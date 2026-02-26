import { db } from './firebase';
import {
    collection,
    addDoc,
    updateDoc,
    doc,
    query,
    where,
    onSnapshot,
    serverTimestamp,
    arrayUnion,
    arrayRemove,
    getDoc,
    setDoc
} from 'firebase/firestore';

const COLLECTION_NAME = 'corrections';

/**
 * Submits a new correction suggestion for a station.
 * @param {string} stationId 
 * @param {string} stationName
 * @param {object} correctionData - { field: 'address'|'name'|'coords', oldValue, newValue }
 * @param {object} user - { uid, email }
 */
export const submitCorrection = async (stationId, stationName, correctionData, user) => {
    if (!user) throw new Error('Authentication required to submit corrections');

    const correction = {
        stationId,
        stationName,
        field: correctionData.field,
        oldValue: correctionData.oldValue,
        newValue: correctionData.newValue,
        userId: user.uid,
        userEmail: user.email,
        status: 'pending', // pending, approved, rejected
        upvotes: [user.uid],
        downvotes: [],
        timestamp: serverTimestamp(),
        autoApproved: false
    };

    return await addDoc(collection(db, COLLECTION_NAME), correction);
};

/**
 * Votes on a pending correction.
 * @param {string} correctionId 
 * @param {string} userId 
 * @param {'up' | 'down'} type 
 */
export const voteCorrection = async (correctionId, userId, type) => {
    const correctionRef = doc(db, COLLECTION_NAME, correctionId);

    if (type === 'up') {
        await updateDoc(correctionRef, {
            upvotes: arrayUnion(userId),
            downvotes: arrayRemove(userId)
        });
    } else {
        await updateDoc(correctionRef, {
            downvotes: arrayUnion(userId),
            upvotes: arrayRemove(userId)
        });
    }

    // Check for auto-approval threshold (e.g., 5 upvotes)
    await checkAutoApproval(correctionId);
};

/**
 * Automatically approves a correction if it reaches the consensus threshold.
 */
const checkAutoApproval = async (correctionId) => {
    const correctionRef = doc(db, COLLECTION_NAME, correctionId);
    const snap = await getDoc(correctionRef);
    const data = snap.data();

    if (data.status === 'pending' && data.upvotes.length >= 5) {
        await approveCorrection(correctionId, 'system_consensus');
    }
};

/**
 * Approves a correction and updates the main station document.
 */
export const approveCorrection = async (correctionId, adminId = 'system') => {
    const correctionRef = doc(db, COLLECTION_NAME, correctionId);
    const snap = await getDoc(correctionRef);
    const data = snap.data();

    if (data.status !== 'pending') return;

    const stationRef = doc(db, 'stations', data.stationId);

    // Update the station with the new value
    const updatePayload = {
        [data.field]: data.newValue,
        lastUpdated: new Date().toISOString()
    };

    await Promise.all([
        updateDoc(stationRef, updatePayload),
        updateDoc(correctionRef, {
            status: 'approved',
            approvedBy: adminId,
            approvedAt: serverTimestamp()
        })
    ]);
};

/**
 * Rejects a correction.
 */
export const rejectCorrection = async (correctionId, adminId) => {
    const correctionRef = doc(db, COLLECTION_NAME, correctionId);
    await updateDoc(correctionRef, {
        status: 'rejected',
        rejectedBy: adminId,
        rejectedAt: serverTimestamp()
    });
};

/**
 * Subscribes to pending corrections for a specific station.
 */
export const subscribeToStationCorrections = (stationId, onUpdate) => {
    const q = query(
        collection(db, COLLECTION_NAME),
        where('stationId', '==', stationId),
        where('status', '==', 'pending')
    );

    return onSnapshot(q, (snapshot) => {
        const corrections = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        onUpdate(corrections);
    });
};

/**
 * Subscribes to all pending corrections across all stations (for Admin use).
 */
export const subscribeToAllPendingCorrections = (onUpdate) => {
    const q = query(
        collection(db, COLLECTION_NAME),
        where('status', '==', 'pending')
    );

    return onSnapshot(q, (snapshot) => {
        const corrections = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        onUpdate(corrections);
    });
};

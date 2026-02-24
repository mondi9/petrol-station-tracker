import { db } from './firebase';
import {
    collection, addDoc, query, where, orderBy,
    onSnapshot, serverTimestamp, deleteDoc, doc, limit
} from 'firebase/firestore';

const LEDGER_COLLECTION = 'fuelLedger';

/**
 * Add a new fill-up entry to the ledger.
 * entry: { stationId, stationName, fuelType, litres, pricePerLitre, totalCost, vehicleId, driverName, notes, depotId }
 */
export const addLedgerEntry = async (entry) => {
    return addDoc(collection(db, LEDGER_COLLECTION), {
        ...entry,
        timestamp: serverTimestamp(),
        totalCost: entry.litres * entry.pricePerLitre
    });
};

/**
 * Subscribe to real-time ledger entries for a depot (or all if null).
 */
export const subscribeToLedger = (depotId, onUpdate, onError, maxEntries = 100) => {
    let q;
    if (depotId) {
        q = query(
            collection(db, LEDGER_COLLECTION),
            where('depotId', '==', depotId),
            orderBy('timestamp', 'desc'),
            limit(maxEntries)
        );
    } else {
        q = query(
            collection(db, LEDGER_COLLECTION),
            orderBy('timestamp', 'desc'),
            limit(maxEntries)
        );
    }

    return onSnapshot(q, (snapshot) => {
        const entries = snapshot.docs.map(d => {
            const data = d.data();
            return {
                id: d.id,
                ...data,
                timestamp: data.timestamp?.toDate?.() || new Date()
            };
        });
        onUpdate(entries);
    }, onError);
};

/**
 * Delete a ledger entry by ID.
 */
export const deleteLedgerEntry = async (entryId) => {
    return deleteDoc(doc(db, LEDGER_COLLECTION, entryId));
};

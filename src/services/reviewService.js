import { db } from './firebase';
import { collection, addDoc, query, orderBy, onSnapshot, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

const getReviewsCollection = (stationId) => {
    return collection(db, 'stations', stationId, 'reviews');
};

export const addReview = async (stationId, reviewData, user) => {
    if (!user) throw new Error("Must be logged in to review.");

    const docData = {
        text: reviewData.text,
        rating: Number(reviewData.rating),
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || user.email.split('@')[0],
        createdAt: serverTimestamp()
    };

    return await addDoc(getReviewsCollection(stationId), docData);
};

export const subscribeToReviews = (stationId, onUpdate, onError) => {
    const q = query(getReviewsCollection(stationId), orderBy('createdAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
        const reviews = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        onUpdate(reviews);
    }, (error) => {
        console.error("Error fetching reviews", error);
        if (onError) onError(error);
    });
};

export const deleteReview = async (stationId, reviewId) => {
    await deleteDoc(doc(db, 'stations', stationId, 'reviews', reviewId));
};

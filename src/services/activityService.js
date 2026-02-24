import { db } from './firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from 'firebase/firestore';

const COLLECTION_NAME = 'activity';

/**
 * Logs a visit to the application.
 * @param {string} userId - Optional user ID if logged in
 * @param {string} email - Optional user email if logged in
 */
export const logAppVisit = async (userId = null, email = null) => {
    try {
        const visitData = {
            type: 'visit',
            timestamp: serverTimestamp(),
            userId: userId || 'anonymous',
            email: email || 'Anonymous Visitor',
            userAgent: navigator.userAgent,
            referrer: document.referrer || 'direct',
            path: window.location.pathname,
            platform: navigator.platform
        };
        await addDoc(collection(db, COLLECTION_NAME), visitData);
    } catch (error) {
        console.error("Error logging app visit:", error);
    }
};

/**
 * Fetches recent activity logs.
 * @param {number} limitCount - Number of logs to fetch
 * @returns {Promise<Array>}
 */
export const getRecentActivity = async (limitCount = 50) => {
    try {
        const activityRef = collection(db, COLLECTION_NAME);
        const q = query(activityRef, orderBy('timestamp', 'desc'), limit(limitCount));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : new Date().toISOString()
            };
        });
    } catch (error) {
        console.error("Error fetching recent activity:", error);
        throw error;
    }
};

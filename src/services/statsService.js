import { db } from './firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

/**
 * Get user statistics (contributions and reviews)
 * @param {string} userId - User ID
 * @returns {Promise<{contributions: number, reviews: number}>}
 */
export const getUserStats = async (userId) => {
    if (!userId) {
        return { contributions: 0, reviews: 0 };
    }

    try {
        // Count contributions (reports across all stations)
        let contributionsCount = 0;
        const stationsSnapshot = await getDocs(collection(db, 'stations'));

        for (const stationDoc of stationsSnapshot.docs) {
            const reportsQuery = query(
                collection(db, 'stations', stationDoc.id, 'reports'),
                where('userId', '==', userId)
            );
            const reportsSnapshot = await getDocs(reportsQuery);
            contributionsCount += reportsSnapshot.size;
        }

        // Count reviews across all stations
        let reviewsCount = 0;
        for (const stationDoc of stationsSnapshot.docs) {
            const reviewsQuery = query(
                collection(db, 'stations', stationDoc.id, 'reviews'),
                where('userId', '==', userId)
            );
            const reviewsSnapshot = await getDocs(reviewsQuery);
            reviewsCount += reviewsSnapshot.size;
        }

        return {
            contributions: contributionsCount,
            reviews: reviewsCount
        };
    } catch (error) {
        console.error('Error fetching user stats:', error);
        return { contributions: 0, reviews: 0 };
    }
};

/**
 * Get user's favorite stations
 * @param {string} userId - User ID
 * @returns {Promise<string[]>} - Array of station IDs
 */
export const getUserFavorites = async (userId) => {
    if (!userId) return [];

    try {
        const favoritesSnapshot = await getDocs(
            collection(db, 'users', userId, 'favorites')
        );
        return favoritesSnapshot.docs.map(doc => doc.id);
    } catch (error) {
        console.error('Error fetching favorites:', error);
        return [];
    }
};

/**
 * Add station to favorites
 * @param {string} userId - User ID
 * @param {string} stationId - Station ID
 */
export const addFavorite = async (userId, stationId) => {
    if (!userId || !stationId) return;

    try {
        const { doc, setDoc } = await import('firebase/firestore');
        await setDoc(doc(db, 'users', userId, 'favorites', stationId), {
            addedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error adding favorite:', error);
        throw error;
    }
};

/**
 * Remove station from favorites
 * @param {string} userId - User ID
 * @param {string} stationId - Station ID
 */
export const removeFavorite = async (userId, stationId) => {
    if (!userId || !stationId) return;

    try {
        const { doc, deleteDoc } = await import('firebase/firestore');
        await deleteDoc(doc(db, 'users', userId, 'favorites', stationId));
    } catch (error) {
        console.error('Error removing favorite:', error);
        throw error;
    }
};

/**
 * Get user's recent reports (across all stations)
 * @param {string} userId
 * @param {number} limitCount
 * @returns {Promise<Array>}
 */
export const getUserReports = async (userId, limitCount = 20) => {
    if (!userId) return [];
    try {
        const { collectionGroup, orderBy, limit } = await import('firebase/firestore');
        // Note: This requires a composite index on queueStatus and timestamp if filtered...
        // But for just userId, it needs a single field index (auto) + composite for sort?
        // Let's try simple query first.
        const reportsQuery = query(
            collectionGroup(db, 'reports'),
            where('userId', '==', userId),
            orderBy('timestamp', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(reportsQuery);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            // We need to know WHICH station this is. 
            // The ref.parent.parent.id gives the station ID.
            const stationId = doc.ref.parent.parent?.id;
            return {
                id: doc.id,
                stationId,
                ...data,
                timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : new Date().toISOString()
            };
        });
    } catch (error) {
        console.error("Error fetching user reports:", error);
        return [];
    }
};

/**
 * Get user's recent reviews
 * @param {string} userId
 * @param {number} limitCount
 * @returns {Promise<Array>}
 */
export const getUserReviews = async (userId, limitCount = 20) => {
    if (!userId) return [];
    try {
        const { collectionGroup, orderBy, limit } = await import('firebase/firestore');
        const reviewsQuery = query(
            collectionGroup(db, 'reviews'),
            where('userId', '==', userId),
            orderBy('timestamp', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(reviewsQuery);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            const stationId = doc.ref.parent.parent?.id;
            return {
                id: doc.id,
                stationId,
                ...data,
                timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : new Date().toISOString()
            };
        });
    } catch (error) {
        console.error("Error fetching user reviews:", error);
        return [];
    }
};

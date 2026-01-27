import { db } from './firebase';
import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    deleteDoc,
    doc,
    updateDoc,
    onSnapshot,
    serverTimestamp,
    orderBy
} from 'firebase/firestore';

const ALERTS_COLLECTION = 'priceAlerts';

/**
 * Request browser notification permission
 * @returns {Promise<boolean>} - True if permission granted
 */
export const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
        console.warn('Browser does not support notifications');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
};

/**
 * Send browser notification
 * @param {string} title 
 * @param {string} body 
 * @param {object} data - Additional data
 */
export const sendNotification = (title, body, data = {}) => {
    if (Notification.permission === 'granted') {
        const notification = new Notification(title, {
            body,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: data.alertId || 'price-alert',
            requireInteraction: false,
            data
        });

        notification.onclick = () => {
            window.focus();
            notification.close();
            // Could navigate to station details here
            if (data.stationId) {
                console.log('Navigate to station:', data.stationId);
            }
        };
    }
};

/**
 * Create a new price alert
 * @param {string} userId 
 * @param {string} stationId 
 * @param {string} stationName 
 * @param {string} fuelType 
 * @param {number} targetPrice 
 * @param {number} currentPrice 
 * @returns {Promise<string>} - Alert ID
 */
export const createAlert = async (userId, stationId, stationName, fuelType, targetPrice, currentPrice) => {
    try {
        // Request notification permission when creating first alert
        await requestNotificationPermission();

        const alertData = {
            userId,
            stationId,
            stationName,
            fuelType,
            targetPrice: parseInt(targetPrice),
            currentPrice: parseInt(currentPrice),
            status: 'active', // 'active' | 'triggered' | 'expired'
            createdAt: serverTimestamp(),
            triggeredAt: null,
            notified: false
        };

        const docRef = await addDoc(collection(db, ALERTS_COLLECTION), alertData);
        console.log('Alert created:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('Error creating alert:', error);
        throw error;
    }
};

/**
 * Get all alerts for a user
 * @param {string} userId 
 * @returns {Promise<Array>} - Array of alerts
 */
export const getUserAlerts = async (userId) => {
    try {
        const q = query(
            collection(db, ALERTS_COLLECTION),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            triggeredAt: doc.data().triggeredAt?.toDate?.()?.toISOString() || null
        }));
    } catch (error) {
        console.error('Error fetching user alerts:', error);
        return [];
    }
};

/**
 * Subscribe to user's alerts (real-time)
 * @param {string} userId 
 * @param {function} callback 
 * @returns {function} - Unsubscribe function
 */
export const subscribeToUserAlerts = (userId, callback) => {
    const q = query(
        collection(db, ALERTS_COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
        const alerts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            triggeredAt: doc.data().triggeredAt?.toDate?.()?.toISOString() || null
        }));
        callback(alerts);
    });
};

/**
 * Delete an alert
 * @param {string} alertId 
 */
export const deleteAlert = async (alertId) => {
    try {
        await deleteDoc(doc(db, ALERTS_COLLECTION, alertId));
        console.log('Alert deleted:', alertId);
    } catch (error) {
        console.error('Error deleting alert:', error);
        throw error;
    }
};

/**
 * Update alert status
 * @param {string} alertId 
 * @param {string} status - 'active' | 'triggered' | 'expired'
 */
export const updateAlertStatus = async (alertId, status) => {
    try {
        const updates = {
            status,
            ...(status === 'triggered' ? { triggeredAt: serverTimestamp(), notified: true } : {})
        };

        await updateDoc(doc(db, ALERTS_COLLECTION, alertId), updates);
        console.log('Alert status updated:', alertId, status);
    } catch (error) {
        console.error('Error updating alert status:', error);
        throw error;
    }
};

/**
 * Check if any alerts should trigger for a price update
 * Called when a new price is reported
 * @param {string} stationId 
 * @param {string} fuelType 
 * @param {number} newPrice 
 */
export const checkPriceAlerts = async (stationId, fuelType, newPrice) => {
    try {
        // Find all active alerts for this station and fuel type
        const q = query(
            collection(db, ALERTS_COLLECTION),
            where('stationId', '==', stationId),
            where('fuelType', '==', fuelType),
            where('status', '==', 'active')
        );

        const snapshot = await getDocs(q);

        // Check each alert
        for (const alertDoc of snapshot.docs) {
            const alert = alertDoc.data();

            // If new price is <= target price, trigger the alert
            if (newPrice <= alert.targetPrice) {
                // Update alert status
                await updateAlertStatus(alertDoc.id, 'triggered');

                // Send notification
                sendNotification(
                    '🔔 Price Alert!',
                    `${fuelType.charAt(0).toUpperCase() + fuelType.slice(1)} at ${alert.stationName} dropped to ₦${newPrice}`,
                    {
                        alertId: alertDoc.id,
                        stationId: alert.stationId,
                        stationName: alert.stationName,
                        fuelType: alert.fuelType,
                        newPrice
                    }
                );

                console.log('Alert triggered:', alertDoc.id, alert.stationName, newPrice);
            }
        }
    } catch (error) {
        console.error('Error checking price alerts:', error);
    }
};

/**
 * Get active alert count for a user
 * @param {string} userId 
 * @returns {Promise<number>}
 */
export const getActiveAlertCount = async (userId) => {
    try {
        const q = query(
            collection(db, ALERTS_COLLECTION),
            where('userId', '==', userId),
            where('status', '==', 'active')
        );

        const snapshot = await getDocs(q);
        return snapshot.size;
    } catch (error) {
        console.error('Error getting alert count:', error);
        return 0;
    }
};

import { db } from './firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

/**
 * Check if user has submitted a duplicate report recently
 * @param {string} userId - User ID
 * @param {string} stationId - Station ID
 * @param {number} timeWindowMinutes - Time window in minutes (default 5)
 * @returns {Promise<{isDuplicate: boolean, lastReport: object}>}
 */
export const checkDuplicateReport = async (userId, stationId, timeWindowMinutes = 5) => {
    try {
        if (!userId) return { isDuplicate: false, lastReport: null };

        const timeThreshold = new Date(Date.now() - timeWindowMinutes * 60 * 1000);

        const reportsRef = collection(db, 'stations', stationId, 'reports');
        const q = query(
            reportsRef,
            where('userId', '==', userId),
            where('timestamp', '>', timeThreshold),
            orderBy('timestamp', 'desc'),
            limit(1)
        );

        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            const lastReport = snapshot.docs[0].data();
            return { isDuplicate: true, lastReport };
        }

        return { isDuplicate: false, lastReport: null };
    } catch (error) {
        console.error('Error checking duplicate:', error);
        return { isDuplicate: false, lastReport: null };
    }
};

/**
 * Check if user has exceeded rate limit
 * @param {string} userId - User ID
 * @param {number} maxReports - Maximum reports allowed (default 5)
 * @param {number} timeWindowMinutes - Time window in minutes (default 60)
 * @returns {Promise<{exceeded: boolean, count: number, resetTime: Date}>}
 */
export const checkRateLimit = async (userId, maxReports = 5, timeWindowMinutes = 60) => {
    try {
        if (!userId) {
            // Guest users have stricter limits
            return { exceeded: false, count: 0, resetTime: null };
        }

        const timeThreshold = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
        const resetTime = new Date(Date.now() + timeWindowMinutes * 60 * 1000);

        // Query all stations for user's recent reports
        const stationsRef = collection(db, 'stations');
        const stationsSnapshot = await getDocs(stationsRef);

        let totalReports = 0;

        // Check reports across all stations
        for (const stationDoc of stationsSnapshot.docs) {
            const reportsRef = collection(db, 'stations', stationDoc.id, 'reports');
            const q = query(
                reportsRef,
                where('userId', '==', userId),
                where('timestamp', '>', timeThreshold)
            );

            const reportsSnapshot = await getDocs(q);
            totalReports += reportsSnapshot.size;

            if (totalReports >= maxReports) {
                return { exceeded: true, count: totalReports, resetTime };
            }
        }

        return { exceeded: false, count: totalReports, resetTime };
    } catch (error) {
        console.error('Error checking rate limit:', error);
        return { exceeded: false, count: 0, resetTime: null };
    }
};

/**
 * Validate report data before submission
 * @param {object} reportData - Report data to validate
 * @returns {{valid: boolean, errors: string[]}}
 */
export const validateReportData = (reportData) => {
    const errors = [];

    // Validate fuel type
    const validFuelTypes = ['petrol', 'diesel', 'premium', 'gas'];
    if (!validFuelTypes.includes(reportData.fuelType)) {
        errors.push('Invalid fuel type');
    }

    // Validate availability
    const validAvailability = ['available', 'low', 'empty'];
    if (!validAvailability.includes(reportData.availability)) {
        errors.push('Invalid availability status');
    }

    // Validate queue length
    if (reportData.queueLength < 0 || reportData.queueLength > 300) {
        errors.push('Queue length must be between 0 and 300 minutes');
    }

    // Validate price if provided
    if (reportData.price) {
        if (reportData.price < 100 || reportData.price > 5000) {
            errors.push('Price seems unrealistic (₦100-₦5000)');
        }
    }

    // Validate reporter name
    if (!reportData.reporterName || reportData.reporterName.trim().length === 0) {
        errors.push('Reporter name is required');
    }

    return {
        valid: errors.length === 0,
        errors
    };
};

/**
 * Calculate quality score for a report
 * @param {object} report - Report data
 * @returns {number} Quality score (0-1)
 */
export const calculateReportQuality = (report) => {
    let score = 0;

    // Has photo: +30%
    if (report.hasPhoto || report.photoUrl) {
        score += 0.3;
    }

    // Has price: +20%
    if (report.price && report.price > 0) {
        score += 0.2;
    }

    // Has queue info: +20%
    if (report.queueLength !== undefined && report.queueLength !== null) {
        score += 0.2;
    }

    // Is logged in user: +20%
    if (report.userId && report.userId !== 'anonymous') {
        score += 0.2;
    }

    // Has name: +10%
    if (report.reporterName && report.reporterName !== 'Guest' && report.reporterName !== 'Anonymous') {
        score += 0.1;
    }

    return Math.min(score, 1.0);
};

/**
 * Get user's recent report count
 * @param {string} userId - User ID
 * @param {number} timeWindowMinutes - Time window in minutes
 * @returns {Promise<number>} Number of recent reports
 */
export const getUserReportCount = async (userId, timeWindowMinutes = 60) => {
    try {
        if (!userId) return 0;

        const timeThreshold = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
        const stationsRef = collection(db, 'stations');
        const stationsSnapshot = await getDocs(stationsRef);

        let totalReports = 0;

        for (const stationDoc of stationsSnapshot.docs) {
            const reportsRef = collection(db, 'stations', stationDoc.id, 'reports');
            const q = query(
                reportsRef,
                where('userId', '==', userId),
                where('timestamp', '>', timeThreshold)
            );

            const reportsSnapshot = await getDocs(q);
            totalReports += reportsSnapshot.size;
        }

        return totalReports;
    } catch (error) {
        console.error('Error getting report count:', error);
        return 0;
    }
};

/**
 * Format time remaining for rate limit reset
 * @param {Date} resetTime - Reset time
 * @returns {string} Formatted time remaining
 */
export const formatResetTime = (resetTime) => {
    if (!resetTime) return '';

    const now = new Date();
    const diff = resetTime - now;
    const minutes = Math.ceil(diff / (1000 * 60));

    if (minutes < 1) return 'less than a minute';
    if (minutes === 1) return '1 minute';
    return `${minutes} minutes`;
};

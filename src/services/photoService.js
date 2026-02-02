import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

/**
 * Compress an image file to reduce size before upload
 * @param {File} file - Image file to compress
 * @param {number} maxSizeMB - Maximum size in MB (default 1MB)
 * @param {number} maxWidthOrHeight - Maximum width or height in pixels (default 1920)
 * @returns {Promise<Blob>} Compressed image blob
 */
export const compressImage = async (file, maxSizeMB = 1, maxWidthOrHeight = 1920) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Calculate new dimensions
                if (width > height) {
                    if (width > maxWidthOrHeight) {
                        height *= maxWidthOrHeight / width;
                        width = maxWidthOrHeight;
                    }
                } else {
                    if (height > maxWidthOrHeight) {
                        width *= maxWidthOrHeight / height;
                        height = maxWidthOrHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to blob with quality adjustment
                canvas.toBlob(
                    (blob) => {
                        if (blob.size > maxSizeMB * 1024 * 1024) {
                            // If still too large, reduce quality
                            canvas.toBlob(
                                (smallerBlob) => resolve(smallerBlob),
                                'image/jpeg',
                                0.7
                            );
                        } else {
                            resolve(blob);
                        }
                    },
                    'image/jpeg',
                    0.85
                );
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
};

/**
 * Create a thumbnail from an image file
 * @param {File} file - Image file
 * @param {number} size - Thumbnail size (default 200px)
 * @returns {Promise<Blob>} Thumbnail blob
 */
export const createThumbnail = async (file, size = 200) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Calculate dimensions to maintain aspect ratio
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    height = (height / width) * size;
                    width = size;
                } else {
                    width = (width / height) * size;
                    height = size;
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => resolve(blob),
                    'image/jpeg',
                    0.7
                );
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
};

/**
 * Upload a photo to Firebase Storage
 * @param {File} file - Image file to upload
 * @param {string} stationId - Station ID
 * @param {string} userId - User ID
 * @returns {Promise<{photoUrl: string, thumbUrl: string}>} URLs of uploaded images
 */
export const uploadPhoto = async (file, stationId, userId) => {
    try {
        // Validate file
        if (!file.type.startsWith('image/')) {
            throw new Error('File must be an image');
        }

        if (file.size > 10 * 1024 * 1024) {
            throw new Error('Image must be less than 10MB');
        }

        // Generate unique filename
        const timestamp = Date.now();
        const filename = `${userId}_${timestamp}.jpg`;
        const thumbFilename = `thumb_${userId}_${timestamp}.jpg`;

        // Compress main image
        const compressedImage = await compressImage(file);

        // Create thumbnail
        const thumbnail = await createThumbnail(file);

        // Upload main image
        const photoRef = ref(storage, `stations/${stationId}/reports/${filename}`);
        await uploadBytes(photoRef, compressedImage);
        const photoUrl = await getDownloadURL(photoRef);

        // Upload thumbnail
        const thumbRef = ref(storage, `stations/${stationId}/reports/${thumbFilename}`);
        await uploadBytes(thumbRef, thumbnail);
        const thumbUrl = await getDownloadURL(thumbRef);

        return { photoUrl, thumbUrl };
    } catch (error) {
        console.error('Error uploading photo:', error);
        throw error;
    }
};

/**
 * Delete a photo from Firebase Storage
 * @param {string} photoUrl - URL of photo to delete
 */
export const deletePhoto = async (photoUrl) => {
    try {
        if (!photoUrl) return;

        // Extract path from URL
        const photoRef = ref(storage, photoUrl);
        await deleteObject(photoRef);
    } catch (error) {
        console.error('Error deleting photo:', error);
        // Don't throw - deletion failures shouldn't block other operations
    }
};

/**
 * Validate image file
 * @param {File} file - File to validate
 * @returns {{valid: boolean, error: string}}
 */
export const validateImageFile = (file) => {
    if (!file) {
        return { valid: false, error: 'No file selected' };
    }

    if (!file.type.startsWith('image/')) {
        return { valid: false, error: 'File must be an image' };
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        return { valid: false, error: 'Image must be less than 10MB' };
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        return { valid: false, error: 'Only JPG, PNG, and WebP images are allowed' };
    }

    return { valid: true, error: null };
};

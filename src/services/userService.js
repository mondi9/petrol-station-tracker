import { db } from './firebase';
import { doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';

const COLLECTION_NAME = 'users';

/**
 * Creates a user profile document in Firestore.
 * @param {object} user - The Firebase Auth user object
 * @param {string} role - The initial role (default: "user")
 */
export const createUserProfile = async (user, role = 'user') => {
    if (!user) return;

    const userRef = doc(db, COLLECTION_NAME, user.uid);
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
        const userData = {
            email: user.email,
            role: role,
            createdAt: new Date().toISOString(),
            displayName: user.displayName || user.email.split('@')[0], // Fallback display name
        };
        await setDoc(userRef, userData);
        return userData;
    } else {
        return userSnapshot.data();
    }
};

/**
 * Fetches the user's role from Firestore.
 * @param {string} uid - The user's UID
 * @returns {Promise<string>} The user's role (e.g. 'admin', 'user')
 */
export const getUserRole = async (uid) => {
    if (!uid) return null;
    try {
        const userRef = doc(db, COLLECTION_NAME, uid);
        const snapshot = await getDoc(userRef);
        if (snapshot.exists()) {
            return snapshot.data().role;
        }
        return 'user'; // Default role if no profile found
    } catch (error) {
        console.error("Error fetching user role:", error);
        return 'user'; // Fail safe
    }
};

/**
 * Promotes a user to admin by email.
 * @param {string} email
 * @returns {Promise<boolean>} true if successful, false if user not found
 */
export const grantAdminRole = async (email) => {
    try {
        const usersRef = collection(db, COLLECTION_NAME);
        const q = query(usersRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.log("No user found with email:", email);
            return false;
        }

        // Should only be one, but let's update first match
        const userDoc = querySnapshot.docs[0];
        console.log("Found user to promote:", userDoc.id, userDoc.data());

        // Use setDoc with merge instead of updateDoc to avoid "No document to update" error
        // if the document is somehow in a weird state.
        await setDoc(doc(db, COLLECTION_NAME, userDoc.id), {
            role: 'admin'
        }, { merge: true });

        return true;
    } catch (error) {
        console.error("Error promoting user:", error);
        throw error;
    }
};

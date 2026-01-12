import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import { auth } from './firebase';
import { createUserProfile, getUserRole } from './userService';

// Sign Up
export const signUp = async (email, password) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Create user profile in Firestore
        await createUserProfile(userCredential.user);
        return userCredential.user;
    } catch (error) {
        throw error;
    }
};

// Login
export const login = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error) {
        throw error;
    }
};

// Logout
export const logout = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        throw error;
    }
};

// Subscribe to Auth State Changes
export const subscribeToAuth = (callback) => {
    return onAuthStateChanged(auth, async (user) => {
        if (user) {
            // Fetch role and add to user object
            const role = await getUserRole(user.uid);
            user.role = role;
        }
        callback(user);
    });
};

// Error Helper
export const getAuthErrorMessage = (error) => {
    switch (error.code) { // Firebase errors have .code property
        case 'auth/email-already-in-use':
            return 'This email is already registered.';
        case 'auth/invalid-email':
            return 'Invalid email address.';
        case 'auth/weak-password':
            return 'Password should be at least 6 characters.';
        case 'auth/user-not-found':
            return 'No account found with this email.';
        case 'auth/wrong-password':
            return 'Incorrect password.';
        case 'auth/too-many-requests':
            return 'Too many failed attempts. Try again later.';
        case 'auth/configuration-not-found':
            return 'Authentication not enabled in Firebase Console. Please enable Email/Password provider.';
        case 'auth/network-request-failed':
            return 'Network error. Please check your internet connection.';
        default:
            return error.message;
    }
};

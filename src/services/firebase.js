import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// REPLACE THESE VALUES WITH YOUR OWN FROM FIREBASE CONSOLE
const firebaseConfig = {
    apiKey: "AIzaSyCzSH3Hr6Lj4yFSVhh-An4NfDUfdn-laTk",
    authDomain: "petrol-station-tracker.firebaseapp.com",
    projectId: "petrol-station-tracker",
    storageBucket: "petrol-station-tracker.firebasestorage.app",
    messagingSenderId: "179799011744",
    appId: "1:179799011744:web:946861612075377720f4c5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

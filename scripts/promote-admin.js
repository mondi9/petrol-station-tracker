import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";

// Firebase configuration copied from src/services/firebase.js
const firebaseConfig = {
    apiKey: "AIzaSyCzSH3Hr6Lj4yFSVhh-An4NfDUfdn-laTk",
    authDomain: "petrol-station-tracker.firebaseapp.com",
    projectId: "petrol-station-tracker",
    storageBucket: "petrol-station-tracker.firebasestorage.app",
    messagingSenderId: "179799011744",
    appId: "1:179799011744:web:946861612075377720f4c5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const promoteUser = async (email) => {
    if (!email) {
        console.error("Please provide an email address as an argument.");
        process.exit(1);
    }

    try {
        console.log(`Searching for user with email: ${email}...`);
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.error(`❌ No user found with email: ${email}`);
            process.exit(1);
        }

        const userDoc = querySnapshot.docs[0];
        const userId = userDoc.id;

        console.log(`Found user! ID: ${userId}. Promoting to admin...`);

        await updateDoc(doc(db, 'users', userId), {
            role: 'admin'
        });

        console.log(`✅ Success! User ${email} is now an admin.`);
        console.log("Please restart the app or refresh the page to see the changes.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error promoting user:", error);
        process.exit(1);
    }
};

const emailArg = process.argv[2];
promoteUser(emailArg);

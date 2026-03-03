import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";

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

const email = process.argv[2];

if (!email) {
    console.error("Usage: node promote-admin.mjs <email>");
    process.exit(1);
}

console.log(`🔍 Searching for: ${email}...`);

const q = query(collection(db, 'users'), where("email", "==", email));
const snapshot = await getDocs(q);

if (snapshot.empty) {
    console.error(`❌ No user found with email: ${email}`);
    console.error("Make sure the user has logged in to the app at least once.");
    process.exit(1);
}

const userDoc = snapshot.docs[0];
await updateDoc(doc(db, 'users', userDoc.id), { role: 'admin' });

console.log(`✅ Done! ${email} is now an admin.`);
console.log("Refresh the app to see the gear icon appear in the top-right corner.");
process.exit(0);

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // For Firestore
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCuRCMAOWuzJkO5hHr_aplckutm3Uro4UU",
  authDomain: "outtaboundstravel.firebaseapp.com",
  projectId: "outtaboundstravel",
  storageBucket: "outtaboundstravel.firebasestorage.app",
  messagingSenderId: "334709055897",
  appId: "1:334709055897:web:b6a00825698ae13a93f308",
measurementId: "G-S0CPBMCFHZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

export default db;
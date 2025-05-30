import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail, updateProfile, fetchSignInMethodsForEmail, GoogleAuthProvider, OAuthProvider, signInWithPopup, connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Connect to emulators in development
const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || 
   window.location.hostname === '127.0.0.1' || 
   window.location.hostname === '0.0.0.0');

const useEmulators = process.env.NODE_ENV === 'development' || isLocalhost;

if (useEmulators) {
  console.log('🔧 Connecting to Firebase Emulators...');
  
  // Connect to Firestore emulator
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
    console.log('✅ Firestore Emulator connected on port 8080');
  } catch (error) {
    console.warn('⚠️ Firestore Emulator connection failed:', error.message);
  }
  
  // Connect to Auth emulator
  try {
    connectAuthEmulator(auth, 'http://localhost:9099');
    console.log('✅ Auth Emulator connected on port 9099');
  } catch (error) {
    console.warn('⚠️ Auth Emulator connection failed:', error.message);
  }
  
  // Connect to Storage emulator
  try {
    connectStorageEmulator(storage, 'localhost', 9199);
    console.log('✅ Storage Emulator connected on port 9199');
  } catch (error) {
    console.warn('⚠️ Storage Emulator connection failed:', error.message);
  }
  
  console.log('🎯 All emulators connected! Your writes won\'t count against production quota.');
} else {
  console.log('🌐 Using production Firebase services');
}

// Initialize providers
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email'); // Explicitly request email
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email'); // Explicitly request email
appleProvider.setCustomParameters({
  // Request email and full name from Apple
  response_mode: 'form_post'
});

export { 
  app, 
  db, 
  auth, 
  storage,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  fetchSignInMethodsForEmail,
  GoogleAuthProvider,
  OAuthProvider,
  googleProvider,
  appleProvider,
  signInWithPopup
}; 
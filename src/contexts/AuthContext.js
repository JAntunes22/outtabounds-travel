import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  fetchSignInMethodsForEmail,
  googleProvider,
  appleProvider,
  signInWithPopup
} from '../utils/firebaseConfig';
import { checkUserAdmin, createUserDocument, getUserDocument } from '../utils/firebaseUtils';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userFullname, setUserFullname] = useState('');

  async function refreshAdminStatus() {
    if (currentUser) {
      try {
        // Force check from Firestore using email
        const adminStatus = await checkUserAdmin(currentUser);
        console.log("Admin status checked:", adminStatus);
        setIsAdmin(adminStatus);
        return adminStatus;
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
        return false;
      }
    }
    return false;
  }

  async function fetchUserData(user) {
    if (!user) {
      console.error("Cannot fetch user data: User is undefined");
      return null;
    }
    
    console.log("Fetching data for user:", user.email);
    
    try {
      const userData = await getUserDocument(user);
      if (userData) {
        // Update admin status
        console.log("User data fetched:", userData);
        setIsAdmin(userData.isAdmin === true);
        
        // Update user fullname if available
        if (userData.fullname) {
          setUserFullname(userData.fullname);
        }
        return userData;
      } else {
        console.log("No user document found. Creating one now...");
        // If no user document found, create one
        await createUserDocument(user);
        return null;
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      return null;
    }
  }

  // Check if an email already exists in Firebase Auth or Firestore
  async function checkEmailExists(email) {
    try {
      console.log("Starting email existence check for:", email);
      
      // First check if email exists in Firebase Authentication
      console.log("Checking Firebase Auth...");
      const methods = await fetchSignInMethodsForEmail(auth, email);
      console.log("Firebase Auth sign-in methods:", methods);
      
      if (methods && methods.length > 0) {
        console.log("Email found in Firebase Auth");
        return true;
      }
      
      // Also check if email exists in Firestore users collection
      // In Firestore, email is used as the document ID
      console.log("Checking Firestore users collection...");
      try {
        const userDoc = await getUserDocument(email);
        console.log("Firestore check result:", userDoc ? "User found" : "User not found");
        return userDoc !== null;
      } catch (firestoreError) {
        console.error("Error checking Firestore for email:", firestoreError);
        // If there's an error checking Firestore, we still want to continue
        // so return the result from the Authentication check
        return false;
      }
    } catch (error) {
      console.error("Error checking if email exists:", error);
      throw error;
    }
  }

  async function signup(email, password, displayName, userData = {}) {
    try {
      // Create the user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the user's profile with display name
      await updateProfile(userCredential.user, { displayName });
      
      // Prepare user data for Firestore
      const userDataForFirestore = {
        ...userCredential.user,
        displayName,
        fullname: userData.firstName && userData.lastName 
          ? `${userData.firstName} ${userData.lastName}` 
          : displayName,
        title: userData.title || '',
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        phoneNumber: userData.phoneNumber || '',
        receiveOffers: userData.receiveOffers || false,
        createdAt: new Date()
      };
      
      // Create a document in Firestore for this user
      await createUserDocument(userDataForFirestore);
      
      setUserFullname(userDataForFirestore.fullname);
      
      return userCredential;
    } catch (error) {
      throw error;
    }
  }

  async function login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Fetch user data including admin status and fullname
      if (userCredential.user) {
        await fetchUserData(userCredential.user);
      }
      
      return userCredential;
    } catch (error) {
      throw error;
    }
  }

  async function logout() {
    try {
      await signOut(auth);
      setIsAdmin(false);
      setUserFullname('');
    } catch (error) {
      throw error;
    }
  }

  async function resetPassword(email) {
    try {
      console.log("Sending password reset email to:", email);
      await sendPasswordResetEmail(auth, email);
      console.log("Password reset email sent successfully");
      return true;
    } catch (error) {
      console.error("Error in resetPassword:", error);
      throw error;
    }
  }

  // Update user profile
  async function updateUserProfile(updates) {
    try {
      await updateProfile(currentUser, updates);
      // Refresh the user to get updated information
      setCurrentUser({ ...currentUser });
    } catch (error) {
      throw error;
    }
  }

  async function signInWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user document exists, if not create one
      const userData = await getUserDocument(user);
      if (!userData) {
        const userDataForFirestore = {
          ...user,
          fullname: user.displayName || '',
          createdAt: new Date()
        };
        await createUserDocument(userDataForFirestore);
      }
      
      // Fetch user data including admin status and fullname
      await fetchUserData(user);
      
      return result;
    } catch (error) {
      throw error;
    }
  }

  async function signInWithApple() {
    try {
      const result = await signInWithPopup(auth, appleProvider);
      const user = result.user;
      
      // Check if user document exists, if not create one
      const userData = await getUserDocument(user);
      if (!userData) {
        const userDataForFirestore = {
          ...user,
          fullname: user.displayName || '',
          createdAt: new Date()
        };
        await createUserDocument(userDataForFirestore);
      }
      
      // Fetch user data including admin status and fullname
      await fetchUserData(user);
      
      return result;
    } catch (error) {
      throw error;
    }
  }

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Fetch complete user data from Firestore
        await fetchUserData(user);
      } else {
        setIsAdmin(false);
        setUserFullname('');
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    isAdmin,
    userFullname,
    login,
    signup,
    logout,
    resetPassword,
    updateUserProfile,
    refreshAdminStatus,
    checkEmailExists,
    signInWithGoogle,
    signInWithApple
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 
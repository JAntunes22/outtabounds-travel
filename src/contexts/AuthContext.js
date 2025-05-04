import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile
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

  async function signup(email, password, displayName, fullname) {
    try {
      // Create the user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the user's profile with display name
      await updateProfile(userCredential.user, { displayName });
      
      // Create a document in Firestore for this user
      await createUserDocument({
        ...userCredential.user,
        displayName,
        fullname
      });
      
      setUserFullname(fullname || displayName);
      
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
      return await sendPasswordResetEmail(auth, email);
    } catch (error) {
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
    refreshAdminStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 
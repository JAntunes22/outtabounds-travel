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
import { 
  checkUserAdmin, 
  createUserDocument, 
  getUserDocument, 
  findUserByEmail, 
  syncUserData,
  mergeUserAccounts // For backward compatibility
} from '../utils/firebaseUtils';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../utils/firebaseConfig';
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userFullname, setUserFullname] = useState('');
  const [hasSeenProfileReminder, setHasSeenProfileReminder] = useState(false);

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
      // First, try to get the user document by UID
      let userData = await getUserDocument(user);
      
      // If no document found by UID but we have an email, check for document by email
      if (!userData && user.email) {
        console.log("No user document found by UID, checking by email...");
        const userByEmail = await findUserByEmail(user.email);
        
        if (userByEmail && userByEmail.id !== user.uid) {
          console.log("Found user document by email but with different UID");
          // Only sync profile data between accounts, not linking authentication methods
          userData = await syncUserData(user, userByEmail);
        }
      }
      
      if (userData) {
        // Update admin status
        console.log("User data fetched:", userData);
        setIsAdmin(userData.isAdmin === true);
        
        // Update user fullname if available
        if (userData.fullname) {
          setUserFullname(userData.fullname);
        }
        
        // Update auth providers if needed
        const userRef = doc(db, 'users', user.uid);
        if (!userData.authProviders) {
          // If no auth providers tracked yet, set based on current auth method
          const defaultProvider = user.providerData && 
            user.providerData[0] && 
            user.providerData[0].providerId.includes('google.com') ? 'social' : 'email';
          
          await updateDoc(userRef, { 
            authProviders: [defaultProvider],
            lastLogin: new Date()
          });
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
        uid: userCredential.user.uid,
        email: email,
        displayName: displayName,
        fullname: userData.firstName && userData.lastName 
          ? `${userData.firstName} ${userData.lastName}` 
          : displayName,
        title: userData.title || '',
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        phoneNumber: userData.phoneNumber || '',
        receiveOffers: userData.receiveOffers || false,
        profileCompleted: true,
        createdAt: new Date(),
        lastLogin: new Date(),
        authProviders: ['email'] // Track authentication providers
      };
      
      // Create a document in Firestore for this user - using our manually constructed object
      // rather than passing userCredential.user which might not contain all the form data
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
      // Reset all states
      setIsAdmin(false);
      setUserFullname('');
      setHasSeenProfileReminder(false);
      
      // Sign out from Firebase
      await signOut(auth);
      
      return true;
    } catch (error) {
      console.error("Error during logout:", error);
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
      if (!currentUser) {
        console.error("No user logged in");
        throw new Error("No user logged in");
      }

      console.log("Updating profile for user:", currentUser.uid, "with data:", updates);

      // If there's a displayName update from fullname, apply it to Auth profile
      if (updates.fullname) {
        try {
          console.log("Updating display name in Auth profile to:", updates.fullname);
          await updateProfile(currentUser, { displayName: updates.fullname });
          console.log("Auth profile display name updated successfully");
        } catch (authUpdateError) {
          console.error("Error updating Auth profile:", authUpdateError);
          // Continue with Firestore update even if Auth update fails
        }
      }
      
      try {
        // Update user document in Firestore using UID
        const userRef = doc(db, 'users', currentUser.uid);
        console.log("Updating Firestore document for user:", currentUser.uid);
        await updateDoc(userRef, updates);
        console.log("Firestore document updated successfully");
        
        // Set userFullname state to keep local state in sync
        if (updates.fullname) {
          setUserFullname(updates.fullname);
        }
        
        return true;
      } catch (firestoreError) {
        console.error("Error updating Firestore document:", firestoreError);
        throw firestoreError;
      }
    } catch (error) {
      console.error("Error in updateUserProfile:", error);
      throw error;
    }
  }

  async function signInWithGoogle() {
    try {
      console.log("Starting Google sign-in process in AuthContext");
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      console.log("Google sign-in successful for user:", user.email);
      
      try {
        // Check if user document exists - use .uid instead of passing the whole user object
        const userId = user.uid;
        console.log("Checking if user document exists for UID:", userId);
        
        // Get document reference directly
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          console.log("User document doesn't exist, creating new one");
          
          // Check if there's existing user data with this email
          let existingUserData = null;
          if (user.email) {
            existingUserData = await findUserByEmail(user.email);
            if (existingUserData && existingUserData.id !== user.uid) {
              console.log("Found existing profile data with same email:", existingUserData.id);
              // Sync the user data from the existing account - this only syncs profile data,
              // not authentication methods or account linking
              await syncUserData(user, existingUserData);
            }
          }
          
          // If we didn't find any existing data or didn't sync
          if (!existingUserData || existingUserData.id === user.uid) {
            // New user - create document and mark for profile completion
            const userDataForFirestore = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || '',
              fullname: user.displayName || '',
              createdAt: new Date(),
              profileCompleted: false, // Mark that profile needs completion
              authProviders: ['social'] // Track authentication providers
            };
            
            await setDoc(userRef, userDataForFirestore);
            console.log("Created new user document in Firestore");
          }
          
          return { ...result, isNewUser: true };
        } else {
          // User exists, check if profile is completed
          const userData = userDoc.data();
          console.log("User document exists, profile completed:", userData.profileCompleted);
          
          // Update the auth providers array if needed
          if (!userData.authProviders || !userData.authProviders.includes('social')) {
            const updatedAuthProviders = userData.authProviders 
              ? [...new Set([...userData.authProviders, 'social'])]
              : ['social'];
              
            await updateDoc(userRef, { 
              authProviders: updatedAuthProviders,
              lastLogin: new Date()
            });
            console.log("Updated user document with social auth provider");
          }
          
          if (userData.profileCompleted === false) {
            console.log("User exists but profile not completed");
            return { ...result, isNewUser: true };
          }
          
          // Existing user with complete profile
          console.log("Existing user with complete profile");
          return { ...result, isNewUser: false };
        }
      } catch (firestoreError) {
        console.error("Firestore error during Google sign-in:", firestoreError);
        // If there's an error with Firestore, default to requiring profile completion
        return { ...result, isNewUser: true };
      }
    } catch (error) {
      console.error("Google sign-in error in AuthContext:", error);
      throw error;
    }
  }

  async function signInWithApple() {
    try {
      console.log("Starting Apple sign-in process in AuthContext");
      const result = await signInWithPopup(auth, appleProvider);
      const user = result.user;
      console.log("Apple sign-in successful for user:", user.email);
      
      try {
        // Check if user document exists - use .uid instead of passing the whole user object
        const userId = user.uid;
        console.log("Checking if user document exists for UID:", userId);
        
        // Get document reference directly
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          console.log("User document doesn't exist, creating new one");
          
          // Check if there's existing user data with this email
          let existingUserData = null;
          if (user.email) {
            existingUserData = await findUserByEmail(user.email);
            if (existingUserData && existingUserData.id !== user.uid) {
              console.log("Found existing profile data with same email:", existingUserData.id);
              // Sync the user data from the existing account - this only syncs profile data,
              // not authentication methods or account linking
              await syncUserData(user, existingUserData);
            }
          }
          
          // If we didn't find any existing data or didn't sync
          if (!existingUserData || existingUserData.id === user.uid) {
            // New user - create document and mark for profile completion
            const userDataForFirestore = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || '',
              fullname: user.displayName || '',
              createdAt: new Date(),
              profileCompleted: false, // Mark that profile needs completion
              authProviders: ['social'] // Track authentication providers
            };
            
            await setDoc(userRef, userDataForFirestore);
            console.log("Created new user document in Firestore");
          }
          
          return { ...result, isNewUser: true };
        } else {
          // User exists, check if profile is completed
          const userData = userDoc.data();
          console.log("User document exists, profile completed:", userData.profileCompleted);
          
          // Update the auth providers array if needed
          if (!userData.authProviders || !userData.authProviders.includes('social')) {
            const updatedAuthProviders = userData.authProviders 
              ? [...new Set([...userData.authProviders, 'social'])]
              : ['social'];
              
            await updateDoc(userRef, { 
              authProviders: updatedAuthProviders,
              lastLogin: new Date()
            });
            console.log("Updated user document with social auth provider");
          }
          
          if (userData.profileCompleted === false) {
            console.log("User exists but profile not completed");
            return { ...result, isNewUser: true };
          }
          
          // Existing user with complete profile
          console.log("Existing user with complete profile");
          return { ...result, isNewUser: false };
        }
      } catch (firestoreError) {
        console.error("Firestore error during Apple sign-in:", firestoreError);
        // If there's an error with Firestore, default to requiring profile completion
        return { ...result, isNewUser: true };
      }
    } catch (error) {
      console.error("Apple sign-in error in AuthContext:", error);
      throw error;
    }
  }

  // Function to cancel incomplete sign up process
  async function cancelIncompleteSignUp() {
    try {
      console.log("Canceling incomplete sign up process");
      await signOut(auth);
      setCurrentUser(null);
      setIsAdmin(false);
      setUserFullname('');
      return true;
    } catch (error) {
      console.error("Error canceling sign up:", error);
      throw error;
    }
  }

  // Function to check if user profile is completed
  async function isProfileCompleted() {
    try {
      if (!currentUser) {
        console.log("No current user, profile not completed");
        return false;
      }
      
      const userId = currentUser.uid;
      console.log("Checking profile completion for user UID:", userId);
      
      try {
        // Get document reference directly
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          console.log("User document doesn't exist, profile not completed");
          return false;
        }
        
        const userData = userDoc.data();
        console.log("User profile completion status:", userData.profileCompleted);
        return userData && userData.profileCompleted === true;
      } catch (firestoreError) {
        console.error("Firestore error checking profile completion:", firestoreError);
        return false;
      }
    } catch (error) {
      console.error("Error checking profile completion status:", error);
      return false;
    }
  }

  function markProfileReminderSeen() {
    setHasSeenProfileReminder(true);
  }

  // Function to manually sync profile data between accounts with same email address
  async function syncAccountData() {
    try {
      if (!currentUser || !currentUser.email) {
        console.error("Cannot sync account data: No current user or email");
        throw new Error("You must be logged in with an email address to sync account data");
      }
      
      console.log("Starting profile data sync for:", currentUser.email);
      
      // Call the Cloud Function to handle the data syncing
      const syncAccountDataFunction = httpsCallable(functions, 'linkUserAccounts'); // Using the same function with updated behavior
      const result = await syncAccountDataFunction({ email: currentUser.email });
      
      if (result.data.success) {
        console.log("Profile data sync successful:", result.data.message);
        
        // Refresh user data
        await fetchUserData(currentUser);
        
        return {
          success: true,
          message: result.data.message,
          syncedAccounts: result.data.syncedAccounts
        };
      } else {
        console.log("No profile data to sync:", result.data.message);
        return {
          success: false,
          message: result.data.message
        };
      }
    } catch (error) {
      console.error("Error syncing profile data:", error);
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
    signInWithApple,
    cancelIncompleteSignUp,
    isProfileCompleted,
    hasSeenProfileReminder,
    markProfileReminderSeen,
    syncAccountData
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 
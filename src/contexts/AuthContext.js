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
  mergeUserAccounts, // For backward compatibility
  addAdminRole
} from '../utils/firebaseUtils';
import { doc, updateDoc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
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
  const [error, setError] = useState(null);

  async function refreshAdminStatus() {
    if (currentUser) {
      try {
        console.log("Refreshing admin status for:", currentUser.email);
        
        // Get the user's ID token to check custom claims
        const idTokenResult = await currentUser.getIdTokenResult(true); // Force token refresh
        const hasAdminClaim = idTokenResult.claims.admin === true;
        console.log("Admin claim from token:", hasAdminClaim);

        // Check Firestore for admin status by email first
        let userDoc = await getDoc(doc(db, 'users', currentUser.email));
        
        // If not found by email, try by UID
        if (!userDoc.exists()) {
          console.log("User document not found by email, trying UID:", currentUser.uid);
          userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        }
        
        // If still not found, query by email field
        if (!userDoc.exists()) {
          console.log("User document not found by UID, querying by email field");
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('email', '==', currentUser.email));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            userDoc = querySnapshot.docs[0];
          }
        }
        
        const hasAdminDoc = userDoc.exists() && userDoc.data().isAdmin === true;
        console.log("Admin status in Firestore:", hasAdminDoc);
        console.log("User document data:", userDoc.exists() ? userDoc.data() : "No document");
        
        // For now we'll only require one of the two checks to be true
        // This allows admins to start using the dashboard even if one side is not yet updated
        const isUserAdmin = hasAdminClaim || hasAdminDoc;
        
        // If admin in Firestore but not in claims, attempt to fix
        if (hasAdminDoc && !hasAdminClaim) {
          console.log("Admin in Firestore but not in claims - will need to call addAdminRole function");
          try {
            const addAdminRoleFunction = httpsCallable(functions, 'addAdminRole');
            await addAdminRoleFunction({ email: currentUser.email });
            console.log("Called addAdminRole to fix missing admin claim");
          } catch (fixError) {
            console.error("Error fixing admin claim:", fixError);
            // Continue anyway since we're allowing access with just Firestore admin status
          }
        }
        
        console.log("Final admin status:", isUserAdmin);
        setIsAdmin(isUserAdmin);
        return isUserAdmin;
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        throw new Error('Failed to verify admin status: ' + error.message);
      }
    }
    return false;
  }

  async function fetchUserData(user) {
    if (!user) {
      throw new Error('User object is required');
    }
    
    try {
      // First, try to get the user document by UID
      let userData = null;
      try {
        userData = await getUserDocument(user.uid);
      } catch (err) {
        console.error('Error fetching user data by UID:', err);
      }
      
      // If no document found by UID but we have an email, check for document by email
      if (!userData && user.email) {
        try {
          const userByEmail = await findUserByEmail(user.email);
          
          if (userByEmail) {
            if (userByEmail.id !== user.uid) {
              // Only sync profile data between accounts, not linking authentication methods
              userData = await syncUserData(user, userByEmail);
            } else {
              userData = userByEmail;
            }
          }
        } catch (emailErr) {
          console.error('Error fetching user data by email:', emailErr);
        }
      }
      
      if (userData) {
        // Update admin status
        setIsAdmin(userData.isAdmin === true);
        
        // Update user fullname if available
        if (userData.fullname) {
          setUserFullname(userData.fullname);
        }
        
        // Update auth providers if needed
        try {
          const userRef = doc(db, 'users', user.uid);
          if (!userData.authProviders) {
            const defaultProvider = user.providerData && 
              user.providerData[0] && 
              user.providerData[0].providerId.includes('google.com') ? 'social' : 'email';
            
            await updateDoc(userRef, { 
              authProviders: [defaultProvider],
              lastLogin: new Date()
            });
          }
        } catch (updateErr) {
          console.error('Error updating user auth providers:', updateErr);
          // Don't throw here, just continue
        }
        
        return userData;
      } else {
        // If no user document found, create one
        try {
          const newUserData = {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || '',
            fullname: user.displayName || '',
            createdAt: new Date(),
            lastLogin: new Date(),
            profileCompleted: false,
            isAdmin: false,
            authProviders: user.providerData ? 
              user.providerData.map(provider => 
                provider.providerId.includes('google.com') ? 'social' : 'email'
              ) : ['email']
          };
          
          await setDoc(doc(db, 'users', user.uid), newUserData);
          
          // Also create a document with email as ID for easier lookups
          if (user.email) {
            await setDoc(doc(db, 'users', user.email), {
              ...newUserData,
              referenceUid: user.uid
            });
          }
          
          return newUserData;
        } catch (createErr) {
          console.error('Error creating user document:', createErr);
          throw new Error('Failed to create user document');
        }
      }
    } catch (error) {
      console.error('Error in fetchUserData:', error);
      throw new Error('Failed to fetch user data');
    }
  }

  async function checkEmailExists(email) {
    if (!email) {
      throw new Error('Email is required');
    }

    try {
      // First check if email exists in Firebase Authentication
      const methods = await fetchSignInMethodsForEmail(auth, email);
      
      if (methods && methods.length > 0) {
        return true;
      }
      
      // Also check if email exists in Firestore users collection
      try {
        const userDoc = await getUserDocument(email);
        return userDoc !== null;
      } catch (firestoreError) {
        console.error('Error checking Firestore for email:', firestoreError);
        return false;
      }
    } catch (error) {
      console.error('Error checking if email exists:', error);
      throw new Error('Failed to check email existence');
    }
  }

  async function signup(email, password, displayName, userData = {}) {
    if (!email || !password || !displayName) {
      throw new Error('Email, password, and display name are required');
    }

    try {
      setError(null);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      await updateProfile(userCredential.user, { displayName });
      
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
        isAdmin: false,
        profileCompleted: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLogin: new Date(),
        authProviders: ['email']
      };
      
      await setDoc(doc(db, 'users', email), userDataForFirestore);
      
      setUserFullname(userDataForFirestore.fullname);
      
      return userCredential.user;
    } catch (error) {
      setError(error.message);
      throw new Error('Failed to create account');
    }
  }

  async function login(email, password) {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    try {
      setError(null);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await refreshAdminStatus();
      return userCredential.user;
    } catch (error) {
      setError(error.message);
      throw new Error('Failed to log in');
    }
  }

  async function logout() {
    try {
      setError(null);
      setIsAdmin(false);
      setUserFullname('');
      setHasSeenProfileReminder(false);
      await signOut(auth);
      return true;
    } catch (error) {
      console.error('Error during logout:', error);
      setError(error.message);
      throw new Error('Failed to log out');
    }
  }

  async function resetPassword(email) {
    if (!email) {
      throw new Error('Email is required');
    }

    try {
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (error) {
      console.error('Error in resetPassword:', error);
      setError(error.message);
      throw new Error('Failed to send password reset email');
    }
  }

  async function updateUserProfile(updates) {
    if (!currentUser) {
      throw new Error('No user logged in');
    }

    if (!updates || typeof updates !== 'object') {
      throw new Error('Invalid update data');
    }

    try {
      if (updates.fullname) {
        await updateProfile(currentUser, { displayName: updates.fullname });
      }
      
      const { updateUserProfile: updateUserProfileInFirestore } = await import('../utils/firebaseUtils');
      await updateUserProfileInFirestore(currentUser.uid, updates);
      
      if (updates.fullname) {
        setUserFullname(updates.fullname);
      }
      
      return true;
    } catch (error) {
      console.error('Error in updateUserProfile:', error);
      setError(error.message);
      throw new Error('Failed to update profile');
    }
  }

  async function signInWithGoogle() {
    try {
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      try {
        // Fetch/create user data in Firestore
        const userData = await fetchUserData(user);
        const isNewUser = userData ? !userData.profileCompleted : true;
        
        // If we have the user data, update lastLogin
        if (userData) {
          try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, { 
              lastLogin: new Date(),
              // Ensure social provider is in authProviders
              authProviders: userData.authProviders && userData.authProviders.includes('social') 
                ? userData.authProviders 
                : [...(userData.authProviders || []), 'social']
            });
          } catch (updateError) {
            console.error('Error updating last login:', updateError);
            // Don't throw here, just continue
          }
        }
        
        // Return whether this is a new user (for profile completion routing)
        return { ...result, isNewUser };
      } catch (firestoreError) {
        console.error('Firestore error during Google sign-in:', firestoreError);
        // If there's an error with Firestore, default to requiring profile completion
        return { ...result, isNewUser: true, error: firestoreError.message };
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      setError(error.message || 'Failed to sign in with Google');
      throw error;
    }
  }

  async function signInWithApple() {
    try {
      setError(null);
      const result = await signInWithPopup(auth, appleProvider);
      const user = result.user;
      
      try {
        // Fetch/create user data in Firestore
        const userData = await fetchUserData(user);
        const isNewUser = userData ? !userData.profileCompleted : true;
        
        // If we have the user data, update lastLogin
        if (userData) {
          try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, { 
              lastLogin: new Date(),
              // Ensure social provider is in authProviders
              authProviders: userData.authProviders && userData.authProviders.includes('social') 
                ? userData.authProviders 
                : [...(userData.authProviders || []), 'social']
            });
          } catch (updateError) {
            console.error('Error updating last login:', updateError);
            // Don't throw here, just continue
          }
        }
        
        // Return whether this is a new user (for profile completion routing)
        return { ...result, isNewUser };
      } catch (firestoreError) {
        console.error('Firestore error during Apple sign-in:', firestoreError);
        // If there's an error with Firestore, default to requiring profile completion
        return { ...result, isNewUser: true, error: firestoreError.message };
      }
    } catch (error) {
      console.error('Apple sign-in error:', error);
      setError(error.message || 'Failed to sign in with Apple');
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
      setError(error.message);
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
      setError(error.message);
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
    loading,
    error,
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
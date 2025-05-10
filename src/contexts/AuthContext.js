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
        
        let adminStatusFromClaim = false;
        let adminStatusFromFirestore = false;
        
        // Get the user's ID token to check custom claims
        try {
          const idTokenResult = await currentUser.getIdTokenResult(true); // Force token refresh
          adminStatusFromClaim = idTokenResult.claims.admin === true;
          console.log("Admin claim from token:", adminStatusFromClaim);
        } catch (tokenError) {
          console.error("Error checking token claims:", tokenError);
          // Continue to check Firestore
        }

        // Check Firestore for admin status
        try {
          // First try by email
          if (currentUser.email) {
            try {
              const emailDoc = await getDoc(doc(db, 'users', currentUser.email));
              if (emailDoc.exists()) {
                adminStatusFromFirestore = emailDoc.data().isAdmin === true;
                console.log("Admin status from email document:", adminStatusFromFirestore);
              }
            } catch (emailError) {
              console.error("Error checking admin by email document:", emailError);
            }
          }
          
          // If not found or no email, try by UID
          if (!adminStatusFromFirestore) {
            try {
              const uidDoc = await getDoc(doc(db, 'users', currentUser.uid));
              if (uidDoc.exists()) {
                adminStatusFromFirestore = uidDoc.data().isAdmin === true;
                console.log("Admin status from UID document:", adminStatusFromFirestore);
              }
            } catch (uidError) {
              console.error("Error checking admin by UID document:", uidError);
            }
          }
          
          // If still not found, query by email field
          if (!adminStatusFromFirestore && currentUser.email) {
            try {
              const usersRef = collection(db, 'users');
              const q = query(usersRef, where('email', '==', currentUser.email));
              const querySnapshot = await getDocs(q);
              
              if (!querySnapshot.empty) {
                const userData = querySnapshot.docs[0].data();
                adminStatusFromFirestore = userData.isAdmin === true;
                console.log("Admin status from email query:", adminStatusFromFirestore);
              }
            } catch (queryError) {
              console.error("Error checking admin by email query:", queryError);
            }
          }
        } catch (firestoreError) {
          console.error("Error checking Firestore admin status:", firestoreError);
        }
        
        // For now we'll only require one of the two checks to be true
        // This allows admins to start using the dashboard even if one side is not yet updated
        const isUserAdmin = adminStatusFromClaim || adminStatusFromFirestore;
        
        // If admin in Firestore but not in claims, attempt to fix
        if (adminStatusFromFirestore && !adminStatusFromClaim) {
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
      console.error("fetchUserData: No user object provided");
      throw new Error('User object is required');
    }
    
    console.log("fetchUserData: Starting for user:", user.uid, user.email);
    console.log("fetchUserData: User object:", JSON.stringify({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      providerData: user.providerData
    }));
    
    try {
      // Create a new document for the user if needed
      // We need to ensure users have documents with both UID and email as IDs
      let userData = null;
      
      // First try to get the existing document by UID or email
      try {
        console.log("fetchUserData: Trying to get user document by UID:", user.uid);
        // Try UID first
        const uidRef = doc(db, 'users', user.uid);
        const uidDoc = await getDoc(uidRef);
        
        if (uidDoc.exists()) {
          console.log("fetchUserData: Found user document by UID");
          userData = { id: user.uid, ...uidDoc.data() };
        } else {
          console.log("fetchUserData: No document found by UID");
          // If not found by UID but we have an email, try by email
          if (user.email) {
            console.log("fetchUserData: Trying to get user document by email:", user.email);
            const emailRef = doc(db, 'users', user.email);
            const emailDoc = await getDoc(emailRef);
            
            if (emailDoc.exists()) {
              console.log("fetchUserData: Found user document by email");
              userData = { id: user.email, ...emailDoc.data() };
            } else {
              console.log("fetchUserData: No document found by email either");
            }
          } else {
            console.log("fetchUserData: No email available to try");
          }
        }
      } catch (getError) {
        console.error("fetchUserData: Error getting user document:", getError);
        // Continue to create if needed
      }
      
      // If no document found, create one
      if (!userData) {
        console.log("fetchUserData: No user document found, creating one");
        
        try {
          // Prepare user data
          const newUserData = {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || '',
            fullname: user.displayName || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastLogin: new Date(),
            profileCompleted: false,
            isAdmin: false,
            authProviders: user.providerData ? 
              user.providerData.map(provider => 
                provider.providerId.includes('google.com') ? 'social' : 'email'
              ) : ['email']
          };
          
          console.log("fetchUserData: Creating document with UID as ID:", user.uid);
          // Create document with UID as document ID
          const uidRef = doc(db, 'users', user.uid);
          await setDoc(uidRef, newUserData);
          console.log("fetchUserData: Successfully created document with UID");
          
          // Also create/update document with email as ID for easier lookups (if email exists)
          if (user.email) {
            console.log("fetchUserData: Creating document with email as ID:", user.email);
            const emailRef = doc(db, 'users', user.email);
            await setDoc(emailRef, {
              ...newUserData,
              referenceUid: user.uid
            });
            console.log("fetchUserData: Successfully created document with email");
          }
          
          userData = { id: user.uid, ...newUserData };
          console.log("fetchUserData: Created new user document successfully");
        } catch (createError) {
          console.error("fetchUserData: Error creating user document:", createError);
          throw new Error('Failed to create user document: ' + createError.message);
        }
      }
      
      // Update admin status
      if (userData) {
        console.log("fetchUserData: Updating admin status, isAdmin =", userData.isAdmin === true);
        setIsAdmin(userData.isAdmin === true);
        
        // Update fullname if available
        if (userData.fullname) {
          console.log("fetchUserData: Setting userFullname from userData:", userData.fullname);
          setUserFullname(userData.fullname);
        } else if (user.displayName) {
          console.log("fetchUserData: Setting userFullname from displayName:", user.displayName);
          setUserFullname(user.displayName);
        }
        
        // Update last login
        try {
          console.log("fetchUserData: Updating last login time");
          const uidRef = doc(db, 'users', user.uid);
          await updateDoc(uidRef, { 
            lastLogin: new Date(),
            updatedAt: serverTimestamp()
          });
          console.log("fetchUserData: Updated last login on UID document");
          
          if (user.email) {
            const emailRef = doc(db, 'users', user.email);
            await updateDoc(emailRef, { 
              lastLogin: new Date(),
              updatedAt: serverTimestamp()
            });
            console.log("fetchUserData: Updated last login on email document");
          }
        } catch (updateError) {
          console.error("fetchUserData: Error updating last login:", updateError);
          // Continue anyway, this is not critical
        }
      } else {
        console.error("fetchUserData: userData is still null after create/fetch attempts");
      }
      
      console.log("fetchUserData: Completed successfully, returning userData");
      return userData;
    } catch (error) {
      console.error("fetchUserData: Fatal error:", error);
      console.error("fetchUserData: Error stack:", error.stack);
      throw new Error('Failed to fetch user data: ' + error.message);
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
      console.log("signInWithGoogle: Starting Google sign-in process");
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      console.log("signInWithGoogle: Sign-in successful, user:", user.uid, user.email);
      
      try {
        // Ensure we get the most up-to-date token before proceeding
        try {
          await user.getIdToken(true);
          console.log("signInWithGoogle: Refreshed ID token");
        } catch (tokenError) {
          console.error("signInWithGoogle: Error refreshing token, continuing anyway:", tokenError);
        }
        
        // Fetch/create user data in Firestore
        console.log("signInWithGoogle: Fetching user data from Firestore");
        let userData = null;
        try {
          userData = await fetchUserData(user);
          console.log("signInWithGoogle: User data fetched successfully");
        } catch (fetchError) {
          console.error("signInWithGoogle: Error in fetchUserData:", fetchError);
          
          // Try the debug function as a fallback
          try {
            console.log("signInWithGoogle: Trying debug function to create user document");
            const { debugUserDocuments } = await import('../utils/firebaseUtils');
            const debugResults = await debugUserDocuments(user);
            console.log("signInWithGoogle: Debug function results:", debugResults);
            
            // If we created any documents, try fetching again
            if (debugResults.createdDocuments.length > 0) {
              console.log("signInWithGoogle: Created documents, trying fetchUserData again");
              userData = await fetchUserData(user);
              console.log("signInWithGoogle: Second fetchUserData attempt succeeded");
            }
          } catch (debugError) {
            console.error("signInWithGoogle: Debug function error:", debugError);
            // Continue with fallback behavior
          }
        }
        
        const isNewUser = userData ? !userData.profileCompleted : true;
        
        // If we have the user data, update lastLogin
        if (userData) {
          try {
            console.log("signInWithGoogle: Updating last login time");
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, { 
              lastLogin: new Date(),
              // Ensure social provider is in authProviders
              authProviders: userData.authProviders && userData.authProviders.includes('social') 
                ? userData.authProviders 
                : [...(userData.authProviders || []), 'social']
            });
            console.log("signInWithGoogle: Updated last login successfully");
          } catch (updateError) {
            console.error('signInWithGoogle: Error updating last login:', updateError);
            // Don't throw here, just continue
          }
        } else {
          console.warn("signInWithGoogle: No userData available for lastLogin update");
        }
        
        // Check admin status
        try {
          console.log("signInWithGoogle: Checking admin status");
          await refreshAdminStatus();
          console.log("signInWithGoogle: Admin status checked successfully");
        } catch (adminError) {
          console.error("signInWithGoogle: Error checking admin status:", adminError);
          // Continue anyway
        }
        
        console.log("signInWithGoogle: Success, returning result with isNewUser:", isNewUser);
        // Return whether this is a new user (for profile completion routing)
        return { ...result, isNewUser };
      } catch (firestoreError) {
        console.error('signInWithGoogle: Firestore error during sign-in:', firestoreError);
        // If there's an error with Firestore, default to requiring profile completion
        return { ...result, isNewUser: true, error: firestoreError.message };
      }
    } catch (error) {
      console.error('signInWithGoogle: Sign-in error:', error);
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

  // Add this new function before the handleAuthStateChange function
  async function refreshUserToken(user) {
    if (!user) return null;
    
    console.log("refreshUserToken: Starting token refresh for user:", user.uid);
    try {
      // Force token refresh
      await user.getIdToken(true);
      console.log("refreshUserToken: Token refreshed successfully");
      return user;
    } catch (error) {
      console.error("refreshUserToken: Error refreshing token:", error);
      // Continue with the user object even if token refresh fails
      return user;
    }
  }

  async function handleAuthStateChange(user) {
    console.log("handleAuthStateChange: Auth state changed, user:", user ? `${user.uid} (${user.email})` : "null");
    
    if (user) {
      // Refresh the token before proceeding
      try {
        user = await refreshUserToken(user);
      } catch (tokenError) {
        console.error("handleAuthStateChange: Token refresh error:", tokenError);
        // Continue with the original user object
      }
    }
    
    setCurrentUser(user);
    
    if (user) {
      try {
        console.log("handleAuthStateChange: User authenticated, fetching user data");
        // Fetch complete user data from Firestore
        await fetchUserData(user);
        console.log("handleAuthStateChange: User data fetched successfully");
      } catch (fetchError) {
        console.error("handleAuthStateChange: Error fetching user data:", fetchError);
        // Even if there's an error, we'll continue with the authenticated state
        // but admin status will be false
        setIsAdmin(false);
        setUserFullname(user.displayName || '');
      }
    } else {
      console.log("handleAuthStateChange: User signed out, resetting state");
      setIsAdmin(false);
      setUserFullname('');
    }
    
    console.log("handleAuthStateChange: Setting loading to false");
    setLoading(false);
  }

  useEffect(() => {
    console.log("AuthContext: Setting up auth state observer");
    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        console.log("AuthContext: Auth state changed, calling handleAuthStateChange");
        await handleAuthStateChange(user);
      } catch (error) {
        console.error("AuthContext: Fatal error in auth state observer:", error);
        setLoading(false);
      }
    });

    return () => {
      console.log("AuthContext: Cleanup - unsubscribing from auth state");
      unsubscribe();
    };
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
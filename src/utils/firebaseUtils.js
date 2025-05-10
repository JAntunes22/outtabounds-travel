import { collection, addDoc, getDocs, setDoc, updateDoc, deleteDoc, doc, getDoc, query, where, orderBy, serverTimestamp } from "firebase/firestore";
import { db } from "./firebaseConfig";
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();

// Helper function to safely get user ID (UID) for document reference
const getUserId = (user) => {
  if (!user) return null;
  
  console.log("Getting user ID from:", user);
  
  // If user is a string, just return it as the ID
  if (typeof user === 'string') {
    console.log("User is a string, returning as ID:", user);
    return user;
  }
  
  // If user has uid, that's from Firebase Auth - primary identifier
  if (user.uid) {
    console.log("Using user.uid:", user.uid);
    return user.uid;
  }
  
  // Fallback to other identifiers
  if (user.id) {
    console.log("Using user.id:", user.id);
    return user.id;
  }
  
  if (user.email) {
    console.log("Using user.email:", user.email);
    return user.email;
  }
  
  console.log("Could not determine user ID");
  return null;
};

// User-related functions
export async function createUserDocument(user) {
  if (!user) {
    throw new Error('User object is required');
  }

  try {
    const userId = getUserId(user);
    if (!userId) throw new Error("Could not determine user ID");
    
    console.log(`Creating user document for UID: ${userId}`);
    const userRef = doc(db, "users", userId);
    
    // Check if document already exists
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      console.log("User document already exists, updating instead of creating");
      // Document exists, update instead of create
      const existingData = docSnap.data();
      const updatedData = {
        ...existingData,
        lastLogin: new Date()
      };
      
      // Update any new fields from the user object
      if (user.email && !existingData.email) updatedData.email = user.email;
      if (user.displayName && !existingData.displayName) updatedData.displayName = user.displayName;
      if (user.fullname && !existingData.fullname) updatedData.fullname = user.fullname || user.displayName || '';
      if (user.firstName && !existingData.firstName) updatedData.firstName = user.firstName || '';
      if (user.lastName && !existingData.lastName) updatedData.lastName = user.lastName || '';
      if (user.phoneNumber && !existingData.phoneNumber) updatedData.phoneNumber = user.phoneNumber || '';
      if (user.title && !existingData.title) updatedData.title = user.title || '';
      if (user.receiveOffers !== undefined && existingData.receiveOffers === undefined) {
        updatedData.receiveOffers = user.receiveOffers;
      }
      
      await updateDoc(userRef, updatedData);
      console.log("User document updated");
      return true;
    }
    
    // Default user data - include all possible fields
    const userData = {
      uid: userId,
      email: user.email || '',
      displayName: user.displayName || '',
      fullname: user.fullname || user.displayName || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phoneNumber: user.phoneNumber || '',
      title: user.title || '',
      receiveOffers: user.receiveOffers !== undefined ? user.receiveOffers : false,
      isAdmin: false,
      createdAt: new Date(),
      lastLogin: new Date(),
      profileCompleted: user.profileCompleted !== undefined ? user.profileCompleted : true
    };
    
    // Add auth providers if specified
    if (user.authProviders) {
      userData.authProviders = user.authProviders;
    }
    
    // Create new document
    await setDoc(userRef, userData);
    console.log("User document created successfully for:", userId);
    return true;
  } catch (error) {
    console.error("Error creating/updating user document:", error);
    throw error;
  }
}

export async function getUserDocument(userId) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  try {
    // First try direct lookup with the provided ID
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return {
        id: userId,
        ...userDoc.data()
      };
    }
    
    // If the document doesn't exist and looks like an email, try looking up by email
    if (userId.includes('@')) {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', userId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return {
          id: doc.id,
          ...doc.data()
        };
      }
    }
    
    // If the document doesn't exist and looks like a UID, try looking up by UID field
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('uid', '==', userId));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user document:', error);
    throw new Error('Failed to get user document');
  }
}

// Find a user document by email address
export async function findUserByEmail(email) {
  if (!email) {
    throw new Error('Email is required');
  }

  try {
    // First, try direct lookup by email as document ID
    const directRef = doc(db, 'users', email);
    const directDoc = await getDoc(directRef);
    
    if (directDoc.exists()) {
      return {
        id: email,
        ...directDoc.data()
      };
    }
    
    // Then try query by email field
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      return {
        id: userDoc.id,
        ...userDoc.data()
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error finding user by email:', error);
    throw new Error('Failed to find user by email');
  }
}

// Fetch all users from Firestore
export const fetchAllUsers = async () => {
  try {
    console.log("Fetching all users from Firestore");
    const usersCollection = collection(db, 'users');
    const usersSnapshot = await getDocs(usersCollection);
    
    const users = [];
    usersSnapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`Fetched ${users.length} users`);
    return users;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

// Update a user document
export const updateUser = async (user) => {
  try {
    if (!user || !user.id) {
      throw new Error("User object with ID is required");
    }
    
    console.log("Updating user:", user.id);
    const userRef = doc(db, "users", user.id);
    
    // Remove the id property to avoid storing it in the document
    const { id, ...userData } = user;
    
    // Update the document
    await updateDoc(userRef, userData);
    
    // If isAdmin status changed, update the admin custom claim
    if (userData.isAdmin !== undefined) {
      try {
        if (userData.isAdmin) {
          await addAdminRole(user.id);
        } else {
          await removeAdminRole(user.id);
        }
      } catch (adminError) {
        console.error("Could not update admin status:", adminError);
        // We don't throw here because the Firestore update was successful
      }
    }
    
    console.log("User updated successfully");
    return true;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

// Delete a user from both Firestore and Authentication (if applicable)
export const deleteUser = async (userId) => {
  try {
    if (!userId) {
      throw new Error("User ID is required");
    }
    
    console.log("Deleting user:", userId);
    
    // First, delete the user document from Firestore
    const userRef = doc(db, "users", userId);
    await deleteDoc(userRef);
    console.log("User document deleted from Firestore");
    
    // Then, attempt to delete the user from Authentication using Firebase Functions
    try {
      const deleteAuthUserFunction = httpsCallable(functions, 'deleteUserAccount');
      await deleteAuthUserFunction({ email: userId });
      console.log("User deleted from Authentication");
    } catch (authError) {
      console.error("Error deleting user from Authentication:", authError);
      // We don't throw here because the Firestore deletion was successful
    }
    
    return true;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

export async function checkUserAdmin(user) {
  if (!user) {
    throw new Error('User object is required');
  }

  try {
    console.log("Checking admin status for user:", user.email || user.uid);
    
    // Check custom claims first
    let hasAdminClaim = false;
    try {
      const idTokenResult = await user.getIdTokenResult(true);
      hasAdminClaim = idTokenResult.claims.admin === true;
      console.log("Admin claim from token:", hasAdminClaim);
    } catch (claimError) {
      console.error("Error checking admin claim:", claimError);
      // Continue checking Firestore
    }

    // Check Firestore by email
    let hasAdminDoc = false;
    
    if (user.email) {
      try {
        // Try by email as document ID
        const emailDoc = await getDoc(doc(db, 'users', user.email));
        if (emailDoc.exists()) {
          hasAdminDoc = emailDoc.data().isAdmin === true;
          console.log("Admin status by email document:", hasAdminDoc);
        }
      } catch (emailError) {
        console.error("Error checking admin by email document:", emailError);
      }
    }
    
    // If not found, try by UID
    if (!hasAdminDoc) {
      try {
        const uidDoc = await getDoc(doc(db, 'users', user.uid));
        if (uidDoc.exists()) {
          hasAdminDoc = uidDoc.data().isAdmin === true;
          console.log("Admin status by UID document:", hasAdminDoc);
        }
      } catch (uidError) {
        console.error("Error checking admin by UID document:", uidError);
      }
    }
    
    // If still not found, try query by email field
    if (!hasAdminDoc && user.email) {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', user.email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          hasAdminDoc = userDoc.data().isAdmin === true;
          console.log("Admin status by email query:", hasAdminDoc);
        }
      } catch (queryError) {
        console.error("Error checking admin by email query:", queryError);
      }
    }

    // For now we'll only require one of the two checks to be true
    // This allows admins to access even if one side is not yet updated
    const isAdmin = hasAdminClaim || hasAdminDoc;
    console.log("Final admin status:", isAdmin);
    
    return isAdmin;
  } catch (error) {
    console.error('Error checking admin status:', error);
    throw new Error('Failed to verify admin status: ' + error.message);
  }
}

// Add a course to Firestore
export const addCourse = async (course) => {
  try {
    const docRef = await addDoc(collection(db, "courses"), course);
    console.log("Course added with ID: ", docRef.id);
  } catch (error) {
    console.error("Error adding course: ", error);
  }
};

// Fetch all courses from Firestore
export const fetchCourses = async () => {
  try {
    const coursesRef = collection(db, 'courses');
    const q = query(coursesRef, orderBy('name'));
    const querySnapshot = await getDocs(q);
    
    const courses = [];
    querySnapshot.forEach((doc) => {
      courses.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return courses;
  } catch (error) {
    console.error("Error fetching courses:", error);
    throw error;
  }
};

export const fetchCourseById = async (courseId) => {
  try {
    const courseDoc = await getDoc(doc(db, 'courses', courseId));
    
    if (courseDoc.exists()) {
      return {
        id: courseDoc.id,
        ...courseDoc.data()
      };
    } else {
      throw new Error('Course not found');
    }
  } catch (error) {
    console.error("Error fetching course:", error);
    throw error;
  }
};

// Admin-related functions
export const addAdminRole = async (email) => {
  try {
    const addAdminFunction = httpsCallable(functions, 'addAdminRole');
    const result = await addAdminFunction({ email });
    return result.data;
  } catch (error) {
    console.error("Error adding admin role:", error);
    throw error;
  }
};

export const removeAdminRole = async (email) => {
  try {
    const removeAdminFunction = httpsCallable(functions, 'removeAdminRole');
    const result = await removeAdminFunction({ email });
    return result.data;
  } catch (error) {
    console.error("Error removing admin role:", error);
    throw error;
  }
};

// Sync user data from an existing account with the same email
export async function syncUserData(user, existingUserData) {
  if (!user || !existingUserData) {
    throw new Error('User and existing user data are required');
  }

  try {
    // Create a document for the current user with data from both sources
    const userRef = doc(db, 'users', user.uid);
    
    // Get any important data from the existing user document
    const updateData = {
      uid: user.uid,
      email: user.email || existingUserData.email || '',
      displayName: user.displayName || existingUserData.displayName || '',
      fullname: existingUserData.fullname || user.displayName || '',
      firstName: existingUserData.firstName || '',
      lastName: existingUserData.lastName || '',
      phoneNumber: existingUserData.phoneNumber || '',
      title: existingUserData.title || '',
      // Don't copy over admin status - preserve as false for security
      isAdmin: false,
      // Keep profile completion status from existing data or default to false
      profileCompleted: existingUserData.profileCompleted === true,
      // Update timestamps
      updatedAt: serverTimestamp(),
      createdAt: existingUserData.createdAt || serverTimestamp(),
      lastLogin: new Date(),
      // Add social to auth providers
      authProviders: existingUserData.authProviders && existingUserData.authProviders.includes('social')
        ? existingUserData.authProviders
        : [...(existingUserData.authProviders || []), 'social']
    };

    // Check if the document exists first
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      // Update existing document
      await updateDoc(userRef, updateData);
    } else {
      // Create new document
      await setDoc(userRef, updateData);
    }
    
    // Also ensure we have a document with email as ID for easier lookups
    if (user.email) {
      const emailRef = doc(db, 'users', user.email);
      await setDoc(emailRef, {
        ...updateData,
        referenceUid: user.uid
      }, { merge: true });
    }
    
    return {
      id: user.uid,
      ...updateData
    };
  } catch (error) {
    console.error('Error syncing user data:', error);
    throw new Error('Failed to sync user data');
  }
}

// For backward compatibility
export const mergeUserAccounts = syncUserData;

// Fetch all inquiries for a specific user
export const fetchUserInquiries = async (userId) => {
  try {
    if (!userId) throw new Error("User ID is required");
    
    console.log("Fetching inquiries for user:", userId);
    const inquiriesCollection = collection(db, 'inquiries');
    const q = query(
      inquiriesCollection, 
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    
    const inquiries = [];
    querySnapshot.forEach((doc) => {
      inquiries.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      });
    });
    
    console.log(`Fetched ${inquiries.length} inquiries for user`);
    return inquiries;
  } catch (error) {
    console.error("Error fetching user inquiries:", error);
    throw error;
  }
};

// Fetch all inquiries (for admin)
export const fetchAllInquiries = async () => {
  try {
    console.log("Fetching all inquiries");
    const inquiriesCollection = collection(db, 'inquiries');
    const q = query(
      inquiriesCollection,
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    
    const inquiries = [];
    querySnapshot.forEach((doc) => {
      inquiries.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      });
    });
    
    console.log(`Fetched ${inquiries.length} inquiries total`);
    return inquiries;
  } catch (error) {
    console.error("Error fetching all inquiries:", error);
    throw error;
  }
};

// Update inquiry status
export const updateInquiryStatus = async (inquiryId, status) => {
  try {
    if (!inquiryId) throw new Error("Inquiry ID is required");
    if (!status) throw new Error("Status is required");
    
    console.log(`Updating inquiry ${inquiryId} status to ${status}`);
    const inquiryRef = doc(db, "inquiries", inquiryId);
    
    await updateDoc(inquiryRef, { 
      status: status,
      updatedAt: new Date()
    });
    
    console.log("Inquiry status updated successfully");
    return true;
  } catch (error) {
    console.error("Error updating inquiry status:", error);
    throw error;
  }
};

// Update user profile
export async function updateUserProfile(userId, updates) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  if (!updates || typeof updates !== 'object') {
    throw new Error('Invalid update data');
  }

  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    // Prevent direct modification of admin status
    if ('isAdmin' in updates) {
      throw new Error('Cannot modify admin status directly');
    }

    // Add timestamp for the update
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp()
    };

    await updateDoc(userRef, updateData);
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw new Error('Failed to update user profile');
  }
}

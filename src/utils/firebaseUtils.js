import { collection, addDoc, getDocs, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";
import { getFunctions, httpsCallable } from 'firebase/functions';
import { 
  query, 
  where,
  orderBy, 
  doc, 
  getDoc 
} from 'firebase/firestore';

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
export const createUserDocument = async (user) => {
  try {
    if (!user) throw new Error("User object is required");
    
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
};

export const getUserDocument = async (user) => {
  try {
    if (!user) throw new Error("User object or ID is required");
    
    const userId = getUserId(user);
    if (!userId) throw new Error("Could not determine user ID");
    
    console.log("Getting user document for ID:", userId);
    const userRef = doc(db, "users", userId);
    
    try {
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log("Found user document:", userData);
        
        // Log specific fields that we're interested in
        console.log("Title:", userData.title);
        console.log("Phone Number:", userData.phoneNumber);
        console.log("Receive Offers:", userData.receiveOffers);
        
        return {
          id: userId,
          ...userData
        };
      }
      
      console.log("No user document found for ID:", userId);
      return null;
    } catch (docError) {
      console.error("Error getting document:", docError);
      throw docError;
    }
  } catch (error) {
    console.error("Error in getUserDocument:", error);
    throw error;
  }
};

// Find a user document by email address
export const findUserByEmail = async (email) => {
  try {
    if (!email) throw new Error("Email is required");
    
    console.log("Finding user document by email:", email);
    const usersCollection = collection(db, 'users');
    const q = query(usersCollection, where("email", "==", email));
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      // Return the first matching user
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      console.log("Found user document by email:", userData);
      return {
        id: userDoc.id,
        ...userData
      };
    }
    
    console.log("No user document found for email:", email);
    return null;
  } catch (error) {
    console.error("Error finding user by email:", error);
    throw error;
  }
};

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

export const checkUserAdmin = async (user) => {
  try {
    if (!user) throw new Error("User object or ID is required");
    
    const userId = getUserId(user);
    if (!userId) throw new Error("Could not determine user ID");
    
    console.log("Checking admin status for user ID:", userId);
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log("User data from Firestore:", userData);
      return userData.isAdmin === true;
    } 
    
    console.log("No user document found for ID:", userId);
    return false;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
};

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
export const syncUserData = async (currentUser, existingUserData) => {
  try {
    if (!currentUser || !existingUserData) {
      throw new Error("Both current user and existing user data are required");
    }

    console.log("Syncing user data for:", currentUser.email);
    
    // We'll only update the Firestore document for the current user
    // without disturbing any existing documents or Firebase Auth accounts
    
    // Create document data for the current user with synced profile data
    const userData = {
      uid: currentUser.uid,
      email: currentUser.email || '',
      displayName: currentUser.displayName || existingUserData.displayName || '',
      fullname: existingUserData.fullname || currentUser.displayName || '',
      // Copy any existing profile data
      firstName: existingUserData.firstName || '',
      lastName: existingUserData.lastName || '',
      phoneNumber: existingUserData.phoneNumber || '',
      title: existingUserData.title || '',
      // Keep admin status if it exists, otherwise set to false
      isAdmin: existingUserData.isAdmin === true ? true : false,
      // Keep profile completion status
      profileCompleted: existingUserData.profileCompleted === true,
      // Keep user preferences
      receiveOffers: existingUserData.receiveOffers === true,
      // Update timestamps
      createdAt: existingUserData.createdAt || new Date(),
      lastLogin: new Date(),
      // Track authentication methods - we're not modifying auth providers here
      // just preserving the current authentication method
      authProviders: ['social']
    };
    
    // Update document for the current user with synced data
    console.log("Updating user document with synced data for:", currentUser.uid);
    const userRef = doc(db, 'users', currentUser.uid);
    await setDoc(userRef, userData);
    
    return {
      id: currentUser.uid,
      ...userData
    };
  } catch (error) {
    console.error("Error syncing user data:", error);
    throw error;
  }
};

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
export const updateUserProfile = async (uid, updates) => {
  try {
    if (!uid) {
      throw new Error("User ID is required");
    }
    
    console.log("Updating user profile in firebaseUtils:", uid, updates);
    
    // Reference to the user document
    const userRef = doc(db, "users", uid);
    
    // Check if document exists
    const docSnap = await getDoc(userRef);
    
    if (!docSnap.exists()) {
      console.warn("User document doesn't exist, creating new one");
      
      // Ensure admin status is explicitly set to false for new documents
      const userData = {
        uid: uid,
        createdAt: new Date(),
        lastLogin: new Date(),
        isAdmin: false, // Explicitly set isAdmin to false
        ...updates
      };
      
      await setDoc(userRef, userData);
      return true;
    }
    
    // Get current data
    const currentData = docSnap.data();
    
    // Don't allow overriding isAdmin status through regular profile updates
    if (updates.hasOwnProperty('isAdmin') && updates.isAdmin !== currentData.isAdmin) {
      console.warn("Attempting to change isAdmin status through regular profile update - ignoring");
      delete updates.isAdmin;
    }
    
    // Update the document
    await updateDoc(userRef, updates);
    
    console.log("User profile updated successfully");
    return true;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

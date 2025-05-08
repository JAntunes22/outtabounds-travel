import { collection, addDoc, getDocs, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db, auth } from "./firebaseConfig";
import { getFunctions, httpsCallable } from 'firebase/functions';
import { 
  query, 
  where,
  orderBy, 
  doc, 
  getDoc 
} from 'firebase/firestore';
import { deleteUser as deleteAuthUser } from 'firebase/auth';

const functions = getFunctions();

// Helper function to safely get user ID (email) for document reference
const getUserId = (user) => {
  if (!user) return null;
  
  console.log("Getting user ID from:", user);
  
  // If user is a string, just return it as the ID
  if (typeof user === 'string') {
    console.log("User is a string, returning as ID:", user);
    return user;
  }
  
  // Check if user has id or email property
  if (user.id) {
    console.log("Using user.id:", user.id);
    return user.id;
  }
  
  if (user.email) {
    console.log("Using user.email:", user.email);
    return user.email;
  }
  
  // If user has uid, that's from Firebase Auth
  if (user.uid) {
    console.log("Using user.email or user.uid:", user.email || user.uid);
    return user.email || user.uid;
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
    
    const userRef = doc(db, "users", userId);
    
    // Default user data
    const userData = {
      email: user.email || userId,
      displayName: user.displayName || '',
      fullname: user.fullname || user.displayName || '',
      isAdmin: false,
      createdAt: new Date()
    };
    
    // Add additional user fields if they exist
    if (user.title) userData.title = user.title;
    if (user.firstName) userData.firstName = user.firstName;
    if (user.lastName) userData.lastName = user.lastName;
    if (user.phoneNumber) userData.phoneNumber = user.phoneNumber;
    if (user.receiveOffers !== undefined) userData.receiveOffers = user.receiveOffers;
    
    await setDoc(userRef, userData);
    console.log("User document created for:", userId);
    return true;
  } catch (error) {
    console.error("Error creating user document:", error);
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

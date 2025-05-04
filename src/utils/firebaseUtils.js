import { collection, addDoc, getDocs, setDoc } from "firebase/firestore";
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

// Helper function to safely get user ID (email) for document reference
const getUserId = (user) => {
  if (!user) return null;
  
  // If user is a string, just return it as the ID
  if (typeof user === 'string') return user;
  
  // Check if user has id or email property
  if (user.id) return user.id;
  if (user.email) return user.email;
  
  // If user has uid, that's from Firebase Auth
  if (user.uid) return user.email || user.uid;
  
  return null;
};

// User-related functions
export const createUserDocument = async (user) => {
  try {
    if (!user) throw new Error("User object is required");
    
    const userId = getUserId(user);
    if (!userId) throw new Error("Could not determine user ID");
    
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, {
      email: user.email || userId,
      displayName: user.displayName || '',
      fullname: user.fullname || user.displayName || '',
      isAdmin: false,
      createdAt: new Date()
    });
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
  } catch (error) {
    console.error("Error fetching user document:", error);
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

import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "./firebaseConfig";
import { getFunctions, httpsCallable } from 'firebase/functions';
import { 
  query, 
  orderBy, 
  doc, 
  getDoc 
} from 'firebase/firestore';

const functions = getFunctions();

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

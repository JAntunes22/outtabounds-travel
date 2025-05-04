// src/services/database.js
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "../utils/firebaseConfig";

export const getCourses = async () => {
  const querySnapshot = await getDocs(collection(db, "courses"));
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const addCourse = async (course) => {
  await addDoc(collection(db, "courses"), course);
};
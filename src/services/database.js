// src/services/database.js
import { getFirestore, collection, getDocs, addDoc } from "firebase/firestore";

const db = getFirestore();

export const getCourses = async () => {
  const querySnapshot = await getDocs(collection(db, "courses"));
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const addCourse = async (course) => {
  await addDoc(collection(db, "courses"), course);
};
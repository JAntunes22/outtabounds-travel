// src/services/storage.js
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../utils/firebaseConfig";

export const uploadImage = async (file) => {
  const storageRef = ref(storage, `images/${file.name}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};
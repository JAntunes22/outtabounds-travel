// src/services/auth.js
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "../utils/firebaseConfig";

export const login = async (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const signup = async (email, password) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const logout = async () => {
  return signOut(auth);
};
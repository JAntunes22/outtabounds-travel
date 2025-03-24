// src/services/auth.js
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";

const auth = getAuth();

export const login = async (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const signup = async (email, password) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const logout = async () => {
  return signOut(auth);
};
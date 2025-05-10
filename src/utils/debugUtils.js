import { getAuth } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebaseConfig';

// Function to manually check user existence and create if needed
export async function debugUserDocument() {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      console.error("DEBUG: No user is signed in");
      return { success: false, error: "No user signed in" };
    }
    
    console.log("DEBUG: Current user:", {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName
    });
    
    // Check if user document exists by UID
    const uidRef = doc(db, 'users', user.uid);
    const uidDoc = await getDoc(uidRef);
    const uidExists = uidDoc.exists();
    
    // Check if user document exists by email
    let emailExists = false;
    if (user.email) {
      const emailRef = doc(db, 'users', user.email);
      const emailDoc = await getDoc(emailRef);
      emailExists = emailDoc.exists();
    }
    
    console.log("DEBUG: Document exists checks:", {
      byUid: uidExists,
      byEmail: emailExists
    });
    
    // Create document if it doesn't exist
    if (!uidExists) {
      console.log("DEBUG: Creating user document with UID");
      const userData = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        fullname: user.displayName || '',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: new Date(),
        profileCompleted: false,
        isAdmin: false, // Note: Set to true manually in Firebase Console for admin access
        authProviders: ['email']
      };
      
      await setDoc(uidRef, userData);
      console.log("DEBUG: User document created with UID");
    }
    
    // Create email document if it doesn't exist and email is available
    if (!emailExists && user.email) {
      console.log("DEBUG: Creating user document with email");
      const emailRef = doc(db, 'users', user.email);
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || '',
        fullname: user.displayName || '',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: new Date(),
        profileCompleted: false,
        isAdmin: false, // Note: Set to true manually in Firebase Console for admin access
        authProviders: ['email'],
        referenceUid: user.uid
      };
      
      await setDoc(emailRef, userData);
      console.log("DEBUG: User document created with email");
    }
    
    // Re-check documents after creation
    const updatedUidDoc = await getDoc(uidRef);
    console.log("DEBUG: Updated user document by UID:", updatedUidDoc.exists() ? updatedUidDoc.data() : "No document");
    
    if (user.email) {
      const updatedEmailRef = doc(db, 'users', user.email);
      const updatedEmailDoc = await getDoc(updatedEmailRef);
      console.log("DEBUG: Updated user document by email:", updatedEmailDoc.exists() ? updatedEmailDoc.data() : "No document");
    }
    
    return { 
      success: true, 
      message: "User documents checked and created if needed",
      userDocExists: updatedUidDoc.exists()
    };
  } catch (error) {
    console.error("DEBUG: Error in debug function:", error);
    return { success: false, error: error.message };
  }
} 
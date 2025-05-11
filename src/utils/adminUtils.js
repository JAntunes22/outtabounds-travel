import { getFunctions, httpsCallable } from 'firebase/functions';

/**
 * Utility functions for admin operations
 */

/**
 * Clean up duplicate email-based documents in the database
 * This should only be run by an admin user
 * @returns {Promise<Object>} Results of the cleanup operation
 */
export const cleanupEmailDocuments = async () => {
  try {
    console.log("Starting email documents cleanup process...");
    
    const functions = getFunctions();
    const cleanupFunction = httpsCallable(functions, 'cleanupEmailDocuments');
    
    const result = await cleanupFunction();
    
    console.log("Cleanup completed:", result.data);
    return result.data;
  } catch (error) {
    console.error("Error running cleanup:", error);
    throw new Error(`Cleanup failed: ${error.message}`);
  }
};

/**
 * Delete a specific email document
 * This is a manual operation that should be used carefully
 * @param {string} email The email to delete as document ID
 * @returns {Promise<Object>} Result of the operation
 */
export const deleteEmailDocument = async (email) => {
  try {
    if (!email || !email.includes('@')) {
      throw new Error("Valid email is required");
    }
    
    console.log(`Attempting to delete document with ID: ${email}`);
    
    const { deleteDoc, doc } = await import('firebase/firestore');
    const { db } = await import('../utils/firebaseConfig');
    
    // Delete the document
    await deleteDoc(doc(db, 'users', email));
    
    console.log(`Document with ID ${email} deleted successfully`);
    return { success: true, message: `Document with ID ${email} deleted successfully` };
  } catch (error) {
    console.error(`Error deleting document ${email}:`, error);
    throw new Error(`Failed to delete document: ${error.message}`);
  }
}; 
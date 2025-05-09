const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Function to add admin role to a user
exports.addAdminRole = functions.https.onCall(async (data, context) => {
  // Check if the request is made by an admin
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Only authenticated users can add admin roles'
    );
  }
  
  // Verify that the caller is already an admin
  const callerEmail = context.auth.token.email || '';
  
  // Check admin status in the database - using email as document ID
  const callerSnapshot = await admin.firestore().collection('users').doc(callerEmail).get();
  
  if (!callerSnapshot.exists || !callerSnapshot.data().isAdmin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can add other admins'
    );
  }
  
  // Get the user by email
  try {
    const { email } = data;
    
    if (!email) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Email is required'
      );
    }
    
    // First check if the user document exists
    const userDoc = await admin.firestore().collection('users').doc(email).get();
    
    if (!userDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        `User with email ${email} does not have a profile. They must sign in first.`
      );
    }
    
    // Update the user document in Firestore (using email as document ID)
    await admin.firestore().collection('users').doc(email).update({
      isAdmin: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Also set the custom claim for backward compatibility
    try {
      const user = await admin.auth().getUserByEmail(email);
      await admin.auth().setCustomUserClaims(user.uid, {
        admin: true
      });
    } catch (authError) {
      console.error('Error setting custom claims:', authError);
      // Continue even if custom claim fails
    }
    
    // Return the updated user
    return {
      message: `Success! ${email} has been made an admin.`
    };
  } catch (error) {
    throw new functions.https.HttpsError(
      'internal',
      `Error adding admin role: ${error.message}`
    );
  }
});

// Function to remove admin role from a user
exports.removeAdminRole = functions.https.onCall(async (data, context) => {
  // Check if the request is made by an admin
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Only authenticated users can remove admin roles'
    );
  }
  
  // Verify that the caller is already an admin
  const callerEmail = context.auth.token.email || '';
  
  // Check admin status in the database - using email as document ID
  const callerSnapshot = await admin.firestore().collection('users').doc(callerEmail).get();
  
  if (!callerSnapshot.exists || !callerSnapshot.data().isAdmin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can remove admin privileges'
    );
  }
  
  // Get the user by email
  try {
    const { email } = data;
    
    if (!email) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Email is required'
      );
    }
    
    // Make sure you're not removing your own admin privileges
    if (email === callerEmail) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'You cannot remove your own admin privileges'
      );
    }
    
    // First check if the user document exists
    const userDoc = await admin.firestore().collection('users').doc(email).get();
    
    if (!userDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        `User with email ${email} does not have a profile.`
      );
    }
    
    // Update the user document in Firestore (using email as document ID)
    await admin.firestore().collection('users').doc(email).update({
      isAdmin: false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Also update the custom claim for backward compatibility
    try {
      const user = await admin.auth().getUserByEmail(email);
      await admin.auth().setCustomUserClaims(user.uid, {
        admin: false
      });
    } catch (authError) {
      console.error('Error updating custom claims:', authError);
      // Continue even if custom claim fails
    }
    
    // Return success
    return {
      message: `Success! Admin privileges removed from ${email}.`
    };
  } catch (error) {
    throw new functions.https.HttpsError(
      'internal',
      `Error removing admin role: ${error.message}`
    );
  }
});

// Create initial admin - This function is for bootstrapping the first admin
// Use with caution and delete or disable after creating the first admin
exports.createInitialAdmin = functions.https.onRequest(async (req, res) => {
  // This should be secured with an API key or other authentication in production
  const API_KEY = functions.config().admin?.key || 'secure-api-key';
  
  if (req.query.key !== API_KEY) {
    res.status(401).send('Unauthorized');
    return;
  }
  
  try {
    const email = req.query.email;
    
    if (!email) {
      res.status(400).send('Email parameter is required');
      return;
    }
    
    // Check if user exists in Authentication
    try {
      const user = await admin.auth().getUserByEmail(email);
      
      // Update user document in Firestore (using email as document ID)
      await admin.firestore().collection('users').doc(email).set({
        email: email,
        displayName: user.displayName || '',
        isAdmin: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      
      // Also set admin claim for backward compatibility
      await admin.auth().setCustomUserClaims(user.uid, {
        admin: true
      });
      
      res.status(200).send(`Success! ${email} has been made an admin.`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        res.status(404).send(`User with email ${email} not found. They must sign up first.`);
      } else {
        res.status(500).send(`Error: ${error.message}`);
      }
    }
  } catch (error) {
    res.status(500).send(`Server error: ${error.message}`);
  }
});

// Trigger when a new user is created in Authentication
exports.createUserProfile = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be logged in to create a profile'
      );
    }
    
    const user = context.auth;
    const userId = user.token.email || user.uid;
    
    // Create a new document for the user in Firestore (using email as document ID)
    await admin.firestore().collection('users').doc(userId).set({
      email: user.token.email || '',
      displayName: user.token.name || '',
      isAdmin: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    console.log(`User document created for ${userId}`);
    return { success: true };
  } catch (error) {
    console.error('Error creating user document:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Also fix the onCreate trigger
exports.createUserOnSignup = functions.auth.user().onCreate(async (user) => {
  try {
    const userId = user.uid;
    const email = user.email || '';
    
    console.log(`Processing new user signup: ${userId} with email ${email}`);
    
    // Determine auth provider for the new user
    let provider = 'email';
    if (user.providerData && user.providerData.length > 0) {
      const providerId = user.providerData[0].providerId;
      if (providerId.includes('google.com') || providerId.includes('apple.com')) {
        provider = 'social';
      }
    }
    
    // Create initial user data
    const userData = {
      uid: userId,
      email: email,
      displayName: user.displayName || '',
      fullname: user.displayName || '',
      isAdmin: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: admin.firestore.FieldValue.serverTimestamp(),
      authProviders: [provider],
      profileCompleted: false
    };
    
    // If this user has an email, check for existing user data with the same email
    // This only syncs profile data, not authentication methods
    if (email) {
      try {
        const existingUsersSnapshot = await admin.firestore()
          .collection('users')
          .where('email', '==', email)
          .get();
        
        // If we found existing documents with the same email
        if (!existingUsersSnapshot.empty) {
          console.log(`Found ${existingUsersSnapshot.size} existing account(s) with email ${email}`);
          
          // Find the document with the most complete profile data
          let mostCompleteData = null;
          existingUsersSnapshot.forEach(doc => {
            if (doc.id !== userId) { // Skip the current user's document if it exists
              const docData = doc.data();
              if (!mostCompleteData || Object.keys(docData).length > Object.keys(mostCompleteData).length) {
                mostCompleteData = docData;
              }
            }
          });
          
          // If we found data to sync
          if (mostCompleteData) {
            console.log("Found existing profile data to sync");
            
            // Copy only relevant profile information - this doesn't affect Firebase Auth
            // account linking, just syncs profile data
            if (mostCompleteData.firstName) userData.firstName = mostCompleteData.firstName;
            if (mostCompleteData.lastName) userData.lastName = mostCompleteData.lastName;
            if (mostCompleteData.phoneNumber) userData.phoneNumber = mostCompleteData.phoneNumber;
            if (mostCompleteData.title) userData.title = mostCompleteData.title;
            if (mostCompleteData.fullname) userData.fullname = mostCompleteData.fullname;
            if (mostCompleteData.profileCompleted === true) userData.profileCompleted = true;
            if (mostCompleteData.receiveOffers === true) userData.receiveOffers = true;
            
            // Track authentication methods for reference only, not affecting Firebase Auth
            if (mostCompleteData.authProviders && Array.isArray(mostCompleteData.authProviders)) {
              userData.authProviders = [...new Set([...mostCompleteData.authProviders, provider])];
            }
            
            console.log("Synced user profile data from existing account");
          }
        }
      } catch (syncError) {
        console.error("Error syncing profile data:", syncError);
        // Continue with original data if sync fails
      }
    }
    
    // Create user document with the final data
    await admin.firestore().collection('users').doc(userId).set(userData);
    console.log(`User document created for ${userId}`);
    
    return null;
  } catch (error) {
    console.error('Error creating user document:', error);
    return null;
  }
});

// Function to delete a user from Firebase Authentication
exports.deleteUserAccount = functions.https.onCall(async (data, context) => {
  // Check if the request is made by an admin
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Only authenticated users can delete user accounts'
    );
  }
  
  // Verify that the caller is an admin
  const callerEmail = context.auth.token.email || '';
  
  // Check admin status in the database - using email as document ID
  const callerSnapshot = await admin.firestore().collection('users').doc(callerEmail).get();
  
  if (!callerSnapshot.exists || !callerSnapshot.data().isAdmin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can delete user accounts'
    );
  }
  
  try {
    const { email } = data;
    
    if (!email) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Email is required'
      );
    }
    
    // Find the user in Firebase Authentication by email
    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      
      // Delete the user from Firebase Authentication
      await admin.auth().deleteUser(userRecord.uid);
      
      return {
        success: true,
        message: `User ${email} has been deleted from Firebase Authentication.`
      };
    } catch (authError) {
      if (authError.code === 'auth/user-not-found') {
        // If user doesn't exist in Auth, we just return success since there's nothing to delete
        return {
          success: true,
          message: `User ${email} not found in Firebase Authentication, nothing to delete.`
        };
      }
      
      throw new functions.https.HttpsError(
        'internal',
        `Error deleting user from Authentication: ${authError.message}`
      );
    }
  } catch (error) {
    throw new functions.https.HttpsError(
      'internal',
      `Error deleting user account: ${error.message}`
    );
  }
});

// Function to sync profile data between accounts with the same email
exports.linkUserAccounts = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be logged in to sync profile data'
      );
    }
    
    const { email } = data;
    
    if (!email) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Email is required'
      );
    }
    
    // Security check - email should match the authenticated user
    if (email !== context.auth.token.email) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'You can only sync profile data for your own email address'
      );
    }
    
    // Find all user documents with the provided email
    const usersSnapshot = await admin.firestore()
      .collection('users')
      .where('email', '==', email)
      .get();
    
    if (usersSnapshot.empty) {
      throw new functions.https.HttpsError(
        'not-found',
        'No user accounts found with this email'
      );
    }
    
    // Get all user document references
    const userDocs = [];
    usersSnapshot.forEach(doc => {
      userDocs.push({
        id: doc.id,
        data: doc.data()
      });
    });
    
    console.log(`Found ${userDocs.length} documents with email ${email}`);
    
    // If multiple documents with same email exist
    if (userDocs.length > 1) {
      // The current authenticated user UID
      const currentAuthUid = context.auth.uid;
      
      // Find the document with the current user's UID
      const primaryUserDoc = userDocs.find(doc => doc.id === currentAuthUid);
      
      if (!primaryUserDoc) {
        throw new functions.https.HttpsError(
          'not-found',
          'Your authenticated account document was not found'
        );
      }
      
      // Find other documents 
      const otherUserDocs = userDocs.filter(doc => doc.id !== currentAuthUid);
      
      // Get the most complete data from all documents
      let mostCompleteData = { ...primaryUserDoc.data };
      
      // Process each other document to sync/merge data
      for (const otherDoc of otherUserDocs) {
        console.log(`Checking data from document ${otherDoc.id}`);
        
        // Add any missing fields from the other document
        for (const [key, value] of Object.entries(otherDoc.data)) {
          // Only sync profile-related fields, not authentication or system fields
          if (['firstName', 'lastName', 'phoneNumber', 'title', 'fullname', 'profileCompleted', 'receiveOffers'].includes(key)) {
            if (!mostCompleteData[key] || mostCompleteData[key] === '') {
              mostCompleteData[key] = value;
            }
          }
        }
        
        // Collect auth providers for tracking purposes only
        // This does NOT affect Firebase Auth methods, just tracks them in Firestore
        const authProviders = new Set(mostCompleteData.authProviders || []);
        if (otherDoc.data.authProviders) {
          otherDoc.data.authProviders.forEach(p => authProviders.add(p));
        } else {
          authProviders.add('email'); // Assume email login if no provider specified
        }
        mostCompleteData.authProviders = Array.from(authProviders);
      }
      
      // Update the main document with the merged data
      mostCompleteData.lastLogin = admin.firestore.FieldValue.serverTimestamp();
      
      // Update the main document with the merged data  
      await admin.firestore().collection('users').doc(currentAuthUid).set(mostCompleteData);
      console.log(`Updated current user document ${currentAuthUid} with synced profile data`);
      
      return {
        success: true,
        message: `Successfully synced profile data from ${otherUserDocs.length} account(s)`,
        syncedAccounts: otherUserDocs.map(doc => doc.id)
      };
    } else {
      // Only one document found, nothing to sync
      return {
        success: false,
        message: 'No additional accounts found to sync profile data with this email'
      };
    }
  } catch (error) {
    console.error('Error syncing profile data:', error);
    throw new functions.https.HttpsError('internal', `Error syncing profile data: ${error.message}`);
  }
}); 
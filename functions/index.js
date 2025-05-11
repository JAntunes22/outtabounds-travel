const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Rate limiting for admin creation
const adminCreationLimiter = {
  attempts: new Map(),
  maxAttempts: 3,
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
};

// Function to add admin role to a user
exports.addAdminRole = functions.https.onCall(async (data, context) => {
  // Check if the requester is authenticated and is an admin
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const requesterEmail = context.auth.token.email;
  const requesterDoc = await admin.firestore().collection('users').doc(requesterEmail).get();
  
  if (!requesterDoc.exists || !requesterDoc.data().isAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can add other admins');
  }

  try {
    const { email } = data;
    if (!email) {
      throw new functions.https.HttpsError('invalid-argument', 'Email is required');
    }

    // Check if target user exists
    const userRecord = await admin.auth().getUserByEmail(email);
    
    // Check if user is already an admin
    const userDoc = await admin.firestore().collection('users').doc(email).get();
    if (userDoc.exists && userDoc.data().isAdmin) {
      throw new functions.https.HttpsError('already-exists', 'User is already an admin');
    }

    // Set admin custom claim
    await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });
    
    // Update Firestore document
    await admin.firestore().collection('users').doc(email).set({
      isAdmin: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // Log the admin addition
    await admin.firestore().collection('adminLogs').add({
      action: 'add_admin',
      targetEmail: email,
      createdBy: requesterEmail,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, message: 'Admin role assigned successfully' };
  } catch (error) {
    console.error('Error adding admin role:', error);
    throw new functions.https.HttpsError('internal', 'Failed to add admin role');
  }
});

// Function to remove admin role from a user
exports.removeAdminRole = functions.https.onCall(async (data, context) => {
  // Check if the requester is authenticated and is an admin
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const requesterEmail = context.auth.token.email;
  const requesterDoc = await admin.firestore().collection('users').doc(requesterEmail).get();
  
  if (!requesterDoc.exists || !requesterDoc.data().isAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can remove admin roles');
  }

  try {
    const { email } = data;
    if (!email) {
      throw new functions.https.HttpsError('invalid-argument', 'Email is required');
    }

    // Prevent removing the last admin
    const adminCount = await admin.firestore().collection('users')
      .where('isAdmin', '==', true)
      .count()
      .get();
    
    if (adminCount.data().count <= 1) {
      throw new functions.https.HttpsError('failed-precondition', 'Cannot remove the last admin');
    }

    // Check if target user exists
    const userRecord = await admin.auth().getUserByEmail(email);
    
    // Check if user is actually an admin
    const userDoc = await admin.firestore().collection('users').doc(email).get();
    if (!userDoc.exists || !userDoc.data().isAdmin) {
      throw new functions.https.HttpsError('not-found', 'User is not an admin');
    }

    // Remove admin custom claim
    await admin.auth().setCustomUserClaims(userRecord.uid, { admin: false });
    
    // Update Firestore document
    await admin.firestore().collection('users').doc(email).set({
      isAdmin: false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // Log the admin removal
    await admin.firestore().collection('adminLogs').add({
      action: 'remove_admin',
      targetEmail: email,
      createdBy: requesterEmail,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, message: 'Admin role removed successfully' };
  } catch (error) {
    console.error('Error removing admin role:', error);
    throw new functions.https.HttpsError('internal', 'Failed to remove admin role');
  }
});

// Create initial admin - This function is for bootstrapping the first admin
// Use with caution and delete or disable after creating the first admin
exports.createInitialAdmin = functions.https.onCall(async (data, context) => {
  // Check API key
  const apiKey = data.apiKey;
  if (!apiKey || apiKey !== process.env.ADMIN_CREATION_API_KEY) {
    throw new functions.https.HttpsError('permission-denied', 'Invalid API key');
  }

  // Rate limiting check
  const ip = context.rawRequest.ip;
  const now = Date.now();
  const userAttempts = adminCreationLimiter.attempts.get(ip) || [];
  const recentAttempts = userAttempts.filter(time => now - time < adminCreationLimiter.windowMs);
  
  if (recentAttempts.length >= adminCreationLimiter.maxAttempts) {
    throw new functions.https.HttpsError('resource-exhausted', 'Too many attempts. Please try again later.');
  }
  
  // Add current attempt
  recentAttempts.push(now);
  adminCreationLimiter.attempts.set(ip, recentAttempts);

  try {
    const { email } = data;
    if (!email) {
      throw new functions.https.HttpsError('invalid-argument', 'Email is required');
    }

    // Check if user exists
    const userRecord = await admin.auth().getUserByEmail(email);
    
    // Check if user is already an admin
    const userDoc = await admin.firestore().collection('users').doc(email).get();
    if (userDoc.exists && userDoc.data().isAdmin) {
      throw new functions.https.HttpsError('already-exists', 'User is already an admin');
    }

    // Set admin custom claim
    await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });
    
    // Update Firestore document
    await admin.firestore().collection('users').doc(email).set({
      isAdmin: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // Log the admin creation
    await admin.firestore().collection('adminLogs').add({
      action: 'create_admin',
      targetEmail: email,
      createdBy: 'system',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, message: 'Admin role assigned successfully' };
  } catch (error) {
    console.error('Error creating admin:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create admin');
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
    let email = user.email || '';
    let displayName = user.displayName || '';
    
    console.log(`Processing new user signup: ${userId} with initial email ${email}`);
    
    // Determine auth provider for the new user
    let provider = 'email';
    let providerData = [];
    
    if (user.providerData && user.providerData.length > 0) {
      // Save provider data for logging
      providerData = user.providerData.map(p => ({
        providerId: p.providerId,
        email: p.email,
        displayName: p.displayName
      }));
      console.log(`Provider data:`, JSON.stringify(providerData));
      
      // Check all provider data for an email if we don't have one
      if (!email) {
        for (const provider of user.providerData) {
          if (provider.email) {
            email = provider.email;
            console.log(`Found email in provider data: ${email}`);
            break;
          }
        }
      }
      
      // Get display name from provider if not available
      if (!displayName) {
        for (const provider of user.providerData) {
          if (provider.displayName) {
            displayName = provider.displayName;
            console.log(`Found displayName in provider data: ${displayName}`);
            break;
          }
        }
      }
      
      // Determine the provider type
      const providerId = user.providerData[0].providerId;
      if (providerId.includes('google.com') || providerId.includes('apple.com')) {
        provider = 'social';
      }
    }
    
    // If we found an email but it's not set in the user record,
    // update the authentication record to include the email
    if (email && !user.email) {
      try {
        await admin.auth().updateUser(userId, {
          email: email,
          emailVerified: true // Since we're getting this from a social provider
        });
        console.log(`Updated authentication record with email: ${email}`);
      } catch (authUpdateError) {
        console.error('Error updating authentication record:', authUpdateError);
        // Continue with creating the document even if auth update fails
      }
    }
    
    // Create initial user data
    const userData = {
      uid: userId,
      email: email,
      displayName: displayName,
      fullname: displayName || '',
      isAdmin: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: admin.firestore.FieldValue.serverTimestamp(),
      authProviders: [provider],
      profileCompleted: false
    };
    
    console.log(`Creating user document for UID: ${userId}`);
    await admin.firestore().collection('users').doc(userId).set(userData);
    console.log(`User document created for UID: ${userId}`);
    
    // No longer creating reference document with email as ID
    
    // If we have a user without an email (rare case), log for investigation
    if (!email) {
      console.error(`WARNING: User ${userId} created without email. Provider data:`, 
        JSON.stringify(providerData));
    }
    
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

// Function to update user email in Authentication
exports.updateUserEmail = functions.https.onCall(async (data, context) => {
  try {
    // Make sure the user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be logged in to update email'
      );
    }
    
    const { uid, email } = data;
    
    if (!uid || !email) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'User ID and email are required'
      );
    }
    
    // Security check: User can only update their own email
    if (context.auth.uid !== uid) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'You can only update your own email'
      );
    }
    
    console.log(`Updating email for user ${uid} to ${email}`);
    
    // Get the current user data
    const user = await admin.auth().getUser(uid);
    
    // If email is already set and matches, no need to update
    if (user.email === email) {
      console.log('Email already matches, no update needed');
      return { success: true, message: 'Email already up to date' };
    }
    
    // Update the email in Authentication
    await admin.auth().updateUser(uid, {
      email: email,
      emailVerified: true // Since we're getting this from a social provider
    });
    
    console.log(`Successfully updated email for user ${uid}`);
    
    // Update UID document in Firestore to ensure it has the correct email
    const uidRef = admin.firestore().collection('users').doc(uid);
    await uidRef.update({ email: email });
    console.log(`Updated UID document with email: ${email}`);
    
    // Don't create or update email document anymore
    
    return { success: true, message: 'Email updated successfully' };
  } catch (error) {
    console.error('Error updating user email:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Function to clean up email-based documents
exports.cleanupEmailDocuments = functions.https.onCall(async (data, context) => {
  try {
    // This function should only be callable by admins
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be logged in to perform cleanup'
      );
    }
    
    const isAdmin = context.auth.token.admin === true;
    if (!isAdmin) {
      // Double check admin status in Firestore
      const userDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
      if (!userDoc.exists || !userDoc.data().isAdmin) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Only admins can perform database cleanup'
        );
      }
    }
    
    console.log('Starting cleanup of email-based documents');
    const results = {
      processed: 0,
      cleaned: 0,
      errors: 0,
      details: []
    };
    
    // Get all users from Firebase Authentication
    const listUsersResult = await admin.auth().listUsers();
    const authUsers = listUsersResult.users;
    
    console.log(`Found ${authUsers.length} users in Firebase Authentication`);
    
    // Process each user from Auth
    for (const authUser of authUsers) {
      try {
        results.processed++;
        
        if (!authUser.email) {
          results.details.push(`User ${authUser.uid} has no email, skipping`);
          continue;
        }
        
        const email = authUser.email;
        const uid = authUser.uid;
        
        console.log(`Processing user ${uid} with email ${email}`);
        
        // Check if an email document exists
        const emailDocRef = admin.firestore().collection('users').doc(email);
        const emailDoc = await emailDocRef.get();
        
        if (emailDoc.exists) {
          // Check if UID document exists
          const uidDocRef = admin.firestore().collection('users').doc(uid);
          const uidDoc = await uidDocRef.get();
          
          if (uidDoc.exists) {
            // Both email and UID documents exist
            console.log(`Both email and UID documents exist for user ${uid}`);
            
            // Merge data (prioritize UID document but get fields from email if missing)
            const uidData = uidDoc.data();
            const emailData = emailDoc.data();
            
            const mergedData = { ...uidData };
            
            // Only update fields that are missing or empty in the UID document
            const fieldsToCheck = [
              'fullname', 'firstName', 'lastName', 'phoneNumber', 
              'title', 'profileCompleted', 'receiveOffers'
            ];
            
            let updateNeeded = false;
            
            for (const field of fieldsToCheck) {
              if (!uidData[field] && emailData[field]) {
                mergedData[field] = emailData[field];
                updateNeeded = true;
              }
            }
            
            // Update UID document if needed
            if (updateNeeded) {
              await uidDocRef.update({
                ...mergedData,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
              });
              console.log(`Updated UID document with data from email document for user ${uid}`);
            }
            
            // Delete the email document as it's no longer needed
            await emailDocRef.delete();
            console.log(`Deleted email document for user ${uid}`);
            results.cleaned++;
            results.details.push(`Merged and cleaned up documents for user ${uid} (${email})`);
          } else {
            // Only email document exists, create UID document with this data
            console.log(`Only email document exists for user ${uid}, creating UID document`);
            
            const emailData = emailDoc.data();
            await uidDocRef.set({
              ...emailData,
              uid: uid, // Ensure UID is correct
              email: email, // Ensure email is correct
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            
            // Delete the email document as it's no longer needed
            await emailDocRef.delete();
            console.log(`Created UID document and deleted email document for user ${uid}`);
            results.cleaned++;
            results.details.push(`Migrated email document to UID document for user ${uid} (${email})`);
          }
        } else {
          // No email document exists, nothing to clean up
          console.log(`No email document exists for user ${uid}, no cleanup needed`);
          results.details.push(`No email document found for user ${uid} (${email})`);
        }
      } catch (userError) {
        console.error(`Error processing user:`, userError);
        results.errors++;
        results.details.push(`Error processing user: ${userError.message}`);
      }
    }
    
    console.log(`Cleanup completed. Processed: ${results.processed}, Cleaned: ${results.cleaned}, Errors: ${results.errors}`);
    return results;
  } catch (error) {
    console.error('Error in cleanupEmailDocuments function:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
}); 
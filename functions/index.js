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
    const userId = user.email || user.uid;
    
    // Create a new document for the user in Firestore (using email as document ID)
    await admin.firestore().collection('users').doc(userId).set({
      email: user.email || '',
      displayName: user.displayName || '',
      isAdmin: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`User document created for ${userId}`);
    return null;
  } catch (error) {
    console.error('Error creating user document:', error);
    return null;
  }
}); 
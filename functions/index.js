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
  const callerUid = context.auth.uid;
  const callerUserRecord = await admin.auth().getUser(callerUid);
  const callerCustomClaims = callerUserRecord.customClaims || {};
  
  if (!callerCustomClaims.admin) {
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
    
    const user = await admin.auth().getUserByEmail(email);
    
    // Set the custom claim
    await admin.auth().setCustomUserClaims(user.uid, {
      admin: true
    });
    
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
  const callerUid = context.auth.uid;
  const callerUserRecord = await admin.auth().getUser(callerUid);
  const callerCustomClaims = callerUserRecord.customClaims || {};
  
  if (!callerCustomClaims.admin) {
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
    
    const user = await admin.auth().getUserByEmail(email);
    
    // Make sure you're not removing the last admin
    const userData = await admin.auth().getUser(user.uid);
    if (userData.uid === callerUid) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'You cannot remove your own admin privileges'
      );
    }
    
    // Set the custom claim to false
    await admin.auth().setCustomUserClaims(user.uid, {
      admin: false
    });
    
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
    
    // Check if user exists
    try {
      const user = await admin.auth().getUserByEmail(email);
      
      // Set admin claim
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
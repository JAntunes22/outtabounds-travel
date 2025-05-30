const admin = require('firebase-admin');

// Initialize Firebase Admin for PRODUCTION (source)
const serviceAccount = {
  // You'll need to download your service account key from Firebase Console
  // For now, we'll use the emulator
};

const prodApp = admin.initializeApp({
  // You would use your production credentials here
  projectId: 'outtaboundstravel',
}, 'production');

// Initialize Firebase Admin for EMULATOR (destination)
const emulatorApp = admin.initializeApp({
  projectId: 'outtaboundstravel',
}, 'emulator');

// Set emulator host for the emulator app
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

const prodDb = admin.firestore(prodApp);
const emulatorDb = admin.firestore(emulatorApp);

async function importCollection(collectionName, maxDocs = 50) {
  console.log(`📂 Importing ${collectionName}...`);
  
  try {
    // Get data from production
    const snapshot = await prodDb.collection(collectionName).limit(maxDocs).get();
    
    if (snapshot.empty) {
      console.log(`  ⚠️  No documents found in ${collectionName}`);
      return;
    }

    // Write to emulator
    const batch = emulatorDb.batch();
    let count = 0;
    
    snapshot.forEach(doc => {
      const docRef = emulatorDb.collection(collectionName).doc(doc.id);
      batch.set(docRef, doc.data());
      count++;
    });

    await batch.commit();
    console.log(`  ✅ Imported ${count} documents to ${collectionName}`);
    
  } catch (error) {
    console.error(`  ❌ Error importing ${collectionName}:`, error.message);
  }
}

async function importData() {
  console.log('🚀 Starting production data import to emulator...');
  console.log('⚠️  This script requires Firebase Admin credentials');
  console.log('');

  // Collections to import (limit to avoid overwhelming emulator)
  const collections = [
    'packs',
    'courses', 
    'experiences',
    'accommodations',
    'services',
    'settings',
    'users' // Be careful with user data!
  ];

  for (const collection of collections) {
    await importCollection(collection);
  }

  console.log('');
  console.log('🎉 Import completed!');
  console.log('📊 View your data at: http://localhost:4000');
}

// Only run if this file is executed directly
if (require.main === module) {
  importData().then(() => {
    console.log('✨ Script finished');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Import failed:', error);
    process.exit(1);
  });
}

module.exports = { importData, importCollection }; 
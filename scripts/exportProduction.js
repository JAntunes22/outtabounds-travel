// This script requires Google Cloud SDK and authentication
// Install: `npm install -g @google-cloud/firestore`
// Authenticate: `gcloud auth application-default login`

const { Firestore } = require('@google-cloud/firestore');
const fs = require('fs');
const path = require('path');

async function exportProductionData() {
  console.log('🚀 Exporting production Firestore data...');
  
  try {
    // Initialize Firestore for production
    const firestore = new Firestore({
      projectId: 'outtaboundstravel',
    });

    // Collections to export
    const collections = ['packs', 'courses', 'experiences', 'accommodations', 'services', 'settings'];
    const exportData = {};

    for (const collectionName of collections) {
      console.log(`📂 Exporting ${collectionName}...`);
      
      const snapshot = await firestore.collection(collectionName).get();
      exportData[collectionName] = [];
      
      snapshot.forEach(doc => {
        exportData[collectionName].push({
          id: doc.id,
          data: doc.data()
        });
      });
      
      console.log(`  ✅ Exported ${exportData[collectionName].length} documents from ${collectionName}`);
    }

    // Save to file
    const exportPath = path.join(__dirname, 'production-data.json');
    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
    
    console.log('');
    console.log('🎉 Export completed!');
    console.log(`💾 Data saved to: ${exportPath}`);
    console.log('');
    console.log('Next steps:');
    console.log('1. Run: npm run import:emulator');
    console.log('2. Or manually import via Emulator UI');
    
  } catch (error) {
    console.error('❌ Export failed:', error.message);
    console.log('');
    console.log('💡 Try these solutions:');
    console.log('1. Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install');
    console.log('2. Authenticate: gcloud auth application-default login');
    console.log('3. Install dependencies: npm install @google-cloud/firestore');
  }
}

exportProductionData(); 
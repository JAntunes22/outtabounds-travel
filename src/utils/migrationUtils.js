import { db } from './firebaseConfig';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

/**
 * Utility function to migrate imageUrl to url field in the experiences collection
 * This helps ensure consistency in the field names across the application
 */
export const migrateExperienceImageUrls = async () => {
  try {
    console.log("Starting migration of experience imageUrl fields to url...");
    let updatedCount = 0;

    // Get all experiences
    const experiencesRef = collection(db, 'experiences');
    const querySnapshot = await getDocs(experiencesRef);
    
    // Keep track of total experiences and those needing updates
    const totalExperiences = querySnapshot.size;
    let needsUpdateCount = 0;
    
    // Process each experience document
    const migrationPromises = querySnapshot.docs.map(async (document) => {
      const experienceData = document.data();
      
      // Check if the document has imageUrl but not url
      if (experienceData.imageUrl && !experienceData.url) {
        needsUpdateCount++;
        
        // Update the document with the new url field
        await updateDoc(doc(db, 'experiences', document.id), {
          url: experienceData.imageUrl,
          updatedAt: new Date()
        });
        
        updatedCount++;
        console.log(`Migrated experience: ${document.id} - ${experienceData.name || 'unnamed'}`);
      }
    });
    
    // Wait for all updates to complete
    await Promise.all(migrationPromises);
    
    console.log(`Migration complete. ${updatedCount} of ${totalExperiences} experiences updated.`);
    console.log(`${totalExperiences - needsUpdateCount} experiences already had the correct field.`);
    
    return {
      totalExperiences,
      updatedCount,
      alreadyCorrect: totalExperiences - needsUpdateCount
    };
  } catch (error) {
    console.error("Error during migration:", error);
    throw new Error(`Migration failed: ${error.message}`);
  }
};

/**
 * You can run this migration from the admin dashboard or developer console
 * Example usage:
 * import { migrateExperienceImageUrls } from './utils/migrationUtils';
 * migrateExperienceImageUrls().then(result => console.log('Migration result:', result));
 */ 
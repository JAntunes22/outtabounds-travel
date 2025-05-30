const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, connectFirestoreEmulator } = require('firebase/firestore');

// Your Firebase config (same as in your app)
const firebaseConfig = {
  apiKey: "demo-key",
  authDomain: "demo-project.firebaseapp.com",
  projectId: "outtaboundstravel", // Must match your real project ID
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "demo-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Connect to emulator
connectFirestoreEmulator(db, 'localhost', 8080);

// Sample data
const samplePacks = [
  {
    id: 'algarve-golf-escape',
    name: 'Algarve Golf Escape',
    description: 'Premium golf experience in Portugal',
    imageUrl: 'https://example.com/algarve.jpg',
    basePrice: 1200,
    pricing: {
      'tier1': { amount: 1200, currency: 'EUR' },
      'tier2': { amount: 1100, currency: 'EUR' },
      'rest': { amount: 1300, currency: 'EUR' }
    },
    duration: 7,
    location: 'Algarve, Portugal',
    maxGuests: 8,
    included: ['Golf rounds', 'Accommodation', 'Transfers'],
    createdAt: new Date(),
    active: true
  },
  {
    id: 'madrid-adventure',
    name: 'Madrid City Adventure',
    description: 'Explore the vibrant capital of Spain',
    imageUrl: 'https://example.com/madrid.jpg',
    basePrice: 800,
    pricing: {
      'tier1': { amount: 800, currency: 'EUR' },
      'tier2': { amount: 750, currency: 'EUR' },
      'rest': { amount: 900, currency: 'EUR' }
    },
    duration: 4,
    location: 'Madrid, Spain',
    maxGuests: 12,
    included: ['City tours', 'Museum tickets', 'Local cuisine'],
    createdAt: new Date(),
    active: true
  }
];

const sampleUsers = [
  {
    uid: 'test-user-1',
    email: 'test@example.com',
    displayName: 'Test User',
    fullname: 'Test User',
    isAdmin: false,
    profileCompleted: true,
    createdAt: new Date(),
    lastLogin: new Date(),
    authProviders: ['email']
  },
  {
    uid: 'admin-user-1',
    email: 'admin@outtabounds.com',
    displayName: 'Admin User',
    fullname: 'Admin User',
    isAdmin: true,
    profileCompleted: true,
    createdAt: new Date(),
    lastLogin: new Date(),
    authProviders: ['email']
  }
];

const sampleCourses = [
  {
    id: 'vale-do-lobo',
    name: 'Vale do Lobo Golf Course',
    description: 'Championship golf course in Algarve',
    location: 'Algarve, Portugal',
    priceRange: '€100-€200',
    rating: 4.8,
    holes: 18,
    imageUrl: 'https://example.com/vale-do-lobo.jpg',
    active: true
  }
];

const sampleExperiences = [
  {
    id: 'fado-night',
    name: 'Traditional Fado Night',
    description: 'Authentic Portuguese music experience',
    location: 'Lisbon, Portugal',
    duration: '3 hours',
    priceRange: '€50-€80',
    rating: 4.9,
    imageUrl: 'https://example.com/fado.jpg',
    active: true
  }
];

async function seedData() {
  try {
    console.log('🌱 Starting to seed emulator data...');

    // Seed packs
    console.log('📦 Adding sample packs...');
    for (const pack of samplePacks) {
      await setDoc(doc(db, 'packs', pack.id), pack);
      console.log(`  ✅ Added pack: ${pack.name}`);
    }

    // Seed users
    console.log('👤 Adding sample users...');
    for (const user of sampleUsers) {
      await setDoc(doc(db, 'users', user.uid), user);
      console.log(`  ✅ Added user: ${user.email}`);
    }

    // Seed courses
    console.log('⛳ Adding sample courses...');
    for (const course of sampleCourses) {
      await setDoc(doc(db, 'courses', course.id), course);
      console.log(`  ✅ Added course: ${course.name}`);
    }

    // Seed experiences
    console.log('🎭 Adding sample experiences...');
    for (const experience of sampleExperiences) {
      await setDoc(doc(db, 'experiences', experience.id), experience);
      console.log(`  ✅ Added experience: ${experience.name}`);
    }

    // Add featured packs settings
    console.log('⭐ Adding featured packs settings...');
    await setDoc(doc(db, 'settings', 'featuredPacks'), {
      tier1: ['algarve-golf-escape', 'madrid-adventure'],
      tier2: ['algarve-golf-escape', 'madrid-adventure'],
      rest: ['madrid-adventure', 'algarve-golf-escape']
    });
    console.log('  ✅ Added featured packs settings');

    console.log('');
    console.log('🎉 Emulator seeding completed successfully!');
    console.log('📊 View your data at: http://localhost:4000');
    console.log('');
    console.log('Test credentials:');
    console.log('📧 User: test@example.com');
    console.log('🔑 Admin: admin@outtabounds.com');
    console.log('');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  }
}

// Run the seeding
seedData().then(() => {
  console.log('✨ Seeding script completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Seeding failed:', error);
  process.exit(1);
}); 
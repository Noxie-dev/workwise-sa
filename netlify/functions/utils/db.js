import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

// PostgreSQL Database Connection (for job-related functions)
let postgresDb = null;

function getPostgresDb() {
  if (!postgresDb) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is required for PostgreSQL connection');
    }
    
    const client = postgres(connectionString);
    postgresDb = drizzle(client);
  }
  return postgresDb;
}

// Export the PostgreSQL database connection directly for Drizzle operations
export const db = getPostgresDb();

// Legacy query method for backward compatibility
export const dbLegacy = {
  query: async (sql, params = []) => {
    const db = getPostgresDb();
    try {
      const result = await db.execute(sql, params);
      return { rows: result };
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }
};

// Firebase Configuration (keeping existing functionality)
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  projectId: process.env.FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
const firestoreDb = getFirestore(app);

// Firebase Firestore functions (for backward compatibility)
export async function saveImageMetadata({ 
  userId, 
  type, 
  cloudflareImageId, 
  uploadedAt,
  status = 'processing' 
}) {
  const docRef = doc(firestoreDb, "userImages", `${userId}-${type}`);
  await setDoc(docRef, {
    userId,
    type,
    cloudflareImageId,
    status, // 'processing', 'ready', 'failed'
    uploadedAt: uploadedAt.toISOString(),
    createdAt: new Date().toISOString(),
  });
  
  return docRef.id;
}

export async function updateImageUrls({
  userId,
  type,
  originalUrl,
  thumbnailUrl,
  optimizedUrl,
  variants
}) {
  const docRef = doc(firestoreDb, "userImages", `${userId}-${type}`);
  await updateDoc(docRef, {
    originalUrl,
    thumbnailUrl,
    optimizedUrl,
    variants: JSON.stringify(variants),
    status: 'ready',
    processedAt: new Date().toISOString(),
  });
}

export async function getUserImage(userId, type) {
  const docRef = doc(firestoreDb, "userImages", `${userId}-${type}`);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data();
  }
  return null;
}

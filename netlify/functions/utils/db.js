import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  projectId: process.env.FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function saveImageMetadata({ 
  userId, 
  type, 
  cloudflareImageId, 
  uploadedAt,
  status = 'processing' 
}) {
  const docRef = doc(db, "userImages", `${userId}-${type}`);
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
  const docRef = doc(db, "userImages", `${userId}-${type}`);
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
  const docRef = doc(db, "userImages", `${userId}-${type}`);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data();
  }
  return null;
}

// src/firebase.ts
// Re-export Firebase functionality from server/firebase.ts
import firebaseApp, { db, storage } from '../server/firebase';
import * as admin from 'firebase-admin';

export const auth = admin.auth(firebaseApp);
export { db, storage };
export default firebaseApp;

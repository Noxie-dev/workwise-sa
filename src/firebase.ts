// src/firebase.ts
// Re-export Firebase functionality from server/firebase.ts
import firebaseApp, { auth, db, storage } from '../server/firebase';

export { auth, db, storage };
export default firebaseApp;

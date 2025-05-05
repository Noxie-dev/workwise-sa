import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  addDoc,
  serverTimestamp,
  Timestamp,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from 'firebase/auth';

// Types
export interface WiseUpComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  text: string;
  createdAt: Date | Timestamp;
}

export interface WiseUpBookmark {
  id: string;
  contentId: string;
  userId: string;
  title: string;
  thumbnail: string;
  creatorName: string;
  createdAt: Date | Timestamp;
}

// Collection references
const LIKES_COLLECTION = 'user_content_likes';
const BOOKMARKS_COLLECTION = 'user_content_bookmarks';
const COMMENTS_COLLECTION = 'wiseup_comments';

// Service methods
export const wiseupService = {
  // Like functionality
  async likeContent(userId: string, contentId: string): Promise<void> {
    const likeRef = doc(db, LIKES_COLLECTION, `${userId}_${contentId}`);
    await setDoc(likeRef, {
      userId,
      contentId,
      createdAt: serverTimestamp()
    });
  },

  async unlikeContent(userId: string, contentId: string): Promise<void> {
    const likeRef = doc(db, LIKES_COLLECTION, `${userId}_${contentId}`);
    await deleteDoc(likeRef);
  },

  async checkIfUserLiked(userId: string, contentId: string): Promise<boolean> {
    const likeRef = doc(db, LIKES_COLLECTION, `${userId}_${contentId}`);
    const docSnap = await getDoc(likeRef);
    return docSnap.exists();
  },

  // Bookmark functionality
  async addBookmark(userId: string, contentId: string, title: string, thumbnail: string, creatorName: string): Promise<void> {
    const bookmarkRef = doc(db, BOOKMARKS_COLLECTION, `${userId}_${contentId}`);
    await setDoc(bookmarkRef, {
      userId,
      contentId,
      title,
      thumbnail,
      creatorName,
      createdAt: serverTimestamp()
    });
  },

  async removeBookmark(userId: string, contentId: string): Promise<void> {
    const bookmarkRef = doc(db, BOOKMARKS_COLLECTION, `${userId}_${contentId}`);
    await deleteDoc(bookmarkRef);
  },

  async isBookmarked(userId: string, contentId: string): Promise<boolean> {
    const bookmarkRef = doc(db, BOOKMARKS_COLLECTION, `${userId}_${contentId}`);
    const docSnap = await getDoc(bookmarkRef);
    return docSnap.exists();
  },

  async getUserBookmarks(
    userId: string, 
    itemsPerPage: number = 12, 
    startAfterDoc: QueryDocumentSnapshot | null = null
  ): Promise<{ bookmarks: WiseUpBookmark[], lastDoc: QueryDocumentSnapshot | null }> {
    let bookmarksQuery = query(
      collection(db, BOOKMARKS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(itemsPerPage)
    );

    if (startAfterDoc) {
      bookmarksQuery = query(bookmarksQuery, startAfter(startAfterDoc));
    }

    const querySnapshot = await getDocs(bookmarksQuery);
    const bookmarks: WiseUpBookmark[] = [];
    let lastDoc: QueryDocumentSnapshot | null = null;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      bookmarks.push({
        id: doc.id,
        contentId: data.contentId,
        userId: data.userId,
        title: data.title,
        thumbnail: data.thumbnail,
        creatorName: data.creatorName,
        createdAt: data.createdAt
      });
      lastDoc = doc;
    });

    return { bookmarks, lastDoc };
  },

  // Comment functionality
  async getComments(
    contentId: string,
    commentsPerPage: number = 10,
    startAfterDoc: QueryDocumentSnapshot | null = null
  ): Promise<{ comments: WiseUpComment[], lastDoc: QueryDocumentSnapshot | null }> {
    let commentsQuery = query(
      collection(db, COMMENTS_COLLECTION),
      where('contentId', '==', contentId),
      orderBy('createdAt', 'desc'),
      limit(commentsPerPage)
    );

    if (startAfterDoc) {
      commentsQuery = query(commentsQuery, startAfter(startAfterDoc));
    }

    const querySnapshot = await getDocs(commentsQuery);
    const comments: WiseUpComment[] = [];
    let lastDoc: QueryDocumentSnapshot | null = null;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      comments.push({
        id: doc.id,
        userId: data.userId,
        userName: data.userName,
        userAvatar: data.userAvatar,
        text: data.text,
        createdAt: data.createdAt.toDate()
      });
      lastDoc = doc;
    });

    return { comments, lastDoc };
  },

  async addComment(contentId: string, user: User, text: string): Promise<WiseUpComment> {
    const commentsRef = collection(db, COMMENTS_COLLECTION);
    
    const commentData = {
      contentId,
      userId: user.uid,
      userName: user.displayName || 'Anonymous User',
      userAvatar: user.photoURL,
      text,
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(commentsRef, commentData);
    
    // Get the newly created document to return with server timestamp
    const newDoc = await getDoc(docRef);
    const data = newDoc.data()!;
    
    return {
      id: docRef.id,
      userId: data.userId,
      userName: data.userName,
      userAvatar: data.userAvatar,
      text: data.text,
      createdAt: data.createdAt.toDate()
    };
  },

  async deleteComment(contentId: string, commentId: string): Promise<void> {
    const commentRef = doc(db, COMMENTS_COLLECTION, commentId);
    await deleteDoc(commentRef);
  }
};

export default wiseupService;

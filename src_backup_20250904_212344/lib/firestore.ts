
import { getFirestore, collection, query, where, orderBy, limit, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { app } from './firebase';
import type { VideoItem } from '@/pages/WiseUp';

const db = getFirestore(app);

export const videosCollection = collection(db, 'videos');

interface VideoQueryOptions {
  category?: string;
  limitCount?: number;
  lastDoc?: any;
}

export const getVideos = async ({ category, limitCount = 10, lastDoc }: VideoQueryOptions = {}) => {
  try {
    let q = query(videosCollection, orderBy('createdAt', 'desc'));
    
    if (category && category !== 'all') {
      q = query(q, where('category', '==', category));
    }
    
    if (limitCount) {
      q = query(q, limit(limitCount));
    }
    
    if (lastDoc) {
      q = query(q, where('createdAt', '<', lastDoc));
    }
    
    const snapshot = await getDocs(q);
    return {
      videos: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VideoItem)),
      lastDoc: snapshot.docs[snapshot.docs.length - 1]
    };
  } catch (error) {
    console.error('Error fetching videos:', error);
    return { videos: [], lastDoc: null };
  }
};

export const updateVideoStats = async (videoId: string, stats: { views?: number; likes?: number }) => {
  try {
    const videoRef = doc(db, 'videos', videoId);
    await updateDoc(videoRef, stats);
  } catch (error) {
    console.error('Error updating video stats:', error);
    throw error;
  }
};

export const addVideo = async (video: Omit<VideoItem, 'id'>) => {
  try {
    const docRef = await addDoc(videosCollection, {
      ...video,
      createdAt: new Date(),
      views: 0,
      likes: 0
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding video:', error);
    throw error;
  }
};

export const deleteVideo = async (videoId: string) => {
  try {
    const videoRef = doc(db, 'videos', videoId);
    await deleteDoc(videoRef);
  } catch (error) {
    console.error('Error deleting video:', error);
    throw error;
  }
};

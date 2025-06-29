import { ContentItem, AdItem, WiseUpItem } from '@/pages/WiseUp/types';
import { getCurrentUser } from '@/lib/firebase';
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  deleteDoc,
  doc,
  getDoc,
  startAfter,
  DocumentSnapshot,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { sampleContentItems, sampleAdItems } from '@/pages/WiseUp/data/sampleItems';

interface Bookmark {
  userId: string;
  wiseUpItemId: string;
  itemType: 'content' | 'ad';
  bookmarkedAt: Timestamp;
}

/**
 * Service for handling WiseUp content and ad operations
 */
class WiseUpService {
  private static instance: WiseUpService;
  private bookmarksCollection = collection(db, 'user_bookmarks');

  private constructor() {}

  public static getInstance(): WiseUpService {
    if (!WiseUpService.instance) {
      WiseUpService.instance = new WiseUpService();
    }
    return WiseUpService.instance;
  }

  /**
   * Fetch content items from Firestore
   * @param maxItems Maximum number of items to fetch
   * @returns Promise with array of ContentItems
   */
  public async getContent(maxItems: number = 10): Promise<ContentItem[]> {
    try {
      const contentRef = collection(db, 'wiseup_content');
      const contentQuery = query(
        contentRef,
        orderBy('createdAt', 'desc'),
        limit(maxItems)
      );

      const snapshot = await getDocs(contentQuery);

      if (snapshot.empty) {
        console.log('No content found, using sample data');
        return sampleContentItems;
      }

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: 'content',
          title: data.title,
          creator: data.creator,
          video: data.video,
          description: data.description,
          resources: data.resources || [],
          tags: data.tags || []
        } as ContentItem;
      });
    } catch (error) {
      console.error('Error fetching content:', error);
      // Return sample data as fallback
      return sampleContentItems;
    }
  }

  /**
   * Fetch ad items from Firestore
   * @param maxItems Maximum number of ads to fetch
   * @param userInterests User interests for targeting (optional)
   * @returns Promise with array of AdItems
   */
  public async getAds(maxItems: number = 5, userInterests: string[] = []): Promise<AdItem[]> {
    try {
      const adsRef = collection(db, 'wiseup_ads');
      let adsQuery;

      // If user has interests, try to target ads
      if (userInterests.length > 0) {
        adsQuery = query(
          adsRef,
          where('active', '==', true),
          where('targetInterests', 'array-contains-any', userInterests),
          limit(maxItems)
        );
      } else {
        adsQuery = query(
          adsRef,
          where('active', '==', true),
          limit(maxItems)
        );
      }

      const snapshot = await getDocs(adsQuery);

      if (snapshot.empty) {
        console.log('No ads found, using sample data');
        return sampleAdItems;
      }

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: 'ad',
          advertiser: data.advertiser,
          title: data.title,
          video: data.video,
          cta: data.cta,
          description: data.description,
          notes: data.notes || ''
        } as AdItem;
      });
    } catch (error) {
      console.error('Error fetching ads:', error);
      // Return sample data as fallback
      return sampleAdItems;
    }
  }

  /**
   * Track ad impression when an ad is viewed
   * @param adId ID of the ad being viewed
   * @param userId ID of the user viewing the ad
   * @returns Promise indicating success/failure
   */
  public async trackAdImpression(adId: string | number, userId: string | null): Promise<void> {
    try {
      const impressionsRef = collection(db, 'ad_impressions');

      await addDoc(impressionsRef, {
        adId,
        userId: userId || 'anonymous',
        timestamp: Timestamp.now(),
        platform: 'web'
      });

      console.log(`Tracked impression for ad ${adId}`);
    } catch (error) {
      console.error('Error tracking ad impression:', error);
      // Silently fail - don't disrupt user experience for analytics
    }
  }

  /**
   * Interleave content and ads
   * @param content Array of content items
   * @param ads Array of ad items
   * @param frequency How often to insert ads (e.g., 3 means after every 3 content items)
   * @returns Combined and interleaved array of WiseUpItems
   */
  public interleaveContentAndAds(
    content: ContentItem[],
    ads: AdItem[],
    frequency: number = 3
  ): WiseUpItem[] {
    if (!content.length) return ads;
    if (!ads.length) return content;

    const result: WiseUpItem[] = [];
    let adIndex = 0;

    content.forEach((item, index) => {
      result.push(item);

      // Insert an ad after every 'frequency' content items
      if ((index + 1) % frequency === 0 && adIndex < ads.length) {
        result.push(ads[adIndex]);
        adIndex++;
      }
    });

    // Add any remaining ads at the end if needed
    while (adIndex < ads.length) {
      result.push(ads[adIndex]);
      adIndex++;
    }

    return result;
  }

  /**
   * Add a bookmark for a WiseUp item
   */
  public async addBookmark(userId: string, itemId: string, itemType: 'content' | 'ad'): Promise<string> {
    try {
      const bookmark: Bookmark = {
        userId,
        wiseUpItemId: itemId,
        itemType,
        bookmarkedAt: Timestamp.now()
      };

      const docRef = await addDoc(this.bookmarksCollection, bookmark);
      return docRef.id;
    } catch (error) {
      console.error('Error adding bookmark:', error);
      throw error;
    }
  }

  /**
   * Remove a bookmark by user ID and item ID
   */
  public async removeBookmark(userId: string, itemId: string): Promise<void> {
    try {
      const bookmarkQuery = query(
        this.bookmarksCollection,
        where('userId', '==', userId),
        where('wiseUpItemId', '==', itemId)
      );

      const snapshot = await getDocs(bookmarkQuery);

      if (!snapshot.empty) {
        await deleteDoc(snapshot.docs[0].ref);
      }
    } catch (error) {
      console.error('Error removing bookmark:', error);
      throw error;
    }
  }

  /**
   * Remove a bookmark by bookmark ID
   */
  public async removeBookmarkById(bookmarkId: string): Promise<void> {
    if (!bookmarkId) {
      console.error("Bookmark ID is required to remove a bookmark.");
      return;
    }
    try {
      const bookmarkRef = doc(this.bookmarksCollection, bookmarkId);
      await deleteDoc(bookmarkRef);
      console.log(`Bookmark ${bookmarkId} removed.`);
    } catch (error) {
      console.error('Error removing bookmark:', error);
      throw error;
    }
  }

  /**
   * Check if an item is bookmarked by user
   */
  public async isBookmarked(userId: string, itemId: string): Promise<boolean> {
    try {
      const bookmarkQuery = query(
        this.bookmarksCollection,
        where('userId', '==', userId),
        where('wiseUpItemId', '==', itemId)
      );

      const snapshot = await getDocs(bookmarkQuery);
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking bookmark status:', error);
      return false;
    }
  }

  /**
   * Get all bookmarked items for a user
   * @deprecated Use getBookmarkedItems instead for pagination support
   */
  public async getUserBookmarks(userId: string): Promise<(ContentItem | AdItem)[]> {
    try {
      const bookmarkQuery = query(
        this.bookmarksCollection,
        where('userId', '==', userId),
        orderBy('bookmarkedAt', 'desc')
      );

      const snapshot = await getDocs(bookmarkQuery);
      const bookmarks = snapshot.docs.map(doc => doc.data() as Bookmark);

      const items: (ContentItem | AdItem)[] = [];

      for (const bookmark of bookmarks) {
        if (bookmark.itemType === 'content') {
          const contentQuery = query(
            collection(db, 'wiseup_content'),
            where('id', '==', bookmark.wiseUpItemId)
          );
          const contentSnapshot = await getDocs(contentQuery);
          if (!contentSnapshot.empty) {
            items.push(contentSnapshot.docs[0].data() as ContentItem);
          }
        } else {
          const adQuery = query(
            collection(db, 'wiseup_ads'),
            where('id', '==', bookmark.wiseUpItemId)
          );
          const adSnapshot = await getDocs(adQuery);
          if (!adSnapshot.empty) {
            items.push(adSnapshot.docs[0].data() as AdItem);
          }
        }
      }

      return items;
    } catch (error) {
      console.error('Error fetching user bookmarks:', error);
      return [];
    }
  }

  /**
   * Fetch bookmarked WiseUp items for a user with pagination.
   * @param userId - The ID of the user whose bookmarks to fetch.
   * @param pageSize - Number of items per page.
   * @param lastDoc - The last document snapshot from the previous page for pagination.
   * @returns Promise with items and lastDoc for pagination
   */
  public async getBookmarkedItems(
    userId: string,
    pageSize: number = 12, // Default page size for grid view
    lastDoc: QueryDocumentSnapshot | null = null
  ): Promise<{ items: (WiseUpItem & { _bookmarkId: string })[]; lastDoc: QueryDocumentSnapshot | null }> {
    if (!userId) {
      console.error('User ID is required to fetch bookmarks.');
      return { items: [], lastDoc: null };
    }

    try {
      // 1. Query the user_bookmarks collection
      const bookmarksRef = collection(db, 'user_bookmarks');
      let bookmarksQuery;

      const constraints = [
        where('userId', '==', userId),
        orderBy('bookmarkedAt', 'desc'), // Show newest bookmarks first
        limit(pageSize)
      ];

      if (lastDoc) {
        bookmarksQuery = query(bookmarksRef, ...constraints, startAfter(lastDoc));
      } else {
        bookmarksQuery = query(bookmarksRef, ...constraints);
      }

      const bookmarkSnapshot = await getDocs(bookmarksQuery);

      if (bookmarkSnapshot.empty) {
        return { items: [], lastDoc: null };
      }

      const newLastDoc = bookmarkSnapshot.docs[bookmarkSnapshot.docs.length - 1] || null;

      // 2. Prepare to fetch details for each bookmarked item
      const fetchDetailPromises = bookmarkSnapshot.docs.map(async (bookmarkDoc) => {
        const bookmarkData = bookmarkDoc.data();
        const itemId = bookmarkData.wiseUpItemId;
        const itemType = bookmarkData.itemType; // 'content' or 'ad'
        const bookmarkId = bookmarkDoc.id; // Keep bookmark doc ID for deletion

        if (!itemId || !itemType) {
          console.warn(`Bookmark ${bookmarkId} is missing itemId or itemType.`);
          return null;
        }

        const collectionName = itemType === 'content' ? 'wiseup_content' : 'wiseup_ads';
        const itemRef = doc(db, collectionName, itemId);

        try {
          const itemDoc = await getDoc(itemRef);
          if (itemDoc.exists()) {
            // Add the bookmarkId to the item data so we can delete the bookmark later
            return {
              ...itemDoc.data(),
              id: itemDoc.id, // The actual content/ad ID
              type: itemType, // Ensure type is correctly set
              _bookmarkId: bookmarkId // Store the bookmark document ID
            } as WiseUpItem & { _bookmarkId: string };
          } else {
            console.warn(`Bookmarked item ${collectionName}/${itemId} not found.`);
            // Optionally: Delete the dangling bookmark reference here
            // await this.removeBookmarkById(bookmarkId);
            return null;
          }
        } catch (itemError) {
          console.error(`Error fetching details for ${collectionName}/${itemId}:`, itemError);
          return null;
        }
      });

      // 3. Resolve all detail fetches and filter out nulls (errors or not found)
      const itemsWithDetails = (await Promise.all(fetchDetailPromises))
                             .filter(item => item !== null) as (WiseUpItem & { _bookmarkId: string })[];

      return {
        items: itemsWithDetails,
        lastDoc: newLastDoc
      };

    } catch (error) {
      console.error('Error fetching bookmarked WiseUp items:', error);
      throw error; // Re-throw to be caught by the component
    }
  }
}

// Export a singleton instance
export const wiseupService = WiseUpService.getInstance();

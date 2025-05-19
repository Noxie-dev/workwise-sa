import { ContentItem, AdItem, WiseUpItem } from '@/pages/WiseUp/types';
import api from '@/lib/api';

/**
 * WiseUp API Service
 * 
 * Handles all API calls related to the WiseUp learning platform
 */
export class WiseUpApiService {
  /**
   * Fetch content items from the API
   * @param maxItems Maximum number of items to fetch
   * @returns Promise with array of ContentItems
   */
  public async getContent(maxItems: number = 10): Promise<ContentItem[]> {
    try {
      const response = await api.get<ContentItem[]>('/api/v1/wiseup/content', {
        params: { limit: maxItems }
      });
      
      return response.data.map(item => ({
        ...item,
        type: 'content'
      }));
    } catch (error) {
      console.error('Error fetching content:', error);
      throw error;
    }
  }

  /**
   * Fetch ad items from the API
   * @param maxItems Maximum number of ads to fetch
   * @param userInterests User interests for targeting (optional)
   * @returns Promise with array of AdItems
   */
  public async getAds(maxItems: number = 5, userInterests: string[] = []): Promise<AdItem[]> {
    try {
      const response = await api.get<AdItem[]>('/api/v1/wiseup/ads', {
        params: { 
          limit: maxItems,
          interests: userInterests.join(',')
        }
      });
      
      return response.data.map(item => ({
        ...item,
        type: 'ad'
      }));
    } catch (error) {
      console.error('Error fetching ads:', error);
      throw error;
    }
  }

  /**
   * Track ad impression when an ad is viewed
   * @param adId ID of the ad being viewed
   * @returns Promise indicating success/failure
   */
  public async trackAdImpression(adId: string | number): Promise<void> {
    try {
      await api.post('/api/v1/wiseup/ads/impression', { adId });
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

    // Add any remaining ads at the end if there are more ads than can be interleaved
    while (adIndex < ads.length) {
      result.push(ads[adIndex]);
      adIndex++;
    }

    return result;
  }

  /**
   * Get user bookmarks
   * @returns Promise with array of bookmarked items
   */
  public async getBookmarks(): Promise<WiseUpItem[]> {
    try {
      const response = await api.get<WiseUpItem[]>('/api/v1/wiseup/bookmarks');
      return response.data;
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      throw error;
    }
  }

  /**
   * Add a bookmark
   * @param itemId ID of the item to bookmark
   * @param itemType Type of the item ('content' or 'ad')
   * @returns Promise with the created bookmark
   */
  public async addBookmark(itemId: string, itemType: 'content' | 'ad'): Promise<any> {
    try {
      const response = await api.post('/api/v1/wiseup/bookmarks', {
        wiseUpItemId: itemId,
        itemType
      });
      
      return response.data;
    } catch (error) {
      console.error('Error adding bookmark:', error);
      throw error;
    }
  }

  /**
   * Remove a bookmark
   * @param bookmarkId ID of the bookmark to remove
   * @returns Promise indicating success/failure
   */
  public async removeBookmark(bookmarkId: string): Promise<void> {
    try {
      await api.delete(`/api/v1/wiseup/bookmarks/${bookmarkId}`);
    } catch (error) {
      console.error('Error removing bookmark:', error);
      throw error;
    }
  }

  /**
   * Update user progress for a content item
   * @param contentId ID of the content item
   * @param progress Progress percentage (0-100)
   * @param completed Whether the content has been completed
   * @returns Promise indicating success/failure
   */
  public async updateProgress(
    contentId: number, 
    progress: number, 
    completed: boolean = false
  ): Promise<void> {
    try {
      await api.post('/api/v1/wiseup/progress', {
        contentId,
        progress,
        completed
      });
    } catch (error) {
      console.error('Error updating progress:', error);
      // Silently fail - don't disrupt user experience
    }
  }
}

// Create and export a singleton instance
export const wiseupApiService = new WiseUpApiService();

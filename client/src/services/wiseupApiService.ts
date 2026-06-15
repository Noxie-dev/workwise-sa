import {
  WiseUpAdItem as AdItem,
  WiseUpComment,
  WiseUpContentItem as ContentItem,
  WiseUpEvent,
  WiseUpFeedItem as WiseUpItem,
  WiseUpFeedResponse,
} from '@shared/wiseup-contracts';
import api from '@/lib/api';

type FeedParams = {
  limit?: number;
  cursor?: string | null;
  category?: string;
  q?: string;
};

type CommentsResponse = {
  comments: WiseUpComment[];
  nextCursor: string | null;
};

export class WiseUpApiService {
  public async getFeed(params: FeedParams = {}): Promise<WiseUpFeedResponse> {
    const response = await api.get<WiseUpFeedResponse>('/api/v1/wiseup/feed', {
      params: {
        limit: params.limit ?? 18,
        cursor: params.cursor || undefined,
        category: params.category || undefined,
        q: params.q || undefined,
      },
    });

    return response.data;
  }

  public async getItem(item: Pick<WiseUpItem, 'id' | 'type'>): Promise<WiseUpItem> {
    const response = await api.get<WiseUpItem>(`/api/v1/wiseup/items/${this.getItemKey(item)}`, {
      params: { itemType: item.type },
    });
    return response.data;
  }

  public async getContent(maxItems: number = 10): Promise<ContentItem[]> {
    const response = await api.get<ContentItem[]>('/api/v1/wiseup/content', {
      params: { limit: maxItems },
    });
    return response.data;
  }

  public async getAds(maxItems: number = 5, userInterests: string[] = []): Promise<AdItem[]> {
    const response = await api.get<AdItem[]>('/api/v1/wiseup/ads', {
      params: {
        limit: maxItems,
        interests: userInterests.join(','),
      },
    });
    return response.data;
  }

  public async trackEvent(event: WiseUpEvent): Promise<void> {
    await this.trackEvents([event]);
  }

  public async trackEvents(events: WiseUpEvent[]): Promise<void> {
    if (!events.length) return;

    try {
      await api.post('/api/v1/wiseup/events', { events });
    } catch (error) {
      console.warn('WiseUp analytics event failed:', error);
    }
  }

  public async updateProgress(
    contentId: number,
    progress: number,
    completed: boolean = false
  ): Promise<void> {
    try {
      await api.post('/api/v1/wiseup/progress', {
        contentId,
        progress,
        completed,
      });
    } catch (error) {
      console.warn('WiseUp progress update failed:', error);
    }
  }

  public async getComments(
    item: Pick<WiseUpItem, 'id' | 'type'>,
    limit: number = 20
  ): Promise<CommentsResponse> {
    const response = await api.get<CommentsResponse>(
      `/api/v1/wiseup/items/${this.getItemKey(item)}/comments`,
      {
        params: { itemType: item.type, limit },
      }
    );
    return response.data;
  }

  public async addComment(
    item: Pick<WiseUpItem, 'id' | 'type'>,
    text: string
  ): Promise<WiseUpComment> {
    const response = await api.post<WiseUpComment>(
      `/api/v1/wiseup/items/${this.getItemKey(item)}/comments`,
      {
        text,
        itemType: item.type,
      }
    );
    return response.data;
  }

  public async trackAdImpression(adId: string | number): Promise<void> {
    try {
      await api.post('/api/v1/wiseup/ads/impression', { adId });
    } catch (error) {
      console.warn('WiseUp ad impression failed:', error);
    }
  }

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

      if ((index + 1) % frequency === 0 && adIndex < ads.length) {
        result.push(ads[adIndex]);
        adIndex += 1;
      }
    });

    while (adIndex < ads.length) {
      result.push(ads[adIndex]);
      adIndex += 1;
    }

    return result;
  }

  public async getBookmarks(): Promise<WiseUpItem[]> {
    const response = await api.get<WiseUpItem[]>('/api/v1/wiseup/bookmarks');
    return response.data;
  }

  public async addBookmark(itemId: string, itemType: 'content' | 'ad'): Promise<unknown> {
    const response = await api.post('/api/v1/wiseup/bookmarks', {
      wiseUpItemId: itemId,
      itemType,
    });

    return response.data;
  }

  public async removeBookmark(bookmarkId: string): Promise<void> {
    await api.delete(`/api/v1/wiseup/bookmarks/${bookmarkId}`);
  }

  public getItemKey(item: Pick<WiseUpItem, 'id' | 'type'>): string {
    return `${item.type}:${item.id}`;
  }
}

export const wiseupApiService = new WiseUpApiService();

import apiClient from './apiClient';
import { User } from 'firebase/auth';
import { QueryDocumentSnapshot } from 'firebase/firestore';

/**
 * Comment interface
 */
export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  createdAt: Date;
}

/**
 * Response from getComments
 */
export interface CommentsResponse {
  comments: Comment[];
  lastDoc: QueryDocumentSnapshot | null;
}

/**
 * Service for comment-related API calls
 */
export const commentsService = {
  /**
   * Get comments for a specific content
   */
  async getComments(
    contentId: string,
    limit: number = 10,
    lastDoc: QueryDocumentSnapshot | null = null
  ): Promise<CommentsResponse> {
    const params: Record<string, string> = {
      limit: limit.toString(),
    };

    if (lastDoc) {
      params.lastDocId = lastDoc.id;
    }

    const response = await apiClient.get<CommentsResponse>(`/api/comments/${contentId}`, {
      params,
    });

    return response.data;
  },

  /**
   * Add a comment to a specific content
   */
  async addComment(
    contentId: string,
    user: User,
    text: string
  ): Promise<Comment> {
    const response = await apiClient.post<Comment>(`/api/comments/${contentId}`, {
      text,
      userId: user.uid,
      userName: user.displayName || 'Anonymous',
      userAvatar: user.photoURL || '/placeholder-avatar.png',
    });

    return response.data;
  },

  /**
   * Delete a comment
   */
  async deleteComment(contentId: string, commentId: string): Promise<void> {
    await apiClient.delete(`/api/comments/${contentId}/${commentId}`);
  },
};

export default commentsService;

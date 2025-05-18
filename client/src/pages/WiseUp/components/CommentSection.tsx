import React, { useReducer, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { User } from 'firebase/auth';
import { formatDistanceToNow } from 'date-fns';
import { X } from 'lucide-react';
import { QueryDocumentSnapshot } from 'firebase/firestore';
import { commentsService, Comment } from '@/services/commentsService';

/**
 * Props for the CommentSection component
 */
interface CommentSectionProps {
  contentId: string;
  currentUser: User;
}

/**
 * Action types for the comment section reducer
 */
enum CommentActionType {
  SET_NEW_COMMENT_TEXT = 'SET_NEW_COMMENT_TEXT',
  ADD_OPTIMISTIC_COMMENT = 'ADD_OPTIMISTIC_COMMENT',
  REMOVE_OPTIMISTIC_COMMENT = 'REMOVE_OPTIMISTIC_COMMENT',
  DELETE_COMMENT_OPTIMISTIC = 'DELETE_COMMENT_OPTIMISTIC',
  DELETE_COMMENT_ERROR = 'DELETE_COMMENT_ERROR',
}

/**
 * Action interfaces for the comment section reducer
 */
interface SetNewCommentTextAction {
  type: CommentActionType.SET_NEW_COMMENT_TEXT;
  payload: { text: string };
}

interface AddOptimisticCommentAction {
  type: CommentActionType.ADD_OPTIMISTIC_COMMENT;
  payload: { comment: Comment };
}

interface RemoveOptimisticCommentAction {
  type: CommentActionType.REMOVE_OPTIMISTIC_COMMENT;
  payload: { tempId: string };
}

interface DeleteCommentOptimisticAction {
  type: CommentActionType.DELETE_COMMENT_OPTIMISTIC;
  payload: { commentId: string; originalComments: Comment[] };
}

interface DeleteCommentErrorAction {
  type: CommentActionType.DELETE_COMMENT_ERROR;
  payload: { originalComments: Comment[] };
}

/**
 * Union type for all comment actions
 */
type CommentAction =
  | SetNewCommentTextAction
  | AddOptimisticCommentAction
  | RemoveOptimisticCommentAction
  | DeleteCommentOptimisticAction
  | DeleteCommentErrorAction;

/**
 * State interface for the comment section
 */
interface CommentState {
  newCommentText: string;
  optimisticComments: Comment[];
  originalComments: Comment[] | null; // For rollback on delete error
}

/**
 * Initial state for the comment section
 */
const initialState: CommentState = {
  newCommentText: '',
  optimisticComments: [],
  originalComments: null,
};

/**
 * Reducer function for the comment section
 */
const commentReducer = (state: CommentState, action: CommentAction): CommentState => {
  switch (action.type) {
    case CommentActionType.SET_NEW_COMMENT_TEXT:
      return {
        ...state,
        newCommentText: action.payload.text,
      };

    case CommentActionType.ADD_OPTIMISTIC_COMMENT:
      return {
        ...state,
        optimisticComments: [action.payload.comment, ...state.optimisticComments],
      };

    case CommentActionType.REMOVE_OPTIMISTIC_COMMENT:
      return {
        ...state,
        optimisticComments: state.optimisticComments.filter(
          comment => comment.id !== action.payload.tempId
        ),
      };

    case CommentActionType.DELETE_COMMENT_OPTIMISTIC:
      return {
        ...state,
        optimisticComments: state.optimisticComments.filter(
          comment => comment.id !== action.payload.commentId
        ),
        originalComments: action.payload.originalComments,
      };

    case CommentActionType.DELETE_COMMENT_ERROR:
      return {
        ...state,
        optimisticComments: action.payload.originalComments,
        originalComments: null,
      };

    default:
      return state;
  }
};

/**
 * CommentSection component displays and manages comments for content
 */
const CommentSection: React.FC<CommentSectionProps> = ({ contentId, currentUser }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [state, dispatch] = useReducer(commentReducer, initialState);
  const listRef = useRef<HTMLDivElement>(null);

  // Query key for comments
  const commentsQueryKey = ['comments', contentId];

  // Fetch comments with React Query
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useQuery({
    queryKey: commentsQueryKey,
    queryFn: ({ pageParam }) => commentsService.getComments(
      contentId,
      10,
      pageParam as QueryDocumentSnapshot | null
    ),
    getNextPageParam: (lastPage) => lastPage.lastDoc || undefined,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: ({ text }: { text: string }) =>
      commentsService.addComment(contentId, currentUser, text),
    onMutate: async ({ text }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: commentsQueryKey });

      // Create optimistic comment
      const tempId = `temp-${Date.now()}`;
      const optimisticComment: Comment = {
        id: tempId,
        userId: currentUser.uid,
        userName: currentUser.displayName || "You",
        userAvatar: currentUser.photoURL || "/placeholder-avatar.png",
        text: text.trim(),
        createdAt: new Date(),
      };

      // Add optimistic comment to local state
      dispatch({
        type: CommentActionType.ADD_OPTIMISTIC_COMMENT,
        payload: { comment: optimisticComment }
      });

      // Clear input immediately
      dispatch({
        type: CommentActionType.SET_NEW_COMMENT_TEXT,
        payload: { text: '' }
      });

      return { tempId };
    },
    onError: (error, { text }, context) => {
      // Show error toast
      toast({
        title: "Error",
        description: "Failed to post comment.",
        variant: "destructive"
      });

      // Remove optimistic comment
      if (context?.tempId) {
        dispatch({
          type: CommentActionType.REMOVE_OPTIMISTIC_COMMENT,
          payload: { tempId: context.tempId }
        });
      }

      // Restore text input
      dispatch({
        type: CommentActionType.SET_NEW_COMMENT_TEXT,
        payload: { text }
      });
    },
    onSuccess: () => {
      // Invalidate comments query to refetch
      queryClient.invalidateQueries({ queryKey: commentsQueryKey });
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) =>
      commentsService.deleteComment(contentId, commentId),
    onMutate: async (commentId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: commentsQueryKey });

      // Get current comments
      const allComments = [
        ...(data?.pages?.flatMap(page => page.comments) || []),
        ...state.optimisticComments
      ];

      // Store original comments for potential rollback
      const originalComments = [...allComments];

      // Optimistic deletion
      dispatch({
        type: CommentActionType.DELETE_COMMENT_OPTIMISTIC,
        payload: { commentId, originalComments }
      });

      return { originalComments };
    },
    onError: (error, variables, context) => {
      // Show error toast
      toast({
        title: "Error",
        description: "Failed to delete comment.",
        variant: "destructive"
      });

      // Revert to original comments on error
      if (context?.originalComments) {
        dispatch({
          type: CommentActionType.DELETE_COMMENT_ERROR,
          payload: { originalComments: context.originalComments }
        });
      }
    },
    onSuccess: () => {
      // Show success toast
      toast({
        title: "Success",
        description: "Comment deleted."
      });

      // Invalidate comments query to refetch
      queryClient.invalidateQueries({ queryKey: commentsQueryKey });
    },
  });

  // Handle post comment form submission
  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.newCommentText.trim() || addCommentMutation.isPending) return;

    // Call the mutation
    addCommentMutation.mutate({ text: state.newCommentText.trim() });
  };

  // Handle delete comment
  const handleDeleteComment = (commentId: string) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;

    // Call the mutation
    deleteCommentMutation.mutate(commentId);
  };

  // Get comments from React Query and optimistic updates
  const allComments = [
    ...(data?.pages?.flatMap(page => page.comments) || []),
    ...state.optimisticComments
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Comments</h3>

      {/* Comment Input Form */}
      <form onSubmit={handlePostComment} className="flex flex-col space-y-2">
        <Textarea
          placeholder="Add your comment..."
          value={state.newCommentText}
          onChange={(e) => dispatch({
            type: CommentActionType.SET_NEW_COMMENT_TEXT,
            payload: { text: e.target.value }
          })}
          rows={3}
          maxLength={500}
          disabled={addCommentMutation.isPending}
        />
        <Button
          type="submit"
          disabled={!state.newCommentText.trim() || addCommentMutation.isPending}
          className="self-end bg-yellow-400 hover:bg-yellow-500 text-gray-800"
        >
          {addCommentMutation.isPending ? 'Posting...' : 'Post Comment'}
        </Button>
      </form>

      {/* Comment List */}
      <div
        ref={listRef}
        className="space-y-4 max-h-96 overflow-y-auto pr-2"
      >
        {isLoading && allComments.length === 0 && (
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        )}

        {isError && (
          <p className="text-red-500">
            {error instanceof Error ? error.message : 'Could not load comments.'}
          </p>
        )}

        {!isLoading && allComments.length === 0 && !isError && (
          <p className="text-sm text-gray-500 text-center py-4">No comments yet. Be the first!</p>
        )}

        {allComments.map((comment) => (
          <div key={comment.id} className="flex space-x-3">
            <Avatar className="h-8 w-8 mt-1">
              <AvatarImage src={comment.userAvatar} alt={comment.userName} />
              <AvatarFallback>{comment.userName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 bg-gray-50 p-3 rounded-md shadow-sm">
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-sm text-gray-800">{comment.userName}</span>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{comment.text}</p>

              {/* Delete Button - Only show if user owns the comment */}
              {currentUser.uid === comment.userId && (
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  className="text-xs text-red-500 hover:text-red-700 mt-1 float-right p-1"
                  aria-label="Delete comment"
                  disabled={deleteCommentMutation.isPending}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Load More Button */}
        {hasNextPage && !isFetchingNextPage && allComments.length > 0 && (
          <div className="text-center pt-2">
            <Button
              variant="link"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              Load More Comments
            </Button>
          </div>
        )}

        {/* Loading indicator for pagination */}
        {isFetchingNextPage && (
          <div className="text-center py-2">
            <p className="text-sm text-gray-500">Loading more comments...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentSection;

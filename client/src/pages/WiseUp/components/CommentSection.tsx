import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Send } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { wiseupApiService } from '@/services/wiseupApiService';
import { WiseUpItem } from '../types';

interface CommentSectionProps {
  item: WiseUpItem;
}

const CommentSection: React.FC<CommentSectionProps> = ({ item }) => {
  const [commentText, setCommentText] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const queryKey = ['wiseup-comments', item.type, item.id];

  const commentsQuery = useQuery({
    queryKey,
    queryFn: () => wiseupApiService.getComments(item, 20),
    staleTime: 1000 * 30,
  });

  const addComment = useMutation({
    mutationFn: (text: string) => wiseupApiService.addComment(item, text),
    onSuccess: () => {
      setCommentText('');
      queryClient.invalidateQueries({ queryKey });
    },
    onError: () => {
      toast({
        title: 'Sign in required',
        description: 'Please sign in before posting a WiseUp comment.',
        variant: 'destructive',
      });
    },
  });

  const comments = commentsQuery.data?.comments ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-bold text-slate-950">
        <MessageCircle className="h-4 w-4 text-[#24456f]" />
        Discussion
      </div>

      <form
        className="space-y-3"
        onSubmit={event => {
          event.preventDefault();
          if (!commentText.trim()) return;
          addComment.mutate(commentText.trim());
        }}
      >
        <Textarea
          value={commentText}
          onChange={event => setCommentText(event.target.value)}
          placeholder="Add a question, insight, or note..."
          className="min-h-24 resize-none"
          maxLength={1000}
        />
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-slate-500">{commentText.length}/1000</span>
          <button
            type="submit"
            disabled={!commentText.trim() || addComment.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-[#ffc82d] px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-[#f5b800] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {addComment.isPending ? 'Posting' : 'Post'}
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {commentsQuery.isLoading && (
          <>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </>
        )}

        {commentsQuery.isError && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            Comments could not be loaded.
          </p>
        )}

        {!commentsQuery.isLoading && !comments.length && !commentsQuery.isError && (
          <p className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
            No comments yet.
          </p>
        )}

        {comments.map(comment => (
          <div
            key={comment.id}
            className="flex gap-3 rounded-lg border border-slate-100 bg-white p-3"
          >
            <Avatar className="h-9 w-9">
              <AvatarImage src={comment.userAvatar || undefined} alt={comment.userName} />
              <AvatarFallback className="bg-slate-100 text-xs text-slate-700">
                {comment.userName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className="text-sm font-semibold text-slate-900">{comment.userName}</p>
                {comment.createdAt && (
                  <span className="text-xs text-slate-500">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </span>
                )}
              </div>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                {comment.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommentSection;

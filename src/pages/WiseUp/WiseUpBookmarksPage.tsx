import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { WiseUpItem } from './types';
import { wiseupService } from '@/services/wiseupService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bookmark, RefreshCw } from 'lucide-react';
import BookmarkGrid from './components/BookmarkGrid';
import { QueryDocumentSnapshot } from 'firebase/firestore';

/**
 * WiseUpBookmarksPage displays all bookmarked WiseUp items for the current user
 */
const WiseUpBookmarksPage: React.FC = () => {
  // State for bookmarked items
  const [bookmarkedItems, setBookmarkedItems] = useState<(WiseUpItem & { _bookmarkId: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for pagination
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Hooks
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Fetch bookmarked items
  const fetchBookmarks = useCallback(async (isInitialLoad = true) => {
    if (!currentUser) {
      setError('You must be logged in to view bookmarks');
      setIsLoading(false);
      return;
    }
    
    try {
      if (isInitialLoad) {
        setIsLoading(true);
        setError(null);
      } else {
        setIsLoadingMore(true);
      }
      
      const result = await wiseupService.getBookmarkedItems(
        currentUser.uid,
        12, // Page size
        isInitialLoad ? null : lastDoc // For pagination
      );
      
      if (isInitialLoad) {
        setBookmarkedItems(result.items);
      } else {
        setBookmarkedItems(prev => [...prev, ...result.items]);
      }
      
      setLastDoc(result.lastDoc);
      setHasMore(result.items.length === 12); // If we got a full page, there might be more
      
    } catch (err) {
      console.error('Error fetching bookmarks:', err);
      setError('Failed to load bookmarks. Please try again later.');
      
      toast({
        variant: 'destructive',
        title: 'Error Loading Bookmarks',
        description: 'There was a problem loading your bookmarks.',
      });
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [currentUser, lastDoc, toast]);
  
  // Load bookmarks on component mount
  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);
  
  // Handle removing a bookmark
  const handleRemoveBookmark = useCallback(async (bookmarkId: string) => {
    try {
      // Optimistic UI update - remove from state immediately
      setBookmarkedItems(prev => prev.filter(item => item._bookmarkId !== bookmarkId));
      
      // Then remove from database
      await wiseupService.removeBookmarkById(bookmarkId);
      
      toast({
        title: 'Bookmark Removed',
        description: 'The item has been removed from your bookmarks.',
      });
    } catch (err) {
      console.error('Error removing bookmark:', err);
      
      // Fetch all bookmarks again to restore correct state
      fetchBookmarks();
      
      toast({
        variant: 'destructive',
        title: 'Error Removing Bookmark',
        description: 'There was a problem removing the bookmark.',
      });
    }
  }, [fetchBookmarks, toast]);
  
  // Handle loading more bookmarks
  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoadingMore) {
      fetchBookmarks(false);
    }
  }, [fetchBookmarks, hasMore, isLoadingMore]);
  
  // Handle navigation back to WiseUp main page
  const handleBackToWiseUp = useCallback(() => {
    navigate('/wiseup');
  }, [navigate]);
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div className="flex items-center mb-4 md:mb-0">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleBackToWiseUp}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold flex items-center">
            <Bookmark className="h-6 w-6 mr-2" />
            My WiseUp Bookmarks
          </h1>
        </div>
        
        <Button 
          variant="outline" 
          onClick={() => fetchBookmarks()}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      {/* Bookmarks grid */}
      <BookmarkGrid 
        items={bookmarkedItems}
        onRemoveBookmark={handleRemoveBookmark}
        isLoading={isLoading}
      />
      
      {/* Load more button */}
      {hasMore && !isLoading && (
        <div className="mt-8 text-center">
          <Button 
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="px-8"
          >
            {isLoadingMore ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default WiseUpBookmarksPage;

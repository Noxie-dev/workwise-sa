import React from 'react';
import { WiseUpItem } from '../types';
import BookmarkCard from './BookmarkCard';
import { Skeleton } from '@/components/ui/skeleton';

interface BookmarkGridProps {
  items: (WiseUpItem & { _bookmarkId: string })[];
  onRemoveBookmark: (bookmarkId: string) => void;
  isLoading?: boolean;
}

/**
 * BookmarkGrid component displays a grid of bookmarked items
 */
const BookmarkGrid: React.FC<BookmarkGridProps> = ({ 
  items, 
  onRemoveBookmark,
  isLoading = false
}) => {
  // If loading, show skeleton cards
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={`skeleton-${index}`} className="h-full">
            <Skeleton className="h-40 w-full rounded-t-lg" />
            <div className="p-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  // If no items, show empty state
  if (items.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="bg-gray-50 rounded-lg p-8 max-w-md mx-auto">
          <h3 className="text-xl font-semibold mb-2">No bookmarks yet</h3>
          <p className="text-gray-600 mb-4">
            You haven't bookmarked any WiseUp content. When you find something interesting, 
            click the bookmark icon to save it for later.
          </p>
        </div>
      </div>
    );
  }
  
  // Render the grid of bookmark cards
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map(item => (
        <BookmarkCard 
          key={`${item.type}-${item.id}`}
          item={item}
          onRemoveBookmark={onRemoveBookmark}
        />
      ))}
    </div>
  );
};

export default BookmarkGrid;

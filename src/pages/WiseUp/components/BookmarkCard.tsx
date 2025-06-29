import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bookmark, X } from 'lucide-react';
import { WiseUpItem } from '../types';

interface BookmarkCardProps {
  item: WiseUpItem & { _bookmarkId: string };
  onRemoveBookmark: (bookmarkId: string) => void;
}

/**
 * BookmarkCard component displays a single bookmarked item in a card format
 * with options to view the item or remove the bookmark.
 */
const BookmarkCard: React.FC<BookmarkCardProps> = ({ item, onRemoveBookmark }) => {
  // Determine if this is a content item or ad item
  const isContent = item.type === 'content';
  
  // Get the appropriate title and subtitle based on item type
  const title = item.title;
  const subtitle = isContent 
    ? (item as any).creator?.name 
    : `Ad by ${(item as any).advertiser}`;
  
  // Get thumbnail - use avatar for content, or a placeholder for ads
  const thumbnail = isContent 
    ? (item as any).creator?.avatar || '/placeholder-content.jpg'
    : '/placeholder-ad.jpg';
  
  // Handle click on remove button
  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent card navigation
    e.stopPropagation(); // Prevent event bubbling
    onRemoveBookmark(item._bookmarkId);
  };
  
  return (
    <Card className="h-full overflow-hidden hover:shadow-md transition-shadow duration-200">
      <Link 
        to={`/wiseup?itemId=${item.id}`} 
        className="block h-full"
      >
        <div className="relative aspect-video overflow-hidden bg-gray-100">
          <img 
            src={thumbnail} 
            alt={title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 right-2">
            <Button 
              variant="destructive" 
              size="icon" 
              className="h-8 w-8 rounded-full bg-white/80 hover:bg-white text-red-500"
              onClick={handleRemove}
              title="Remove bookmark"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {/* Type badge */}
          <div className="absolute bottom-2 left-2">
            <span className={`text-xs px-2 py-1 rounded-full ${
              isContent 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {isContent ? 'Content' : 'Ad'}
            </span>
          </div>
        </div>
        
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg line-clamp-2 mb-1">{title}</h3>
          <p className="text-sm text-gray-600">{subtitle}</p>
        </CardContent>
        
        <CardFooter className="p-4 pt-0 flex justify-between items-center">
          <span className="text-xs text-gray-500">
            Click to view
          </span>
          <Bookmark className="h-4 w-4 text-blue-500" />
        </CardFooter>
      </Link>
    </Card>
  );
};

export default BookmarkCard;

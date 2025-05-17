import React, { useState, useEffect } from 'react';
import { AdItem } from '../types';
import { Button } from '@/components/ui/button';
import { ExternalLink, Bookmark } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { wiseupService } from '@/services/wiseupService';
import { useToast } from '@/components/ui/use-toast';

interface AdDetailsProps {
  item: AdItem;
}

/**
 * AdDetails component displays the details for an 'ad' type item in the WiseUp feature's left panel.
 * It shows advertiser information, ad title, description, and call-to-action buttons.
 */
const AdDetails: React.FC<AdDetailsProps> = ({ item }) => {
  // State for bookmark status
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);

  // Hooks
  const { currentUser } = useAuth();
  const { toast } = useToast();

  // Check if item is bookmarked on component mount
  useEffect(() => {
    const checkBookmarkStatus = async () => {
      if (currentUser && item.id) {
        try {
          const bookmarked = await wiseupService.isBookmarked(currentUser.uid, item.id.toString());
          setIsBookmarked(bookmarked);
        } catch (error) {
          console.error('Error checking bookmark status:', error);
        }
      }
    };

    checkBookmarkStatus();
  }, [currentUser, item.id]);

  // Handle bookmark toggle
  const handleBookmarkToggle = async () => {
    if (!currentUser) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to bookmark content.',
        variant: 'destructive',
      });
      return;
    }

    setIsBookmarkLoading(true);

    try {
      if (isBookmarked) {
        await wiseupService.removeBookmark(currentUser.uid, item.id.toString());
        setIsBookmarked(false);
        toast({
          title: 'Bookmark removed',
          description: 'Ad removed from your bookmarks.',
        });
      } else {
        await wiseupService.addBookmark(currentUser.uid, item.id.toString(), 'ad');
        setIsBookmarked(true);
        toast({
          title: 'Bookmarked!',
          description: 'Ad saved to your bookmarks.',
        });
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      toast({
        title: 'Error',
        description: 'Failed to update bookmark. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsBookmarkLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Advertiser Info */}
      <div className="flex items-center mb-4">
        <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center mr-3">
          <span className="text-yellow-800 font-bold">AD</span>
        </div>
        <div>
          <h2 className="font-semibold text-base">{item.advertiser}</h2>
          <p className="text-sm text-gray-500">Sponsored</p>
        </div>
      </div>

      {/* Ad Title */}
      <h1 className="text-xl font-bold mb-3">{item.title}</h1>

      {/* Description */}
      <p className="text-gray-700 mb-4">{item.description}</p>

      {/* Notes */}
      {item.notes && (
        <div className="bg-gray-50 p-3 rounded-md mb-4">
          <p className="text-sm text-gray-600">{item.notes}</p>
        </div>
      )}

      {/* Bookmark Button */}
      <Button
        variant="outline"
        size="sm"
        className="mb-4 flex items-center justify-center text-blue-500"
        onClick={handleBookmarkToggle}
        disabled={isBookmarkLoading}
      >
        <Bookmark
          className={`h-4 w-4 mr-2 ${isBookmarked ? 'fill-blue-500 text-blue-500' : ''}`}
        />
        {isBookmarked ? 'Bookmarked' : 'Bookmark'}
      </Button>

      {/* Call to Action Buttons */}
      <div className="mt-auto space-y-2">
        <Button className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-800">
          {item.cta.primary.text}
          <ExternalLink className="ml-2 h-4 w-4" />
        </Button>
        <Button variant="outline" className="w-full text-blue-500">
          {item.cta.secondary.text}
        </Button>
      </div>
    </div>
  );
};

export default AdDetails;

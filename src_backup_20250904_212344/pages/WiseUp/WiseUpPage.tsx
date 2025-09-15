import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { WiseUpItem, ContentItem } from './types';
import WiseUpLayout from './WiseUpLayout';
import { wiseupService } from '@/services/wiseupService';
import { wiseupApiService } from '@/services/wiseupApiService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import WiseUpHeader from '@/components/WiseUpHeader';
import { sampleItems } from './data/sampleItems';
import { Helmet } from 'react-helmet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Search, Filter, Sparkles, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';

/**
 * WiseUpPage component serves as the container for the WiseUp feature.
 * It manages state, data fetching, and interactions for the learning platform.
 */
const WiseUpPage: React.FC = () => {
  // Get query parameters
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const itemIdFromUrl = queryParams.get('itemId');

  // State for content and navigation
  const [allItems, setAllItems] = useState<WiseUpItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // State for filtering and search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'content' | 'ad'>('all');
  const [userPreferences, setUserPreferences] = useState<{
    autoplay: boolean;
    muted: boolean;
    showRelated: boolean;
  }>({
    autoplay: true,
    muted: false,
    showRelated: true
  });

  // State for video playback
  const [isPlaying, setIsPlaying] = useState(userPreferences.autoplay);
  const [isMuted, setIsMuted] = useState(userPreferences.muted);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // State for loading and errors
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hooks
  const { currentUser } = useAuth();
  const { toast } = useToast();

  // Filtered items based on search, tags, and type
  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      // Filter by type
      if (filterType !== 'all' && item.type !== filterType) {
        return false;
      }

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesDescription = item.description.toLowerCase().includes(query);

        // For content items, also search in tags and creator name
        if (item.type === 'content') {
          const matchesTags = item.tags.some(tag =>
            tag.toLowerCase().includes(query)
          );
          const matchesCreator = item.creator.name.toLowerCase().includes(query);

          if (!(matchesTitle || matchesDescription || matchesTags || matchesCreator)) {
            return false;
          }
        } else {
          // For ad items
          const matchesAdvertiser = item.advertiser.toLowerCase().includes(query);

          if (!(matchesTitle || matchesDescription || matchesAdvertiser)) {
            return false;
          }
        }
      }

      // Filter by selected tags (only applies to content items)
      if (selectedTags.length > 0 && item.type === 'content') {
        const hasSelectedTag = selectedTags.some(tag =>
          item.tags.includes(tag)
        );

        if (!hasSelectedTag) {
          return false;
        }
      }

      return true;
    });
  }, [allItems, searchQuery, selectedTags, filterType]);

  // Get all available tags from content items
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();

    allItems.forEach(item => {
      if (item.type === 'content') {
        item.tags.forEach(tag => tagSet.add(tag));
      }
    });

    return Array.from(tagSet).sort();
  }, [allItems]);

  // Computed values
  const currentItem = filteredItems.length > 0 ? filteredItems[currentIndex] : null;
  const isNextDisabled = currentIndex >= filteredItems.length - 1;
  const isPreviousDisabled = currentIndex <= 0;

  // Load user preferences from localStorage
  useEffect(() => {
    const savedPreferences = localStorage.getItem('wiseup-preferences');
    if (savedPreferences) {
      try {
        const parsedPreferences = JSON.parse(savedPreferences);
        setUserPreferences(prev => ({
          ...prev,
          ...parsedPreferences
        }));

        // Apply preferences
        setIsPlaying(parsedPreferences.autoplay ?? true);
        setIsMuted(parsedPreferences.muted ?? false);
      } catch (e) {
        console.error('Error parsing saved preferences:', e);
      }
    }
  }, []);

  // Save user preferences to localStorage when they change
  useEffect(() => {
    localStorage.setItem('wiseup-preferences', JSON.stringify(userPreferences));
  }, [userPreferences]);

  // Fetch content and ads on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Get user interests from profile if available
        const userInterests = currentUser?.interests || [];

        // Fetch content and ads
        // Try to use the API service first, fall back to the Firebase service if it fails
        try {
          const [contentItems, adItems] = await Promise.all([
            wiseupApiService.getContent(),
            wiseupApiService.getAds(5, userInterests) // Pass user interests for targeted ads
          ]);

          // Interleave content and ads
          const combinedItems = wiseupApiService.interleaveContentAndAds(contentItems, adItems);

          if (combinedItems.length === 0) {
            throw new Error('No items returned from API');
          }

          setAllItems(combinedItems);
        } catch (apiError) {
          console.warn('API service failed, falling back to Firebase service:', apiError);

          // Fall back to Firebase service
          const [contentItems, adItems] = await Promise.all([
            wiseupService.getContent(),
            wiseupService.getAds(5, userInterests) // Pass user interests for targeted ads
          ]);

          // Interleave content and ads
          const combinedItems = wiseupService.interleaveContentAndAds(contentItems, adItems);

        if (combinedItems.length === 0) {
          console.warn('No items returned from API, using sample data');
          setAllItems(sampleItems);
        } else {
          setAllItems(combinedItems);
        }
      } catch (err) {
        console.error('Error fetching WiseUp content:', err);
        setError('Failed to load content. Please try again later.');
        setAllItems(sampleItems); // Use sample data as fallback

        toast({
          variant: 'destructive',
          title: 'Error Loading Content',
          description: 'There was a problem loading the content. Using sample data instead.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentUser, toast]);

  // Set current index based on itemId from URL if provided
  useEffect(() => {
    if (itemIdFromUrl && allItems.length > 0 && !isLoading) {
      const itemIndex = allItems.findIndex(item => item.id.toString() === itemIdFromUrl);
      if (itemIndex !== -1) {
        setCurrentIndex(itemIndex);

        // Clear any filters that might hide this item
        setSearchQuery('');
        setSelectedTags([]);
        setFilterType('all');
      }
    }
  }, [itemIdFromUrl, allItems, isLoading]);

  // Track ad impressions when currentItem changes to an ad
  useEffect(() => {
    if (currentItem && currentItem.type === 'ad' && !isLoading) {
      // Try to use the API service first, fall back to the Firebase service if it fails
      try {
        wiseupApiService.trackAdImpression(currentItem.id);
      } catch (error) {
        console.warn('API service failed for tracking impression, falling back to Firebase service:', error);
        wiseupService.trackAdImpression(
          currentItem.id,
          currentUser?.uid || null
        );
      }
    }
  }, [currentItem, currentUser, isLoading]);

  // Reset playback state when currentIndex changes
  useEffect(() => {
    if (!isLoading) {
      setIsPlaying(true);
      setProgress(0);
      setCurrentTime(0);
    }
  }, [currentIndex, isLoading]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if target is an input element
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault();
          handleNext();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          handlePrevious();
          break;
        case ' ': // Space
          event.preventDefault();
          togglePlay();
          break;
        case 'm':
        case 'M':
          event.preventDefault();
          toggleMute();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentIndex, filteredItems.length]);

  // Event handlers
  const handleNext = useCallback(() => {
    if (currentIndex < filteredItems.length - 1) {
      setCurrentIndex(prevIndex => prevIndex + 1);
    }
  }, [currentIndex, filteredItems.length]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prevIndex => prevIndex - 1);
    }
  }, [currentIndex]);

  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const handleTimeUpdate = useCallback((currentTime: number, duration: number) => {
    setCurrentTime(currentTime);
    if (duration > 0) {
      setProgress((currentTime / duration) * 100);
    }
  }, []);

  const handleLoadedMetadata = useCallback((duration: number) => {
    setDuration(duration);
    setProgress(0);
    setCurrentTime(0);
  }, []);

  const handleVideoEnded = useCallback(() => {
    // Auto-advance to next item when video ends
    if (currentIndex < filteredItems.length - 1) {
      handleNext();
    } else {
      // If it's the last item, pause and reset
      setIsPlaying(false);
      setProgress(100);
    }
  }, [currentIndex, handleNext, filteredItems.length]);

  // Search and filtering handlers
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentIndex(0); // Reset to first item when search changes
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setCurrentIndex(0);
  }, []);

  const handleTagToggle = useCallback((tag: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
    setCurrentIndex(0); // Reset to first item when tags change
  }, []);

  const handleClearTags = useCallback(() => {
    setSelectedTags([]);
    setCurrentIndex(0);
  }, []);

  const handleTypeFilter = useCallback((type: 'all' | 'content' | 'ad') => {
    setFilterType(type);
    setCurrentIndex(0); // Reset to first item when filter changes
  }, []);

  // User preferences handlers
  const toggleAutoplay = useCallback(() => {
    setUserPreferences(prev => ({
      ...prev,
      autoplay: !prev.autoplay
    }));
  }, []);

  const toggleMutePreference = useCallback(() => {
    setUserPreferences(prev => ({
      ...prev,
      muted: !prev.muted
    }));
    setIsMuted(prev => !prev);
  }, []);

  const toggleShowRelated = useCallback(() => {
    setUserPreferences(prev => ({
      ...prev,
      showRelated: !prev.showRelated
    }));
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Helmet>
        <title>Wise-Up | Learning & Resources | WorkWise SA</title>
        <meta name="description" content="Browse educational videos, tutorials, and resources to improve your skills and find better job opportunities with WorkWise SA." />
      </Helmet>

      <WiseUpHeader />

      <main className="flex-1 container mx-auto px-4 py-6">
        {/* Page Header with Title and Search */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <h1 className="text-3xl font-bold flex items-center">
              <Sparkles className="text-primary h-6 w-6 mr-2" />
              Wise-Up
              <span className="text-primary ml-2 text-lg font-normal">Learning Hub</span>
            </h1>

            {/* Search Bar */}
            <div className="relative w-full md:w-96">
              <Input
                type="text"
                placeholder="Search videos, topics, creators..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-10 pr-10 py-2 w-full"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Filters and Tags */}
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            {/* Content Type Filter */}
            <div className="flex space-x-2">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleTypeFilter('all')}
              >
                All
              </Button>
              <Button
                variant={filterType === 'content' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleTypeFilter('content')}
              >
                Content
              </Button>
              <Button
                variant={filterType === 'ad' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleTypeFilter('ad')}
                className="bg-yellow-500 hover:bg-yellow-600 text-white"
              >
                Sponsored
              </Button>
            </div>

            {/* User Preferences */}
            <div className="flex space-x-2 ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleAutoplay}
                className={userPreferences.autoplay ? 'bg-primary/10' : ''}
              >
                {userPreferences.autoplay ? 'Autoplay: On' : 'Autoplay: Off'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleMutePreference}
                className={userPreferences.muted ? 'bg-primary/10' : ''}
              >
                {userPreferences.muted ? 'Muted: On' : 'Muted: Off'}
              </Button>
            </div>
          </div>

          {/* Tags */}
          {availableTags.length > 0 && (
            <div className="mt-4">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm font-medium text-gray-500 flex items-center">
                  <Filter className="h-4 w-4 mr-1" /> Tags:
                </span>

                {availableTags.map(tag => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => handleTagToggle(tag)}
                  >
                    {tag}
                  </Badge>
                ))}

                {selectedTags.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearTags}
                    className="text-xs h-7 px-2"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        <Separator className="mb-6" />

        {isLoading ? (
          <div className="space-y-6">
            {/* Skeleton loading state */}
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-2/5">
                <Skeleton className="h-[60vh] w-full rounded-lg" />
              </div>
              <div className="w-full md:w-3/5">
                <Skeleton className="h-[60vh] w-full rounded-lg" />
              </div>
            </div>
          </div>
        ) : error && filteredItems.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Content</h2>
            <p className="text-gray-600">{error}</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No Results Found</h2>
            <p className="text-gray-600">
              {searchQuery ?
                `No items match your search "${searchQuery}"` :
                'No items match your current filters'
              }
            </p>
            <div className="mt-4">
              <Button onClick={() => {
                handleClearSearch();
                handleClearTags();
                handleTypeFilter('all');
              }}>
                Clear All Filters
              </Button>
            </div>
          </div>
        ) : (
          <WiseUpLayout
            currentItem={currentItem}
            isPlaying={isPlaying}
            isMuted={isMuted}
            progress={progress}
            currentTime={currentTime}
            duration={duration}
            onTogglePlay={togglePlay}
            onToggleMute={toggleMute}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleVideoEnded}
            onNext={handleNext}
            onPrevious={handlePrevious}
            isNextDisabled={isNextDisabled}
            isPreviousDisabled={isPreviousDisabled}
          />
        )}
      </main>
    </div>
  );
};

export default WiseUpPage;

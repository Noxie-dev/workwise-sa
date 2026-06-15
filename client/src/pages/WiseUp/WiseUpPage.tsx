import React, { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, Search, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { wiseupApiService } from '@/services/wiseupApiService';
import WiseUpLayout from './WiseUpLayout';
import { WiseUpItem } from './types';
import { VideoPlayerHandle } from './components/VideoPlayer';

const categories = [
  { id: 'all', label: 'All' },
  { id: 'career', label: 'Career' },
  { id: 'interviews', label: 'Interviews' },
  { id: 'cv', label: 'CV' },
  { id: 'sponsored', label: 'Sponsored' },
];

function createSessionId() {
  if ('crypto' in window && 'randomUUID' in window.crypto) {
    return window.crypto.randomUUID();
  }

  return `wiseup-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isTypingTarget(target: EventTarget | null) {
  const element = target as HTMLElement | null;
  if (!element) return false;

  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName) || element.isContentEditable;
}

async function copyTextToClipboard(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return true;
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  document.body.removeChild(textarea);
  return copied;
}

function saveWiseUpItemLocally(item: WiseUpItem) {
  const storageKey = 'wiseupLocalBookmarks';
  const itemKey = `${item.type}:${item.id}`;
  const existingBookmarks = JSON.parse(localStorage.getItem(storageKey) || '[]') as Array<{
    key: string;
    title: string;
    type: WiseUpItem['type'];
    savedAt: string;
  }>;
  const nextBookmarks = [
    { key: itemKey, title: item.title, type: item.type, savedAt: new Date().toISOString() },
    ...existingBookmarks.filter(bookmark => bookmark.key !== itemKey),
  ].slice(0, 100);

  localStorage.setItem(storageKey, JSON.stringify(nextBookmarks));
}

export default function WiseUpPage() {
  const playerRef = useRef<VideoPlayerHandle>(null);
  const sessionIdRef = useRef(createSessionId());
  const lastProgressEventRef = useRef({ itemKey: '', progress: 0, time: 0 });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [captionsVisible, setCaptionsVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const deferredSearch = useDeferredValue(searchTerm);
  const { toast } = useToast();

  const feedQuery = useQuery({
    queryKey: ['wiseup-feed', activeCategory, deferredSearch],
    queryFn: () =>
      wiseupApiService.getFeed({
        limit: 24,
        category: activeCategory === 'all' ? undefined : activeCategory,
        q: deferredSearch.trim() || undefined,
      }),
    staleTime: 1000 * 60,
  });

  const items = feedQuery.data?.items ?? [];
  const currentItem = items[currentIndex] ?? null;
  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  const feedStats = useMemo(() => {
    const lessons = items.filter(item => item.type === 'content').length;
    const sponsors = items.length - lessons;
    return { lessons, sponsors };
  }, [items]);

  const trackCurrentItemEvent = useCallback(
    (
      eventType:
        | 'view'
        | 'play'
        | 'pause'
        | 'seek'
        | 'progress'
        | 'complete'
        | 'error'
        | 'share'
        | 'cta_click',
      item: WiseUpItem | null = currentItem,
      metadata?: Record<string, unknown>
    ) => {
      if (!item) return;

      wiseupApiService.trackEvent({
        itemId: String(item.id),
        itemType: item.type,
        eventType,
        sessionId: sessionIdRef.current,
        progress,
        currentTimeSec: currentTime,
        durationSec: duration || item.media.durationSec,
        metadata,
      });
    },
    [currentItem, currentTime, duration, progress]
  );

  const resetPlaybackPosition = useCallback(() => {
    setCurrentTime(0);
    setDuration(0);
    lastProgressEventRef.current = { itemKey: '', progress: 0, time: 0 };
  }, []);

  const selectIndex = useCallback(
    (index: number) => {
      if (index < 0 || index >= items.length) return;
      setCurrentIndex(index);
      setIsPlaying(true);
      resetPlaybackPosition();
    },
    [items.length, resetPlaybackPosition]
  );

  const goNext = useCallback(() => {
    if (currentIndex < items.length - 1) {
      selectIndex(currentIndex + 1);
      return;
    }

    setIsPlaying(false);
    toast({
      title: 'End of WiseUp queue',
      description: 'You have reached the end of the current feed.',
    });
  }, [currentIndex, items.length, selectIndex, toast]);

  const goPrevious = useCallback(() => {
    if (currentIndex > 0) {
      selectIndex(currentIndex - 1);
    }
  }, [currentIndex, selectIndex]);

  const handlePlaybackStateChange = useCallback((nextPlaying: boolean) => {
    setIsPlaying(nextPlaying);
  }, []);

  const handleTogglePlay = useCallback(() => {
    const nextPlaying = !isPlaying;
    setIsPlaying(nextPlaying);
    trackCurrentItemEvent(nextPlaying ? 'play' : 'pause');
  }, [isPlaying, trackCurrentItemEvent]);

  const handleTimeUpdate = useCallback(
    (time: number, mediaDuration: number) => {
      setCurrentTime(time);
      setDuration(mediaDuration);

      if (!currentItem || mediaDuration <= 0) return;

      const itemKey = `${currentItem.type}:${currentItem.id}`;
      const nextProgress = Math.min(100, (time / mediaDuration) * 100);
      const lastEvent = lastProgressEventRef.current;
      const shouldCommit =
        lastEvent.itemKey !== itemKey ||
        nextProgress - lastEvent.progress >= 10 ||
        time - lastEvent.time >= 20;

      if (!shouldCommit) return;

      lastProgressEventRef.current = {
        itemKey,
        progress: nextProgress,
        time,
      };
      wiseupApiService.trackEvent({
        itemId: String(currentItem.id),
        itemType: currentItem.type,
        eventType: 'progress',
        sessionId: sessionIdRef.current,
        progress: nextProgress,
        currentTimeSec: time,
        durationSec: mediaDuration,
      });
    },
    [currentItem]
  );

  const handleEnded = useCallback(() => {
    trackCurrentItemEvent('complete', currentItem, {
      autoAdvance: currentIndex < items.length - 1,
    });
    goNext();
  }, [currentIndex, currentItem, goNext, items.length, trackCurrentItemEvent]);

  const handleSeek = useCallback(
    (seconds: number) => {
      playerRef.current?.seekTo(seconds);
      setCurrentTime(seconds);
      trackCurrentItemEvent('seek', currentItem, { targetTimeSec: seconds });
    },
    [currentItem, trackCurrentItemEvent]
  );

  const handleToggleMute = useCallback(() => {
    setIsMuted(previousMuted => {
      const nextMuted = !previousMuted;

      if (!previousMuted && volume === 0) {
        setVolume(0.8);
      }

      toast({
        title: nextMuted ? 'Volume muted' : 'Volume on',
        description: nextMuted ? 'WiseUp audio is muted.' : 'WiseUp audio has been restored.',
      });

      return nextMuted;
    });
  }, [toast, volume]);

  const handleVolumeChange = useCallback((nextVolume: number) => {
    const normalizedVolume = Math.max(0, Math.min(1, nextVolume));
    setVolume(normalizedVolume);
    setIsMuted(normalizedVolume === 0);
  }, []);

  const handleVolumeCommit = useCallback(() => {
    toast({
      title: volume === 0 || isMuted ? 'Volume muted' : 'Volume updated',
      description:
        volume === 0 || isMuted
          ? 'WiseUp audio is muted.'
          : `WiseUp volume set to ${Math.round(volume * 100)}%.`,
    });
  }, [isMuted, toast, volume]);

  const handleToggleFullscreen = useCallback(async () => {
    const result = await playerRef.current?.requestFullscreen();

    if (result === 'entered') {
      toast({
        title: 'Fullscreen on',
        description: 'WiseUp player is now fullscreen.',
      });
      return;
    }

    if (result === 'exited') {
      toast({
        title: 'Fullscreen off',
        description: 'WiseUp player returned to the page.',
      });
      return;
    }

    toast({
      title: 'Fullscreen unavailable',
      description: 'This browser did not allow fullscreen for the player.',
      variant: 'destructive',
    });
  }, [toast]);

  const handleRequestPictureInPicture = useCallback(async () => {
    const didToggle = await playerRef.current?.requestPictureInPicture();

    toast({
      title: didToggle ? 'Picture-in-picture updated' : 'Picture-in-picture unavailable',
      description: didToggle
        ? 'WiseUp player changed picture-in-picture mode.'
        : 'This browser did not allow picture-in-picture.',
      variant: didToggle ? undefined : 'destructive',
    });
  }, [toast]);

  const handleBookmark = useCallback(async () => {
    if (!currentItem) return;

    try {
      await wiseupApiService.addBookmark(String(currentItem.id), currentItem.type);
      toast({
        title: 'Saved',
        description: `"${currentItem.title}" has been added to your bookmarks.`,
      });
    } catch {
      saveWiseUpItemLocally(currentItem);
      toast({
        title: 'Saved on this device',
        description: `"${currentItem.title}" was saved locally. Sign in to sync bookmarks.`,
      });
    }
  }, [currentItem, toast]);

  const handleShare = useCallback(async () => {
    if (!currentItem) return;

    const shareUrl = `${window.location.origin}/wise-up?item=${currentItem.type}:${currentItem.id}`;
    trackCurrentItemEvent('share', currentItem);

    try {
      if (navigator.share) {
        await navigator.share({
          title: currentItem.title,
          text: currentItem.description,
          url: shareUrl,
        });
        toast({
          title: 'Shared',
          description: `"${currentItem.title}" is ready to share.`,
        });
        return;
      }

      const copied = await copyTextToClipboard(shareUrl);
      if (!copied) throw new Error('Clipboard copy failed');

      toast({
        title: 'Link copied',
        description: `"${currentItem.title}" share link copied to clipboard.`,
      });
    } catch {
      toast({
        title: 'Share unavailable',
        description: 'The share action could not be completed.',
        variant: 'destructive',
      });
    }
  }, [currentItem, toast, trackCurrentItemEvent]);

  const handleCtaClick = useCallback(
    (url: string) => {
      trackCurrentItemEvent('cta_click', currentItem, { url });
    },
    [currentItem, trackCurrentItemEvent]
  );

  const handlePlayerError = useCallback(
    (message: string | null) => {
      if (message) {
        trackCurrentItemEvent('error', currentItem, { message });
      }
    },
    [currentItem, trackCurrentItemEvent]
  );

  useEffect(() => {
    if (!items.length && currentIndex !== 0) {
      setCurrentIndex(0);
      return;
    }

    if (currentIndex >= items.length) {
      setCurrentIndex(Math.max(0, items.length - 1));
    }
  }, [currentIndex, items.length]);

  useEffect(() => {
    if (!currentItem) return;

    resetPlaybackPosition();
    trackCurrentItemEvent('view', currentItem);

    if (currentItem.type === 'ad') {
      wiseupApiService.trackAdImpression(currentItem.id);
    }
  }, [currentItem?.id, currentItem?.type]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;

      if (event.key === ' ') {
        event.preventDefault();
        handleTogglePlay();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        playerRef.current?.skipBy(10);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        playerRef.current?.skipBy(-10);
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        goNext();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        goPrevious();
      } else if (event.key.toLowerCase() === 'm') {
        handleToggleMute();
      } else if (event.key.toLowerCase() === 'f') {
        handleToggleFullscreen();
      } else if (event.key.toLowerCase() === 'p') {
        handleRequestPictureInPicture();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    goNext,
    goPrevious,
    handleRequestPictureInPicture,
    handleToggleFullscreen,
    handleToggleMute,
    handleTogglePlay,
  ]);

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#24456f]">
                <Sparkles className="h-4 w-4" />
                WiseUp
              </div>
              <h1 className="text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">
                Career learning feed
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Watch practical career lessons, save useful clips, and move through a guided queue
                without losing your place.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 text-center">
              <div className="rounded-md bg-white px-4 py-3">
                <p className="text-lg font-bold text-slate-950">{items.length}</p>
                <p className="text-xs font-semibold text-slate-500">Items</p>
              </div>
              <div className="rounded-md bg-white px-4 py-3">
                <p className="text-lg font-bold text-slate-950">{feedStats.lessons}</p>
                <p className="text-xs font-semibold text-slate-500">Lessons</p>
              </div>
              <div className="rounded-md bg-white px-4 py-3">
                <p className="text-lg font-bold text-slate-950">{feedStats.sponsors}</p>
                <p className="text-xs font-semibold text-slate-500">Sponsors</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative max-w-xl flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchTerm}
                onChange={event => setSearchTerm(event.target.value)}
                placeholder="Search lessons, topics, or tags"
                className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-[#24456f] focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {categories.map(category => {
                const isActive = activeCategory === category.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${
                      isActive
                        ? 'bg-[#24456f] text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                    onClick={() => {
                      setActiveCategory(category.id);
                      setCurrentIndex(0);
                    }}
                  >
                    {category.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {feedQuery.isLoading && (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
            <div className="aspect-video animate-pulse rounded-lg bg-slate-200" />
            <div className="h-[520px] animate-pulse rounded-lg bg-slate-200" />
          </div>
        )}

        {feedQuery.isError && (
          <div className="rounded-lg border border-red-100 bg-red-50 p-6 text-center">
            <p className="text-sm font-semibold text-red-700">WiseUp could not load right now.</p>
            <button
              type="button"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white"
              onClick={() => feedQuery.refetch()}
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        )}

        {!feedQuery.isLoading && !feedQuery.isError && !items.length && (
          <div className="rounded-lg border border-dashed border-slate-200 bg-white p-10 text-center">
            <p className="text-lg font-bold text-slate-950">No WiseUp items found</p>
            <p className="mt-2 text-sm text-slate-500">Try a different search or category.</p>
          </div>
        )}

        {!feedQuery.isLoading && !feedQuery.isError && items.length > 0 && (
          <WiseUpLayout
            items={items}
            currentIndex={currentIndex}
            currentItem={currentItem}
            playerRef={playerRef}
            isPlaying={isPlaying}
            isMuted={isMuted}
            volume={volume}
            progress={progress}
            currentTime={currentTime}
            duration={duration}
            playbackRate={playbackRate}
            captionsVisible={captionsVisible}
            onPlaybackStateChange={handlePlaybackStateChange}
            onTogglePlay={handleTogglePlay}
            onToggleMute={handleToggleMute}
            onVolumeChange={handleVolumeChange}
            onVolumeCommit={handleVolumeCommit}
            onToggleFullscreen={handleToggleFullscreen}
            onRequestPictureInPicture={handleRequestPictureInPicture}
            onSetPlaybackRate={setPlaybackRate}
            onToggleCaptions={() => setCaptionsVisible(value => !value)}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={setDuration}
            onEnded={handleEnded}
            onError={handlePlayerError}
            onNext={goNext}
            onPrevious={goPrevious}
            onSelectIndex={selectIndex}
            onSeek={handleSeek}
            onBookmark={handleBookmark}
            onShare={handleShare}
            onCtaClick={handleCtaClick}
          />
        )}
      </section>
    </main>
  );
}

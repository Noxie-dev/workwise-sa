import React, { RefObject } from 'react';
import { CheckCircle2, Clock3, ListVideo, Megaphone, PlayCircle } from 'lucide-react';
import { WiseUpItem } from './types';
import LeftPanel from './components/LeftPanel';
import MediaPanel from './components/MediaPanel';
import { VideoPlayerHandle } from './components/VideoPlayer';

interface WiseUpLayoutProps {
  items: WiseUpItem[];
  currentIndex: number;
  currentItem: WiseUpItem | null;
  playerRef: RefObject<VideoPlayerHandle | null>;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  progress: number;
  currentTime: number;
  duration: number;
  playbackRate: number;
  captionsVisible: boolean;
  onPlaybackStateChange: (isPlaying: boolean) => void;
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onVolumeChange: (volume: number) => void;
  onVolumeCommit: () => void;
  onToggleFullscreen: () => void;
  onRequestPictureInPicture: () => void;
  onSetPlaybackRate: (rate: number) => void;
  onToggleCaptions: () => void;
  onTimeUpdate: (currentTime: number, duration: number) => void;
  onLoadedMetadata: (duration: number) => void;
  onEnded: () => void;
  onError: (message: string | null) => void;
  onNext: () => void;
  onPrevious: () => void;
  onSelectIndex: (index: number) => void;
  onSeek: (seconds: number) => void;
  onBookmark: () => void;
  onShare: () => void;
  onCtaClick?: (url: string) => void;
}

function itemDuration(item: WiseUpItem) {
  const seconds = item.media?.durationSec || 0;
  if (!seconds) return 'Short watch';
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.max(1, Math.round(seconds / 60));
  return `${minutes} min`;
}

const WiseUpLayout: React.FC<WiseUpLayoutProps> = ({
  items,
  currentIndex,
  currentItem,
  playerRef,
  isPlaying,
  isMuted,
  volume,
  progress,
  currentTime,
  duration,
  playbackRate,
  captionsVisible,
  onPlaybackStateChange,
  onTogglePlay,
  onToggleMute,
  onVolumeChange,
  onVolumeCommit,
  onToggleFullscreen,
  onRequestPictureInPicture,
  onSetPlaybackRate,
  onToggleCaptions,
  onTimeUpdate,
  onLoadedMetadata,
  onEnded,
  onError,
  onNext,
  onPrevious,
  onSelectIndex,
  onSeek,
  onBookmark,
  onShare,
  onCtaClick,
}) => {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
      <div className="min-w-0 space-y-5">
        <MediaPanel
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
          onPlaybackStateChange={onPlaybackStateChange}
          onTogglePlay={onTogglePlay}
          onToggleMute={onToggleMute}
          onVolumeChange={onVolumeChange}
          onVolumeCommit={onVolumeCommit}
          onToggleFullscreen={onToggleFullscreen}
          onRequestPictureInPicture={onRequestPictureInPicture}
          onSetPlaybackRate={onSetPlaybackRate}
          onToggleCaptions={onToggleCaptions}
          onTimeUpdate={onTimeUpdate}
          onLoadedMetadata={onLoadedMetadata}
          onEnded={onEnded}
          onError={onError}
          onNext={onNext}
          onPrevious={onPrevious}
          isNextDisabled={currentIndex >= items.length - 1}
          isPreviousDisabled={currentIndex <= 0}
        />

        <LeftPanel
          currentItem={currentItem}
          onSeek={onSeek}
          onBookmark={onBookmark}
          onShare={onShare}
          onCtaClick={onCtaClick}
        />
      </div>

      <aside className="rounded-lg border border-slate-200 bg-white shadow-sm xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)] xl:overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
          <div className="flex items-center gap-2">
            <ListVideo className="h-5 w-5 text-[#24456f]" />
            <h2 className="text-base font-bold text-slate-950">WiseUp Queue</h2>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
            {items.length}
          </span>
        </div>

        <div className="max-h-[620px] space-y-2 overflow-y-auto p-3">
          {items.map((item, index) => {
            const isActive = index === currentIndex;
            const Icon = item.type === 'ad' ? Megaphone : PlayCircle;
            return (
              <button
                key={`${item.type}-${item.id}-${index}`}
                type="button"
                className={`grid w-full grid-cols-[72px_minmax(0,1fr)] gap-3 rounded-lg border p-2 text-left transition ${
                  isActive
                    ? 'border-[#24456f] bg-blue-50'
                    : 'border-slate-100 bg-white hover:border-blue-200 hover:bg-slate-50'
                }`}
                onClick={() => onSelectIndex(index)}
              >
                <div className="relative aspect-video overflow-hidden rounded-md bg-slate-900">
                  {item.media?.thumbnail || item.media?.poster ? (
                    <img
                      src={item.media.thumbnail || item.media.poster}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-slate-950/25" />
                  <Icon className="absolute bottom-1.5 left-1.5 h-4 w-4 text-white" />
                </div>

                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        item.type === 'ad'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-[#24456f]'
                      }`}
                    >
                      {item.type === 'ad' ? 'Sponsor' : item.category}
                    </span>
                    {item.completed && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                  </div>
                  <p className="line-clamp-2 text-sm font-bold leading-5 text-slate-950">
                    {item.title}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                    <Clock3 className="h-3.5 w-3.5" />
                    {itemDuration(item)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </aside>
    </div>
  );
};

export default WiseUpLayout;

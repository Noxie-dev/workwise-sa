import React, { RefObject, useMemo, useRef } from 'react';
import {
  Captions,
  ChevronDown,
  ChevronUp,
  Gauge,
  Maximize2,
  Pause,
  PictureInPicture2,
  Play,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { WiseUpItem } from '../types';
import VideoPlayer, { VideoPlayerHandle } from './VideoPlayer';

interface MediaPanelProps {
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
  isNextDisabled: boolean;
  isPreviousDisabled: boolean;
}

function formatTime(timeInSeconds: number): string {
  if (Number.isNaN(timeInSeconds) || !Number.isFinite(timeInSeconds)) {
    return '00:00';
  }

  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

const MediaPanel: React.FC<MediaPanelProps> = ({
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
  isNextDisabled,
  isPreviousDisabled,
}) => {
  const fullscreenTargetRef = useRef<HTMLElement | null>(null);
  const chapters = currentItem?.media?.chapters ?? [];
  const activeChapter = useMemo(() => {
    if (!chapters.length) return null;
    return chapters.reduce((active, chapter) =>
      chapter.startSec <= currentTime && chapter.startSec >= active.startSec ? chapter : active
    );
  }, [chapters, currentTime]);

  const seekTo = (time: number) => {
    playerRef.current?.seekTo(time);
    onTimeUpdate(time, duration);
  };

  return (
    <section
      ref={fullscreenTargetRef}
      className="overflow-hidden rounded-lg border border-slate-200 bg-slate-950 shadow-sm"
    >
      <div className="relative aspect-video min-h-[240px] bg-slate-950">
        {!currentItem ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-200">
            Loading WiseUp...
          </div>
        ) : (
          <>
            <VideoPlayer
              ref={playerRef}
              item={currentItem}
              fullscreenTargetRef={fullscreenTargetRef}
              isPlaying={isPlaying}
              isMuted={isMuted}
              volume={volume}
              playbackRate={playbackRate}
              captionsVisible={captionsVisible}
              onPlaybackStateChange={onPlaybackStateChange}
              onTimeUpdate={onTimeUpdate}
              onLoadedMetadata={onLoadedMetadata}
              onEnded={onEnded}
              onError={onError}
            />

            {!isPlaying && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <button
                  type="button"
                  className="pointer-events-auto rounded-full bg-[#ffc82d] p-5 text-slate-950 shadow-xl transition hover:bg-[#f5b800]"
                  onClick={onTogglePlay}
                  aria-label="Play WiseUp video"
                >
                  <Play className="h-9 w-9 fill-current" />
                </button>
              </div>
            )}

            <div className="absolute right-4 top-1/2 flex -translate-y-1/2 flex-col gap-3">
              <button
                type="button"
                className="rounded-full bg-slate-950/70 p-3 text-white backdrop-blur transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-35"
                onClick={onPrevious}
                disabled={isPreviousDisabled}
                aria-label="Previous WiseUp item"
              >
                <ChevronUp className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="rounded-full bg-slate-950/70 p-3 text-white backdrop-blur transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-35"
                onClick={onNext}
                disabled={isNextDisabled}
                aria-label="Next WiseUp item"
              >
                <ChevronDown className="h-5 w-5" />
              </button>
            </div>
          </>
        )}
      </div>

      <div className="space-y-4 bg-slate-950 p-4 text-white">
        <div className="space-y-2">
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={Math.min(currentTime, duration || currentTime)}
            onChange={event => seekTo(Number(event.target.value))}
            className="h-2 w-full cursor-pointer accent-[#ffc82d]"
            aria-label="Video timeline"
          />
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>{formatTime(currentTime)}</span>
            <span>{Math.round(progress)}%</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-full bg-[#ffc82d] p-3 text-slate-950 transition hover:bg-[#f5b800]"
              onClick={onTogglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 fill-current" />
              )}
            </button>
            <button
              type="button"
              className="rounded-full bg-white/10 p-3 transition hover:bg-white/20"
              onClick={() => playerRef.current?.skipBy(-10)}
              aria-label="Skip back 10 seconds"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="rounded-full bg-white/10 p-3 transition hover:bg-white/20"
              onClick={() => playerRef.current?.skipBy(10)}
              aria-label="Skip forward 10 seconds"
            >
              <RotateCw className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="rounded-full bg-white/10 p-3 transition hover:bg-white/20"
              onClick={onToggleMute}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={event => onVolumeChange(Number(event.target.value))}
              onPointerUp={onVolumeCommit}
              onBlur={onVolumeCommit}
              onKeyUp={event => {
                if (
                  ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(
                    event.key
                  )
                ) {
                  onVolumeCommit();
                }
              }}
              className="h-2 w-24 cursor-pointer accent-[#ffc82d] sm:w-28"
              aria-label="Volume"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm">
              <Gauge className="h-4 w-4 text-[#ffc82d]" />
              <select
                className="bg-transparent text-sm font-semibold outline-none"
                value={playbackRate}
                onChange={event => onSetPlaybackRate(Number(event.target.value))}
                aria-label="Playback speed"
              >
                {[0.75, 1, 1.25, 1.5, 2].map(rate => (
                  <option key={rate} value={rate} className="text-slate-950">
                    {rate}x
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className={`rounded-full p-3 transition ${
                captionsVisible ? 'bg-[#ffc82d] text-slate-950' : 'bg-white/10 hover:bg-white/20'
              }`}
              onClick={onToggleCaptions}
              aria-label={captionsVisible ? 'Hide captions' : 'Show captions'}
            >
              <Captions className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="rounded-full bg-white/10 p-3 transition hover:bg-white/20"
              onClick={onRequestPictureInPicture}
              aria-label="Picture in picture"
            >
              <PictureInPicture2 className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="rounded-full bg-white/10 p-3 transition hover:bg-white/20"
              onClick={onToggleFullscreen}
              aria-label="Fullscreen"
            >
              <Maximize2 className="h-5 w-5" />
            </button>
          </div>
        </div>

        {chapters.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {chapters.map(chapter => {
              const isActive = activeChapter?.title === chapter.title;
              return (
                <button
                  key={`${chapter.title}-${chapter.startSec}`}
                  type="button"
                  className={`shrink-0 rounded-full border px-3 py-2 text-left text-xs font-semibold transition ${
                    isActive
                      ? 'border-[#ffc82d] bg-[#ffc82d] text-slate-950'
                      : 'border-white/15 bg-white/5 text-slate-100 hover:bg-white/10'
                  }`}
                  onClick={() => seekTo(chapter.startSec)}
                >
                  <span className="mr-2 text-slate-400">{formatTime(chapter.startSec)}</span>
                  {chapter.title}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default MediaPanel;

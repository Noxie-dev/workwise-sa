import React, { useState } from 'react';
import { WiseUpItem } from '../types';
import VideoPlayer from './VideoPlayer';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

interface MediaPanelProps {
  currentItem: WiseUpItem | null;
  isPlaying: boolean;
  isMuted: boolean;
  progress: number; // 0-100
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onTimeUpdate: (currentTime: number, duration: number) => void;
  onLoadedMetadata: (duration: number) => void;
  onEnded: () => void;
  onNext: () => void;
  onPrevious: () => void;
  isNextDisabled: boolean;
  isPreviousDisabled: boolean;
}

/**
 * MediaPanel component serves as a container for the right panel,
 * holding the VideoPlayer and playback controls.
 */
const MediaPanel: React.FC<MediaPanelProps> = ({
  currentItem,
  isPlaying,
  isMuted,
  progress,
  currentTime,
  duration,
  onTogglePlay,
  onToggleMute,
  onTimeUpdate,
  onLoadedMetadata,
  onEnded,
  onNext,
  onPrevious,
  isNextDisabled,
  isPreviousDisabled
}) => {
  const [videoError, setVideoError] = useState<MediaError | null>(null);

  // Format time in MM:SS format
  const formatTime = (timeInSeconds: number): string => {
    if (isNaN(timeInSeconds) || !isFinite(timeInSeconds)) {
      return '00:00';
    }

    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle video errors
  const handleVideoError = (error: MediaError | null) => {
    setVideoError(error);
  };

  // Reset error state when metadata is loaded
  const handleMetadataLoaded = (duration: number) => {
    setVideoError(null);
    onLoadedMetadata(duration);
  };

  return (
    <div className="w-full md:w-3/5 relative bg-black rounded-lg overflow-hidden h-[80vh] max-h-[800px] shadow-xl">
      {!currentItem ? (
        <div className="flex items-center justify-center h-full text-white">
          <p>Loading content...</p>
        </div>
      ) : (
        <>
          {/* Video Player */}
          <VideoPlayer
            key={currentItem.id}
            src={currentItem.video}
            isPlaying={isPlaying}
            isMuted={isMuted}
            onTogglePlay={onTogglePlay}
            onToggleMute={onToggleMute}
            onTimeUpdate={onTimeUpdate}
            onLoadedMetadata={handleMetadataLoaded}
            onEnded={onEnded}
            onError={handleVideoError}
          />

          {/* Play/Pause overlay button (center of video) - Only show when paused */}
          {!isPlaying && !videoError && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <button
                className="bg-yellow-500 hover:bg-yellow-400 backdrop-blur-sm rounded-full p-6 pointer-events-auto transition-all duration-200 shadow-lg"
                onClick={onTogglePlay}
                aria-label="Play"
              >
                <Play className="h-10 w-10 text-white" />
              </button>
            </div>
          )}

          {/* Controls Overlay - Only show if no video error */}
          {!videoError && (
            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
              {/* Progress Bar */}
              <div
                className="w-full h-2 bg-gray-700 rounded-full mb-4 cursor-pointer"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Video progress"
              >
                <div
                  className="h-full bg-yellow-500 rounded-full"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>

              {/* Controls and Time */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Play/Pause Button */}
                  <button
                    className="bg-yellow-500 hover:bg-yellow-400 text-white p-3 rounded-full transition-colors duration-200"
                    onClick={onTogglePlay}
                    aria-label={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5" />
                    )}
                  </button>

                  {/* Mute/Unmute Button */}
                  <button
                    className="bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-colors duration-200"
                    onClick={onToggleMute}
                    aria-label={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? (
                      <VolumeX className="h-5 w-5" />
                    ) : (
                      <Volume2 className="h-5 w-5" />
                    )}
                  </button>
                </div>

                {/* Time Display */}
                <div className="text-white text-sm font-medium bg-black/30 px-3 py-1 rounded-full">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls - Vertical on right side */}
          <div className="absolute top-1/2 right-6 transform -translate-y-1/2 flex flex-col gap-4">
            {/* Previous Button */}
            <button
              className={`bg-black/40 hover:bg-black/60 text-white p-3 rounded-full shadow-lg transition-all duration-200 ${
                isPreviousDisabled ? 'opacity-40 cursor-not-allowed' : ''
              }`}
              onClick={onPrevious}
              disabled={isPreviousDisabled}
              aria-label="Previous content"
            >
              <ChevronUp className="h-6 w-6" />
            </button>

            {/* Next Button */}
            <button
              className={`bg-black/40 hover:bg-black/60 text-white p-3 rounded-full shadow-lg transition-all duration-200 ${
                isNextDisabled ? 'opacity-40 cursor-not-allowed' : ''
              }`}
              onClick={onNext}
              disabled={isNextDisabled}
              aria-label="Next content"
            >
              <ChevronDown className="h-6 w-6" />
            </button>
          </div>

          {/* Swipe Indicator - Only show if there's next content */}
          {!isNextDisabled && (
            <div className="absolute bottom-24 right-6 text-white/80 text-xs flex items-center bg-black/30 px-3 py-1 rounded-full">
              <span className="mr-1">Swipe for next</span>
              <ChevronDown className="h-4 w-4" />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MediaPanel;

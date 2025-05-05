import React from 'react';
import { WiseUpItem } from './types';
import LeftPanel from './components/LeftPanel';
import MediaPanel from './components/MediaPanel';

interface WiseUpLayoutProps {
  // Props for both panels
  currentItem: WiseUpItem | null;
  
  // Props specific to MediaPanel
  isPlaying: boolean;
  isMuted: boolean;
  progress: number;
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
 * WiseUpLayout component defines the main two-panel structure for the WiseUp page.
 * It consists of a left panel for content details and a right panel for media playback.
 */
const WiseUpLayout: React.FC<WiseUpLayoutProps> = ({
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
  return (
    <div className="flex flex-col md:flex-row flex-1 overflow-hidden h-full">
      {/* Left Panel - Content details */}
      <div className="w-full md:w-2/5 md:pr-4">
        <LeftPanel currentItem={currentItem} />
      </div>
      
      {/* Right Panel - Media player */}
      <div className="w-full md:w-3/5 mt-4 md:mt-0">
        <MediaPanel
          currentItem={currentItem}
          isPlaying={isPlaying}
          isMuted={isMuted}
          progress={progress}
          currentTime={currentTime}
          duration={duration}
          onTogglePlay={onTogglePlay}
          onToggleMute={onToggleMute}
          onTimeUpdate={onTimeUpdate}
          onLoadedMetadata={onLoadedMetadata}
          onEnded={onEnded}
          onNext={onNext}
          onPrevious={onPrevious}
          isNextDisabled={isNextDisabled}
          isPreviousDisabled={isPreviousDisabled}
        />
      </div>
    </div>
  );
};

export default WiseUpLayout;

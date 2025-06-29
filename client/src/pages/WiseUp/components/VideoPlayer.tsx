import React, { useRef, useState, useEffect } from 'react';

interface VideoPlayerProps {
  src: string;
  isPlaying: boolean;
  isMuted: boolean;
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onTimeUpdate: (currentTime: number, duration: number) => void;
  onLoadedMetadata: (duration: number) => void;
  onEnded: () => void;
  onError: (error: MediaError | null) => void;
}

/**
 * VideoPlayer component for rendering and controlling HTML5 video playback
 * Handles video events and state management
 */
const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  isPlaying,
  isMuted,
  onTogglePlay,
  onToggleMute,
  onTimeUpdate,
  onLoadedMetadata,
  onEnded,
  onError,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  // Effect to control play/pause based on isPlaying prop
  useEffect(() => {
    if (!videoRef.current || !src) return;

    if (isPlaying) {
      const playPromise = videoRef.current.play();
      
      // Handle play promise rejection (e.g., autoplay policy)
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Video play failed:', err);
          // Sync parent state with actual video state
          onTogglePlay();
          // Set error if it's not a user interaction issue
          if (err.name !== 'NotAllowedError') {
            setError(`Playback error: ${err.message}`);
            onError(videoRef.current?.error || null);
          }
        });
      }
    } else {
      videoRef.current.pause();
    }
  }, [isPlaying, src, onTogglePlay, onError]);

  // Effect to control muted state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Effect to reset video when src changes
  useEffect(() => {
    if (!videoRef.current || !src) return;
    
    // Reset video state
    videoRef.current.currentTime = 0;
    setError(null);
    
    // Attempt autoplay if isPlaying is true
    if (isPlaying) {
      const playPromise = videoRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Autoplay failed after source change:', err);
          // Sync parent state with actual video state
          onTogglePlay();
        });
      }
    }
  }, [src, isPlaying, onTogglePlay]);

  // Handle time updates
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      onTimeUpdate(
        videoRef.current.currentTime,
        videoRef.current.duration || 0
      );
    }
  };

  // Handle metadata loaded (video duration available)
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      onLoadedMetadata(videoRef.current.duration || 0);
    }
  };

  // Handle video ended
  const handleEnded = () => {
    onEnded();
  };

  // Handle video errors
  const handleError = () => {
    if (!videoRef.current) return;
    
    const videoError = videoRef.current.error;
    let errorMessage = 'Unknown video error';
    
    if (videoError) {
      // Map error codes to user-friendly messages
      switch (videoError.code) {
        case MediaError.MEDIA_ERR_ABORTED:
          errorMessage = 'Video playback was aborted';
          break;
        case MediaError.MEDIA_ERR_NETWORK:
          errorMessage = 'Network error occurred while loading the video';
          break;
        case MediaError.MEDIA_ERR_DECODE:
          errorMessage = 'Video decoding error';
          break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage = 'Video format is not supported';
          break;
        default:
          errorMessage = `Video error: ${videoError.message}`;
      }
    }
    
    setError(errorMessage);
    onError(videoError);
  };

  return (
    <div className="relative w-full h-full bg-black">
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain"
        playsInline
        aria-label="WiseUp learning video or advertisement"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={handleError}
      />
      
      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 p-4">
          <div className="bg-red-600 text-white p-4 rounded-md max-w-md text-center">
            <p className="font-semibold mb-2">Video Error</p>
            <p>{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;

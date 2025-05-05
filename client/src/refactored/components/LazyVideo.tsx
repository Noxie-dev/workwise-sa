import React, { memo } from 'react';
import { useLazyVideo } from '../hooks/useLazyVideo';

/**
 * Props for LazyVideo component
 */
interface LazyVideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src: string;
  poster?: string;
  className?: string;
  onLoad?: () => void;
  isMobile?: boolean;
  fallbackContent?: React.ReactNode;
  loadingContent?: React.ReactNode;
  autoplay?: boolean;
  autoPlayOnVisible?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  threshold?: number;
  rootMargin?: string;
}

/**
 * LazyVideo Component
 * 
 * Loads and plays videos only when they enter the viewport
 * with support for responsive loading and error handling
 */
export const LazyVideo: React.FC<LazyVideoProps> = ({
  src,
  poster,
  className,
  onLoad,
  isMobile,
  fallbackContent,
  loadingContent,
  autoplay = false,
  autoPlayOnVisible = false,
  loop = false,
  muted = true,
  controls = false,
  threshold = 0.1,
  rootMargin = '50px',
  ...props
}) => {
  // Use the custom hook to handle video loading logic
  const { videoRef, isLoaded, isLoading, isError, isVisible } = useLazyVideo({
    src,
    isMobile,
    onLoad,
    autoPlayOnVisible,
    loop,
    threshold,
    rootMargin,
  });

  return (
    <div className="relative">
      <video
        ref={videoRef}
        poster={poster}
        className={className}
        playsInline
        preload="metadata"
        controlsList="nodownload"
        autoPlay={autoplay}
        loop={loop}
        muted={muted}
        controls={controls}
        aria-label={props['aria-label'] || 'Video content'}
        {...props}
      />
      
      {isLoading && !isLoaded && !isError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-50 rounded-lg">
          {loadingContent || (
            <div className="animate-pulse rounded-full h-8 w-8 bg-primary opacity-75" role="status" aria-label="Loading video"></div>
          )}
        </div>
      )}
      
      {isError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg p-4">
          {fallbackContent || (
            <div className="text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 mx-auto text-gray-400 mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-gray-500">Failed to load video</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Use memo to prevent unnecessary re-renders
export default memo(LazyVideo);

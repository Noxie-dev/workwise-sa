import { useEffect, useRef, useState } from 'react';

interface UseLazyVideoOptions {
  src: string;
  isMobile?: boolean;
  onLoad?: () => void;
  autoPlayOnVisible?: boolean;
  loop?: boolean;
  threshold?: number;
  rootMargin?: string;
}

interface UseLazyVideoResult {
  videoRef: React.RefObject<HTMLVideoElement>;
  isLoaded: boolean;
  isLoading: boolean;
  isError: boolean;
  isVisible: boolean;
}

/**
 * Custom hook for lazy loading videos with IntersectionObserver
 * 
 * Handles loading videos only when they enter the viewport,
 * with support for mobile optimization, error handling,
 * and autoplay on visibility.
 */
export function useLazyVideo({
  src,
  isMobile,
  onLoad,
  autoPlayOnVisible = false,
  loop = false,
  threshold = 0.1,
  rootMargin = '50px',
}: UseLazyVideoOptions): UseLazyVideoResult {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!videoRef.current) return;

    const handleLoad = () => {
      setIsLoaded(true);
      setIsLoading(false);
      if (onLoad) onLoad();
    };

    const handleError = () => {
      setIsError(true);
      setIsLoading(false);
      console.error(`Error loading video: ${src}`);
    };

    // Set up intersection observer to detect when video is in viewport
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        setIsVisible(entry.isIntersecting);
        
        if (entry.isIntersecting) {
          if (!isLoaded && !isLoading) {
            setIsLoading(true);
            
            // For mobile, load lower quality version if available
            const videoSrc = isMobile && src.includes('720p') 
              ? src.replace('720p', '480p')
              : src;
            
            videoRef.current!.src = videoSrc;
          }
          
          // Auto-play when visible if enabled
          if (autoPlayOnVisible && videoRef.current && isLoaded) {
            videoRef.current.play().catch(err => {
              console.warn('Auto-play failed:', err);
            });
          }
        } else if (!loop && videoRef.current && isLoaded) {
          // Pause when not visible, unless loop is enabled
          videoRef.current.pause();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(videoRef.current);
    
    const video = videoRef.current;
    video.addEventListener('loadeddata', handleLoad);
    video.addEventListener('error', handleError);
    
    return () => {
      observer.disconnect();
      if (video) {
        video.removeEventListener('loadeddata', handleLoad);
        video.removeEventListener('error', handleError);
        video.pause();
        video.src = '';
      }
    };
  }, [src, isLoaded, isLoading, onLoad, isMobile, autoPlayOnVisible, loop, threshold, rootMargin]);

  return {
    videoRef,
    isLoaded,
    isLoading,
    isError,
    isVisible,
  };
}

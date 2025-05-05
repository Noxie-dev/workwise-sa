import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useIsMobile } from './use-mobile';
import { faqService, FAQItem } from '@/services/faqService';

/**
 * Interface for position of FAQ items in the wheel
 */
export interface ItemPosition {
  x: string;
  y: string;
  rotation: number;
}

/**
 * Smooth animation function with cubic easing
 * Uses simple, reliable easing function for consistent animations
 *
 * @param startValue - Initial value of the animation
 * @param endValue - Target value of the animation
 * @param callback - Function to call with the current value on each frame
 * @param onComplete - Optional function to call when animation completes
 * @returns Cleanup function to cancel animation if needed
 */
const smoothAnimation = (
  startValue: number,
  endValue: number,
  callback: (value: number) => void,
  onComplete?: () => void
): (() => void) => {
  // Detect if we're running on a low-performance device
  const isLowPerformance = typeof window !== 'undefined' &&
    (window.innerWidth < 640 || navigator.hardwareConcurrency <= 4);

  // Adjust duration based on device capability and animation distance
  const distance = Math.abs(endValue - startValue);
  // Shorter duration for small movements, longer for big movements, but cap it
  const baseDuration = Math.min(400, 300 + distance * 2);
  // Shorter duration on low-performance devices
  const duration = isLowPerformance ? baseDuration * 0.8 : baseDuration;

  const startTime = performance.now();
  let animationFrameId: number;

  // Cubic easing function - smoother acceleration and deceleration
  const easeInOutCubic = (t: number): number => {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  const animate = (currentTime: number): void => {
    // Calculate progress (0 to 1)
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Apply easing function
    const easedProgress = easeInOutCubic(progress);

    // Calculate current value
    const currentValue = startValue + (endValue - startValue) * easedProgress;

    // Apply the new value
    callback(currentValue);

    // Check if animation should stop
    if (progress < 1) {
      animationFrameId = requestAnimationFrame(animate);
    } else {
      // Ensure final value is exactly the target value
      callback(endValue);
      if (onComplete) onComplete();
    }
  };

  // Start animation
  animationFrameId = requestAnimationFrame(animate);

  // Return a cleanup function
  return () => {
    cancelAnimationFrame(animationFrameId);
  };
};

/**
 * Enhanced throttle function to limit how often an event can fire
 * Includes options for leading/trailing edge execution and cancellation
 *
 * @param func - The function to throttle
 * @param limit - The time limit in milliseconds
 * @param options - Optional configuration
 * @returns A throttled version of the function
 */
const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number,
  options: { leading?: boolean; trailing?: boolean } = { leading: true, trailing: true }
): ((...args: Parameters<T>) => void) => {
  let lastFunc: ReturnType<typeof setTimeout> | undefined;
  let lastRan: number = 0;
  const { leading = true, trailing = true } = options;

  return function(this: any, ...args: Parameters<T>): void {
    const context = this;
    const now = Date.now();

    if (!lastRan && !leading) {
      lastRan = now;
    }

    const remaining = limit - (now - lastRan);

    if (remaining <= 0 || remaining > limit) {
      if (lastFunc) {
        clearTimeout(lastFunc);
        lastFunc = undefined;
      }

      lastRan = now;
      func.apply(context, args);
    } else if (!lastFunc && trailing) {
      // Schedule a trailing call
      lastFunc = setTimeout(() => {
        lastRan = !leading ? 0 : Date.now();
        lastFunc = undefined;
        func.apply(context, args);
      }, remaining);
    }
  };
};

/**
 * Custom hook for FAQ wheel functionality
 * Encapsulates all wheel logic, animations, and state management
 *
 * @returns All wheel functionality and state
 */
export function useFAQWheel() {
  // State management
  const [rotation, setRotation] = useState<number>(0);
  const [selectedQuestion, setSelectedQuestion] = useState<FAQItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  // Refs
  const autoRotateRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<{ x: number, y: number } | null>(null);

  // Hooks
  const isMobile = useIsMobile();

  /**
   * Use React Query to fetch FAQ data
   * Includes stale time and refetch configuration for optimal performance
   */
  const {
    data: faqItems = [],
    isLoading,
    error
  } = useQuery<FAQItem[]>({
    queryKey: ['faqs'],
    queryFn: () => faqService.getFAQs(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  /**
   * Handle smooth rotation with cubic easing
   * Memoized to prevent recreating on every render
   */
  const smoothRotate = useCallback((targetRotation: number): void => {
    setIsAnimating(true);

    smoothAnimation(
      rotation,
      targetRotation,
      (value) => {
        setRotation(value);
      },
      () => setIsAnimating(false)
    );
  }, [rotation]);

  /**
   * Handle manual rotation with throttling to prevent rapid firing
   * Direction can be 'left' or 'right'
   * Uses enhanced throttle with leading edge execution only
   * Supports faster rotation with shift key
   */
  const handleRotate = useCallback(throttle(
    (direction: 'left' | 'right', isFast: boolean = false): void => {
      // Calculate new rotation with momentum - faster with shift key or consecutive clicks
      const baseRotation = 45;
      const fastMultiplier = isFast ? 2 : 1; // Double rotation speed when shift key is pressed
      const rotationAmount = direction === 'left' ? -baseRotation * fastMultiplier : baseRotation * fastMultiplier;
      const newRotation = rotation + rotationAmount;

      // Force stop any existing animation by setting isAnimating to false first
      setIsAnimating(false);

      // Apply smooth animation with cubic easing
      setTimeout(() => {
        smoothRotate(newRotation);
      }, 10);

      // Provide haptic feedback on mobile devices if supported
      if (isMobile && 'vibrate' in navigator) {
        try {
          navigator.vibrate(10); // Subtle vibration (10ms)
        } catch (e) {
          // Ignore errors if vibration is not supported
        }
      }
    },
    300, // Faster response time
    { leading: true, trailing: false } // Only execute on the leading edge
  ), [rotation, smoothRotate, isMobile]);

  /**
   * Handle question selection
   * Stops auto-rotation when viewing a question
   */
  const handleQuestionClick = useCallback((index: number): void => {
    // Stop auto-rotation when viewing a question
    if (isAutoRotating && autoRotateRef.current) {
      clearInterval(autoRotateRef.current);
      setIsAutoRotating(false);
    }

    setSelectedQuestion(faqItems[index]);
    setIsModalOpen(true);
  }, [isAutoRotating, faqItems]);

  /**
   * Close the modal
   */
  const closeModal = useCallback((): void => {
    setIsModalOpen(false);
    // Small delay before clearing the selected question to allow for exit animations
    setTimeout(() => setSelectedQuestion(null), 300);
  }, []);

  /**
   * Toggle auto-rotation
   * Sets up or clears an interval for automatic wheel rotation
   */
  const toggleAutoRotation = useCallback((): void => {
    if (isAutoRotating) {
      if (autoRotateRef.current) {
        clearInterval(autoRotateRef.current);
        autoRotateRef.current = null;
      }
      setIsAutoRotating(false);
    } else {
      setIsAutoRotating(true);

      // Clear any existing interval first
      if (autoRotateRef.current) {
        clearInterval(autoRotateRef.current);
      }

      // Create a new interval that uses the current rotation value
      autoRotateRef.current = setInterval(() => {
        // Use a function to get the latest rotation value
        setRotation(currentRotation => {
          const newRotation = currentRotation + 45;
          smoothRotate(newRotation);
          return newRotation;
        });
      }, 3000);
    }
  }, [isAutoRotating, smoothRotate]);

  /**
   * Calculate positions for each FAQ item in the wheel
   * Uses trigonometry to position items in a circle with improved spacing
   */
  const getItemPosition = useCallback((index: number, totalItems: number): ItemPosition => {
    // Ensure rotation is properly applied
    const angle = (index * (360 / totalItems) + rotation) % 360;
    const radian = angle * (Math.PI / 180);

    // Wheel dimensions - Adjust radius based on screen size and number of items
    // Make the wheel more compact while maintaining readability
    const baseRadius = isMobile ? 140 : 200; // Reduced radius for more compact layout

    // Adjust radius slightly based on number of items to prevent overlapping
    const wheelRadius = totalItems > 6 ? baseRadius : baseRadius * 0.9;

    const centerX = "50%"; // Center horizontally using percentages
    const centerY = "50%"; // Center vertically using percentages

    // Calculate position using trigonometry
    const x = `calc(${centerX} + ${Math.cos(radian) * wheelRadius}px)`;
    const y = `calc(${centerY} + ${Math.sin(radian) * wheelRadius}px)`;

    return {
      x,
      y,
      rotation: angle
    };
  }, [rotation, isMobile]);

  /**
   * Handle touch start event for mobile swipe
   * Improved to prevent default behavior and capture touch position more reliably
   */
  const handleTouchStart = useCallback((e: React.TouchEvent): void => {
    // Prevent default behavior to avoid scrolling while swiping
    if (isMobile) {
      e.preventDefault();
    }

    // Store the initial touch position
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  }, [isMobile]);

  /**
   * Handle touch move event for mobile swipe
   * Added to provide more responsive feedback during swipe
   */
  const handleTouchMove = useCallback((e: React.TouchEvent): void => {
    // Skip if no starting position or not on mobile
    if (!touchStartRef.current || !isMobile) return;

    // Prevent default to avoid scrolling
    e.preventDefault();
  }, [isMobile]);

  /**
   * Handle touch end event for mobile swipe
   * Improved with better threshold detection and more responsive feedback
   */
  const handleTouchEnd = useCallback((e: React.TouchEvent): void => {
    // Skip if no starting position
    if (!touchStartRef.current) return;

    // Get the final touch position
    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY
    };

    // Calculate the swipe distance
    const deltaX = touchEnd.x - touchStartRef.current.x;
    const deltaY = touchEnd.y - touchStartRef.current.y;

    // Only process horizontal swipes (ignore vertical swipes)
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Use a smaller threshold on mobile for better responsiveness
      const swipeThreshold = isMobile ? 30 : 50;

      // Determine swipe direction if the swipe is significant enough
      if (Math.abs(deltaX) > swipeThreshold) {
        // Swipe right = rotate left, swipe left = rotate right
        // The direction is reversed to feel more natural
        handleRotate(deltaX > 0 ? 'left' : 'right');

        // Provide haptic feedback on successful swipe if supported
        if (isMobile && 'vibrate' in navigator) {
          try {
            navigator.vibrate(5); // Very subtle vibration
          } catch (e) {
            // Ignore errors if vibration is not supported
          }
        }
      }
    }

    // Reset touch start position
    touchStartRef.current = null;
  }, [handleRotate, isMobile]);

  /**
   * Handle keyboard navigation
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      // Only handle keyboard events when the modal is closed
      if (isModalOpen) return;

      switch (e.key) {
        case 'ArrowLeft':
          handleRotate('left', e.shiftKey); // Pass shift key state for fast rotation
          break;
        case 'ArrowRight':
          handleRotate('right', e.shiftKey); // Pass shift key state for fast rotation
          break;
        case 'Tab':
          // Tab navigation between FAQ items
          if (e.shiftKey) {
            // Shift+Tab - move focus to previous item
            setFocusedIndex(prev => (prev <= 0 ? faqItems.length - 1 : prev - 1));
          } else {
            // Tab - move focus to next item
            setFocusedIndex(prev => (prev >= faqItems.length - 1 ? 0 : prev + 1));
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleRotate, isModalOpen, faqItems.length]);

  /**
   * Rotate wheel slightly on mount for visual appeal
   * Also handles cleanup of auto-rotation on unmount
   */
  useEffect(() => {
    // Start with a slight initial rotation after data is loaded
    if (!isLoading && faqItems.length > 0) {
      // Use a timeout to ensure the component is fully rendered
      const initialRotationTimeout = setTimeout(() => {
        // Calculate optimal initial rotation based on number of items
        // This helps position the first item at the top
        const optimalRotation = faqItems.length > 0 ? (360 / faqItems.length) / 2 : 22.5;

        // Apply direct rotation first for immediate effect
        setRotation(optimalRotation);
        // Then apply smooth animation for a subtle effect
        setTimeout(() => smoothRotate(optimalRotation), 100);
      }, 300);

      return () => clearTimeout(initialRotationTimeout);
    }
  }, [isLoading, faqItems.length, smoothRotate]);

  /**
   * Clean up auto-rotation interval on unmount
   */
  useEffect(() => {
    return () => {
      if (autoRotateRef.current) {
        clearInterval(autoRotateRef.current);
      }
    };
  }, []);

  return {
    rotation,
    selectedQuestion,
    isModalOpen,
    isAutoRotating,
    focusedIndex,
    isAnimating,
    faqItems,
    isLoading,
    error,
    setFocusedIndex,
    handleRotate,
    handleQuestionClick,
    closeModal,
    toggleAutoRotation,
    getItemPosition,
    handleTouchStart,
    handleTouchMove, // Add the new touch move handler
    handleTouchEnd,
    isMobile
  };
}

export default useFAQWheel;

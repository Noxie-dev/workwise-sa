import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useIsMobile } from './use-mobile';
import { faqService, FAQItem } from '@/services/faqService';

export type FAQCategory = NonNullable<FAQItem['category']>;
export type FAQCategoryFilter = FAQCategory | 'all';

export interface ItemPosition {
  x: number;
  y: number;
  angle: number;
  tilt: number;
  scale: number;
  opacity: number;
  zIndex: number;
}

export type FAQCategoryCounts = Record<FAQCategoryFilter, number>;

const CATEGORY_FILTERS: FAQCategoryFilter[] = ['all', 'job-seekers', 'employers', 'general'];

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const easeOutQuint = (progress: number): number => 1 - Math.pow(1 - progress, 5);

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

const getWheelStep = (itemCount: number): number => 360 / Math.max(itemCount, 1);

export function useFAQWheel() {
  const [rotation, setRotation] = useState<number>(0);
  const [selectedQuestion, setSelectedQuestion] = useState<FAQItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<FAQCategoryFilter>('all');

  const rotationRef = useRef<number>(0);
  const targetRotationRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const autoRotateFrameRef = useRef<number | null>(null);
  const lastAutoFrameTimeRef = useRef<number | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; rotation: number } | null>(null);
  const isAnimatingRef = useRef<boolean>(false);

  const isMobile = useIsMobile();

  const {
    data: allFAQItems = [],
    isLoading,
    error,
  } = useQuery<FAQItem[]>({
    queryKey: ['faqs'],
    queryFn: () => faqService.getFAQs(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const faqItems = useMemo(() => {
    if (activeCategory === 'all') return allFAQItems;
    return allFAQItems.filter(item => item.category === activeCategory);
  }, [activeCategory, allFAQItems]);

  const categoryCounts = useMemo<FAQCategoryCounts>(() => {
    return CATEGORY_FILTERS.reduce(
      (counts, category) => {
        counts[category] =
          category === 'all'
            ? allFAQItems.length
            : allFAQItems.filter(item => item.category === category).length;
        return counts;
      },
      {
        all: 0,
        'job-seekers': 0,
        employers: 0,
        general: 0,
      } as FAQCategoryCounts
    );
  }, [allFAQItems]);

  const applyRotation = useCallback((value: number): void => {
    rotationRef.current = value;
    setRotation(value);
  }, []);

  const stopAnimation = useCallback((): void => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    isAnimatingRef.current = false;
    setIsAnimating(false);
  }, []);

  const rotateTo = useCallback(
    (targetRotation: number, durationOverride?: number): void => {
      stopAnimation();
      targetRotationRef.current = targetRotation;

      const startRotation = rotationRef.current;
      const distance = Math.abs(targetRotation - startRotation);

      if (distance < 0.1 || prefersReducedMotion()) {
        applyRotation(targetRotation);
        return;
      }

      const duration =
        durationOverride ??
        clamp(
          360 + distance * (isMobile ? 1.25 : 1.65),
          isMobile ? 360 : 430,
          isMobile ? 620 : 760
        );

      const startTime = performance.now();
      isAnimatingRef.current = true;
      setIsAnimating(true);

      const tick = (currentTime: number): void => {
        const elapsed = currentTime - startTime;
        const progress = clamp(elapsed / duration, 0, 1);
        const easedProgress = easeOutQuint(progress);
        const nextRotation = startRotation + (targetRotation - startRotation) * easedProgress;

        applyRotation(nextRotation);

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(tick);
          return;
        }

        applyRotation(targetRotation);
        animationFrameRef.current = null;
        isAnimatingRef.current = false;
        setIsAnimating(false);
      };

      animationFrameRef.current = requestAnimationFrame(tick);
    },
    [applyRotation, isMobile, stopAnimation]
  );

  const rotateBy = useCallback(
    (delta: number, duration?: number): void => {
      const baseRotation = isAnimatingRef.current ? targetRotationRef.current : rotationRef.current;
      rotateTo(baseRotation + delta, duration);
    },
    [rotateTo]
  );

  const stopAutoRotation = useCallback((): void => {
    if (autoRotateFrameRef.current !== null) {
      cancelAnimationFrame(autoRotateFrameRef.current);
      autoRotateFrameRef.current = null;
    }
    lastAutoFrameTimeRef.current = null;
    setIsAutoRotating(false);
  }, []);

  const handleRotate = useCallback(
    (direction: 'left' | 'right', isFast: boolean = false): void => {
      stopAutoRotation();

      const step = getWheelStep(faqItems.length);
      const speedMultiplier = isFast ? 2 : 1;
      const delta = (direction === 'left' ? -step : step) * speedMultiplier;

      rotateBy(delta);

      if (isMobile && 'vibrate' in navigator) {
        try {
          navigator.vibrate(8);
        } catch {
          // Best effort only.
        }
      }
    },
    [faqItems.length, isMobile, rotateBy, stopAutoRotation]
  );

  const handleQuestionClick = useCallback(
    (index: number): void => {
      stopAutoRotation();
      setFocusedIndex(index);
      setSelectedQuestion(faqItems[index] ?? null);
      setIsModalOpen(true);
    },
    [faqItems, stopAutoRotation]
  );

  const closeModal = useCallback((): void => {
    setIsModalOpen(false);
    window.setTimeout(() => setSelectedQuestion(null), 180);
  }, []);

  const toggleAutoRotation = useCallback((): void => {
    if (isAutoRotating) {
      stopAutoRotation();
      return;
    }

    stopAnimation();
    setIsAutoRotating(true);

    const spinSpeed = isMobile ? 12 : 14;

    const spin = (timestamp: number): void => {
      if (lastAutoFrameTimeRef.current === null) {
        lastAutoFrameTimeRef.current = timestamp;
      }

      const elapsed = timestamp - lastAutoFrameTimeRef.current;
      lastAutoFrameTimeRef.current = timestamp;
      applyRotation(rotationRef.current + (elapsed / 1000) * spinSpeed);
      autoRotateFrameRef.current = requestAnimationFrame(spin);
    };

    autoRotateFrameRef.current = requestAnimationFrame(spin);
  }, [applyRotation, isAutoRotating, isMobile, stopAnimation, stopAutoRotation]);

  const handleCategoryChange = useCallback(
    (category: FAQCategoryFilter): void => {
      if (category === activeCategory) return;

      stopAutoRotation();
      setActiveCategory(category);
      setFocusedIndex(-1);
    },
    [activeCategory, stopAutoRotation]
  );

  const getItemPosition = useCallback(
    (index: number, totalItems: number): ItemPosition => {
      const spacing = getWheelStep(totalItems);
      const angle = index * spacing + rotation - 90;
      const radian = (angle * Math.PI) / 180;

      const radiusX = isMobile ? 122 : totalItems > 8 ? 262 : 252;
      const radiusY = isMobile ? 265 : totalItems > 8 ? 222 : 212;
      const x = Math.cos(radian) * radiusX;
      const y = Math.sin(radian) * radiusY;
      const depth = (Math.sin(radian) + 1) / 2;

      return {
        x,
        y,
        angle,
        tilt: Math.cos(radian) * 12,
        scale: 0.94 + depth * 0.08,
        opacity: 0.86 + depth * 0.14,
        zIndex: Math.round(20 + depth * 30),
      };
    },
    [isMobile, rotation]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent): void => {
      if (e.touches.length !== 1) return;

      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        rotation: rotationRef.current,
      };
      stopAutoRotation();
    },
    [stopAutoRotation]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent): void => {
      if (!touchStartRef.current || e.touches.length !== 1) return;

      const deltaX = e.touches[0].clientX - touchStartRef.current.x;
      const deltaY = e.touches[0].clientY - touchStartRef.current.y;

      if (Math.abs(deltaX) < Math.abs(deltaY)) return;

      e.preventDefault();
      stopAnimation();
      const dragSensitivity = isMobile ? 0.36 : 0.24;
      applyRotation(touchStartRef.current.rotation + deltaX * dragSensitivity);
    },
    [applyRotation, isMobile, stopAnimation]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent): void => {
      if (!touchStartRef.current) return;

      const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
      const step = getWheelStep(faqItems.length);
      const projectedRotation = rotationRef.current + deltaX * (isMobile ? 0.08 : 0.04);
      const snappedRotation = Math.round(projectedRotation / step) * step;

      rotateTo(snappedRotation, 360);
      touchStartRef.current = null;

      if (Math.abs(deltaX) > 24 && isMobile && 'vibrate' in navigator) {
        try {
          navigator.vibrate(5);
        } catch {
          // Best effort only.
        }
      }
    },
    [faqItems.length, isMobile, rotateTo]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (isModalOpen) return;

      const target = e.target as HTMLElement | null;
      const isEditableTarget =
        target?.isContentEditable ||
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT';

      if (isEditableTarget) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleRotate('left', e.shiftKey);
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleRotate('right', e.shiftKey);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleRotate, isModalOpen]);

  useEffect(() => {
    if (isLoading || faqItems.length === 0) return;

    const initialRotation = getWheelStep(faqItems.length) / 2;
    rotateTo(initialRotation, 460);
  }, [activeCategory, faqItems.length, isLoading, rotateTo]);

  useEffect(() => {
    return () => {
      stopAnimation();
      if (autoRotateFrameRef.current !== null) {
        cancelAnimationFrame(autoRotateFrameRef.current);
      }
    };
  }, [stopAnimation]);

  return {
    rotation,
    selectedQuestion,
    isModalOpen,
    isAutoRotating,
    focusedIndex,
    isAnimating,
    faqItems,
    allFAQItems,
    categoryCounts,
    activeCategory,
    isLoading,
    error,
    setFocusedIndex,
    handleRotate,
    handleQuestionClick,
    closeModal,
    toggleAutoRotation,
    handleCategoryChange,
    getItemPosition,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    isMobile,
  };
}

export default useFAQWheel;

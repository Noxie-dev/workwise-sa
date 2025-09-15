import { useState, useEffect } from 'react';

// Use 640px to align with Tailwind's sm breakpoint for consistency
const MOBILE_BREAKPOINT = 640;

/**
 * Custom hook to detect if the current viewport is mobile-sized
 * @param breakpoint - The width in pixels below which the viewport is considered mobile (default: 640)
 * @returns boolean indicating if the viewport is mobile-sized
 */
export function useIsMobile(breakpoint: number = MOBILE_BREAKPOINT): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Use both resize event and matchMedia for better performance
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);

    const checkMobile = (): void => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    // Check on mount and add listeners
    checkMobile();
    window.addEventListener('resize', checkMobile);
    mql.addEventListener('change', checkMobile);

    // Clean up
    return () => {
      window.removeEventListener('resize', checkMobile);
      mql.removeEventListener('change', checkMobile);
    };
  }, [breakpoint]);

  return isMobile;
}

export default useIsMobile;

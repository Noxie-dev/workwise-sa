import React, { memo } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Props for LoadingScreen component
 */
interface LoadingScreenProps {
  /**
   * Optional message to display during loading
   */
  message?: string;
  
  /**
   * Optional additional CSS classes
   */
  className?: string;
  
  /**
   * Optional spinner size
   * @default "md"
   */
  size?: "sm" | "md" | "lg";
  
  /**
   * Whether to use a full-page overlay
   * @default true
   */
  fullPage?: boolean;
  
  /**
   * Optional custom spinner component
   */
  customSpinner?: React.ReactNode;
  
  /**
   * Optional backdrop blur effect strength
   * @default "sm"
   */
  backdropBlur?: "none" | "sm" | "md" | "lg";
  
  /**
   * Optional z-index for the loading screen
   * @default 50
   */
  zIndex?: number;
}

/**
 * LoadingScreen component to display during data fetching or page transitions
 * 
 * Features:
 * - Configurable spinner size
 * - Optional custom spinner
 * - Full-page or inline display
 * - Customizable message
 * - Backdrop blur effect
 * - Proper accessibility attributes
 */
const LoadingScreen = memo<LoadingScreenProps>(({
  message = "Loading...",
  className = "",
  size = "md",
  fullPage = true,
  customSpinner,
  backdropBlur = "sm",
  zIndex = 50
}) => {
  // Determine spinner size
  const spinnerSize = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  }[size];
  
  // Determine backdrop blur class
  const blurClass = {
    none: "",
    sm: "backdrop-blur-sm",
    md: "backdrop-blur-md",
    lg: "backdrop-blur-lg"
  }[backdropBlur];
  
  // Determine container classes
  const containerClasses = fullPage
    ? `fixed inset-0 flex flex-col items-center justify-center bg-background/80 ${blurClass} z-${zIndex}`
    : "flex flex-col items-center justify-center py-8";
    
  return (
    <div 
      className={cn(containerClasses, className)} 
      role="alert" 
      aria-live="assertive"
      aria-busy="true"
      data-testid="loading-screen"
    >
      <div className="flex flex-col items-center justify-center space-y-4">
        {customSpinner || (
          <Loader2 
            className={cn(spinnerSize, "text-primary animate-spin")} 
            aria-hidden="true" 
          />
        )}
        
        {message && (
          <p className="text-foreground/80 animate-pulse text-center font-medium">
            {message}
          </p>
        )}
      </div>
    </div>
  );
});

LoadingScreen.displayName = "LoadingScreen";

export { LoadingScreen };

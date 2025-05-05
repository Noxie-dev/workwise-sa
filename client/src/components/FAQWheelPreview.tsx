import React, { useRef, useEffect, lazy, Suspense, memo } from 'react';
import { X, ChevronLeft, ChevronRight, RotateCw, Loader, KeyRound, HelpCircle } from 'lucide-react';
import { useFAQWheel, ItemPosition } from '../hooks/useFAQWheel';
import { FAQItem } from '@/services/faqService';

/**
 * Props for FAQItemCard component
 */
interface FAQItemCardProps {
  item: FAQItem;
  position: ItemPosition;
  rotation: number;
  onClick: () => void;
  isFocused: boolean;
  index: number;
  isMobile?: boolean; // Add isMobile prop
}

/**
 * Props for FAQModal component
 */
interface FAQModalProps {
  question: string;
  answer: string;
  onClose: () => void;
}



/**
 * Lazy loaded modal component for displaying FAQ details
 * Uses React.lazy for code splitting and performance optimization
 * Enhanced with animations, better styling, and improved accessibility
 */
const FAQModal = lazy(() => new Promise<{ default: React.FC<FAQModalProps> }>(resolve => {
  // Small delay to ensure smooth loading transition
  setTimeout(() => {
    resolve({
      default: ({ question, answer, onClose }: FAQModalProps) => {
        // Handle keyboard events for accessibility
        const handleKeyDown = (e: React.KeyboardEvent): void => {
          if (e.key === 'Escape') {
            onClose();
          }
        };

        // Focus trap - focus the modal when it opens
        const modalRef = useRef<HTMLDivElement>(null);

        useEffect(() => {
          // Focus the modal when it opens
          if (modalRef.current) {
            modalRef.current.focus();
          }

          // Prevent body scrolling when modal is open
          document.body.style.overflow = 'hidden';

          // Cleanup
          return () => {
            document.body.style.overflow = '';
          };
        }, []);

        return (
          <div
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 px-4 animate-fadeIn"
            onClick={(e: React.MouseEvent<HTMLDivElement>): void => {
              // Close when clicking outside the modal
              if (e.target === e.currentTarget) onClose();
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="faq-modal-title"
            onKeyDown={handleKeyDown}
          >
            <div
              ref={modalRef}
              className="bg-white rounded-xl shadow-xl p-6 max-w-lg w-full animate-scaleIn"
              tabIndex={0} // Make modal focusable
              onClick={(e: React.MouseEvent<HTMLDivElement>): void => e.stopPropagation()}
              style={{
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                animation: 'scaleIn 0.3s ease-out forwards'
              }}
            >
              <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
                <h2
                  id="faq-modal-title"
                  className="text-xl font-bold text-indigo-800"
                >
                  {question}
                </h2>
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-full p-1 transition-colors"
                  aria-label="Close modal"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="text-gray-700 prose max-w-none">
                <p className="leading-relaxed">{answer}</p>
              </div>

              <div className="mt-6 flex justify-end space-x-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors shadow-sm hover:shadow"
                  aria-label="Close FAQ modal"
                >
                  Close
                </button>
              </div>

              {/* Add custom CSS animations */}
              <style jsx>{`
                @keyframes scaleIn {
                  from { transform: scale(0.95); opacity: 0; }
                  to { transform: scale(1); opacity: 1; }
                }

                @keyframes fadeIn {
                  from { opacity: 0; }
                  to { opacity: 1; }
                }

                .animate-scaleIn {
                  animation: scaleIn 0.3s ease-out forwards;
                }

                .animate-fadeIn {
                  animation: fadeIn 0.2s ease-out forwards;
                }
              `}</style>
            </div>
          </div>
        );
      }
    });
  }, 100);
}));

/**
 * Memoized FAQ Item component
 * Renders a single FAQ card in the wheel
 */
const FAQItemCard = memo<FAQItemCardProps>(({ item, position, rotation, onClick, isFocused, index, isMobile }) => {
  const { x, y, rotation: itemRotation } = position;
  const [isHovered, setIsHovered] = React.useState<boolean>(false);

  // Handle keyboard interaction
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  // Calculate dynamic styles based on state - optimized for performance
  const dynamicStyles = {
    left: x,
    top: y,
    // Larger cards to ensure text is fully visible
    width: isFocused ? '12rem' : isHovered ? '11rem' : '10.5rem',
    height: isFocused ? '9rem' : isHovered ? '8rem' : '7.5rem',
    transform: `translate(-50%, -50%) rotate(${itemRotation}deg)`,
    zIndex: isFocused ? 30 : isHovered ? 25 : 20,
    // Use optimized transitions for smoother animations
    // Simplify transitions on mobile for better performance
    transition: isMobile
      ? 'transform 0.35s cubic-bezier(0.33, 1, 0.68, 1), width 0.3s, height 0.3s'
      : 'transform 0.4s cubic-bezier(0.33, 1, 0.68, 1), width 0.35s cubic-bezier(0.33, 1, 0.68, 1), height 0.35s cubic-bezier(0.33, 1, 0.68, 1)',
    boxShadow: isFocused
      ? '0 10px 25px -5px rgba(79, 70, 229, 0.4)'
      : isHovered
        ? '0 8px 20px -4px rgba(79, 70, 229, 0.3)'
        : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    willChange: 'transform, left, top', // Optimize for animations
    backfaceVisibility: 'hidden', // Prevent flickering
    perspective: '1000px', // Improve 3D rendering
    transformStyle: 'preserve-3d', // Better 3D performance
    overflow: 'hidden' // Ensure content doesn't overflow
  };

  // Category-based styling (if category is available)
  const getCategoryColor = () => {
    if (!item.category) return 'border-indigo-600 hover:border-indigo-800';

    switch (item.category) {
      case 'job-seekers':
        return 'border-blue-600 hover:border-blue-800';
      case 'employers':
        return 'border-purple-600 hover:border-purple-800';
      case 'general':
        return 'border-indigo-600 hover:border-indigo-800';
      default:
        return 'border-indigo-600 hover:border-indigo-800';
    }
  };

  return (
    <div
      className={`absolute bg-white rounded-2xl shadow-lg cursor-pointer transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-all duration-300 flex items-center justify-center p-4 border-2 faq-item ${
        isFocused
          ? 'border-yellow-500 shadow-xl scale-110 z-30'
          : `${getCategoryColor()} hover:shadow-xl`
      }`}
      style={dynamicStyles}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      role="button"
      aria-label={`FAQ question: ${item.question}${item.category ? `, Category: ${item.category}` : ''}`}
      tabIndex={0}
      data-index={index}
      data-category={item.category || 'none'}
      onKeyDown={handleKeyDown}
    >
      <div
        style={{
          transform: `rotate(${-itemRotation}deg)`,
          width: '100%',
          transition: 'transform 0.4s cubic-bezier(0.33, 1, 0.68, 1)',
          willChange: 'transform',
          backfaceVisibility: 'hidden',
          perspective: '1000px'
        }}
      >
        <p
          className={`font-medium text-center overflow-hidden px-2 ${
            isFocused
              ? 'text-base text-indigo-900 leading-tight'
              : isHovered
                ? 'text-sm text-indigo-800 leading-tight'
                : 'text-sm text-indigo-700 leading-tight'
          }`}
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxHeight: '5em' // Approximately 4 lines of text
          }}
        >
          {item.question}
        </p>

        {/* Optional category indicator */}
        {item.category && (
          <div className="mt-2 flex justify-center">
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              item.category === 'job-seekers'
                ? 'bg-blue-100 text-blue-800'
                : item.category === 'employers'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-indigo-100 text-indigo-800'
            }`}>
              {item.category}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  return (
    prevProps.item.question === nextProps.item.question &&
    prevProps.item.category === nextProps.item.category &&
    prevProps.position.x === nextProps.position.x &&
    prevProps.position.y === nextProps.position.y &&
    prevProps.position.rotation === nextProps.position.rotation &&
    prevProps.isFocused === nextProps.isFocused
  );
});

/**
 * FAQ Wheel Preview Component
 * Displays FAQ items in an interactive wheel layout
 */
const FAQWheelPreview: React.FC = () => {
  // Get all wheel functionality from custom hook
  const {
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
  } = useFAQWheel();

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const wheelRef = useRef<HTMLDivElement>(null);



  /**
   * Render the FAQ Wheel component
   */
  return (
    <div
      className="flex flex-col items-center justify-center w-full p-4 bg-gradient-to-b from-indigo-50 to-white"
      ref={containerRef}
      tabIndex={-1} // Make container focusable
      aria-label="FAQ Wheel Interactive Display"
    >
      {/* Header section with title */}
      <div className={`pt-8 ${isMobile ? 'pb-2 mb-2' : 'pb-4 mb-4'}`}>
        <h1 className={`font-bold text-center text-indigo-800 ${isMobile ? 'text-3xl' : 'text-4xl'}`}>
          Workwise SA FAQ
        </h1>

        {/* Navigation instructions - moved below heading for better visibility */}
        <div className="mt-4 text-center">
          {/* Desktop instructions */}
          <div className="hidden md:block bg-indigo-50 rounded-lg py-2 px-4 mx-auto max-w-lg">
            <KeyRound className="inline-block w-4 h-4 mr-1 mb-1 text-indigo-600" aria-hidden="true" />
            <span className="text-indigo-700 font-medium">
              Use arrow keys to rotate (Shift+arrows for faster), Tab to navigate questions
            </span>
          </div>

          {/* Mobile instructions */}
          {isMobile && (
            <p className="mt-2 text-center text-indigo-700 font-medium text-sm bg-indigo-50 mx-auto py-2 px-4 rounded-lg inline-block">
              Swipe to rotate, tap questions to learn more
            </p>
          )}
        </div>

        {/* General instructions */}
        <p className="mt-3 text-center text-gray-600 px-4 font-medium">
          {isMobile ? (
            "Tap any question to learn more"
          ) : (
            "Hover over any question and click to learn more"
          )}
        </p>

        {/* Accessibility instructions - only visible to screen readers */}
        <div className="sr-only">
          Use left and right arrow keys to rotate the wheel. Hold Shift with arrow keys for faster rotation. Press Tab to navigate between questions, and Enter to select.
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex flex-col items-center justify-center h-64 text-center px-4">
          <HelpCircle className="w-12 h-12 text-red-500 mb-4" aria-hidden="true" />
          <p className="text-lg text-red-700 mb-2">Sorry, we couldn't load the FAQ data</p>
          <p className="text-sm text-gray-600">Please try refreshing the page</p>
        </div>
      )}

      {/* Loading state */}
      {isLoading && !error && (
        <div className="flex flex-col items-center justify-center h-64">
          <Loader className="w-12 h-12 text-indigo-600 animate-spin mb-4" aria-hidden="true" />
          <p className="text-lg text-indigo-800">Loading FAQ data...</p>
        </div>
      )}

      {/* Custom CSS for wheel animations - optimized for performance */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .wheel-container {
          animation: fadeIn 0.5s ease-out;
          will-change: transform; /* Optimize for animations */
          transform: translateZ(0); /* Force GPU acceleration */
        }

        .faq-item {
          transition: transform 0.4s cubic-bezier(0.33, 1, 0.68, 1),
                      left 0.4s cubic-bezier(0.33, 1, 0.68, 1),
                      top 0.4s cubic-bezier(0.33, 1, 0.68, 1);
          will-change: transform, left, top; /* Optimize for animations */
          transform: translateZ(0); /* Force GPU acceleration */
          backface-visibility: hidden; /* Prevent flickering */
          perspective: 1000; /* Improve 3D rendering */
          transform-style: preserve-3d; /* Better 3D performance */
        }

        /* Reduce animation complexity on mobile */
        @media (max-width: 640px) {
          .faq-item {
            transition: transform 0.35s cubic-bezier(0.33, 1, 0.68, 1),
                        left 0.35s cubic-bezier(0.33, 1, 0.68, 1),
                        top 0.35s cubic-bezier(0.33, 1, 0.68, 1);
          }
        }
      `}</style>

      {/* Wheel Container - Only rendered when data is loaded */}
      {!isLoading && !error && faqItems.length > 0 && (
        <div
          className={`relative w-full ${isMobile ? 'max-w-sm h-[400px]' : 'max-w-4xl h-[480px]'} mx-auto flex items-center justify-center wheel-container`}
          ref={wheelRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          aria-roledescription="Interactive FAQ wheel"
        >
          {/* Center point with rotation controls */}
          <div
            className={`absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 ${
              isMobile ? 'w-20 h-20' : 'w-28 h-28'
            } bg-indigo-600 rounded-full flex flex-col items-center justify-center text-white font-bold z-30 shadow-lg transition-all duration-300 hover:shadow-xl`}
          >
            <span className={`${isMobile ? 'text-lg mb-1' : 'text-xl mb-2'}`}>FAQ</span>
            <div className="flex items-center justify-center gap-2 mt-1">
              {/* Left rotation button */}
              <button
                className="p-2 bg-indigo-700 hover:bg-indigo-800 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 disabled:opacity-50 focus:ring-2 focus:ring-white focus:outline-none"
                onClick={() => handleRotate('left')}
                disabled={isAnimating}
                aria-label="Rotate Left"
              >
                <ChevronLeft size={isMobile ? 14 : 18} />
              </button>

              {/* Auto-rotation toggle button */}
              <button
                className={`p-2 ${
                  isAutoRotating ? 'bg-indigo-400' : 'bg-indigo-700'
                } hover:bg-indigo-800 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 focus:ring-2 focus:ring-white focus:outline-none`}
                onClick={toggleAutoRotation}
                aria-label={isAutoRotating ? "Stop Auto-Rotation" : "Start Auto-Rotation"}
              >
                <RotateCw
                  size={isMobile ? 14 : 18}
                  className={isAutoRotating ? "animate-spin" : ""}
                />
              </button>

              {/* Right rotation button */}
              <button
                className="p-2 bg-indigo-700 hover:bg-indigo-800 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 disabled:opacity-50 focus:ring-2 focus:ring-white focus:outline-none"
                onClick={() => handleRotate('right')}
                disabled={isAnimating}
                aria-label="Rotate Right"
              >
                <ChevronRight size={isMobile ? 14 : 18} />
              </button>
            </div>
          </div>

          {/* We've moved the keyboard navigation instructions to below the heading */}

          {/* FAQ Items */}
          {faqItems.map((item, index) => {
            const position = getItemPosition(index, faqItems.length);

            return (
              <FAQItemCard
                key={item.id || index}
                item={item}
                position={position}
                rotation={rotation}
                onClick={() => handleQuestionClick(index)}
                isFocused={focusedIndex === index}
                index={index}
                isMobile={isMobile}
              />
            );
          })}
        </div>
      )}

      {/* Modal with lazy loading */}
      {isModalOpen && selectedQuestion && (
        <Suspense fallback={
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white rounded-xl p-8 flex items-center justify-center">
              <Loader className="w-8 h-8 text-indigo-600 animate-spin" aria-hidden="true" />
              <span className="ml-3 text-indigo-800">Loading...</span>
            </div>
          </div>
        }>
          <FAQModal
            question={selectedQuestion.question}
            answer={selectedQuestion.answer}
            onClose={closeModal}
          />
        </Suspense>
      )}
    </div>
  );
};

// Set display name for better debugging
FAQItemCard.displayName = 'FAQItemCard';

export default FAQWheelPreview;
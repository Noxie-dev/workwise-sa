import React, { useEffect, useReducer, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import WiseUpLayout from './WiseUpLayout';
import { WiseUpItem } from './types';
import { useAuth } from '@/contexts/AuthContext';

// Sample data - replace with API call using React Query later
const sampleItems: WiseUpItem[] = [
  {
    id: 1,
    type: 'content',
    title: 'Introduction to Job Interviews',
    creator: {
      name: 'Sarah Johnson',
      role: 'Career Coach',
      avatar: '/images/avatars/sarah.jpg'
    },
    video: 'https://example.com/videos/interview-tips.mp4',
    description: 'Learn the basics of job interviews and how to prepare effectively.',
    resources: [
      { title: 'Interview Checklist', url: 'https://example.com/resources/checklist.pdf' },
      { title: 'Common Questions', url: 'https://example.com/resources/questions.pdf' }
    ],
    tags: ['interview', 'career', 'preparation'],
    likeCount: 245,
    commentCount: 32
  },
  {
    id: 2,
    type: 'ad',
    advertiser: 'TechCorp Solutions',
    title: 'Join Our Internship Program',
    video: 'https://example.com/videos/techcorp-ad.mp4',
    cta: {
      primary: { text: 'Apply Now', url: 'https://techcorp.example.com/apply' },
      secondary: { text: 'Learn More', url: 'https://techcorp.example.com/internships' }
    },
    description: 'Gain valuable experience with our 3-month paid internship program.',
    notes: 'Applications close on June 30th. Remote positions available.'
  }
];

// --- State Management with useReducer ---

interface WiseUpState {
  items: WiseUpItem[];
  currentIndex: number;
  isLoading: boolean;
  isPlaying: boolean;
  isMuted: boolean;
  progress: number;
  currentTime: number;
  duration: number;
}

type WiseUpAction =
  | { type: 'SET_ITEMS'; payload: WiseUpItem[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'NEXT_ITEM' }
  | { type: 'PREVIOUS_ITEM' }
  | { type: 'TOGGLE_PLAY' }
  | { type: 'SET_PLAYING'; payload: boolean }
  | { type: 'TOGGLE_MUTE' }
  | { type: 'UPDATE_TIME'; payload: { currentTime: number; duration: number } }
  | { type: 'SET_DURATION'; payload: number };

const initialState: WiseUpState = {
  items: [], // Start with empty items, load via effect/React Query
  currentIndex: 0,
  isLoading: true,
  isPlaying: false,
  isMuted: false,
  progress: 0,
  currentTime: 0,
  duration: 0,
};

function wiseUpReducer(state: WiseUpState, action: WiseUpAction): WiseUpState {
  switch (action.type) {
    case 'SET_ITEMS':
      return { ...state, items: action.payload, isLoading: false };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'NEXT_ITEM':
      if (state.currentIndex < state.items.length - 1) {
        return { ...state, currentIndex: state.currentIndex + 1, isPlaying: true, progress: 0, currentTime: 0 };
      }
      return state; // No change if already at the end
    case 'PREVIOUS_ITEM':
      if (state.currentIndex > 0) {
        return { ...state, currentIndex: state.currentIndex - 1, isPlaying: true, progress: 0, currentTime: 0 };
      }
      return state; // No change if already at the beginning
    case 'TOGGLE_PLAY':
      return { ...state, isPlaying: !state.isPlaying };
    case 'SET_PLAYING':
        return { ...state, isPlaying: action.payload };
    case 'TOGGLE_MUTE':
      return { ...state, isMuted: !state.isMuted };
    case 'UPDATE_TIME':
      return {
        ...state,
        currentTime: action.payload.currentTime,
        progress: action.payload.duration > 0 ? (action.payload.currentTime / action.payload.duration) * 100 : 0,
      };
    case 'SET_DURATION':
      return { ...state, duration: action.payload };
    default:
      return state;
  }
}

// --- Component Implementation ---

/**
 * WiseUpPageRefactored component is the main container for the WiseUp feature.
 * It manages state for the content items and playback controls using useReducer.
 * This refactored version improves code organization and maintainability.
 */
const WiseUpPageRefactored: React.FC = () => {
  const [state, dispatch] = useReducer(wiseUpReducer, initialState);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch content items (Replace with React Query in the future)
  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      dispatch({ type: 'SET_ITEMS', payload: sampleItems });
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Track ad impressions
  useEffect(() => {
    const currentItem = state.items[state.currentIndex];
    if (currentItem?.type === 'ad') {
      console.log(`Ad impression tracked: ${currentItem.title}`);
      // TODO: Integrate with actual analytics service
    }
  }, [state.currentIndex, state.items]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === ' ') {
        e.preventDefault();
        dispatch({ type: 'TOGGLE_PLAY' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentIndex, state.items.length]); // Dependencies adjusted for reducer pattern

  // --- Event Handlers ---
  
  // Media control handlers
  const handleTogglePlay = useCallback(() => {
    dispatch({ type: 'TOGGLE_PLAY' });
  }, []);

  const handleToggleMute = useCallback(() => {
    dispatch({ type: 'TOGGLE_MUTE' });
  }, []);

  const handleTimeUpdate = useCallback((currentTime: number, duration: number) => {
    dispatch({ type: 'UPDATE_TIME', payload: { currentTime, duration } });
  }, []);

  const handleLoadedMetadata = useCallback((duration: number) => {
    dispatch({ type: 'SET_DURATION', payload: duration });
  }, []);

  // Navigation handlers
  const handleEnded = useCallback(() => {
    // Automatically move to the next item when video ends
    if (state.currentIndex < state.items.length - 1) {
        dispatch({ type: 'NEXT_ITEM' });
    } else {
        dispatch({ type: 'SET_PLAYING', payload: false }); // Stop playing at the end
        toast({
            title: "End of content",
            description: "You've reached the end of the available content.",
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentIndex, state.items.length, toast]);

  const handleNext = useCallback(() => {
    if (state.currentIndex < state.items.length - 1) {
      dispatch({ type: 'NEXT_ITEM' });
    } else {
      toast({
        title: "End of content",
        description: "You've reached the end of the available content.",
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentIndex, state.items.length, toast]);

  const handlePrevious = useCallback(() => {
    if (state.currentIndex > 0) {
      dispatch({ type: 'PREVIOUS_ITEM' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentIndex]);

  // --- Render Logic ---
  
  // Loading state
  if (state.isLoading) {
    // Consider using a Skeleton component here for better UX
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  // Computed values for props
  const currentItem = state.items[state.currentIndex] || null;
  const isNextDisabled = state.currentIndex >= state.items.length - 1;
  const isPreviousDisabled = state.currentIndex <= 0;

  return (
    <div className="container mx-auto px-4 py-8 h-full">
      <h1 className="text-3xl font-bold mb-6">WiseUp Learning Hub (Refactored)</h1>

      <WiseUpLayout
        currentItem={currentItem}
        isPlaying={state.isPlaying}
        isMuted={state.isMuted}
        progress={state.progress}
        currentTime={state.currentTime}
        duration={state.duration}
        onTogglePlay={handleTogglePlay}
        onToggleMute={handleToggleMute}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onNext={handleNext}
        onPrevious={handlePrevious}
        isNextDisabled={isNextDisabled}
        isPreviousDisabled={isPreviousDisabled}
      />
    </div>
  );
};

export default WiseUpPageRefactored;

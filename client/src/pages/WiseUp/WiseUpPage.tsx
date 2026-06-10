// @ts-nocheck
import React, { useEffect, useReducer, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import WiseUpLayout from './WiseUpLayout';
import { WiseUpItem } from './types';

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
  | { type: 'NEXT_ITEM' }
  | { type: 'PREVIOUS_ITEM' }
  | { type: 'TOGGLE_PLAY' }
  | { type: 'SET_PLAYING'; payload: boolean }
  | { type: 'TOGGLE_MUTE' }
  | { type: 'UPDATE_TIME'; payload: { currentTime: number; duration: number } }
  | { type: 'SET_DURATION'; payload: number };

const initialState: WiseUpState = {
  items: [],
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
    case 'NEXT_ITEM':
      if (state.currentIndex < state.items.length - 1) {
        return { ...state, currentIndex: state.currentIndex + 1, isPlaying: true, progress: 0, currentTime: 0 };
      }
      return state;
    case 'PREVIOUS_ITEM':
      if (state.currentIndex > 0) {
        return { ...state, currentIndex: state.currentIndex - 1, isPlaying: true, progress: 0, currentTime: 0 };
      }
      return state;
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

export default function WiseUpPage() {
  const [state, dispatch] = useReducer(wiseUpReducer, initialState);
  const { toast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch({ type: 'SET_ITEMS', payload: sampleItems });
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleNext = useCallback(() => {
    if (state.currentIndex < state.items.length - 1) {
      dispatch({ type: 'NEXT_ITEM' });
      return;
    }

    toast({
      title: "End of content",
      description: "You've reached the end of the available content.",
    });
  }, [state.currentIndex, state.items.length, toast]);

  const handlePrevious = useCallback(() => {
    if (state.currentIndex > 0) {
      dispatch({ type: 'PREVIOUS_ITEM' });
    }
  }, [state.currentIndex]);

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
  }, [handleNext, handlePrevious]);

  const handleEnded = useCallback(() => {
    if (state.currentIndex < state.items.length - 1) {
      dispatch({ type: 'NEXT_ITEM' });
      return;
    }

    dispatch({ type: 'SET_PLAYING', payload: false });
    toast({
      title: "End of content",
      description: "You've reached the end of the available content.",
    });
  }, [state.currentIndex, state.items.length, toast]);

  if (state.isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 h-full">
      <h1 className="text-4xl font-bold mb-8 text-center text-blue-800 py-2 border-b-2 border-blue-200">
        WiseUp Learning Hub
      </h1>

      <WiseUpLayout
        currentItem={state.items[state.currentIndex] || null}
        isPlaying={state.isPlaying}
        isMuted={state.isMuted}
        progress={state.progress}
        currentTime={state.currentTime}
        duration={state.duration}
        onTogglePlay={() => dispatch({ type: 'TOGGLE_PLAY' })}
        onToggleMute={() => dispatch({ type: 'TOGGLE_MUTE' })}
        onTimeUpdate={(currentTime, duration) =>
          dispatch({ type: 'UPDATE_TIME', payload: { currentTime, duration } })
        }
        onLoadedMetadata={(duration) => dispatch({ type: 'SET_DURATION', payload: duration })}
        onEnded={handleEnded}
        onNext={handleNext}
        onPrevious={handlePrevious}
        isNextDisabled={state.currentIndex >= state.items.length - 1}
        isPreviousDisabled={state.currentIndex <= 0}
      />
    </div>
  );
}

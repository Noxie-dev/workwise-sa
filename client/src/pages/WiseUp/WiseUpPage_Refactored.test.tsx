import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import WiseUpPageRefactored from './WiseUpPage_Refactored';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

// Mock the dependencies
jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock the WiseUpLayout component
jest.mock('./WiseUpLayout', () => ({
  __esModule: true,
  default: jest.fn(({
    currentItem,
    isPlaying,
    onTogglePlay,
    onNext,
    onPrevious
  }) => (
    <div data-testid="wise-up-layout">
      <div data-testid="current-item">{currentItem ? currentItem.title : 'No item'}</div>
      <button
        data-testid="toggle-play"
        onClick={onTogglePlay}
      >
        {isPlaying ? 'Pause' : 'Play'}
      </button>
      <button data-testid="next-button" onClick={onNext}>Next</button>
      <button data-testid="prev-button" onClick={onPrevious}>Previous</button>
    </div>
  )),
}));

describe('WiseUpPageRefactored Component', () => {
  const mockToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mocks
    (useToast as jest.Mock).mockReturnValue({ toast: mockToast });
    (useAuth as jest.Mock).mockReturnValue({ user: { id: '123', name: 'Test User' } });

    // Mock setTimeout to execute immediately
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders loading state initially', () => {
    render(<WiseUpPageRefactored />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders content after loading', async () => {
    render(<WiseUpPageRefactored />);

    // Fast-forward timers to trigger the data loading
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Check if the layout is rendered with the first item
    expect(screen.getByTestId('wise-up-layout')).toBeInTheDocument();
    expect(screen.getByTestId('current-item')).toHaveTextContent('Introduction to Job Interviews');
  });

  it('handles play/pause toggle', async () => {
    render(<WiseUpPageRefactored />);

    // Fast-forward timers to trigger the data loading
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Initially should be paused
    expect(screen.getByTestId('toggle-play')).toHaveTextContent('Play');

    // Click play button
    fireEvent.click(screen.getByTestId('toggle-play'));
    expect(screen.getByTestId('toggle-play')).toHaveTextContent('Pause');

    // Click pause button
    fireEvent.click(screen.getByTestId('toggle-play'));
    expect(screen.getByTestId('toggle-play')).toHaveTextContent('Play');
  });

  it('handles next/previous navigation', async () => {
    render(<WiseUpPageRefactored />);

    // Fast-forward timers to trigger the data loading
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Initially should show the first item
    expect(screen.getByTestId('current-item')).toHaveTextContent('Introduction to Job Interviews');

    // Navigate to next item
    fireEvent.click(screen.getByTestId('next-button'));
    expect(screen.getByTestId('current-item')).toHaveTextContent('Join Our Internship Program');

    // Navigate back to first item
    fireEvent.click(screen.getByTestId('prev-button'));
    expect(screen.getByTestId('current-item')).toHaveTextContent('Introduction to Job Interviews');
  });

  it('shows toast when reaching the end of content', async () => {
    render(<WiseUpPageRefactored />);

    // Fast-forward timers to trigger the data loading
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Navigate to the last item
    fireEvent.click(screen.getByTestId('next-button'));

    // Try to navigate past the last item
    fireEvent.click(screen.getByTestId('next-button'));

    // Should show toast
    expect(mockToast).toHaveBeenCalledWith({
      title: "End of content",
      description: "You've reached the end of the available content.",
    });
  });

  it('handles keyboard navigation', async () => {
    render(<WiseUpPageRefactored />);

    // Fast-forward timers to trigger the data loading
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Initially should show the first item
    expect(screen.getByTestId('current-item')).toHaveTextContent('Introduction to Job Interviews');

    // Navigate with right arrow key
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByTestId('current-item')).toHaveTextContent('Join Our Internship Program');

    // Navigate with left arrow key
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(screen.getByTestId('current-item')).toHaveTextContent('Introduction to Job Interviews');

    // Get the current play state
    const initialPlayState = screen.getByTestId('toggle-play').textContent;

    // Toggle play with space key
    fireEvent.keyDown(window, { key: ' ' });

    // Check that the play state has toggled
    expect(screen.getByTestId('toggle-play').textContent).not.toBe(initialPlayState);
  });
});

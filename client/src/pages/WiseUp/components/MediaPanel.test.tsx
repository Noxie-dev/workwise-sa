import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MediaPanel from './MediaPanel';
import { WiseUpItem, ContentItem, AdItem } from '../types';

// Mock the VideoPlayer component
jest.mock('./VideoPlayer', () => ({
  __esModule: true,
  default: jest.fn(({
    src,
    isPlaying,
    isMuted,
    onTogglePlay,
    onToggleMute,
    onTimeUpdate,
    onLoadedMetadata,
    onEnded,
    onError
  }) => (
    <div data-testid="video-player" data-src={src} data-playing={isPlaying} data-muted={isMuted}>
      <button onClick={() => onTogglePlay()} data-testid="toggle-play-button">Toggle Play</button>
      <button onClick={() => onToggleMute()} data-testid="toggle-mute-button">Toggle Mute</button>
      <button onClick={() => onTimeUpdate(30, 120)} data-testid="time-update-button">Update Time</button>
      <button onClick={() => onLoadedMetadata(120)} data-testid="loaded-metadata-button">Loaded Metadata</button>
      <button onClick={() => onEnded()} data-testid="ended-button">Ended</button>
      <button
        onClick={() => onError({ code: MediaError.MEDIA_ERR_NETWORK } as MediaError)}
        data-testid="error-button"
      >
        Trigger Error
      </button>
    </div>
  ))
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Play: () => <span data-testid="play-icon">Play</span>,
  Pause: () => <span data-testid="pause-icon">Pause</span>,
  Volume2: () => <span data-testid="volume-icon">Volume</span>,
  VolumeX: () => <span data-testid="volume-muted-icon">Muted</span>,
  ChevronUp: () => <span data-testid="chevron-up-icon">Up</span>,
  ChevronDown: () => <span data-testid="chevron-down-icon">Down</span>
}));

// Mock data
const mockContentItem: ContentItem = {
  id: '1',
  type: 'content',
  title: 'Test Content',
  creator: {
    name: 'Test Creator',
    role: 'Test Role',
    avatar: 'test-avatar.jpg'
  },
  video: 'https://example.com/test-video.mp4',
  description: 'Test description',
  resources: [],
  tags: ['test']
};

const mockAdItem: AdItem = {
  id: 'ad1',
  type: 'ad',
  advertiser: 'Test Advertiser',
  title: 'Test Ad',
  video: 'https://example.com/test-ad.mp4',
  description: 'Test ad description',
  cta: {
    primary: {
      text: 'Primary CTA',
      url: 'https://example.com/primary'
    },
    secondary: {
      text: 'Secondary CTA',
      url: 'https://example.com/secondary'
    }
  },
  notes: 'Test notes'
};

// Mock props
const mockProps = {
  currentItem: mockContentItem as WiseUpItem,
  isPlaying: false,
  isMuted: false,
  progress: 25,
  currentTime: 30,
  duration: 120,
  onTogglePlay: jest.fn(),
  onToggleMute: jest.fn(),
  onTimeUpdate: jest.fn(),
  onLoadedMetadata: jest.fn(),
  onEnded: jest.fn(),
  onNext: jest.fn(),
  onPrevious: jest.fn(),
  isNextDisabled: false,
  isPreviousDisabled: false
};

describe('MediaPanel Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state when currentItem is null', () => {
    render(<MediaPanel {...mockProps} currentItem={null} />);

    expect(screen.getByText('Loading content...')).toBeInTheDocument();
    expect(screen.queryByTestId('video-player')).not.toBeInTheDocument();
  });

  it('renders VideoPlayer with correct props when currentItem is provided', () => {
    render(<MediaPanel {...mockProps} />);

    const videoPlayer = screen.getByTestId('video-player');
    expect(videoPlayer).toBeInTheDocument();
    expect(videoPlayer).toHaveAttribute('data-src', mockContentItem.video);
    expect(videoPlayer).toHaveAttribute('data-playing', 'false');
    expect(videoPlayer).toHaveAttribute('data-muted', 'false');
  });

  it('displays controls when there is no video error', () => {
    render(<MediaPanel {...mockProps} />);

    // Progress bar should be visible
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // Play/Pause button should be visible
    expect(screen.getByLabelText('Play')).toBeInTheDocument();

    // Mute/Unmute button should be visible
    expect(screen.getByLabelText('Mute')).toBeInTheDocument();

    // Time display should be visible and formatted correctly
    expect(screen.getByText('00:30 / 02:00')).toBeInTheDocument();
  });

  it('calls onTogglePlay when play/pause button is clicked', () => {
    render(<MediaPanel {...mockProps} />);

    fireEvent.click(screen.getByLabelText('Play'));

    expect(mockProps.onTogglePlay).toHaveBeenCalledTimes(1);
  });

  it('calls onToggleMute when mute/unmute button is clicked', () => {
    render(<MediaPanel {...mockProps} />);

    fireEvent.click(screen.getByLabelText('Mute'));

    expect(mockProps.onToggleMute).toHaveBeenCalledTimes(1);
  });

  it('calls onNext when next button is clicked', () => {
    render(<MediaPanel {...mockProps} />);

    fireEvent.click(screen.getByLabelText('Next content'));

    expect(mockProps.onNext).toHaveBeenCalledTimes(1);
  });

  it('calls onPrevious when previous button is clicked', () => {
    render(<MediaPanel {...mockProps} />);

    fireEvent.click(screen.getByLabelText('Previous content'));

    expect(mockProps.onPrevious).toHaveBeenCalledTimes(1);
  });

  it('disables next button when isNextDisabled is true', () => {
    render(<MediaPanel {...mockProps} isNextDisabled={true} />);

    const nextButton = screen.getByLabelText('Next content');
    expect(nextButton).toBeDisabled();
    expect(nextButton).toHaveClass('opacity-40');
  });

  it('disables previous button when isPreviousDisabled is true', () => {
    render(<MediaPanel {...mockProps} isPreviousDisabled={true} />);

    const prevButton = screen.getByLabelText('Previous content');
    expect(prevButton).toBeDisabled();
    expect(prevButton).toHaveClass('opacity-40');
  });

  it('sets progress bar width based on progress prop with yellow color', () => {
    render(<MediaPanel {...mockProps} progress={50} />);

    const progressBar = screen.getByRole('progressbar').firstChild as HTMLElement;
    expect(progressBar).toHaveStyle('width: 50%');
    expect(progressBar).toHaveClass('bg-yellow-500');
  });

  it('shows swipe indicator with correct styling when next content is available', () => {
    render(<MediaPanel {...mockProps} isNextDisabled={false} />);

    const swipeIndicator = screen.getByText('Swipe for next').closest('div');
    expect(swipeIndicator).toBeInTheDocument();
    expect(swipeIndicator).toHaveClass('bg-black/30');
    expect(swipeIndicator).toHaveClass('rounded-full');
  });

  it('hides swipe indicator when next content is not available', () => {
    render(<MediaPanel {...mockProps} isNextDisabled={true} />);

    expect(screen.queryByText('Swipe for next')).not.toBeInTheDocument();
  });

  it('hides controls when video error occurs', () => {
    render(<MediaPanel {...mockProps} />);

    // Trigger an error from the VideoPlayer
    fireEvent.click(screen.getByTestId('error-button'));

    // Controls should be hidden
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Play')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Mute')).not.toBeInTheDocument();
  });

  it('resets error state when metadata is loaded', () => {
    render(<MediaPanel {...mockProps} />);

    // Trigger an error
    fireEvent.click(screen.getByTestId('error-button'));

    // Controls should be hidden
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();

    // Trigger metadata loaded event
    fireEvent.click(screen.getByTestId('loaded-metadata-button'));

    // Controls should be visible again
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows correct icon based on isPlaying state', () => {
    const { rerender } = render(<MediaPanel {...mockProps} isPlaying={false} />);

    // When not playing, Play icon should be visible in both the center overlay and controls
    const playIcons = screen.getAllByTestId('play-icon');
    expect(playIcons.length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByTestId('pause-icon')).not.toBeInTheDocument();

    // When playing, Pause icon should be visible and center overlay should be hidden
    rerender(<MediaPanel {...mockProps} isPlaying={true} />);
    expect(screen.getByTestId('pause-icon')).toBeInTheDocument();

    // There should be fewer play icons when playing (no center overlay)
    const playIconsWhenPlaying = screen.getAllByTestId('play-icon');
    expect(playIconsWhenPlaying.length).toBeLessThan(playIcons.length);
  });

  it('shows correct icon based on isMuted state', () => {
    const { rerender } = render(<MediaPanel {...mockProps} isMuted={false} />);

    // When not muted, Volume icon should be visible
    expect(screen.getByTestId('volume-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('volume-muted-icon')).not.toBeInTheDocument();

    // When muted, VolumeX icon should be visible
    rerender(<MediaPanel {...mockProps} isMuted={true} />);
    expect(screen.getByTestId('volume-muted-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('volume-icon')).not.toBeInTheDocument();
  });

  it('shows center play button overlay when paused and hides it when playing', () => {
    const { rerender } = render(<MediaPanel {...mockProps} isPlaying={false} />);

    // When paused, center play button should be visible
    const centerPlayButton = screen.getAllByLabelText('Play')[0];
    expect(centerPlayButton).toBeInTheDocument();
    expect(centerPlayButton.closest('div')).toHaveClass('absolute inset-0 flex items-center justify-center');

    // When playing, center play button should be hidden
    rerender(<MediaPanel {...mockProps} isPlaying={true} />);
    expect(screen.queryAllByLabelText('Play').length).toBe(0);
  });
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import WiseUpLayout from './WiseUpLayout';
import { WiseUpItem, ContentItem } from './types';

// Mock the LeftPanel and MediaPanel components
jest.mock('./components/LeftPanel', () => ({
  __esModule: true,
  default: jest.fn(({ currentItem }) => (
    <div data-testid="left-panel">
      <span>Left Panel: {currentItem ? currentItem.title : 'No item'}</span>
    </div>
  ))
}));

jest.mock('./components/MediaPanel', () => ({
  __esModule: true,
  default: jest.fn(({
    currentItem,
    isPlaying,
    isMuted,
    progress,
    currentTime,
    duration,
    isNextDisabled,
    isPreviousDisabled
  }) => (
    <div data-testid="media-panel">
      <span>Media Panel: {currentItem ? currentItem.title : 'No item'}</span>
      <span data-testid="is-playing">{isPlaying ? 'Playing' : 'Paused'}</span>
      <span data-testid="is-muted">{isMuted ? 'Muted' : 'Unmuted'}</span>
      <span data-testid="progress">{progress}</span>
      <span data-testid="current-time">{currentTime}</span>
      <span data-testid="duration">{duration}</span>
      <span data-testid="next-disabled">{isNextDisabled ? 'Next Disabled' : 'Next Enabled'}</span>
      <span data-testid="prev-disabled">{isPreviousDisabled ? 'Prev Disabled' : 'Prev Enabled'}</span>
    </div>
  ))
}));

// Mock data for testing
const mockContentItem: ContentItem = {
  id: '1',
  type: 'content',
  title: 'Test Content Title',
  creator: {
    name: 'Test Creator',
    role: 'Test Role',
    avatar: 'test-avatar.jpg'
  },
  video: 'test-video.mp4',
  description: 'Test description',
  resources: [],
  tags: ['test', 'content']
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
  isPreviousDisabled: true
};

describe('WiseUpLayout Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<WiseUpLayout {...mockProps} />);
    expect(screen.getByTestId('left-panel')).toBeInTheDocument();
    expect(screen.getByTestId('media-panel')).toBeInTheDocument();
  });

  it('renders both LeftPanel and MediaPanel components', () => {
    render(<WiseUpLayout {...mockProps} />);
    
    // Check if both panels are rendered with the correct content
    expect(screen.getByText(`Left Panel: ${mockContentItem.title}`)).toBeInTheDocument();
    expect(screen.getByText(`Media Panel: ${mockContentItem.title}`)).toBeInTheDocument();
  });

  it('passes the correct props to LeftPanel', () => {
    render(<WiseUpLayout {...mockProps} />);
    
    // Verify currentItem is passed to LeftPanel
    expect(screen.getByText(`Left Panel: ${mockContentItem.title}`)).toBeInTheDocument();
  });

  it('passes the correct props to MediaPanel', () => {
    render(<WiseUpLayout {...mockProps} />);
    
    // Verify all relevant props are passed to MediaPanel
    expect(screen.getByText(`Media Panel: ${mockContentItem.title}`)).toBeInTheDocument();
    expect(screen.getByTestId('is-playing')).toHaveTextContent('Paused');
    expect(screen.getByTestId('is-muted')).toHaveTextContent('Unmuted');
    expect(screen.getByTestId('progress')).toHaveTextContent('25');
    expect(screen.getByTestId('current-time')).toHaveTextContent('30');
    expect(screen.getByTestId('duration')).toHaveTextContent('120');
    expect(screen.getByTestId('next-disabled')).toHaveTextContent('Next Enabled');
    expect(screen.getByTestId('prev-disabled')).toHaveTextContent('Prev Disabled');
  });

  it('renders correctly with null currentItem', () => {
    render(<WiseUpLayout {...mockProps} currentItem={null} />);
    
    expect(screen.getByText('Left Panel: No item')).toBeInTheDocument();
    expect(screen.getByText('Media Panel: No item')).toBeInTheDocument();
  });

  it('uses the correct layout classes for responsive design', () => {
    const { container } = render(<WiseUpLayout {...mockProps} />);
    
    // Check if the main container has the correct flex classes
    const mainContainer = container.firstChild as HTMLElement;
    expect(mainContainer).toHaveClass('flex');
    expect(mainContainer).toHaveClass('flex-col');
    expect(mainContainer).toHaveClass('md:flex-row');
    expect(mainContainer).toHaveClass('flex-1');
    expect(mainContainer).toHaveClass('overflow-hidden');
    expect(mainContainer).toHaveClass('h-full');
  });
});

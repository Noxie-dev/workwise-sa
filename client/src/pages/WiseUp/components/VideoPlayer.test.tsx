import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import VideoPlayer from './VideoPlayer';

// Mock HTMLVideoElement methods and properties
describe('VideoPlayer Component', () => {
  // Setup mocks for HTMLVideoElement
  let playMock: jest.Mock;
  let pauseMock: jest.Mock;
  
  beforeEach(() => {
    // Mock play method
    playMock = jest.fn().mockReturnValue(Promise.resolve());
    // Mock pause method
    pauseMock = jest.fn();
    
    // Mock HTMLVideoElement properties and methods
    Object.defineProperty(window.HTMLMediaElement.prototype, 'play', {
      configurable: true,
      writable: true,
      value: playMock
    });
    
    Object.defineProperty(window.HTMLMediaElement.prototype, 'pause', {
      configurable: true,
      writable: true,
      value: pauseMock
    });
    
    // Mock other properties
    Object.defineProperty(window.HTMLMediaElement.prototype, 'muted', {
      configurable: true,
      writable: true,
      value: false
    });
    
    Object.defineProperty(window.HTMLMediaElement.prototype, 'currentTime', {
      configurable: true,
      writable: true,
      value: 0
    });
    
    Object.defineProperty(window.HTMLMediaElement.prototype, 'duration', {
      configurable: true,
      writable: true,
      value: 100
    });
    
    Object.defineProperty(window.HTMLMediaElement.prototype, 'error', {
      configurable: true,
      writable: true,
      value: null
    });
  });
  
  // Mock props
  const mockProps = {
    src: 'https://example.com/video.mp4',
    isPlaying: false,
    isMuted: false,
    onTogglePlay: jest.fn(),
    onToggleMute: jest.fn(),
    onTimeUpdate: jest.fn(),
    onLoadedMetadata: jest.fn(),
    onEnded: jest.fn(),
    onError: jest.fn()
  };
  
  it('renders video element with correct src', () => {
    render(<VideoPlayer {...mockProps} />);
    const videoElement = screen.getByLabelText('WiseUp learning video or advertisement');
    
    expect(videoElement).toBeInTheDocument();
    expect(videoElement).toHaveAttribute('src', mockProps.src);
  });
  
  it('calls play() when isPlaying is true', () => {
    render(<VideoPlayer {...mockProps} isPlaying={true} />);
    
    expect(playMock).toHaveBeenCalled();
  });
  
  it('calls pause() when isPlaying is false', () => {
    render(<VideoPlayer {...mockProps} isPlaying={false} />);
    
    expect(pauseMock).toHaveBeenCalled();
  });
  
  it('sets video.muted based on isMuted prop', () => {
    const { rerender } = render(<VideoPlayer {...mockProps} isMuted={true} />);
    
    const videoElement = screen.getByLabelText('WiseUp learning video or advertisement') as HTMLVideoElement;
    expect(videoElement.muted).toBe(true);
    
    rerender(<VideoPlayer {...mockProps} isMuted={false} />);
    expect(videoElement.muted).toBe(false);
  });
  
  it('calls onTimeUpdate when timeupdate event fires', () => {
    render(<VideoPlayer {...mockProps} />);
    const videoElement = screen.getByLabelText('WiseUp learning video or advertisement');
    
    fireEvent.timeUpdate(videoElement);
    
    expect(mockProps.onTimeUpdate).toHaveBeenCalledWith(0, 100);
  });
  
  it('calls onLoadedMetadata when loadedmetadata event fires', () => {
    render(<VideoPlayer {...mockProps} />);
    const videoElement = screen.getByLabelText('WiseUp learning video or advertisement');
    
    fireEvent.loadedMetadata(videoElement);
    
    expect(mockProps.onLoadedMetadata).toHaveBeenCalledWith(100);
  });
  
  it('calls onEnded when ended event fires', () => {
    render(<VideoPlayer {...mockProps} />);
    const videoElement = screen.getByLabelText('WiseUp learning video or advertisement');
    
    fireEvent.ended(videoElement);
    
    expect(mockProps.onEnded).toHaveBeenCalled();
  });
  
  it('displays error message and calls onError when error event fires', () => {
    // Mock a video error
    const mockError = {
      code: MediaError.MEDIA_ERR_NETWORK,
      message: 'Network error'
    };
    
    Object.defineProperty(window.HTMLMediaElement.prototype, 'error', {
      configurable: true,
      writable: true,
      value: mockError
    });
    
    render(<VideoPlayer {...mockProps} />);
    const videoElement = screen.getByLabelText('WiseUp learning video or advertisement');
    
    fireEvent.error(videoElement);
    
    expect(screen.getByText('Network error occurred while loading the video')).toBeInTheDocument();
    expect(mockProps.onError).toHaveBeenCalledWith(mockError);
  });
  
  it('resets video state when src changes', () => {
    const { rerender } = render(<VideoPlayer {...mockProps} />);
    
    // Reset mocks
    playMock.mockClear();
    pauseMock.mockClear();
    
    // Change src prop
    rerender(<VideoPlayer {...mockProps} src="https://example.com/new-video.mp4" isPlaying={true} />);
    
    // Should attempt to play with new source
    expect(playMock).toHaveBeenCalled();
  });
  
  it('handles play promise rejection and calls onTogglePlay', async () => {
    // Mock play to reject
    playMock.mockRejectedValueOnce(new Error('Autoplay prevented'));
    
    render(<VideoPlayer {...mockProps} isPlaying={true} />);
    
    // Wait for the promise rejection to be handled
    await act(async () => {
      await Promise.resolve();
    });
    
    // Should call onTogglePlay to sync state
    expect(mockProps.onTogglePlay).toHaveBeenCalled();
  });
});

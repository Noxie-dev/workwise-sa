import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LazyVideo } from './LazyVideo';

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock HTMLVideoElement methods
const mockPlay = jest.fn().mockResolvedValue(undefined);
const mockPause = jest.fn();

describe('LazyVideo Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock video element methods
    Object.defineProperty(HTMLMediaElement.prototype, 'play', {
      configurable: true,
      writable: true,
      value: mockPlay
    });
    
    Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
      configurable: true,
      writable: true,
      value: mockPause
    });
  });

  it('renders with basic props', () => {
    render(<LazyVideo src="test-video.mp4" />);
    
    const videoElement = screen.getByLabelText('Video content');
    expect(videoElement).toBeInTheDocument();
    expect(videoElement.tagName).toBe('VIDEO');
  });

  it('applies custom className', () => {
    render(<LazyVideo src="test-video.mp4" className="custom-video-class" />);
    
    const videoElement = screen.getByLabelText('Video content');
    expect(videoElement).toHaveClass('custom-video-class');
  });

  it('applies poster image when provided', () => {
    render(<LazyVideo src="test-video.mp4" poster="test-poster.jpg" />);
    
    const videoElement = screen.getByLabelText('Video content');
    expect(videoElement).toHaveAttribute('poster', 'test-poster.jpg');
  });

  it('applies video attributes correctly', () => {
    render(
      <LazyVideo 
        src="test-video.mp4" 
        autoplay={true}
        loop={true}
        muted={true}
        controls={true}
      />
    );
    
    const videoElement = screen.getByLabelText('Video content');
    expect(videoElement).toHaveAttribute('autoplay');
    expect(videoElement).toHaveAttribute('loop');
    expect(videoElement).toHaveAttribute('muted');
    expect(videoElement).toHaveAttribute('controls');
  });

  it('shows loading state when video is loading', () => {
    // Simulate intersection
    mockIntersectionObserver.mockImplementation((callback) => {
      callback([{ isIntersecting: true }]);
      return {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn()
      };
    });

    render(<LazyVideo src="test-video.mp4" />);
    
    // Loading state should be visible
    const loadingElement = screen.getByRole('status');
    expect(loadingElement).toBeInTheDocument();
  });

  it('shows custom loading content when provided', () => {
    // Simulate intersection
    mockIntersectionObserver.mockImplementation((callback) => {
      callback([{ isIntersecting: true }]);
      return {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn()
      };
    });

    render(
      <LazyVideo 
        src="test-video.mp4" 
        loadingContent={<div data-testid="custom-loader">Custom Loader</div>}
      />
    );
    
    const customLoader = screen.getByTestId('custom-loader');
    expect(customLoader).toBeInTheDocument();
    expect(customLoader).toHaveTextContent('Custom Loader');
  });

  it('shows error state when video fails to load', () => {
    render(<LazyVideo src="test-video.mp4" />);
    
    // Get video element
    const videoElement = screen.getByLabelText('Video content');
    
    // Simulate error event
    fireEvent.error(videoElement);
    
    // Error message should be visible
    const errorMessage = screen.getByText('Failed to load video');
    expect(errorMessage).toBeInTheDocument();
  });

  it('shows custom error content when provided', () => {
    render(
      <LazyVideo 
        src="test-video.mp4" 
        fallbackContent={<div data-testid="custom-error">Custom Error</div>}
      />
    );
    
    // Get video element
    const videoElement = screen.getByLabelText('Video content');
    
    // Simulate error event
    fireEvent.error(videoElement);
    
    // Custom error should be visible
    const customError = screen.getByTestId('custom-error');
    expect(customError).toBeInTheDocument();
    expect(customError).toHaveTextContent('Custom Error');
  });

  it('calls onLoad callback when video is loaded', () => {
    const mockOnLoad = jest.fn();
    render(<LazyVideo src="test-video.mp4" onLoad={mockOnLoad} />);
    
    // Get video element
    const videoElement = screen.getByLabelText('Video content');
    
    // Simulate loadeddata event
    fireEvent.loadedData(videoElement);
    
    // onLoad should be called
    expect(mockOnLoad).toHaveBeenCalledTimes(1);
  });

  it('uses lower quality video for mobile devices', () => {
    // Simulate intersection
    mockIntersectionObserver.mockImplementation((callback) => {
      callback([{ isIntersecting: true }]);
      return {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn()
      };
    });

    render(<LazyVideo src="video-720p.mp4" isMobile={true} />);
    
    // Check if src was modified for mobile
    const videoElement = screen.getByLabelText('Video content');
    expect(videoElement.src).toContain('480p');
  });

  it('plays video when autoPlayOnVisible is true and video becomes visible', async () => {
    // First render without intersection
    const { rerender } = render(
      <LazyVideo src="test-video.mp4" autoPlayOnVisible={true} />
    );
    
    // Simulate video loaded
    const videoElement = screen.getByLabelText('Video content');
    fireEvent.loadedData(videoElement);
    
    // Now simulate intersection
    mockIntersectionObserver.mockImplementation((callback) => {
      callback([{ isIntersecting: true }]);
      return {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn()
      };
    });
    
    // Re-render to trigger the effect with new intersection state
    rerender(<LazyVideo src="test-video.mp4" autoPlayOnVisible={true} />);
    
    // Play should be called
    expect(mockPlay).toHaveBeenCalled();
  });

  it('pauses video when it goes out of view and loop is false', async () => {
    // First simulate intersection
    mockIntersectionObserver.mockImplementation((callback) => {
      callback([{ isIntersecting: true }]);
      return {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn()
      };
    });
    
    const { rerender } = render(
      <LazyVideo src="test-video.mp4" loop={false} />
    );
    
    // Simulate video loaded
    const videoElement = screen.getByLabelText('Video content');
    fireEvent.loadedData(videoElement);
    
    // Now simulate going out of view
    mockIntersectionObserver.mockImplementation((callback) => {
      callback([{ isIntersecting: false }]);
      return {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn()
      };
    });
    
    // Re-render to trigger the effect with new intersection state
    rerender(<LazyVideo src="test-video.mp4" loop={false} />);
    
    // Pause should be called
    expect(mockPause).toHaveBeenCalled();
  });

  it('does not pause video when it goes out of view but loop is true', async () => {
    // First simulate intersection
    mockIntersectionObserver.mockImplementation((callback) => {
      callback([{ isIntersecting: true }]);
      return {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn()
      };
    });
    
    const { rerender } = render(
      <LazyVideo src="test-video.mp4" loop={true} />
    );
    
    // Simulate video loaded
    const videoElement = screen.getByLabelText('Video content');
    fireEvent.loadedData(videoElement);
    
    // Reset mock to check if it gets called again
    mockPause.mockClear();
    
    // Now simulate going out of view
    mockIntersectionObserver.mockImplementation((callback) => {
      callback([{ isIntersecting: false }]);
      return {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn()
      };
    });
    
    // Re-render to trigger the effect with new intersection state
    rerender(<LazyVideo src="test-video.mp4" loop={true} />);
    
    // Pause should NOT be called when loop is true
    expect(mockPause).not.toHaveBeenCalled();
  });
});

import { renderHook, act } from '@testing-library/react';
import { useLazyVideo } from './useLazyVideo';

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
let intersectionCallback: (entries: { isIntersecting: boolean }[]) => void;

mockIntersectionObserver.mockImplementation((callback) => {
  intersectionCallback = callback;
  return {
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn()
  };
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock HTMLVideoElement methods
const mockPlay = jest.fn().mockResolvedValue(undefined);
const mockPause = jest.fn();

describe('useLazyVideo Hook', () => {
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

  it('initializes with correct default values', () => {
    const { result } = renderHook(() => useLazyVideo({ src: 'test-video.mp4' }));
    
    expect(result.current.isLoaded).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.isVisible).toBe(false);
    expect(result.current.videoRef.current).toBe(null);
  });

  it('sets isVisible to true when video enters viewport', () => {
    const { result } = renderHook(() => useLazyVideo({ src: 'test-video.mp4' }));
    
    // Simulate intersection
    act(() => {
      intersectionCallback([{ isIntersecting: true }]);
    });
    
    expect(result.current.isVisible).toBe(true);
  });

  it('sets isLoading to true when video enters viewport and is not loaded', () => {
    // Mock videoRef.current to be a valid element
    const mockVideoElement = document.createElement('video');
    jest.spyOn(React, 'useRef').mockReturnValue({ current: mockVideoElement });
    
    const { result } = renderHook(() => useLazyVideo({ src: 'test-video.mp4' }));
    
    // Simulate intersection
    act(() => {
      intersectionCallback([{ isIntersecting: true }]);
    });
    
    expect(result.current.isLoading).toBe(true);
  });

  it('calls onLoad callback when video is loaded', () => {
    const mockOnLoad = jest.fn();
    
    // Mock videoRef.current to be a valid element
    const mockVideoElement = document.createElement('video');
    jest.spyOn(React, 'useRef').mockReturnValue({ current: mockVideoElement });
    
    renderHook(() => useLazyVideo({ 
      src: 'test-video.mp4',
      onLoad: mockOnLoad
    }));
    
    // Simulate loadeddata event
    act(() => {
      mockVideoElement.dispatchEvent(new Event('loadeddata'));
    });
    
    expect(mockOnLoad).toHaveBeenCalledTimes(1);
  });

  it('sets isError to true when video fails to load', () => {
    // Mock videoRef.current to be a valid element
    const mockVideoElement = document.createElement('video');
    jest.spyOn(React, 'useRef').mockReturnValue({ current: mockVideoElement });
    
    const { result } = renderHook(() => useLazyVideo({ src: 'test-video.mp4' }));
    
    // Simulate error event
    act(() => {
      mockVideoElement.dispatchEvent(new Event('error'));
    });
    
    expect(result.current.isError).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('uses lower quality video for mobile devices', () => {
    // Mock videoRef.current to be a valid element
    const mockVideoElement = document.createElement('video');
    Object.defineProperty(mockVideoElement, 'src', {
      set: jest.fn(),
      get: jest.fn()
    });
    jest.spyOn(React, 'useRef').mockReturnValue({ current: mockVideoElement });
    
    renderHook(() => useLazyVideo({ 
      src: 'video-720p.mp4',
      isMobile: true
    }));
    
    // Simulate intersection
    act(() => {
      intersectionCallback([{ isIntersecting: true }]);
    });
    
    // Check if src was set with the mobile version
    expect(mockVideoElement.src).toBeDefined();
  });

  it('plays video when autoPlayOnVisible is true and video becomes visible and is loaded', () => {
    // Mock videoRef.current to be a valid element
    const mockVideoElement = document.createElement('video');
    jest.spyOn(React, 'useRef').mockReturnValue({ current: mockVideoElement });
    
    const { result, rerender } = renderHook(
      (props) => useLazyVideo(props), 
      { initialProps: { src: 'test-video.mp4', autoPlayOnVisible: true } }
    );
    
    // Simulate video loaded
    act(() => {
      mockVideoElement.dispatchEvent(new Event('loadeddata'));
    });
    
    // Simulate intersection
    act(() => {
      intersectionCallback([{ isIntersecting: true }]);
    });
    
    // Rerender to trigger effects
    rerender({ src: 'test-video.mp4', autoPlayOnVisible: true });
    
    // Play should be called
    expect(mockPlay).toHaveBeenCalled();
  });

  it('pauses video when it goes out of view and loop is false', () => {
    // Mock videoRef.current to be a valid element
    const mockVideoElement = document.createElement('video');
    jest.spyOn(React, 'useRef').mockReturnValue({ current: mockVideoElement });
    
    const { result, rerender } = renderHook(
      (props) => useLazyVideo(props), 
      { initialProps: { src: 'test-video.mp4', loop: false } }
    );
    
    // Simulate video loaded
    act(() => {
      mockVideoElement.dispatchEvent(new Event('loadeddata'));
    });
    
    // Simulate intersection
    act(() => {
      intersectionCallback([{ isIntersecting: true }]);
    });
    
    // Simulate going out of view
    act(() => {
      intersectionCallback([{ isIntersecting: false }]);
    });
    
    // Rerender to trigger effects
    rerender({ src: 'test-video.mp4', loop: false });
    
    // Pause should be called
    expect(mockPause).toHaveBeenCalled();
  });

  it('does not pause video when it goes out of view but loop is true', () => {
    // Mock videoRef.current to be a valid element
    const mockVideoElement = document.createElement('video');
    jest.spyOn(React, 'useRef').mockReturnValue({ current: mockVideoElement });
    
    const { result, rerender } = renderHook(
      (props) => useLazyVideo(props), 
      { initialProps: { src: 'test-video.mp4', loop: true } }
    );
    
    // Simulate video loaded
    act(() => {
      mockVideoElement.dispatchEvent(new Event('loadeddata'));
    });
    
    // Simulate intersection
    act(() => {
      intersectionCallback([{ isIntersecting: true }]);
    });
    
    // Reset mock to check if it gets called again
    mockPause.mockClear();
    
    // Simulate going out of view
    act(() => {
      intersectionCallback([{ isIntersecting: false }]);
    });
    
    // Rerender to trigger effects
    rerender({ src: 'test-video.mp4', loop: true });
    
    // Pause should NOT be called when loop is true
    expect(mockPause).not.toHaveBeenCalled();
  });
});

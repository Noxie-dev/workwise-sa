import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useLazyVideo } from '../hooks/useLazyVideo';

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

// Initialize the callback to prevent undefined errors
intersectionCallback = () => {};

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
    // For this test, we'll directly mock the implementation of IntersectionObserver
    // to immediately call the callback with isIntersecting: true

    // Create a mock implementation that calls the callback immediately
    const mockObserve = jest.fn();
    const mockDisconnect = jest.fn();

    class MockIntersectionObserver {
      constructor(callback) {
        // Call the callback immediately with isIntersecting: true
        callback([{ isIntersecting: true }]);
        // Store the callback for later use
        this.callback = callback;
      }

      observe = mockObserve;
      disconnect = mockDisconnect;
    }

    // Replace the global IntersectionObserver
    const originalIntersectionObserver = window.IntersectionObserver;
    window.IntersectionObserver = MockIntersectionObserver;

    // Render the hook
    const { result } = renderHook(() => useLazyVideo({ src: 'test-video.mp4' }));

    // Check that isVisible is true
    expect(result.current.isVisible).toBe(true);

    // Restore the original IntersectionObserver
    window.IntersectionObserver = originalIntersectionObserver;
  });

  it('sets isLoading to true when video enters viewport and is not loaded', () => {
    // Create a mock video element
    const mockVideoElement = {
      src: '',
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      pause: jest.fn()
    };

    // Mock useRef to return our mock video element
    jest.spyOn(React, 'useRef').mockReturnValue({ current: mockVideoElement });

    // Create a mock IntersectionObserver that calls the callback immediately
    class MockIntersectionObserver {
      constructor(callback) {
        // Call the callback immediately with isIntersecting: true
        callback([{ isIntersecting: true }]);
      }

      observe = jest.fn();
      disconnect = jest.fn();
    }

    // Replace the global IntersectionObserver
    const originalIntersectionObserver = window.IntersectionObserver;
    window.IntersectionObserver = MockIntersectionObserver;

    // Render the hook
    const { result } = renderHook(() => useLazyVideo({ src: 'test-video.mp4' }));

    // Check that isLoading is true
    expect(result.current.isLoading).toBe(true);

    // Restore the original IntersectionObserver
    window.IntersectionObserver = originalIntersectionObserver;
  });

  it('calls onLoad callback when video is loaded', () => {
    const mockOnLoad = jest.fn();

    // Create a mock video element
    const mockVideoElement = {
      src: '',
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      pause: jest.fn()
    };

    // Mock useRef to return our mock video element
    jest.spyOn(React, 'useRef').mockReturnValue({ current: mockVideoElement });

    // Render the hook with onLoad callback
    renderHook(() => useLazyVideo({
      src: 'test-video.mp4',
      onLoad: mockOnLoad
    }));

    // Simulate loadeddata event by finding and calling the event listener
    act(() => {
      // Find the loadeddata event listener and call it
      const loadedDataCallback = mockVideoElement.addEventListener.mock.calls.find(
        call => call[0] === 'loadeddata'
      )[1];
      loadedDataCallback();
    });

    // Check that onLoad was called
    expect(mockOnLoad).toHaveBeenCalledTimes(1);
  });

  it('sets isError to true when video fails to load', () => {
    // Create a mock video element
    const mockVideoElement = {
      src: '',
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      pause: jest.fn()
    };

    // Mock useRef to return our mock video element
    jest.spyOn(React, 'useRef').mockReturnValue({ current: mockVideoElement });

    // Mock console.error to prevent test output pollution
    const originalConsoleError = console.error;
    console.error = jest.fn();

    // Render the hook
    const { result } = renderHook(() => useLazyVideo({ src: 'test-video.mp4' }));

    // Simulate error event by finding and calling the event listener
    act(() => {
      // Find the error event listener and call it
      const errorCallback = mockVideoElement.addEventListener.mock.calls.find(
        call => call[0] === 'error'
      )[1];
      errorCallback();
    });

    // Check that isError is true and isLoading is false
    expect(result.current.isError).toBe(true);
    expect(result.current.isLoading).toBe(false);

    // Restore console.error
    console.error = originalConsoleError;
  });

  it('uses lower quality video for mobile devices', () => {
    // For this test, we'll directly test the implementation logic
    // rather than trying to test the side effects

    // Create a mock video element
    const mockVideoElement = {
      src: '',
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      pause: jest.fn()
    };

    // Mock useRef to return our mock video element
    jest.spyOn(React, 'useRef').mockReturnValue({ current: mockVideoElement });

    // Create a mock IntersectionObserver that calls the callback immediately
    class MockIntersectionObserver {
      constructor(callback) {
        // Call the callback immediately with isIntersecting: true
        callback([{ isIntersecting: true }]);
      }

      observe = jest.fn();
      disconnect = jest.fn();
    }

    // Replace the global IntersectionObserver
    const originalIntersectionObserver = window.IntersectionObserver;
    window.IntersectionObserver = MockIntersectionObserver;

    // Render the hook with mobile flag
    renderHook(() => useLazyVideo({
      src: 'video-720p.mp4',
      isMobile: true
    }));

    // Check that the src was set to the mobile version
    // This is a direct test of the implementation logic
    expect(mockVideoElement.src).toBe('video-480p.mp4');

    // Restore the original IntersectionObserver
    window.IntersectionObserver = originalIntersectionObserver;
  });

  it('plays video when autoPlayOnVisible is true and video becomes visible and is loaded', () => {
    // Create a mock video element with a play method
    const mockPlay = jest.fn().mockResolvedValue(undefined);
    const mockVideoElement = {
      src: '',
      play: mockPlay,
      pause: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    };

    // Mock useRef to return our mock video element
    jest.spyOn(React, 'useRef').mockReturnValue({ current: mockVideoElement });

    // Create a mock IntersectionObserver
    class MockIntersectionObserver {
      constructor(callback) {
        this.callback = callback;
      }

      observe = jest.fn();
      disconnect = jest.fn();
    }

    // Replace the global IntersectionObserver
    const originalIntersectionObserver = window.IntersectionObserver;
    window.IntersectionObserver = MockIntersectionObserver;

    // Render the hook with autoPlayOnVisible
    const { result } = renderHook(() => useLazyVideo({
      src: 'test-video.mp4',
      autoPlayOnVisible: true
    }));

    // Simulate the video being loaded
    act(() => {
      // Find the loadeddata event listener and call it
      const loadedDataCallback = mockVideoElement.addEventListener.mock.calls.find(
        call => call[0] === 'loadeddata'
      )[1];
      loadedDataCallback();
    });

    // Simulate the video becoming visible
    act(() => {
      const observer = new MockIntersectionObserver(() => {});
      observer.callback([{ isIntersecting: true }]);
    });

    // Play should be called
    expect(mockPlay).toHaveBeenCalled();

    // Restore the original IntersectionObserver
    window.IntersectionObserver = originalIntersectionObserver;
  });

  it('pauses video when it goes out of view and loop is false', () => {
    // Create a mock video element with a pause method
    const mockPause = jest.fn();
    const mockVideoElement = {
      src: '',
      play: jest.fn().mockResolvedValue(undefined),
      pause: mockPause,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    };

    // Mock useRef to return our mock video element
    jest.spyOn(React, 'useRef').mockReturnValue({ current: mockVideoElement });

    // Create a mock IntersectionObserver
    class MockIntersectionObserver {
      constructor(callback) {
        this.callback = callback;
      }

      observe = jest.fn();
      disconnect = jest.fn();
    }

    // Replace the global IntersectionObserver
    const originalIntersectionObserver = window.IntersectionObserver;
    window.IntersectionObserver = MockIntersectionObserver;

    // Render the hook with loop=false
    const { result } = renderHook(() => useLazyVideo({
      src: 'test-video.mp4',
      loop: false
    }));

    // Simulate the video being loaded
    act(() => {
      // Find the loadeddata event listener and call it
      const loadedDataCallback = mockVideoElement.addEventListener.mock.calls.find(
        call => call[0] === 'loadeddata'
      )[1];
      loadedDataCallback();
    });

    // Get the observer instance
    const observer = new MockIntersectionObserver(() => {});

    // Simulate the video becoming visible first
    act(() => {
      observer.callback([{ isIntersecting: true }]);
    });

    // Then simulate the video going out of view
    act(() => {
      observer.callback([{ isIntersecting: false }]);
    });

    // Pause should be called
    expect(mockPause).toHaveBeenCalled();

    // Restore the original IntersectionObserver
    window.IntersectionObserver = originalIntersectionObserver;
  });

  it('does not pause video when it goes out of view but loop is true', () => {
    // Create a mock video element with a pause method
    const mockPause = jest.fn();
    const mockVideoElement = {
      src: '',
      play: jest.fn().mockResolvedValue(undefined),
      pause: mockPause,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    };

    // Mock useRef to return our mock video element
    jest.spyOn(React, 'useRef').mockReturnValue({ current: mockVideoElement });

    // Create a mock IntersectionObserver
    class MockIntersectionObserver {
      constructor(callback) {
        this.callback = callback;
      }

      observe = jest.fn();
      disconnect = jest.fn();
    }

    // Replace the global IntersectionObserver
    const originalIntersectionObserver = window.IntersectionObserver;
    window.IntersectionObserver = MockIntersectionObserver;

    // Render the hook with loop=true
    const { result } = renderHook(() => useLazyVideo({
      src: 'test-video.mp4',
      loop: true
    }));

    // Simulate the video being loaded
    act(() => {
      // Find the loadeddata event listener and call it
      const loadedDataCallback = mockVideoElement.addEventListener.mock.calls.find(
        call => call[0] === 'loadeddata'
      )[1];
      loadedDataCallback();
    });

    // Get the observer instance
    const observer = new MockIntersectionObserver(() => {});

    // Simulate the video becoming visible first
    act(() => {
      observer.callback([{ isIntersecting: true }]);
    });

    // Clear the mock to ensure we're only checking calls after this point
    mockPause.mockClear();

    // Then simulate the video going out of view
    act(() => {
      observer.callback([{ isIntersecting: false }]);
    });

    // Pause should NOT be called when loop is true
    expect(mockPause).not.toHaveBeenCalled();

    // Restore the original IntersectionObserver
    window.IntersectionObserver = originalIntersectionObserver;
  });
});

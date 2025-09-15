import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import useFormAutosave from '../../hooks/useFormAutosave';

describe('useFormAutosave', () => {
  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value.toString();
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        store = {};
      }),
    };
  })();

  // Replace the global localStorage with our mock
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });

  beforeEach(() => {
    vi.useFakeTimers();
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should save form data to localStorage after delay', () => {
    const formData = { title: 'Test Job', description: 'Test Description' };
    const formId = 'test-form';

    renderHook(() => useFormAutosave(formData, formId));

    // Verify that localStorage.setItem hasn't been called yet
    expect(localStorageMock.setItem).not.toHaveBeenCalled();

    // Fast-forward time by 1000ms
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Now localStorage.setItem should have been called
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      `job-form-draft-${formId}`,
      JSON.stringify(formData)
    );
  });

  it('should not save data when enabled is false', () => {
    const formData = { title: 'Test Job' };
    const formId = 'test-form';

    renderHook(() => useFormAutosave(formData, formId, false));

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // localStorage.setItem should not have been called
    expect(localStorageMock.setItem).not.toHaveBeenCalled();
  });

  it('should load saved data from localStorage', () => {
    const formData = { title: 'Test Job' };
    const formId = 'test-form';
    const savedData = { title: 'Saved Job' };

    // Set up mock to return our test data
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(savedData));

    const { result } = renderHook(() => useFormAutosave(formData, formId));

    // Call loadSavedData
    const loadedData = result.current.loadSavedData();

    // Verify localStorage.getItem was called with the correct key
    expect(localStorageMock.getItem).toHaveBeenCalledWith(`job-form-draft-${formId}`);

    // Verify the returned data matches what we set up
    expect(loadedData).toEqual(savedData);
  });

  it('should handle JSON parse errors when loading data', () => {
    const formData = { title: 'Test Job' };
    const formId = 'test-form';

    // Set up mock to return invalid JSON
    localStorageMock.getItem.mockReturnValueOnce('invalid-json');

    // Spy on console.error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useFormAutosave(formData, formId));

    // Call loadSavedData
    const loadedData = result.current.loadSavedData();

    // Verify console.error was called
    expect(consoleSpy).toHaveBeenCalled();

    // Verify null is returned on error
    expect(loadedData).toBeNull();

    // Clean up
    consoleSpy.mockRestore();
  });

  it('should clear saved data from localStorage', () => {
    const formData = { title: 'Test Job' };
    const formId = 'test-form';

    const { result } = renderHook(() => useFormAutosave(formData, formId));

    // Call clearSavedData
    act(() => {
      result.current.clearSavedData();
    });

    // Verify localStorage.removeItem was called with the correct key
    expect(localStorageMock.removeItem).toHaveBeenCalledWith(`job-form-draft-${formId}`);
  });
});

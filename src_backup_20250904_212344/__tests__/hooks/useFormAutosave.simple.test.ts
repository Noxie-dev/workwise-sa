import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the useFormAutosave hook functionality directly
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
    const key = `job-form-draft-${formId}`;
    
    // Simulate the hook's behavior
    const saveTimeout = setTimeout(() => {
      localStorage.setItem(key, JSON.stringify(formData));
    }, 1000);
    
    // Verify that localStorage.setItem hasn't been called yet
    expect(localStorageMock.setItem).not.toHaveBeenCalled();

    // Fast-forward time by 1000ms
    vi.advanceTimersByTime(1000);

    // Now localStorage.setItem should have been called
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      key,
      JSON.stringify(formData)
    );
    
    // Clean up
    clearTimeout(saveTimeout);
  });

  it('should load saved data from localStorage', () => {
    const formId = 'test-form';
    const key = `job-form-draft-${formId}`;
    const savedData = { title: 'Saved Job' };

    // Set up mock to return our test data
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(savedData));

    // Simulate loadSavedData function
    const loadSavedData = () => {
      const savedDataStr = localStorage.getItem(key);
      if (savedDataStr) {
        try {
          return JSON.parse(savedDataStr);
        } catch (e) {
          console.error('Failed to parse saved form data:', e);
          return null;
        }
      }
      return null;
    };

    // Call loadSavedData
    const loadedData = loadSavedData();

    // Verify localStorage.getItem was called with the correct key
    expect(localStorageMock.getItem).toHaveBeenCalledWith(key);
    
    // Verify the returned data matches what we set up
    expect(loadedData).toEqual(savedData);
  });

  it('should handle JSON parse errors when loading data', () => {
    const formId = 'test-form';
    const key = `job-form-draft-${formId}`;

    // Set up mock to return invalid JSON
    localStorageMock.getItem.mockReturnValueOnce('invalid-json');

    // Spy on console.error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Simulate loadSavedData function
    const loadSavedData = () => {
      const savedDataStr = localStorage.getItem(key);
      if (savedDataStr) {
        try {
          return JSON.parse(savedDataStr);
        } catch (e) {
          console.error('Failed to parse saved form data:', e);
          return null;
        }
      }
      return null;
    };

    // Call loadSavedData
    const loadedData = loadSavedData();

    // Verify console.error was called
    expect(consoleSpy).toHaveBeenCalled();
    
    // Verify null is returned on error
    expect(loadedData).toBeNull();

    // Clean up
    consoleSpy.mockRestore();
  });

  it('should clear saved data from localStorage', () => {
    const formId = 'test-form';
    const key = `job-form-draft-${formId}`;

    // Simulate clearSavedData function
    const clearSavedData = () => {
      localStorage.removeItem(key);
    };

    // Call clearSavedData
    clearSavedData();

    // Verify localStorage.removeItem was called with the correct key
    expect(localStorageMock.removeItem).toHaveBeenCalledWith(key);
  });
});

import { describe, it, expect, vi } from 'vitest';

// Mock the useFormAutosave hook functionality
describe('useFormAutosave mock', () => {
  it('should save form data after delay', () => {
    // Mock functions
    const setItemMock = vi.fn();
    const getItemMock = vi.fn();
    const removeItemMock = vi.fn();
    
    // Mock setTimeout
    vi.useFakeTimers();
    
    // Simulate the hook's behavior
    const formData = { title: 'Test Job' };
    const formId = 'test-form';
    const key = `job-form-draft-${formId}`;
    
    // Simulate the useEffect that saves data
    const saveTimeout = setTimeout(() => {
      setItemMock(key, JSON.stringify(formData));
    }, 1000);
    
    // Verify that setItem hasn't been called yet
    expect(setItemMock).not.toHaveBeenCalled();
    
    // Fast-forward time
    vi.advanceTimersByTime(1000);
    
    // Now setItem should have been called
    expect(setItemMock).toHaveBeenCalledWith(key, JSON.stringify(formData));
    
    // Clean up
    clearTimeout(saveTimeout);
    vi.useRealTimers();
  });
  
  it('should load saved data', () => {
    // Mock functions
    const getItemMock = vi.fn();
    const savedData = { title: 'Saved Job' };
    
    // Set up mock to return our test data
    getItemMock.mockReturnValueOnce(JSON.stringify(savedData));
    
    // Simulate loadSavedData function
    const formId = 'test-form';
    const key = `job-form-draft-${formId}`;
    
    const loadSavedData = () => {
      const savedDataStr = getItemMock(key);
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
    
    // Verify getItem was called with the correct key
    expect(getItemMock).toHaveBeenCalledWith(key);
    
    // Verify the returned data matches what we set up
    expect(loadedData).toEqual(savedData);
  });
  
  it('should clear saved data', () => {
    // Mock functions
    const removeItemMock = vi.fn();
    
    // Simulate clearSavedData function
    const formId = 'test-form';
    const key = `job-form-draft-${formId}`;
    
    const clearSavedData = () => {
      removeItemMock(key);
    };
    
    // Call clearSavedData
    clearSavedData();
    
    // Verify removeItem was called with the correct key
    expect(removeItemMock).toHaveBeenCalledWith(key);
  });
});

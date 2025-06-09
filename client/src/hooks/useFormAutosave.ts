import { useEffect } from 'react';

export const useFormAutosave = (formData: any, formId: string) => {
  // Save to localStorage whenever formData changes
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      localStorage.setItem(`job-form-draft-${formId}`, JSON.stringify(formData));
    }, 1000);
    
    return () => clearTimeout(saveTimeout);
  }, [formData, formId]);
  
  // Load from localStorage on initial render
  const loadSavedData = () => {
    const savedData = localStorage.getItem(`job-form-draft-${formId}`);
    if (savedData) {
      try {
        return JSON.parse(savedData);
      } catch (e) {
        console.error('Failed to parse saved form data');
        return null;
      }
    }
    return null;
  };
  
  // Clear saved data
  const clearSaved = () => {
    localStorage.removeItem(`job-form-draft-${formId}`);
  };
  
  return { loadSavedData, clearSaved };
};

export default useFormAutosave;

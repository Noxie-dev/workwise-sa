import { useEffect, useCallback } from "react";

const useFormAutosave = (formData, formId, enabled = true) => {
  useEffect(() => {
    if (!enabled) return;
    const saveTimeout = setTimeout(() => {
      localStorage.setItem(`job-form-draft-${formId}`, JSON.stringify(formData));
    }, 1000);
    return () => clearTimeout(saveTimeout);
  }, [formData, formId, enabled]);

  const loadSavedData = useCallback(() => {
    if (!enabled) return null;
    const savedData = localStorage.getItem(`job-form-draft-${formId}`);
    if (savedData) {
      try {
        return JSON.parse(savedData);
      } catch (e) {
        console.error('Failed to parse saved form data:', e);
        return null;
      }
    }
    return null;
  }, [formId, enabled]);

  const clearSavedData = useCallback(() => {
    localStorage.removeItem(`job-form-draft-${formId}`);
  }, [formId]);

  return { loadSavedData, clearSavedData };
};

export default useFormAutosave;

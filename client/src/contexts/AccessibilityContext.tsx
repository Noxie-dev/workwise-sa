import React, { createContext, useContext, useEffect, useReducer } from 'react';
import {
  applyAccessibilitySettings,
  loadAccessibilitySettings,
  saveAccessibilitySettings,
  ACCESSIBILITY_STORAGE_KEY,
} from '@/lib/accessibilityPreferences';
import { AccessibilitySettings, DEFAULT_ACCESSIBILITY_SETTINGS } from '@/types/accessibility';

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSetting: <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => void;
  resetSettings: () => void;
}

type AccessibilityAction =
  | {
      type: 'UPDATE_SETTING';
      key: keyof AccessibilitySettings;
      value: AccessibilitySettings[keyof AccessibilitySettings];
    }
  | { type: 'RESET_SETTINGS' }
  | { type: 'REPLACE_SETTINGS'; settings: AccessibilitySettings };

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

const accessibilityReducer = (
  state: AccessibilitySettings,
  action: AccessibilityAction
): AccessibilitySettings => {
  switch (action.type) {
    case 'UPDATE_SETTING':
      return { ...state, [action.key]: action.value };
    case 'RESET_SETTINGS':
      return DEFAULT_ACCESSIBILITY_SETTINGS;
    case 'REPLACE_SETTINGS':
      return action.settings;
    default:
      return state;
  }
};

export const AccessibilityProvider = ({ children }: { children: React.ReactNode }) => {
  const [settings, dispatch] = useReducer(
    accessibilityReducer,
    DEFAULT_ACCESSIBILITY_SETTINGS,
    loadAccessibilitySettings
  );

  useEffect(() => {
    applyAccessibilitySettings(settings);
    saveAccessibilitySettings(settings);
  }, [settings]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === ACCESSIBILITY_STORAGE_KEY) {
        dispatch({ type: 'REPLACE_SETTINGS', settings: loadAccessibilitySettings() });
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    const colorScheme = window.matchMedia('(prefers-color-scheme: dark)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleSystemPreferenceChange = () => applyAccessibilitySettings(settings);

    colorScheme.addEventListener('change', handleSystemPreferenceChange);
    reducedMotion.addEventListener('change', handleSystemPreferenceChange);
    return () => {
      colorScheme.removeEventListener('change', handleSystemPreferenceChange);
      reducedMotion.removeEventListener('change', handleSystemPreferenceChange);
    };
  }, [settings]);

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    dispatch({ type: 'UPDATE_SETTING', key, value });
  };

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        updateSetting,
        resetSettings: () => dispatch({ type: 'RESET_SETTINGS' }),
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

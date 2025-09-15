import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AccessibilitySettings, DEFAULT_ACCESSIBILITY_SETTINGS } from '@/types/accessibility';

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSetting: <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => void;
  resetSettings: () => void;
  applySettings: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

type AccessibilityAction =
  | { type: 'UPDATE_SETTING'; key: keyof AccessibilitySettings; value: any }
  | { type: 'RESET_SETTINGS' }
  | { type: 'LOAD_SETTINGS'; settings: AccessibilitySettings };

function accessibilityReducer(
  state: AccessibilitySettings,
  action: AccessibilityAction
): AccessibilitySettings {
  switch (action.type) {
    case 'UPDATE_SETTING':
      return { ...state, [action.key]: action.value };
    case 'RESET_SETTINGS':
      return DEFAULT_ACCESSIBILITY_SETTINGS;
    case 'LOAD_SETTINGS':
      return action.settings;
    default:
      return state;
  }
}

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [settings, dispatch] = useReducer(accessibilityReducer, DEFAULT_ACCESSIBILITY_SETTINGS);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('workwise-accessibility-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        dispatch({ type: 'LOAD_SETTINGS', settings: { ...DEFAULT_ACCESSIBILITY_SETTINGS, ...parsed } });
      } catch (error) {
        console.error('Failed to load accessibility settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('workwise-accessibility-settings', JSON.stringify(settings));
    applySettings();
  }, [settings]);

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    dispatch({ type: 'UPDATE_SETTING', key, value });
  };

  const resetSettings = () => {
    dispatch({ type: 'RESET_SETTINGS' });
  };

  const applySettings = () => {
    const root = document.documentElement;
    
    // Apply font size
    const fontSizeMap = {
      'small': '14px',
      'medium': '16px',
      'large': '18px',
      'extra-large': '20px',
    };
    root.style.setProperty('--base-font-size', fontSizeMap[settings.fontSize]);
    
    // Apply line spacing
    const lineSpacingMap = {
      'normal': '1.5',
      'looser': '1.8',
    };
    root.style.setProperty('--line-height', lineSpacingMap[settings.lineSpacing]);
    
    // Apply color theme
    root.setAttribute('data-theme', settings.colorTheme);
    
    // Apply motion preferences
    if (settings.reduceMotion) {
      root.style.setProperty('--animation-duration', '0.01ms');
      root.style.setProperty('--transition-duration', '0.01ms');
    } else {
      root.style.removeProperty('--animation-duration');
      root.style.removeProperty('--transition-duration');
    }
    
    // Apply tap target size
    if (settings.expandedTapTargets) {
      root.classList.add('expanded-tap-targets');
    } else {
      root.classList.remove('expanded-tap-targets');
    }
    
    // Apply enhanced focus outlines
    if (settings.enhancedFocusOutlines) {
      root.classList.add('enhanced-focus');
    } else {
      root.classList.remove('enhanced-focus');
    }
    
    // Apply simplified UI
    if (settings.simplifiedUI) {
      root.classList.add('simplified-ui');
    } else {
      root.classList.remove('simplified-ui');
    }
    
    // Apply one-handed mode
    if (settings.oneHandedMode) {
      root.classList.add('one-handed-mode');
    } else {
      root.classList.remove('one-handed-mode');
    }
  };

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        updateSetting,
        resetSettings,
        applySettings,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}
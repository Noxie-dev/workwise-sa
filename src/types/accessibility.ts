// Accessibility and user preference types
export interface AccessibilitySettings {
  // Visual & Text Settings
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  lineSpacing: 'normal' | 'looser';
  colorTheme: 'light' | 'dark' | 'high-contrast';
  
  // Media & Interaction Controls
  reduceMotion: boolean;
  autoPlayMedia: boolean;
  captionsEnabled: boolean;
  
  // Navigation & Input Preferences
  simplifiedUI: boolean;
  voiceNavigation: boolean;
  expandedTapTargets: boolean;
  
  // Screen Reader & Semantic Support
  ariaAnnouncements: boolean;
  enhancedFocusOutlines: boolean;
  
  // Reading Enhancements
  readingMode: boolean;
  textToSpeech: {
    enabled: boolean;
    speed: number; // 0.5 to 2.0
    voice: string;
  };
  
  // Mobile-Specific
  oneHandedMode: boolean;
  gestureAlternatives: boolean;
  orientationLock: 'none' | 'portrait' | 'landscape';
}

export interface UserPreferences extends AccessibilitySettings {
  // Profile-specific preferences
  profileVisibility: 'public' | 'private' | 'recruiters-only';
  notificationSettings: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  language: string;
  timezone: string;
}

export const DEFAULT_ACCESSIBILITY_SETTINGS: AccessibilitySettings = {
  fontSize: 'medium',
  lineSpacing: 'normal',
  colorTheme: 'light',
  reduceMotion: false,
  autoPlayMedia: true,
  captionsEnabled: false,
  simplifiedUI: false,
  voiceNavigation: false,
  expandedTapTargets: false,
  ariaAnnouncements: false,
  enhancedFocusOutlines: false,
  readingMode: false,
  textToSpeech: {
    enabled: false,
    speed: 1.0,
    voice: 'default',
  },
  oneHandedMode: false,
  gestureAlternatives: false,
  orientationLock: 'none',
};
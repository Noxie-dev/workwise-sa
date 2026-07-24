export const ACCESSIBILITY_SETTINGS_VERSION = 1 as const;

export type FontSizePreference = 'small' | 'medium' | 'large' | 'extra-large';
export type LineSpacingPreference = 'normal' | 'looser';
export type ColorThemePreference = 'system' | 'light' | 'dark' | 'high-contrast';
export type MotionPreference = 'system' | 'reduce' | 'allow';

export interface AccessibilitySettings {
  version: typeof ACCESSIBILITY_SETTINGS_VERSION;
  fontSize: FontSizePreference;
  lineSpacing: LineSpacingPreference;
  colorTheme: ColorThemePreference;
  motionPreference: MotionPreference;
  expandedTapTargets: boolean;
  enhancedFocusOutlines: boolean;
}

export const DEFAULT_ACCESSIBILITY_SETTINGS: AccessibilitySettings = {
  version: ACCESSIBILITY_SETTINGS_VERSION,
  fontSize: 'medium',
  lineSpacing: 'normal',
  colorTheme: 'system',
  motionPreference: 'system',
  expandedTapTargets: false,
  enhancedFocusOutlines: false,
};

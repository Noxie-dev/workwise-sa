import {
  ACCESSIBILITY_SETTINGS_VERSION,
  AccessibilitySettings,
  ColorThemePreference,
  DEFAULT_ACCESSIBILITY_SETTINGS,
  FontSizePreference,
  LineSpacingPreference,
  MotionPreference,
} from '@/types/accessibility';

export const ACCESSIBILITY_STORAGE_KEY = 'talentsquare-accessibility-settings';
const LEGACY_STORAGE_KEY = 'workwise-accessibility-settings';

const FONT_SIZES: FontSizePreference[] = ['small', 'medium', 'large', 'extra-large'];
const LINE_SPACINGS: LineSpacingPreference[] = ['normal', 'looser'];
const COLOR_THEMES: ColorThemePreference[] = ['system', 'light', 'dark', 'high-contrast'];
const MOTION_PREFERENCES: MotionPreference[] = ['system', 'reduce', 'allow'];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const includes = <T extends string>(values: T[], value: unknown): value is T =>
  typeof value === 'string' && values.includes(value as T);

export const parseAccessibilitySettings = (value: unknown): AccessibilitySettings => {
  if (!isRecord(value)) {
    return DEFAULT_ACCESSIBILITY_SETTINGS;
  }

  const legacyReduceMotion =
    typeof value.reduceMotion === 'boolean'
      ? value.reduceMotion
        ? 'reduce'
        : 'system'
      : undefined;

  return {
    version: ACCESSIBILITY_SETTINGS_VERSION,
    fontSize: includes(FONT_SIZES, value.fontSize)
      ? value.fontSize
      : DEFAULT_ACCESSIBILITY_SETTINGS.fontSize,
    lineSpacing: includes(LINE_SPACINGS, value.lineSpacing)
      ? value.lineSpacing
      : DEFAULT_ACCESSIBILITY_SETTINGS.lineSpacing,
    colorTheme: includes(COLOR_THEMES, value.colorTheme)
      ? value.colorTheme
      : DEFAULT_ACCESSIBILITY_SETTINGS.colorTheme,
    motionPreference: includes(MOTION_PREFERENCES, value.motionPreference)
      ? value.motionPreference
      : (legacyReduceMotion ?? DEFAULT_ACCESSIBILITY_SETTINGS.motionPreference),
    expandedTapTargets:
      typeof value.expandedTapTargets === 'boolean'
        ? value.expandedTapTargets
        : DEFAULT_ACCESSIBILITY_SETTINGS.expandedTapTargets,
    enhancedFocusOutlines:
      typeof value.enhancedFocusOutlines === 'boolean'
        ? value.enhancedFocusOutlines
        : DEFAULT_ACCESSIBILITY_SETTINGS.enhancedFocusOutlines,
  };
};

const readStorageValue = (key: string): unknown => {
  try {
    const rawValue = window.localStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : undefined;
  } catch {
    return undefined;
  }
};

export const loadAccessibilitySettings = (): AccessibilitySettings => {
  if (typeof window === 'undefined') {
    return DEFAULT_ACCESSIBILITY_SETTINGS;
  }

  const currentValue = readStorageValue(ACCESSIBILITY_STORAGE_KEY);
  if (currentValue !== undefined) {
    return parseAccessibilitySettings(currentValue);
  }

  return parseAccessibilitySettings(readStorageValue(LEGACY_STORAGE_KEY));
};

export const saveAccessibilitySettings = (settings: AccessibilitySettings): void => {
  try {
    window.localStorage.setItem(ACCESSIBILITY_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Preferences remain active for this session when storage is unavailable.
  }
};

const systemPrefersDark = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;

const systemPrefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const applyAccessibilitySettings = (settings: AccessibilitySettings): void => {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  const fontSizeMap: Record<FontSizePreference, string> = {
    small: '0.875rem',
    medium: '1rem',
    large: '1.125rem',
    'extra-large': '1.25rem',
  };
  const lineSpacingMap: Record<LineSpacingPreference, string> = {
    normal: '1.5',
    looser: '1.8',
  };
  const resolvedTheme =
    settings.colorTheme === 'system'
      ? systemPrefersDark()
        ? 'dark'
        : 'light'
      : settings.colorTheme;
  const reduceMotion =
    settings.motionPreference === 'reduce' ||
    (settings.motionPreference === 'system' && systemPrefersReducedMotion());

  root.style.setProperty('--base-font-size', fontSizeMap[settings.fontSize]);
  root.style.setProperty('--line-height', lineSpacingMap[settings.lineSpacing]);
  root.dataset.theme = resolvedTheme;
  root.classList.toggle('dark', resolvedTheme === 'dark');
  root.classList.toggle('reduce-motion', reduceMotion);
  root.classList.toggle('expanded-tap-targets', settings.expandedTapTargets);
  root.classList.toggle('enhanced-focus', settings.enhancedFocusOutlines);
};

export const initializeAccessibilityPreferences = (): AccessibilitySettings => {
  const settings = loadAccessibilitySettings();
  applyAccessibilitySettings(settings);
  return settings;
};

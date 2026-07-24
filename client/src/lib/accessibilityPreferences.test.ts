import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ACCESSIBILITY_STORAGE_KEY,
  applyAccessibilitySettings,
  loadAccessibilitySettings,
  parseAccessibilitySettings,
  saveAccessibilitySettings,
} from './accessibilityPreferences';
import { DEFAULT_ACCESSIBILITY_SETTINGS } from '@/types/accessibility';

describe('accessibility preferences', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.className = '';
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('style');
  });

  it('validates corrupt and unknown stored values', () => {
    expect(parseAccessibilitySettings(null)).toEqual(DEFAULT_ACCESSIBILITY_SETTINGS);
    expect(
      parseAccessibilitySettings({
        fontSize: 'enormous',
        lineSpacing: 'invalid',
        colorTheme: 'sepia',
        expandedTapTargets: 'yes',
      })
    ).toEqual(DEFAULT_ACCESSIBILITY_SETTINGS);
  });

  it('migrates supported values from the legacy schema', () => {
    window.localStorage.setItem(
      'workwise-accessibility-settings',
      JSON.stringify({
        fontSize: 'large',
        lineSpacing: 'looser',
        colorTheme: 'high-contrast',
        reduceMotion: true,
        expandedTapTargets: true,
        enhancedFocusOutlines: true,
      })
    );

    expect(loadAccessibilitySettings()).toMatchObject({
      version: 1,
      fontSize: 'large',
      lineSpacing: 'looser',
      colorTheme: 'high-contrast',
      motionPreference: 'reduce',
      expandedTapTargets: true,
      enhancedFocusOutlines: true,
    });
  });

  it('safely persists and applies validated preferences', () => {
    const settings = {
      ...DEFAULT_ACCESSIBILITY_SETTINGS,
      fontSize: 'extra-large' as const,
      lineSpacing: 'looser' as const,
      colorTheme: 'high-contrast' as const,
      motionPreference: 'reduce' as const,
      expandedTapTargets: true,
      enhancedFocusOutlines: true,
    };

    saveAccessibilitySettings(settings);
    applyAccessibilitySettings(settings);

    expect(JSON.parse(window.localStorage.getItem(ACCESSIBILITY_STORAGE_KEY) ?? '{}')).toEqual(
      settings
    );
    expect(document.documentElement.dataset.theme).toBe('high-contrast');
    expect(document.documentElement.classList.contains('reduce-motion')).toBe(true);
    expect(document.documentElement.classList.contains('expanded-tap-targets')).toBe(true);
    expect(document.documentElement.classList.contains('enhanced-focus')).toBe(true);
    expect(document.documentElement.style.getPropertyValue('--base-font-size')).toBe('1.25rem');
    expect(document.documentElement.style.getPropertyValue('--line-height')).toBe('1.8');
  });

  it('falls back safely when localStorage contains invalid JSON', () => {
    window.localStorage.setItem(ACCESSIBILITY_STORAGE_KEY, '{not-json');
    expect(loadAccessibilitySettings()).toEqual(DEFAULT_ACCESSIBILITY_SETTINGS);
  });

  it('continues when browser storage rejects writes', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage unavailable');
    });

    expect(() => saveAccessibilitySettings(DEFAULT_ACCESSIBILITY_SETTINGS)).not.toThrow();
    setItem.mockRestore();
  });
});

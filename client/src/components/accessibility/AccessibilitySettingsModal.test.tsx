import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { beforeEach, describe, expect, it } from 'vitest';
import { AccessibilityProvider } from '@/contexts/AccessibilityContext';
import { ACCESSIBILITY_STORAGE_KEY } from '@/lib/accessibilityPreferences';
import AccessibilitySettingsModal from './AccessibilitySettingsModal';

const renderModal = () =>
  render(
    <AccessibilityProvider>
      <AccessibilitySettingsModal onOpenChange={() => undefined} open />
    </AccessibilityProvider>
  );

describe('AccessibilitySettingsModal', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('has labelled controls, selected states and no automated axe violations', async () => {
    renderModal();

    expect(screen.getByRole('dialog', { name: 'Accessibility preferences' })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Larger interaction targets' })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Enhanced focus indicators' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Default' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'System' })).toHaveAttribute('aria-checked', 'true');

    const results = await axe.run(document.body);
    expect(results.violations).toEqual([]);
  });

  it('applies and stores a preference selected with the keyboard', async () => {
    const user = userEvent.setup();
    renderModal();

    const largeText = screen.getByRole('radio', { name: 'Large' });
    largeText.focus();
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(document.documentElement.style.getPropertyValue('--base-font-size')).toBe('1.125rem');
      const saved = JSON.parse(
        window.localStorage.getItem(ACCESSIBILITY_STORAGE_KEY) ?? '{}'
      ) as Record<string, unknown>;
      expect(saved.fontSize).toBe('large');
    });
  });
});

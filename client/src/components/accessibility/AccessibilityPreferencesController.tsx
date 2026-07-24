import { useEffect, useState } from 'react';
import AccessibilitySettingsModal from './AccessibilitySettingsModal';

export const OPEN_ACCESSIBILITY_SETTINGS_EVENT = 'open-accessibility-settings';

const AccessibilityPreferencesController = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const openSettings = () => setOpen(true);
    window.addEventListener(OPEN_ACCESSIBILITY_SETTINGS_EVENT, openSettings);
    return () => window.removeEventListener(OPEN_ACCESSIBILITY_SETTINGS_EVENT, openSettings);
  }, []);

  return <AccessibilitySettingsModal onOpenChange={setOpen} open={open} />;
};

export const openAccessibilityPreferences = () => {
  window.dispatchEvent(new CustomEvent(OPEN_ACCESSIBILITY_SETTINGS_EVENT));
};

export default AccessibilityPreferencesController;

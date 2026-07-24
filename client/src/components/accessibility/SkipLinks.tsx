import { openAccessibilityPreferences } from './AccessibilityPreferencesController';

const SkipLinks = () => (
  <nav aria-label="Skip links" className="skip-links">
    <a className="skip-link" href="#main-content">
      Skip to main content
    </a>
    <a className="skip-link" href="#navigation">
      Skip to navigation
    </a>
    <button className="skip-link" onClick={openAccessibilityPreferences} type="button">
      Accessibility preferences
    </button>
  </nav>
);

export default SkipLinks;

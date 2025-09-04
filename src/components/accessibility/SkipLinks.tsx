import React from 'react';

export default function SkipLinks() {
  return (
    <div className="sr-only focus-within:not-sr-only">
      <a
        href="#main-content"
        className="skip-link absolute top-0 left-0 bg-blue-600 text-white px-4 py-2 rounded-br-md z-50 transform -translate-y-full focus:translate-y-0 transition-transform"
      >
        Skip to main content
      </a>
      <a
        href="#navigation"
        className="skip-link absolute top-0 left-24 bg-blue-600 text-white px-4 py-2 rounded-br-md z-50 transform -translate-y-full focus:translate-y-0 transition-transform"
      >
        Skip to navigation
      </a>
      <a
        href="#accessibility-settings"
        className="skip-link absolute top-0 left-48 bg-blue-600 text-white px-4 py-2 rounded-br-md z-50 transform -translate-y-full focus:translate-y-0 transition-transform"
        onClick={() => {
          // Trigger accessibility settings modal
          const event = new CustomEvent('open-accessibility-settings');
          window.dispatchEvent(event);
        }}
      >
        Accessibility settings
      </a>
    </div>
  );
}
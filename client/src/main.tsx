import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './core/app';
import './index.css';
import './styles/accessibility.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { registerServiceWorker } from '@/lib/registerServiceWorker';
import { initializeAccessibilityPreferences } from '@/lib/accessibilityPreferences';

/**
 * Main entry point for the TalentSquare application.
 * Global providers are owned by the canonical app shell in core/app.tsx.
 */

// Add any additional custom styles that aren't covered by Tailwind
const style = document.createElement('style');
style.textContent = `
  .job-card:hover {
    transform: translateY(-2px);
    transition: all 0.3s ease;
  }
`;
document.head.appendChild(style);
initializeAccessibilityPreferences();
registerServiceWorker();

// Find the root element
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element with id "root". Please check your HTML file.');
}

// Create the root using React 18's createRoot API
const root = createRoot(rootElement);

// Render the application
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

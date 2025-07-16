
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { v4 as uuidv4 } from 'uuid'; // Required for useConfig.ts to generate IDs

// Ensure uuid is available. It's used by useConfig for generating IDs.
// This check helps confirm it's bundled and available.
if (typeof uuidv4 !== 'function') {
  console.error("uuidv4 is not loaded correctly. This should not happen.");
}

const mountReactApp = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    // Log a more detailed error if this still happens
    console.error("FATAL: DOM element with ID 'root' not found. React app cannot mount. Check public/index.html and ensure it's correctly served.");
    // Optionally re-throw or handle as a critical failure
    // throw new Error("Could not find root element to mount to, even after DOM readiness check.");
    return;
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

// Check if the DOM is already loaded/interactive, otherwise wait for DOMContentLoaded.
// This is a robust way to handle script execution timing relative to DOM parsing.
if (document.readyState === 'loading') {
  // Loading hasn't finished yet
  document.addEventListener('DOMContentLoaded', mountReactApp);
} else {
  // DOMContentLoaded has already fired or document is already interactive/complete
  mountReactApp();
}
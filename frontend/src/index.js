import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register the service worker
serviceWorkerRegistration.register({
  onSuccess: (registration) => {
    console.log('Service worker registered successfully:', registration);
  },
  onUpdate: (registration) => {
    console.log('Service worker updated:', registration);
  }
});

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log('==== MAIN.TSX INITIALIZING ====');

// Create root and render app
const rootElement = document.getElementById('root');
if (rootElement) {
  console.log('Root element found, creating React root');
  const root = createRoot(rootElement);
  
  console.log('Rendering App component');
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  
  console.log('App render initiated');
} else {
  console.error('Root element not found');
}

console.log('==== MAIN.TSX INITIALIZATION COMPLETE ====');

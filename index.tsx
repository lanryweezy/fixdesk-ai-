
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ToastProvider } from './services/ToastContext';
import { Buffer } from 'buffer';

// simple-peer depends on Buffer and global
if (typeof window !== 'undefined') {
  window.Buffer = window.Buffer || Buffer;
  (window as any).global = window;
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ToastProvider>
        <App />
    </ToastProvider>
  </React.StrictMode>
);


import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ToastProvider } from './services/ToastContext';

// simple-peer depends on Buffer, providing a minimal shim for the browser environment
if (typeof window !== 'undefined' && !window.Buffer) {
  (window as any).Buffer = {
    isBuffer: () => false,
  };
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

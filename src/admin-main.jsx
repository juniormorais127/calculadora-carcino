import React from 'react';
import ReactDOM from 'react-dom/client';
import AccountProvider from './components/AccountProvider.jsx';
import AdminPortal from './components/AdminPortal.jsx';
import './index.css';
import { isNativeApp } from './services/deviceFiles.js';
import AppUpdatesProvider, { AppUpdateNotice } from './components/AppUpdates.jsx';
if (import.meta.env.VITE_ANDROID_TEST === 'true' && isNativeApp()) import('./services/androidDiagnostics.js');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><AppUpdatesProvider><AppUpdateNotice /><AccountProvider syncProduction={false}><AdminPortal /></AccountProvider></AppUpdatesProvider></React.StrictMode>
);

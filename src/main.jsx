import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import AccountProvider from "./components/AccountProvider.jsx";
import "./index.css";
import { isNativeApp } from './services/deviceFiles.js';
import AppUpdatesProvider, { AppUpdateNotice } from './components/AppUpdates.jsx';
if (import.meta.env.VITE_ANDROID_TEST === 'true' && isNativeApp()) import('./services/androidDiagnostics.js');

if (import.meta.env.PROD && !isNativeApp() && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).then(reg => {
      reg.update();
    }).catch(error => {
      console.error('Não foi possível preparar o acesso offline:', error);
    });
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppUpdatesProvider><AppUpdateNotice /><AccountProvider><App /></AccountProvider></AppUpdatesProvider>
  </React.StrictMode>
);

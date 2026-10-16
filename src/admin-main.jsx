import React from 'react';
import ReactDOM from 'react-dom/client';
import AccountProvider from './components/AccountProvider.jsx';
import AdminPortal from './components/AdminPortal.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><AccountProvider syncProduction={false}><AdminPortal /></AccountProvider></React.StrictMode>
);

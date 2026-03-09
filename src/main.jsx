import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { debugLog } from './lib/debugLog.js';
import App from './App.jsx';
import './index.css';
import i18n from './setupI18n.js';
import { AuthProvider } from './context/AuthContext.jsx';
import { OrgProvider } from './context/OrgContext.jsx';

// #region agent log
const _ce = console.error;
console.error = (...args) => {
  _ce.apply(console, args);
  debugLog('main.jsx:console.error', 'console.error', { args: args.map((a) => String(a)) }, 'H5');
};
debugLog('main.jsx:boot', 'app_boot', {}, 'H5');
// #endregion

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <BrowserRouter>
        <AuthProvider>
          <OrgProvider>
            <App />
          </OrgProvider>
        </AuthProvider>
      </BrowserRouter>
    </I18nextProvider>
  </React.StrictMode>
);



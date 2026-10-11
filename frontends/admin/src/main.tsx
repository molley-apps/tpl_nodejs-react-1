import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import { Experimental_CssVarsProvider as CssVarsProvider } from '@mui/material/styles';
import App from './App';
import theme from './theme';
import startup from '@/utils/startup.ts';

startup();

// Use VITE_BASE_PATH from environment, fallback to /admin for local dev
// Remove trailing slash for React Router compatibility.
const basename = (import.meta.env.VITE_BASE_PATH || '/admin').replace(/\/$/, '');

console.log('🚀 Admin App Starting');
console.log('📍 Current pathname:', window.location.pathname);
console.log('📍 VITE_BASE_PATH:', import.meta.env.VITE_BASE_PATH);
console.log('📍 Router basename:', basename);
console.log('📍 Root element:', document.getElementById('root'));

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <CssVarsProvider theme={theme}>
        <CssBaseline />
        <App />
      </CssVarsProvider>
    </BrowserRouter>
  </React.StrictMode>
);

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import startup from './utils/startup';
import './styles/index.css';

startup();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import * as serviceWorker from './serviceWorker';
import { CartProvider, CompareProvider, ProfileProvider } from './api/stateContext';
import { ensurePushSubscription } from './pushClient';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <CartProvider>
    <CompareProvider>
      <ProfileProvider>
        <App />
      </ProfileProvider>
    </CompareProvider>
  </CartProvider>
);

serviceWorker.register();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then(() => {
    ensurePushSubscription();
  });
}

reportWebVitals();
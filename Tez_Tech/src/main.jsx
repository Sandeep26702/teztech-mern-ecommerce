import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { QuoteProvider } from './context/QuoteContext.jsx'; 

// ❌ Yahan se Toaster ka import hata diya hai

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <QuoteProvider> 
            {/* ❌ Yahan se <Toaster /> hata diya hai taaki double popup na aaye */}
            <App />
          </QuoteProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
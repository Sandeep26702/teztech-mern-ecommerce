import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { QuoteProvider } from './context/QuoteContext.jsx'; // 🚀 Yeh naya import add kiya hai
import { Toaster } from 'react-hot-toast'; // 🔥 Toaster yahan import kiya hai

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <QuoteProvider> {/* 📄 QuoteProvider se wrap kar diya */}
            <Toaster position="top-right" reverseOrder={false} /> {/* 🔥 Global Toaster */}
            <App />
          </QuoteProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
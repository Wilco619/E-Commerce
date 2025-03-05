import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import AppRoutes from './App.jsx';
import { SessionProvider } from './authentication/SessionContext';
import { AuthProvider } from './authentication/AuthContext';
import { CartProvider } from './authentication/CartContext.jsx';
import Header from './components/layout/Header.jsx';
import Footer from './components/layout/Footer.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <SessionProvider>
        <AuthProvider>
          <CartProvider>
            <Header />
            <main>
              <AppRoutes />
            </main>
            <Footer />
          </CartProvider>
        </AuthProvider>
      </SessionProvider>
    </BrowserRouter>
  </StrictMode>,
);
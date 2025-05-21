import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';
import './index.css';
import App from './App.jsx';
import { SessionProvider } from './authentication/SessionContext';
import { AuthProvider } from './authentication/AuthContext';
import { CartProvider } from './authentication/CartContext.jsx';
import Header from './components/layout/Header.jsx';
import Footer from './components/layout/Footer.jsx';
import { ErrorBoundary } from 'react-error-boundary';

import { CookieProvider } from './authentication/CookieContext';
import CookieConsent from './components/CookieConsent';
import { WishlistProvider } from './authentication/WishlistContext';

// Simple error fallback component
const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <div className="error-container">
    <h2>Something went wrong</h2>
    <p>{error.message}</p>
    <button onClick={resetErrorBoundary}>Try again</button>
  </div>
);

// Update the refresh header function
export const refreshHeader = () => {
  const event = new CustomEvent('auth-state-changed', {
    detail: {
      timestamp: Date.now()
    }
  });
  window.dispatchEvent(event);
};

const root = createRoot(document.getElementById('root'));

root.render(
  <StrictMode>
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <BrowserRouter>
        <SnackbarProvider maxSnack={3}>
          <SessionProvider>
            <AuthProvider>
              <CartProvider>
                <WishlistProvider>
                  <CookieProvider>
                    <Header />
                    <App />
                    <Footer />
                    <CookieConsent />
                  </CookieProvider>
                </WishlistProvider>
              </CartProvider>
            </AuthProvider>
          </SessionProvider>
        </SnackbarProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);
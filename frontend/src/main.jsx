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

import { CookieProvider } from './contexts/CookieContext';
import CookieConsent from './components/CookieConsent';

// Simple error fallback component
const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <div className="error-container">
    <h2>Something went wrong</h2>
    <p>{error.message}</p>
    <button onClick={resetErrorBoundary}>Try again</button>
  </div>
);

// Create custom event for header refreshing
export const refreshHeader = () => {
  window.dispatchEvent(new Event('auth-state-changed'));
};

const root = createRoot(document.getElementById('root'));

root.render(
  <StrictMode>
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <BrowserRouter>
        <SessionProvider>
          <CookieProvider>
            <AuthProvider>
              <CartProvider>
                <SnackbarProvider maxSnack={3}>
                  <Header />
                  <App />
                  <Footer />
                  <CookieConsent />
                </SnackbarProvider>
              </CartProvider>
            </AuthProvider>
          </CookieProvider>
        </SessionProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);
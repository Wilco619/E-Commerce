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

// Create a unified app state event system
export const refreshAppState = (type = 'auth', detail = {}) => {
  console.log(`Broadcasting app state change: ${type}`, detail);
  const event = new CustomEvent('app-state-changed', {
    detail: {
      type,
      timestamp: Date.now(),
      ...detail
    }
  });
  window.dispatchEvent(event);
  
  // For debugging
  console.log('Event dispatched:', event);
};

// For backwards compatibility
export const refreshHeader = () => {
  refreshAppState('auth');
};

// Initialize any global handlers needed
const setupGlobalHandlers = () => {
  // Expose window functions for debugging
  window.refreshAppState = refreshAppState;
  
  // Log all app-state-changed events for debugging
  window.addEventListener('app-state-changed', (event) => {
    console.log('App state change detected:', event.detail);
  });
  
  // Handle API errors
  window.addEventListener('unhandledrejection', event => {
    if (event.reason?.response?.status === 401) {
      // If there's an unauthorized error in background
      console.error('Unauthorized API call:', event.reason);
    }
  });
};

// Make sure to call this before rendering
setupGlobalHandlers();

const root = createRoot(document.getElementById('root'));

root.render(
  <StrictMode>
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <BrowserRouter>
        <SnackbarProvider maxSnack={3}>
          {/* CookieProvider first as it doesn't depend on other contexts */}
          <CookieProvider>
            {/* SessionProvider second as auth and cart depend on it */}
            <SessionProvider>
              {/* Auth provider third as cart depends on auth state */}
              <AuthProvider>
                {/* Cart provider depends on auth state */}
                <CartProvider>
                  {/* Wishlist provider depends on auth and cart */}
                  <WishlistProvider>
                    <Header />
                    <App />
                    <Footer />
                    <CookieConsent />
                  </WishlistProvider>
                </CartProvider>
              </AuthProvider>
            </SessionProvider>
          </CookieProvider>
        </SnackbarProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);
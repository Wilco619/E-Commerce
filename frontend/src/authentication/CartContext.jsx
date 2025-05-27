import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useSnackbar } from 'notistack';
import { cartAPI } from '../services/api';
import { useAuth } from './AuthContext';
import { GUEST_SESSION_ID } from '../services/constants';
import { getCookie } from '../utils/cookieUtils';

// Create a consistent event name
const APP_STATE_CHANGED = 'app-state-changed';

export const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Use ref to track if migration is in progress
  const migrationInProgress = useRef(false);

  const fetchCart = useCallback(async () => {
    // Don't fetch if a migration is in progress
    if (migrationInProgress.current) {
      return null;
    }
    
    try {
      setLoading(true);
      setError(null);

      // Ensure guest session exists if not authenticated
      if (!isAuthenticated && !sessionStorage.getItem(GUEST_SESSION_ID)) {
        const newSessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem(GUEST_SESSION_ID, newSessionId);
      }

      const response = await cartAPI.getCurrentCart();
      setCart(response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching cart:', err);
      setError(err.message);
      enqueueSnackbar('Failed to fetch cart', { variant: 'error' });
      return null;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, enqueueSnackbar]);

  const refreshCart = useCallback(async () => {
    if (migrationInProgress.current) {
      return null;
    }
    
    try {
      setLoading(true);
      const response = await cartAPI.getCurrentCart();
      setCart(response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to refresh cart:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const addToCart = async (productId, quantity) => {
    try {
      if (migrationInProgress.current) {
        throw new Error("Cart migration in progress, please try again shortly");
      }
      
      setLoading(true);
      const cart = await cartAPI.addItem({ 
        product_id: productId, 
        quantity 
      });
      
      if (cart.data.error) {
        throw new Error(cart.data.error);
      }
      
      await fetchCart();
      return true;
    } catch (err) {
      console.error('Error adding to cart:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateCartItem = async (cartItemId, quantity) => {
    try {
      if (migrationInProgress.current) {
        throw new Error("Cart migration in progress, please try again shortly");
      }
      
      setLoading(true);
      await cartAPI.updateItem({ cart_item_id: cartItemId, quantity });
      await fetchCart();
    } catch (err) {
      setError(err.message);
      enqueueSnackbar('Failed to update item', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (cartItemId) => {
    try {
      if (migrationInProgress.current) {
        throw new Error("Cart migration in progress, please try again shortly");
      }
      
      setLoading(true);
      await cartAPI.removeItem(cartItemId);
      await fetchCart();
      enqueueSnackbar('Item removed from cart', { variant: 'success' });
    } catch (err) {
      setError(err.message);
      enqueueSnackbar('Failed to remove item', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      if (migrationInProgress.current) {
        throw new Error("Cart migration in progress, please try again shortly");
      }
      
      setLoading(true);
      await cartAPI.clearCart();
      await fetchCart();
      enqueueSnackbar('Cart cleared', { variant: 'success' });
    } catch (err) {
      setError(err.message);
      enqueueSnackbar('Failed to clear cart', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Function to handle cart migration
  const migrateGuestCart = useCallback(async () => {
    const sessionId = sessionStorage.getItem(GUEST_SESSION_ID);
    if (!sessionId || !isAuthenticated) {
      return false;
    }
    
    try {
      migrationInProgress.current = true;
      setLoading(true);
      
      const result = await cartAPI.migrateCart(sessionId);
      
      // Clear guest session
      sessionStorage.removeItem(GUEST_SESSION_ID);
      
      if (result.data && !result.data.error) {
        enqueueSnackbar('Cart transferred successfully', { variant: 'success' });
        await fetchCart();
        return true;
      } else {
        throw new Error(result.data?.error || 'Cart migration failed');
      }
    } catch (err) {
      console.error('Cart migration failed:', err);
      enqueueSnackbar('Failed to transfer cart', { variant: 'error' });
      return false;
    } finally {
      migrationInProgress.current = false;
      setLoading(false);
    }
  }, [fetchCart, isAuthenticated, enqueueSnackbar]);

  // Handle initial fetch
  useEffect(() => {
    fetchCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle authentication state changes
  useEffect(() => {
    const handleAppStateChange = async (event) => {
      const { type } = event.detail;
      
      if (type === 'auth') {
        // Handle auth state change
        if (isAuthenticated) {
          // If just logged in and we have a session ID, migrate cart
          const sessionId = sessionStorage.getItem(GUEST_SESSION_ID);
          const justAuthenticated = sessionStorage.getItem('justAuthenticated');
          
          if (sessionId && justAuthenticated) {
            sessionStorage.removeItem('justAuthenticated');
            await migrateGuestCart();
          } else {
            // Just refresh cart if no migration needed
            await refreshCart();
          }
        } else {
          // User logged out, reset cart state
          setCart(null);
          await fetchCart(); // This will create a new guest cart if needed
        }
      }
    };

    window.addEventListener(APP_STATE_CHANGED, handleAppStateChange);
    return () => window.removeEventListener(APP_STATE_CHANGED, handleAppStateChange);
  }, [isAuthenticated, fetchCart, refreshCart, migrateGuestCart]);

  // For backward compatibility with existing code
  useEffect(() => {
    const handleLegacyAuthStateChange = async () => {
      if (isAuthenticated) {
        await migrateGuestCart();
      } else {
        // Reset cart when logged out
        setCart(null);
        await fetchCart();
      }
    };

    window.addEventListener('auth-state-changed', handleLegacyAuthStateChange);
    return () => window.removeEventListener('auth-state-changed', handleLegacyAuthStateChange);
  }, [isAuthenticated, fetchCart, migrateGuestCart]);

  const value = {
    cart,
    loading,
    error,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    fetchCart,
    refreshCart,
    migrateGuestCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

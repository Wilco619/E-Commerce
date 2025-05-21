import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useSnackbar } from 'notistack';
import { cartAPI } from '../services/api';
import { useAuth } from './AuthContext';
import { GUEST_SESSION_ID } from '../services/constants';
import { getCookie } from '../utils/cookieUtils';

export const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCart = useCallback(async () => {
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
    } catch (err) {
      console.error('Error fetching cart:', err);
      setError(err.message);
      enqueueSnackbar('Failed to fetch cart', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, enqueueSnackbar]);

  const refreshCart = useCallback(async () => {
    try {
      setLoading(true);
      const response = await cartAPI.getCurrentCart();
      setCart(response.data);
    } catch (error) {
      console.error('Failed to refresh cart:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addToCart = async (productId, quantity) => {
    try {
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

  // Handle cart migration on login
  useEffect(() => {
    if (isAuthenticated) {
      const sessionId = sessionStorage.getItem(GUEST_SESSION_ID);
      if (sessionId) {
        setLoading(true);
        cartAPI.migrateCart(sessionId)
          .then(() => {
            sessionStorage.removeItem(GUEST_SESSION_ID);
            fetchCart();
            enqueueSnackbar('Cart transferred successfully', { variant: 'success' });
          })
          .catch((err) => {
            console.error('Cart migration failed:', err);
            enqueueSnackbar('Failed to transfer cart', { variant: 'error' });
          })
          .finally(() => {
            setLoading(false);
          });
      }
    }
  }, [isAuthenticated, fetchCart, enqueueSnackbar]);

  // Initial cart fetch
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Modify the auth state change handler
  useEffect(() => {
    const handleAuthStateChange = async () => {
      if (isAuthenticated) {
        setLoading(true);
        try {
          const sessionId = sessionStorage.getItem(GUEST_SESSION_ID);
          if (sessionId) {
            await cartAPI.migrateCart(sessionId);
            sessionStorage.removeItem(GUEST_SESSION_ID);
          }
          const response = await cartAPI.getCurrentCart();
          setCart(response.data);
        } catch (error) {
          console.error('Error handling auth state change:', error);
          setError(error.message);
        } finally {
          setLoading(false);
        }
      } else {
        // Clear cart when logged out
        setCart(null);
      }
    };

    window.addEventListener('auth-state-changed', handleAuthStateChange);
    return () => window.removeEventListener('auth-state-changed', handleAuthStateChange);
  }, [isAuthenticated]);

  const value = {
    cart,
    loading,
    error,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    fetchCart,
    refreshCart
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

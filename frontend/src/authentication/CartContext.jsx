import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../authentication/AuthContext';
import { useSession } from './SessionContext';
import { productsAPI } from '../services/api';

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Add error state
  const [sessionId] = useState(() => {
    return sessionStorage.getItem('guestSessionId') || 
           `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  });

  useEffect(() => {
    const initializeCart = async () => {
      try {
        setLoading(true);
        setError(null); // Reset error state
        if (user) {
          // Fetch user cart
          const response = await productsAPI.getUserCart();
          setCart(response.data);
        } else {
          // Store session ID if not exists
          if (!sessionStorage.getItem('guestSessionId')) {
            sessionStorage.setItem('guestSessionId', sessionId);
          }
          // Fetch guest cart
          const response = await productsAPI.getGuestCart(sessionId);
          setCart(response.data);
        }
      } catch (error) {
        console.error('Error initializing cart:', error);
        setError(error.message || 'Failed to initialize cart');
      } finally {
        setLoading(false);
      }
    };

    initializeCart();
  }, [user, sessionId]);

  const fetchCart = async () => {
    if (!user && !sessionId) return;

    try {
      setLoading(true);
      setError(null);
      const response = user
        ? await productsAPI.getUserCart()
        : await productsAPI.getGuestCart(sessionId);
      setCart(response.data);
    } catch (err) {
      console.error('Error fetching cart:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [user, sessionId]);

  useEffect(() => {
    const migrateCartIfNeeded = async () => {
      try {
        // Only attempt migration if we have a session ID and user just logged in
        if (user && sessionId) {
          const guestCart = await productsAPI.getGuestCart(sessionId);
          
          // Only migrate if guest cart exists and has items
          if (guestCart?.data?.items?.length > 0) {
            await productsAPI.migrateGuestCart(sessionId);
            // Clear session ID after successful migration
            localStorage.removeItem('userSessionId');
          }
        }
      } catch (error) {
        // Ignore "cart not found" errors as they're expected for new users
        if (!error.response?.data?.error?.includes('not found')) {
          console.error('Cart migration error:', error);
        }
      }
    };

    migrateCartIfNeeded();
  }, [user, sessionId]);

  const addToCart = async (productId, quantity = 1) => {
    try {
      if (user) {
        // For authenticated users
        const response = await productsAPI.addToUserCart(productId, quantity);
        setCart(response.data);
      } else {
        // For guest users
        const response = await productsAPI.addToGuestCart(sessionId, productId, quantity);
        setCart(response.data);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      setLoading(true);
      if (user) {
        await productsAPI.removeFromUserCart(itemId);
      } else {
        await productsAPI.removeFromGuestCart(sessionId, itemId);
      }
      await fetchCart(); // Refresh cart after removal
      return true;
    } catch (error) {
      console.error('Error removing from cart:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateCartItem = async (itemId, quantity) => {
    try {
      setLoading(true);
      if (user) {
        await productsAPI.updateUserCartItem(itemId, quantity);
      } else {
        await productsAPI.updateGuestCartItem(sessionId, itemId, quantity);
      }
      await fetchCart(); // Refresh cart after update
      return true;
    } catch (error) {
      console.error('Error updating cart item:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      setLoading(true);
      if (user) {
        await productsAPI.clearUserCart();
      } else {
        await productsAPI.clearGuestCart(sessionId);
      }
      setCart(null);
      return true;
    } catch (error) {
      console.error('Error clearing cart:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    cart,
    loading,
    error,
    setCart,
    fetchCart,
    addToCart,
    removeFromCart,
    updateCartItem,
    clearCart,
    refreshCart: fetchCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

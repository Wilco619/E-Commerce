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
  // Initialize state first
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get context values after initialization
  const auth = useAuth();
  const { sessionId } = useSession();
  const isAuthenticated = auth?.isAuthenticated || false;

  const fetchCart = async () => {
    if (!isAuthenticated && !sessionId) return;

    try {
      setLoading(true);
      setError(null);
      const response = isAuthenticated
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
  }, [isAuthenticated, sessionId]);

  useEffect(() => {
    const migrateCartIfNeeded = async () => {
      try {
        // Only attempt migration if we have a session ID and user just logged in
        if (isAuthenticated && sessionId) {
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
  }, [isAuthenticated, sessionId]);

  const addToCart = async (productId, quantity = 1) => {
    try {
      setLoading(true);
      const response = isAuthenticated
        ? await productsAPI.addToUserCart(productId, quantity)
        : await productsAPI.addToGuestCart(sessionId, productId, quantity);
      
      setCart(response.data);
      return true;
    } catch (error) {
      console.error('Error adding to cart:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      setLoading(true);
      if (isAuthenticated) {
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
      if (isAuthenticated) {
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
      if (isAuthenticated) {
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

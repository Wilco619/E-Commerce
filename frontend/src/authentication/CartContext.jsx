import React, { createContext, useState, useEffect, useContext } from 'react';
import { cartAPI } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext({
  cart: null,
  cartItemsCount: 0,
  loading: false,
  addToCart: () => Promise.resolve(),
  removeFromCart: () => Promise.resolve(),
  updateCartItem: () => Promise.resolve(),
  clearCart: () => Promise.resolve(),
  refreshCart: () => Promise.resolve()
});

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null);
  const [cartId, setCartId] = useState(null);
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();
  
  // Fetch or create cart whenever authentication state changes
  useEffect(() => {
    fetchOrCreateCart();
  }, [isAuthenticated()]);
  
  const fetchOrCreateCart = async () => {
    try {
      setLoading(true);
      // Use POST to get or create cart
      const { data } = await cartAPI.getCart();
      if (data) {
        setCart(data);
        setCartId(data.id);
        setCartItemsCount(data.total_items || 0);
      }
    } catch (error) {
      console.error('Failed to fetch or create cart:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const addToCart = async (productId, quantity = 1) => {
    try {
      setLoading(true);
      
      // If no cartId exists, create a cart first
      let currentCartId = cartId;
      if (!currentCartId) {
        const cartResponse = await cartAPI.getCart();
        currentCartId = cartResponse.data.id;
        setCartId(currentCartId);
        setCart(cartResponse.data);
      }
      
      const { data } = await cartAPI.addToCart(currentCartId, { product_id: productId, quantity });
      setCart(data);
      setCartItemsCount(data.total_items || 0);
      return data;
    } catch (error) {
      console.error('Failed to add item to cart:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const removeFromCart = async (cartItemId) => {
    try {
      if (!cartId) return;
      
      setLoading(true);
      const { data } = await cartAPI.removeFromCart(cartId, cartItemId);
      setCart(data);
      setCartItemsCount(data.total_items || 0);
      return data;
    } catch (error) {
      console.error('Failed to remove item from cart:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const updateCartItem = async (cartItemId, quantity) => {
    try {
      if (!cartId) return;
      
      setLoading(true);
      const { data } = await cartAPI.updateCartItem(cartId, cartItemId, quantity);
      setCart(data);
      setCartItemsCount(data.total_items || 0);
      return data;
    } catch (error) {
      console.error('Failed to update cart item:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const clearCart = async () => {
    try {
      if (!cartId) return;
      
      setLoading(true);
      const { data } = await cartAPI.clearCart(cartId);
      setCart(data);
      setCartItemsCount(0);
      return data;
    } catch (error) {
      console.error('Failed to clear cart:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <CartContext.Provider
      value={{
        cart,
        cartItemsCount,
        loading,
        addToCart,
        removeFromCart,
        updateCartItem,
        clearCart,
        refreshCart: fetchOrCreateCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);

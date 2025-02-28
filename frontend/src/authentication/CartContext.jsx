import React, { createContext, useContext, useState, useEffect } from 'react';
import { cartAPI } from '../services/api';

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
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    refreshCart();
  }, []);

  // Function to create a new cart if none exists
  const createCart = async () => {
    try {
      setLoading(true);
      // Add a createCart function to your cartAPI service if it doesn't exist
      const response = await cartAPI.createCart();
      return response.data;
    } catch (error) {
      console.error('Failed to create a new cart:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, quantity) => {
    try {
      setLoading(true);
      let currentCart = cart;

      // If no cart exists, create one first
      if (!currentCart || !currentCart.id) {
        currentCart = await createCart();
        setCart(currentCart);
      }

      // Now add the item to the cart
      await cartAPI.addToCart(currentCart.id, productId, quantity);
      await refreshCart();
    } catch (error) {
      console.error('Failed to add item to cart:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (cartItemId) => {
    try {
      setLoading(true);
      if (cart && cart.id) {
        await cartAPI.removeFromCart(cart.id, cartItemId);
        await refreshCart();
      } else {
        throw new Error('No cart available');
      }
    } catch (error) {
      console.error('Failed to remove item from cart:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateCartItem = async (cartItemId, quantity) => {
    try {
      setLoading(true);
      if (cart && cart.id) {
        await cartAPI.updateCartItem(cart.id, cartItemId, quantity);
        await refreshCart();
      } else {
        throw new Error('No cart available');
      }
    } catch (error) {
      console.error('Failed to update cart item:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      setLoading(true);
      if (cart && cart.id) {
        await cartAPI.clearCart(cart.id);
        await refreshCart();
      } else {
        throw new Error('No cart available');
      }
    } catch (error) {
      console.error('Failed to clear cart:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshCart = async () => {
    try {
      setLoading(true);
      const response = await cartAPI.getCart();
      console.log('Cart API response:', response.data);

      if (response && response.data) {
        // Check if the cart exists
        if (response.data.results && response.data.results.length > 0) {
          // Cart exists, use it
          const cartData = response.data.results[0];
          setCart(cartData);
          
          // Calculate items count
          const itemsCount = cartData.items 
            ? cartData.items.reduce((count, item) => count + item.quantity, 0) 
            : 0;
          
          setCartItemsCount(itemsCount);
        } else {
          // No cart exists yet, set to null
          console.log('No existing cart found');
          setCart(null);
          setCartItemsCount(0);
        }
      } else {
        console.error('No cart data received');
        setCart(null);
        setCartItemsCount(0);
      }
    } catch (error) {
      console.error('Failed to refresh cart:', error);
      setCart(null);
      setCartItemsCount(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CartContext.Provider value={{
      cart,
      cartItemsCount,
      loading,
      addToCart,
      removeFromCart,
      updateCartItem,
      clearCart,
      refreshCart
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);

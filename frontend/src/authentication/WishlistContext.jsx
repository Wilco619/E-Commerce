import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useSnackbar } from 'notistack';
import { useAuth } from './AuthContext';
import { wishlistAPI } from '../services/api';
import { GUEST_WISHLIST_ID } from '../services/constants';

export const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchWishlist = useCallback(async () => {
    setLoading(true);
    try {
      if (isAuthenticated) {
        const response = await wishlistAPI.getWishlist();
        setWishlistItems(Array.isArray(response.data) ? response.data : []);
      } else {
        const guestWishlist = JSON.parse(localStorage.getItem(GUEST_WISHLIST_ID) || '[]');
        setWishlistItems(Array.isArray(guestWishlist) ? guestWishlist : []);
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      setWishlistItems([]);
      enqueueSnackbar('Failed to fetch wishlist', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, enqueueSnackbar]);

  const isInWishlist = useCallback((productId) => {
    return Array.isArray(wishlistItems) && wishlistItems.some(item => 
      item.product && item.product.id === productId
    );
  }, [wishlistItems]);

  const toggleWishlistItem = async (product) => {
    try {
      if (isAuthenticated) {
        // Optimistically update UI
        const isCurrentlyInWishlist = isInWishlist(product.id);
        const updatedWishlist = isCurrentlyInWishlist
          ? wishlistItems.filter(item => item.product.id !== product.id)
          : [...wishlistItems, { product, created_at: new Date().toISOString() }];
        
        setWishlistItems(updatedWishlist);

        // Make API call
        const response = await wishlistAPI.toggleWishlist(product.id);
        
        // Fetch latest state from server
        await fetchWishlist();
        
        enqueueSnackbar(
          response.data.status === 'added' ? 'Added to wishlist' : 'Removed from wishlist',
          { variant: response.data.status === 'added' ? 'success' : 'info' }
        );
      } else {
        // Handle guest wishlist
        const guestWishlist = JSON.parse(localStorage.getItem(GUEST_WISHLIST_ID) || '[]');
        const isInList = guestWishlist.some(item => item.product.id === product.id);
        
        let updatedWishlist;
        if (isInList) {
          updatedWishlist = guestWishlist.filter(item => item.product.id !== product.id);
          enqueueSnackbar('Removed from wishlist', { variant: 'info' });
        } else {
          updatedWishlist = [...guestWishlist, {
            id: Date.now(),
            product: product,
            created_at: new Date().toISOString()
          }];
          enqueueSnackbar('Added to wishlist', { variant: 'success' });
        }
        
        localStorage.setItem(GUEST_WISHLIST_ID, JSON.stringify(updatedWishlist));
        setWishlistItems(updatedWishlist);
      }
    } catch (error) {
      console.error('Error updating wishlist:', error);
      // Revert optimistic update by re-fetching
      await fetchWishlist();
      enqueueSnackbar('Failed to update wishlist', { variant: 'error' });
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  return (
    <WishlistContext.Provider value={{
      wishlistItems: Array.isArray(wishlistItems) ? wishlistItems : [],
      loading,
      toggleWishlistItem,
      isInWishlist,
      fetchWishlist
    }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
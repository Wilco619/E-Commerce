import { useCallback } from 'react';
import { useAuth } from '../authentication/AuthContext';
import { useCart } from '../authentication/CartContext';
import { useWishlist } from '../authentication/WishlistContext';

export const useAuthStateChange = () => {
  const { refreshUserProfile } = useAuth();
  const { refreshCart } = useCart();
  const { fetchWishlist } = useWishlist();

  return useCallback(async () => {
    try {
      // Execute all refreshes in sequence to ensure proper order
      await refreshUserProfile?.();
      await refreshCart?.();
      await fetchWishlist?.();

      return true;
    } catch (error) {
      console.error('Auth state change error:', error);
      return false;
    }
  }, [refreshUserProfile, refreshCart, fetchWishlist]);
};
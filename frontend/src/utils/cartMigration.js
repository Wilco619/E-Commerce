import { GUEST_SESSION_ID } from '../services/constants';
import { API } from '../services/api';

export const migrateGuestCartToUserCart = async (userId) => {
  try {
    const sessionId = localStorage.getItem(GUEST_SESSION_ID);
    
    if (!sessionId) {
      return { success: false, message: 'No guest cart found' };
    }

    const response = await API.post('/carts/migrate_cart/', {
      user_session_id: sessionId
    });

    if (response.data.cart_migrated) {
      // Clear guest session
      localStorage.removeItem(GUEST_SESSION_ID);
      
      // Notify components about cart update
      window.dispatchEvent(new CustomEvent('cartUpdated', {
        detail: {
          userId,
          migrated: true
        }
      }));

      return {
        success: true,
        message: 'Cart migrated successfully',
        cart: response.data
      };
    }

    return {
      success: false,
      message: 'Cart migration failed',
      error: response.data.error
    };
    
  } catch (error) {
    console.error('Error migrating guest cart:', error);
    return {
      success: false,
      message: 'Cart migration failed',
      error: error.message
    };
  }
};
import { API } from '../services/api';
import { GUEST_SESSION_ID } from '../services/constants';

/**
 * Utility function to migrate a guest cart to a user's cart after login
 * This is a more robust implementation that can be called from multiple places
 */
export const migrateGuestCartToUserCart = async (userId) => {
    try {
        const sessionId = sessionStorage.getItem(GUEST_SESSION_ID);
        
        if (!sessionId) {
            return { success: false, message: 'No guest cart found' };
        }
        
        // Set a flag to prevent duplicate cart operations during migration
        window.cartMigrationInProgress = true;
        
        const response = await API.post('/carts/migrate_cart/', {
            user_session_id: sessionId
        });
        
        if (response.data.success || response.data.cart_migrated) {
            // Clear guest session
            sessionStorage.removeItem(GUEST_SESSION_ID);
            
            return {
                success: true,
                message: 'Cart migrated successfully',
                cart: response.data.cart
            };
        }
        
        return {
            success: false,
            message: response.data.message || 'Cart migration failed',
            error: response.data.error
        };
        
    } catch (error) {
        console.error('Error migrating guest cart:', error);
        return {
            success: false,
            message: 'Cart migration failed',
            error: error.message
        };
    } finally {
        // Clear the migration flag
        window.cartMigrationInProgress = false;
    }
};

/**
 * Generate a new guest session ID
 */
export const generateGuestSessionId = () => {
    const sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(GUEST_SESSION_ID, sessionId);
    return sessionId;
};

/**
 * Ensures a guest session exists
 */
export const ensureGuestSession = () => {
    if (!sessionStorage.getItem(GUEST_SESSION_ID)) {
        return generateGuestSessionId();
    }
    return sessionStorage.getItem(GUEST_SESSION_ID);
};

/**
 * Clear guest session
 */
export const clearGuestSession = () => {
    sessionStorage.removeItem(GUEST_SESSION_ID);
};
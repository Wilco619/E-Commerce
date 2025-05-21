import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { ACCESS_TOKEN, REFRESH_TOKEN } from '../services/constants';
import PreLoader from '../components/PreLoader';
// import { useCart } from './CartContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  // const [refreshCart]= useCart();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [verificationState, setVerificationState] = useState({
    needsOTP: false,
    userId: null,
  });
  const [verifyingOTP, setVerifyingOTP] = useState(false);
  
  const AUTH_STATE_CHANGED_EVENT = 'authStateChanged';

  // Use refs to track auth state changes
  const authStateRef = useRef({ isAuthenticated, isAdmin, userId: null });

  // Synchronized update function to ensure state consistency
  const updateAuthState = useCallback((newState) => {
    const updates = {};
    let stateChanged = false;
    
    if ('user' in newState) {
      setUser(newState.user);
      updates.user = newState.user;
      updates.userId = newState.user?.id;
      stateChanged = true;
    }
    
    if ('isAuthenticated' in newState) {
      setIsAuthenticated(newState.isAuthenticated);
      updates.isAuthenticated = newState.isAuthenticated;
      stateChanged = true;
    }
    
    if ('isAdmin' in newState) {
      setIsAdmin(newState.isAdmin);
      updates.isAdmin = newState.isAdmin;
      stateChanged = true;
    }
    
    if (stateChanged) {
      // Update ref with new values
      authStateRef.current = {
        ...authStateRef.current,
        ...updates
      };
      
      // Broadcast auth changes to other components
      const event = new CustomEvent(AUTH_STATE_CHANGED_EVENT, { 
        detail: { 
          isAuthenticated: updates.isAuthenticated ?? authStateRef.current.isAuthenticated,
          isAdmin: updates.isAdmin ?? authStateRef.current.isAdmin,
          userId: updates.userId ?? authStateRef.current.userId
        } 
      });
      window.dispatchEvent(event);
    }
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await authAPI.getCurrentUser();
      
      // Use synchronized update to ensure consistent state
      updateAuthState({
        user: data,
        isAuthenticated: true,
        isAdmin: data.user_type === 'ADMIN'
      });
      
      return data;
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      localStorage.removeItem(ACCESS_TOKEN);
      localStorage.removeItem(REFRESH_TOKEN);
      
      // Reset auth state
      updateAuthState({
        user: null,
        isAuthenticated: false,
        isAdmin: false
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [updateAuthState]);

  // Initialize auth state on mount
  useEffect(() => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (token) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, [fetchCurrentUser]);

  
  
  // Add this function to refresh the user profile
  const refreshUserProfile = async () => {
    setLoading(true);
    try {
      const response = await authAPI.getCurrentUser();
      setUser(response.data);
    } catch (error) {
      console.error('Failed to refresh user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      const { data } = await authAPI.register(userData);
      // Registration successful, now wait for OTP
      setVerificationState({
        needsOTP: true,
        userId: data.user_id
      });
      return data;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const login = async (credentials) => {
    try {
      setLoading(true);
      const response = await authAPI.login(credentials);
      
      if (response.data.access && response.data.refresh) {
        // Store tokens
        localStorage.setItem(ACCESS_TOKEN, response.data.access);
        localStorage.setItem(REFRESH_TOKEN, response.data.refresh);
        
        // Get user data
        const userResponse = await authAPI.getCurrentUser();
        const userData = userResponse.data;
        
        // Update state synchronously
        setUser(userData);
        setIsAuthenticated(true);
        setIsAdmin(userData.is_staff || userData.user_type === 'ADMIN');
        
        // Trigger state change event
        window.dispatchEvent(new CustomEvent('auth-state-changed'));
        
        return { success: true, requiresOTP: false };
      }
      // OTP flow
      else if (response.data.user_id) {
        sessionStorage.setItem('user_id', response.data.user_id);
        return { success: true, requiresOTP: true };
      }
      
      return { success: false, error: 'Invalid response from server' };
    } catch (error) {
      console.error('Login error:', error);
      console.error('Login error full details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
      return { 
        success: false, 
        error: error.response?.data?.error || error.response?.data?.detail || 'Failed to login'
      };
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (otpData) => {
    try {
      setVerifyingOTP(true);
      const response = await authAPI.verifyOTP(otpData);
      
      if (response.data.access && response.data.refresh) {
        // Store tokens
        localStorage.setItem('access_token', response.data.access);
        localStorage.setItem('refresh_token', response.data.refresh);
        
        // Update auth state
        const userData = response.data.user || (await authAPI.getCurrentUser()).data;
        await handleLoginSuccess(userData);
        
        // Reset verification state
        setVerificationState({
          needsOTP: false,
          userId: null
        });
        
        return { success: true };
      }
      
      return { 
        success: false, 
        error: 'Invalid response from server' 
      };
    } catch (error) {
      console.error('OTP verification failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Verification failed' 
      };
    } finally {
      setVerifyingOTP(false);
    }
  };

  // Add auth state change listener
  useEffect(() => {
    const handleAuthChange = () => {
      // Access the event details if needed
    const { isAuthenticated, isAdmin, userId } = event.detail;
    
    // Force re-render or update local state if needed
    setIsAuthenticated(isAuthenticated);
    setIsAdmin(isAdmin);
    };

    window.addEventListener(AUTH_STATE_CHANGED_EVENT, handleAuthChange);
    return () => window.removeEventListener(AUTH_STATE_CHANGED_EVENT, handleAuthChange);
  }, []);

  const resendOTP = async (userId) => {
    try {
      const { data } = await authAPI.resendOTP({ user_id: userId });
      return data;
    } catch (error) {
      console.error('Failed to resend OTP:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN);
      if (refreshToken) {
        await authAPI.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      localStorage.removeItem(ACCESS_TOKEN);
      localStorage.removeItem(REFRESH_TOKEN);
      
      // Use synchronized update for logout
      updateAuthState({
        user: null,
        isAuthenticated: false,
        isAdmin: false
      });
      
      navigate('/login');
    }
  };

  const changePassword = async (passwordData) => {
    try {
      const { data } = await authAPI.changePassword(passwordData);
      return data;
    } catch (error) {
      console.error('Password change failed:', error);
      throw error;
    }
  };

  const updateProfile = async (userData) => {
    try {
      const { data } = await authAPI.updateProfile(userData);
      updateAuthState({ user: data });
      return data;
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    }
  };

  const handleLoginSuccess = useCallback(async (userData) => {
    try {
        // First update auth state
        setUser(userData);
        setIsAuthenticated(true);
        setIsAdmin(userData.user_type === 'ADMIN');

        // Then fetch fresh user data
        await refreshUserProfile();
        
        // Then refresh cart data
        // await refreshCart();

        // Dispatch auth state change event
        window.dispatchEvent(new Event('auth-state-changed'));

        // Handle post-login redirect
        const redirectPath = sessionStorage.getItem('redirectAfterLogin');
        if (redirectPath) {
            sessionStorage.removeItem('redirectAfterLogin');
            navigate(redirectPath);
        } else {
            navigate('/');
        }
    } catch (error) {
        console.error('Error during login success handling:', error);
        enqueueSnackbar('Error refreshing user data', { variant: 'error' });
    }
}, [navigate, refreshUserProfile]);

  // Make auth state available to API interceptors
  useEffect(() => {
    // Make auth state available to API interceptors
    window.authState = {
      setIsAuthenticated,
      setUser,
      setIsAdmin,
      user,
      isAuthenticated,
      isAdmin
    };
    
    return () => {
      window.authState = null;
    };
  }, [user, isAuthenticated, isAdmin]);

  // Create a stable reference to the context value
  const contextValue = {
    user,
    loading,
    isAuthenticated,
    isAdmin,
    verificationState,
    register,
    login,
    logout,
    verifyOTP,
    resendOTP,
    changePassword,
    updateProfile,
    fetchCurrentUser,
    handleLoginSuccess,
    verifyingOTP,
    setVerifyingOTP,
    refreshUserProfile
  };

  // if (loading) {
  //   return <PreLoader message="Initializing application..." />;
  // }

  if (verifyingOTP) {
    return <PreLoader message="Verifying OTP..." />;
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
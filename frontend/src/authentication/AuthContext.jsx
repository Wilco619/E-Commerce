import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { ACCESS_TOKEN, REFRESH_TOKEN } from '../services/constants';
import PreLoader from '../components/PreLoader';
import { refreshAppState } from '../main';

const AuthContext = createContext(null);

// Create a consistent event name
const APP_STATE_CHANGED = 'app-state-changed';

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [verificationState, setVerificationState] = useState({
    needsOTP: false,
    userId: null,
  });
  const [verifyingOTP, setVerifyingOTP] = useState(false);
  
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
      
      // Broadcast auth changes to other components using the consistent event format
      refreshAppState('auth', { 
        isAuthenticated: updates.isAuthenticated ?? authStateRef.current.isAuthenticated,
        isAdmin: updates.isAdmin ?? authStateRef.current.isAdmin,
        userId: updates.userId ?? authStateRef.current.userId
      });
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
      updateAuthState({
        user: response.data,
        isAuthenticated: true,
        isAdmin: response.data.user_type === 'ADMIN'
      });
      return response.data;
    } catch (error) {
      console.error('Failed to refresh user profile:', error);
      throw error;
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
        updateAuthState({
          user: userData,
          isAuthenticated: true,
          isAdmin: userData.is_staff || userData.user_type === 'ADMIN'
        });
        
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
        localStorage.setItem(ACCESS_TOKEN, response.data.access);
        localStorage.setItem(REFRESH_TOKEN, response.data.refresh);
        
        // Update auth state
        const userData = response.data.user || (await authAPI.getCurrentUser()).data;
        await handleLoginSuccess(userData);
        
        // Reset verification state
        setVerificationState({
          needsOTP: false,
          userId: null
        });
        
        // Broadcast auth state changes
        refreshAppState('auth', { 
          isAuthenticated: true,
          timestamp: Date.now()
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
        // First update auth state with full user data
        updateAuthState({
          user: userData,
          isAuthenticated: true,
          isAdmin: userData.user_type === 'ADMIN'
        });
        
        // Explicitly broadcast the auth state change
        refreshAppState('auth', { 
          isAuthenticated: true,
          timestamp: Date.now() 
        });
        
        // Handle post-login redirect
        const redirectPath = sessionStorage.getItem('redirectAfterLogin');
        
        // Set a flag to indicate we just logged in (helps with migrations)
        sessionStorage.setItem('justAuthenticated', 'true');
        
        if (redirectPath) {
            sessionStorage.removeItem('redirectAfterLogin');
            navigate(redirectPath);
        } else {
            navigate('/');
        }
        
        return userData;
    } catch (error) {
        console.error('Error during login success handling:', error);
        throw error;
    }
  }, [navigate, updateAuthState]);

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
    setIsAuthenticated,
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
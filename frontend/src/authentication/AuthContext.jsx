import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { ACCESS_TOKEN, REFRESH_TOKEN } from '../services/constants';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [verificationState, setVerificationState] = useState({
    needsOTP: false,
    userId: null,
  });
  
  // Use refs to track auth state changes
  const authStateRef = useRef({ isAuthenticated, isAdmin, userId: null });
  const navigate = useNavigate();

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
      const event = new CustomEvent('authStateChanged', { 
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

  const login = async (email, password) => {
    try {
      const response = await authAPI.post('/login/', {
        email,
        password
      });

      if (!response.data) {
        throw new Error('No response data received');
      }

      // Return the response data which should contain user_id and message
      return response.data;
    } catch (error) {
      console.error('Login API error:', error);
      throw error;
    }
  };

  const verifyOTP = async (userId, otp) => {
    try {
      const response = await authAPI.post('/verify-otp/', {
        user_id: userId,
        otp: otp
      });

      if (!response.data || !response.data.tokens) {
        throw new Error('Invalid OTP response');
      }

      return response.data;
    } catch (error) {
      console.error('OTP verification error:', error);
      throw error;
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
    fetchCurrentUser
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
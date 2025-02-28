import React, { createContext, useContext, useState, useEffect } from 'react';
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
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (token) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const { data } = await authAPI.getCurrentUser();
      setUser(data);
      setIsAuthenticated(true);
      setIsAdmin(data.user_type === 'ADMIN');
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      localStorage.removeItem(ACCESS_TOKEN);
      localStorage.removeItem(REFRESH_TOKEN);
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
      const { data } = await authAPI.login(credentials);
      
      // Check if we need OTP verification
      if (data.message && data.message.includes('OTP generated')) {
        setVerificationState({
          needsOTP: true,
          userId: data.user_id
        });
        return { needsOTP: true, userId: data.user_id };
      }
      
      // If we don't need OTP (which shouldn't happen based on the views.py)
      // but including as a fallback
      if (data.access && data.refresh) {
        localStorage.setItem(ACCESS_TOKEN, data.access);
        localStorage.setItem(REFRESH_TOKEN, data.refresh);
        await fetchCurrentUser();
        
        // Redirect based on user type
        if (isAdmin) {
          navigate('/admin');
        } else {
          navigate('/');
        }
        return { needsOTP: false };
      }
      
      return data;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const verifyOTP = async (otpData) => {
    try {
      const { data } = await authAPI.verifyOTP(otpData);
      
      // OTP verification successful, store tokens
      localStorage.setItem(ACCESS_TOKEN, data.access);
      localStorage.setItem(REFRESH_TOKEN, data.refresh);
      
      // Reset verification state
      setVerificationState({
        needsOTP: false,
        userId: null
      });
      
      // Update user state
      setIsAuthenticated(true);
      setIsAdmin(data.user_type === 'ADMIN');
      setUser({ id: data.user_id, user_type: data.user_type });
      
      // Fetch complete user data
      await fetchCurrentUser();
      
      // Redirect based on user type
      if (data.user_type === 'ADMIN') {
        navigate('/admin/categories/new');
      } else {
        navigate('/');
      }
      
      return data;
    } catch (error) {
      console.error('OTP verification failed:', error);
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
      setUser(null);
      setIsAuthenticated(false);
      setIsAdmin(false);
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
      setUser(data);
      return data;
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
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
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

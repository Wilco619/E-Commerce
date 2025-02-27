import React, { createContext, useState, useEffect, useContext } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Check if user is logged in on page load
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);
  
  const fetchCurrentUser = async () => {
    try {
      setLoading(true);
      const { data } = await authAPI.getCurrentUser();
      setUser(data);
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      // Clear tokens on error
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    } finally {
      setLoading(false);
    }
  };
  
  const login = async (credentials) => {
    const { data } = await authAPI.login(credentials);
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    await fetchCurrentUser();
    return data;
  };
  
  const register = async (userData) => {
    const { data } = await authAPI.register(userData);
    return data;
  };
  
  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };
  
  const updateProfile = async (userData) => {
    const { data } = await authAPI.updateProfile(userData);
    setUser(data);
    return data;
  };
  
  const isAdmin = () => {
    return user && user.user_type === 'ADMIN';
  };
  
  const isCustomer = () => {
    return user && user.user_type === 'CUSTOMER';
  };
  
  const isAuthenticated = () => {
    return !!user;
  };
  
  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        login, 
        logout, 
        register, 
        updateProfile, 
        isAdmin, 
        isCustomer, 
        isAuthenticated,
        loading 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

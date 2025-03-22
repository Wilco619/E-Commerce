// src/contexts/CookieContext.js

import React, { createContext, useContext, useState, useEffect } from 'react';
import { setCookie, getCookie, deleteCookie, areCookiesEnabled } from '../utils/cookieUtils';

// Create context
export const CookieContext = createContext();

export const CookieProvider = ({ children }) => {
  const [cookiesEnabled, setCookiesEnabled] = useState(false);
  const [cookieConsent, setCookieConsent] = useState(false);
  
  // Check if cookies are enabled on mount
  useEffect(() => {
    const enabled = areCookiesEnabled();
    setCookiesEnabled(enabled);
    
    // Check for existing consent with secure handling
    const existingConsent = getCookie('cookie_consent');
    if (existingConsent === 'true') {
      setCookieConsent(true);
    }
  }, []);
  
  // Function to handle cookie consent
  const handleCookieConsent = (consent) => {
    setCookieConsent(consent);
    setCookie('cookie_consent', consent.toString(), {
      days: 365,
      secure: true,
      sameSite: 'Lax',
      path: '/'
    });
  };
  
  // Wrapper functions for cookie operations that respect consent
  const setSecureCookie = (name, value, options = {}) => {
    if (cookieConsent) {
      return setCookie(name, value, {
        ...options,
        secure: true,
        sameSite: 'Lax'
      });
    }
    return false;
  };
  
  const value = {
    cookiesEnabled,
    cookieConsent,
    handleCookieConsent,
    setCookie: setSecureCookie,
    getCookie: getCookie,
    deleteCookie: deleteCookie
  };
  
  return (
    <CookieContext.Provider value={value}>
      {children}
    </CookieContext.Provider>
  );
};

// Custom hook to use the cookie context
export const useCookies = () => {
  const context = useContext(CookieContext);
  if (context === undefined) {
    throw new Error('useCookies must be used within a CookieProvider');
  }
  return context;
};
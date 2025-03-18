// src/contexts/CookieContext.js

import React, { createContext, useContext, useState, useEffect } from 'react';
import { setCookie, getCookie, deleteCookie, areCookiesEnabled } from '../utils/cookieUtils';

// Create context
const CookieContext = createContext();

export const CookieProvider = ({ children }) => {
  const [cookiesEnabled, setCookiesEnabled] = useState(false);
  const [cookieConsent, setCookieConsent] = useState(false);
  
  // Check if cookies are enabled on mount
  useEffect(() => {
    const enabled = areCookiesEnabled();
    setCookiesEnabled(enabled);
    
    // Check for existing consent
    const existingConsent = getCookie('cookie_consent');
    if (existingConsent === 'true') {
      setCookieConsent(true);
    }
  }, []);
  
  // Function to handle cookie consent
  const handleCookieConsent = (consent) => {
    setCookieConsent(consent);
    setCookie('cookie_consent', consent.toString(), { days: 365 });
  };
  
  // Wrapper functions for cookie operations that respect consent
  const setConsentCookie = (name, value, options) => {
    if (cookieConsent) {
      setCookie(name, value, options);
      return true;
    }
    return false;
  };
  
  const getConsentCookie = (name) => {
    if (cookieConsent) {
      return getCookie(name);
    }
    return null;
  };
  
  const deleteConsentCookie = (name, options) => {
    if (cookieConsent) {
      deleteCookie(name, options);
      return true;
    }
    return false;
  };
  
  const value = {
    cookiesEnabled,
    cookieConsent,
    handleCookieConsent,
    setCookie: setConsentCookie,
    getCookie: getConsentCookie,
    deleteCookie: deleteConsentCookie
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
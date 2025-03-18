// src/hooks/useUserExperience.js

import { useState, useEffect } from 'react';
import { useCookies } from '../authentication/CookieContext';
import cookieService from '../services/cookieService';

const useUserExperience = () => {
  const { cookieConsent, getCookie, setCookie } = useCookies();
  const [theme, setTheme] = useState('light');
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [initialized, setInitialized] = useState(false);
  
  // Initialize from cookies when component mounts
  useEffect(() => {
    if (!cookieConsent) return;
    
    // Try to get preferences from cookies first (quick load)
    const savedTheme = getCookie('pref_theme') || 'light';
    const savedRecentlyViewed = getCookie('pref_recentlyViewed');
    const savedCartCount = getCookie('pref_cartCount');
    
    setTheme(savedTheme);
    
    if (savedRecentlyViewed) {
      try {
        setRecentlyViewed(JSON.parse(savedRecentlyViewed));
      } catch (e) {
        console.error('Failed to parse recently viewed items', e);
        setRecentlyViewed([]);
      }
    }
    
    if (savedCartCount) {
      setCartCount(parseInt(savedCartCount, 10) || 0);
    }
    
    // Then try to fetch from backend for more accurate data
    fetchPreferencesFromBackend();
    
    // Fetch CSRF token for future requests
    cookieService.fetchCsrfToken();
    
    setInitialized(true);
  }, [cookieConsent, getCookie]);
  
  // Fetch preferences from backend
  const fetchPreferencesFromBackend = async () => {
    if (!cookieConsent) return;
    
    try {
      const { preferences } = await cookieService.getPreferences();
      
      if (preferences.theme) {
        setTheme(preferences.theme);
      }
      
      if (preferences.recentlyViewed) {
        try {
          setRecentlyViewed(JSON.parse(preferences.recentlyViewed));
        } catch (e) {
          console.error('Failed to parse recently viewed items from backend', e);
        }
      }
      
      if (preferences.cartCount) {
        setCartCount(parseInt(preferences.cartCount, 10) || 0);
      }
    } catch (error) {
      console.error('Failed to fetch preferences from backend', error);
    }
  };
  
  // Update theme and save to cookies
  const updateTheme = async (newTheme) => {
    setTheme(newTheme);
    
    if (cookieConsent) {
      setCookie('pref_theme', newTheme, { days: 365 });
      
      try {
        await cookieService.savePreferences({ theme: newTheme });
      } catch (error) {
        console.error('Failed to save theme preference to backend', error);
      }
    }
  };
  
  // Add item to recently viewed and save to cookies
  const addToRecentlyViewed = async (item) => {
    // Only keep most recent 10 items
    const updatedItems = [item, ...recentlyViewed.filter(i => i.id !== item.id)].slice(0, 10);
    setRecentlyViewed(updatedItems);
    
    if (cookieConsent) {
      const recentlyViewedJson = JSON.stringify(updatedItems);
      setCookie('pref_recentlyViewed', recentlyViewedJson, { days: 30 });
      
      try {
        await cookieService.savePreferences({ recentlyViewed: recentlyViewedJson });
      } catch (error) {
        console.error('Failed to save recently viewed items to backend', error);
      }
    }
  };
  
  // Update cart count and save to cookies
  const updateCartCount = async (count) => {
    setCartCount(count);
    
    if (cookieConsent) {
      setCookie('pref_cartCount', count.toString(), { days: 7 });
      
      try {
        await cookieService.savePreferences({ cartCount: count.toString() });
      } catch (error) {
        console.error('Failed to save cart count to backend', error);
      }
    }
  };
  
  return {
    initialized,
    theme,
    updateTheme,
    recentlyViewed,
    addToRecentlyViewed,
    cartCount,
    updateCartCount,
  };
};

export default useUserExperience;
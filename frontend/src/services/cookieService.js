// src/services/cookieService.js

import { getCookie } from '../utils/cookieUtils';

/**
 * Service to handle API calls for cookie management
 */
class CookieService {
  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || '';
  }
  
  /**
   * Get CSRF token from cookie and return headers for API requests
   */
  getHeaders() {
    const csrfToken = getCookie('csrftoken');
    return {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrfToken,
    };
  }
  
  /**
   * Fetch CSRF token from Django
   */
  async fetchCsrfToken() {
    try {
      const response = await fetch(`${this.baseUrl}/api/csrf/`, {
        method: 'GET',
        credentials: 'include', // Important: include cookies in request
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get CSRF token: ${response.status}`);
      }
      
      return true;
    } catch (error) {
      console.error('Error fetching CSRF token:', error);
      return false;
    }
  }
  
  /**
   * Save user preferences to backend
   * @param {Object} preferences - Key-value pairs of user preferences
   */
  async savePreferences(preferences) {
    try {
      const response = await fetch(`${this.baseUrl}/api/preferences/`, {
        method: 'POST',
        headers: this.getHeaders(),
        credentials: 'include',
        body: JSON.stringify({ preferences }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save preferences: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error saving preferences:', error);
      throw error;
    }
  }
  
  /**
   * Get user preferences from backend
   */
  async getPreferences() {
    try {
      const response = await fetch(`${this.baseUrl}/api/preferences/get/`, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get preferences: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting preferences:', error);
      throw error;
    }
  }
  
  /**
   * Delete a specific user preference
   * @param {string} key - Preference key to delete
   */
  async deletePreference(key) {
    try {
      const response = await fetch(`${this.baseUrl}/api/preferences/delete/${key}/`, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete preference: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting preference:', error);
      throw error;
    }
  }
  
  /**
   * Update user session data (for authenticated users)
   * @param {Object} sessionData - Data to store in session
   */
  async updateSession(sessionData) {
    try {
      const response = await fetch(`${this.baseUrl}/api/session/`, {
        method: 'POST',
        headers: this.getHeaders(),
        credentials: 'include',
        body: JSON.stringify(sessionData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update session: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating session:', error);
      throw error;
    }
  }
}

export default new CookieService();
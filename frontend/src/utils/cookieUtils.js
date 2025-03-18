// src/utils/cookieUtils.js

/**
 * Set a cookie with custom options
 * @param {string} name - The name of the cookie
 * @param {string} value - The value of the cookie
 * @param {Object} options - Optional settings
 * @param {number} options.days - Number of days until the cookie expires
 * @param {string} options.path - The path for the cookie
 * @param {boolean} options.secure - Whether the cookie should only be sent over HTTPS
 * @param {boolean} options.sameSite - SameSite attribute ('strict', 'lax', or 'none')
 */
export const setCookie = (name, value, options = {}) => {
    const { days = 30, path = '/', secure = true, sameSite = 'lax' } = options;
    
    // Create expiration date
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    
    // Build cookie string
    let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=${path}`;
    
    // Add secure flag if specified
    if (secure) cookieString += '; secure';
    
    // Add SameSite attribute
    cookieString += `; samesite=${sameSite}`;
    
    // Set the cookie
    document.cookie = cookieString;
  };
  
  /**
   * Get a cookie by name
   * @param {string} name - The name of the cookie to retrieve
   * @returns {string|null} - The cookie value or null if not found
   */
  export const getCookie = (name) => {
    const nameEQ = encodeURIComponent(name) + '=';
    const cookies = document.cookie.split(';');
    
    for (let i = 0; i < cookies.length; i++) {
      let cookie = cookies[i];
      while (cookie.charAt(0) === ' ') {
        cookie = cookie.substring(1);
      }
      if (cookie.indexOf(nameEQ) === 0) {
        return decodeURIComponent(cookie.substring(nameEQ.length));
      }
    }
    return null;
  };
  
  /**
   * Delete a cookie by name
   * @param {string} name - The name of the cookie to delete
   * @param {Object} options - Optional settings
   * @param {string} options.path - The path for the cookie
   */
  export const deleteCookie = (name, options = {}) => {
    const { path = '/' } = options;
    document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`;
  };
  
  /**
   * Check if cookies are enabled in the browser
   * @returns {boolean} - True if cookies are enabled, false otherwise
   */
  export const areCookiesEnabled = () => {
    // Try to set a test cookie
    setCookie('testcookie', 'testvalue', { days: 1 });
    // Check if the test cookie was set successfully
    const cookieEnabled = getCookie('testcookie') === 'testvalue';
    // Delete the test cookie
    deleteCookie('testcookie');
    return cookieEnabled;
  };
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
    const {
        days = 30,
        path = '/',
        secure = true,
        sameSite = 'Lax',
        domain = window.location.hostname
    } = options;
    
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    
    const cookieString = [
        `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
        `expires=${expires.toUTCString()}`,
        `path=${path}`,
        `domain=${domain}`,
        `samesite=${sameSite}`
    ];

    if (secure) cookieString.push('secure');
    
    document.cookie = cookieString.join('; ');
};

// Update getCookie to be more secure
export const getCookie = (name) => {
    try {
        const cookieValue = document.cookie
            .split('; ')
            .find(row => row.startsWith(name + '='));
        
        if (!cookieValue) return null;
        
        return decodeURIComponent(cookieValue.split('=')[1]);
    } catch (error) {
        console.error('Error getting cookie:', error);
        return null;
    }
};

// Add secure cookie deletion
export const deleteCookie = (name, options = {}) => {
    const {
        path = '/',
        domain = window.location.hostname,
        secure = true,
        sameSite = 'Lax'
    } = options;
    
    document.cookie = [
        `${encodeURIComponent(name)}=`,
        'expires=Thu, 01 Jan 1970 00:00:00 GMT',
        `path=${path}`,
        `domain=${domain}`,
        `samesite=${sameSite}`,
        secure ? 'secure' : ''
    ].filter(Boolean).join('; ');
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
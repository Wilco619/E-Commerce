import axios from "axios";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "./constants";

const apiUrl = "http://localhost:8000/api/";
// Base URL with /api/ prefix to match Django router patterns


const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL : apiUrl,
  timeout: 10000,
});

// Attach the access token to the headers
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 errors (Unauthorized)
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.code === 'ECONNABORTED') {
      console.error("Request timed out:", error.message);
      return Promise.reject(error); // Handle timeout error appropriately
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN);
        if (!refreshToken) {
          throw new Error("Refresh token not found.");
        }

        // Refresh the token
        const response = await axios.post(`${apiUrl}token/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;

        // Store the new access token
        localStorage.setItem(ACCESS_TOKEN, access);

        // Update the authorization header with the new token
        API.defaults.headers.common['Authorization'] = `Bearer ${access}`;
        originalRequest.headers['Authorization'] = `Bearer ${access}`;

        // Retry the original request with the new token
        return API(originalRequest);
      } catch (err) {
        console.error("Token refresh failed:", err.response?.data || err.message);

        // Clear tokens and redirect to login or handle error
        localStorage.removeItem(ACCESS_TOKEN);
        localStorage.removeItem(REFRESH_TOKEN);

        // Redirect to login page
        window.location.href = '/login'; // Adjust this path as necessary
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API Services
// Enhanced authAPI with logging
const authAPI = {
  baseURL: API.defaults.baseURL, // Store the base URL for logging purposes
  
  register: (userData) => {
    console.log('Register endpoint:', `${API.defaults.baseURL}/register/`);
    console.log('Register payload:', userData);
    
    // Make sure the content type is set correctly
    return API.post('/register/', userData, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
  },
  
  login: (credentials) => {
    console.log('=== AUTH API LOGIN CALL ===');
    console.log('Login endpoint:', `${API.defaults.baseURL}/login/`);
    console.log('Login payload:', credentials);
    console.log('Headers:', API.defaults.headers);
    
    // Add interceptor to log the response or error
    const interceptor = API.interceptors.response.use(
      response => {
        console.log('Login API Success Response:', response);
        return response;
      },
      error => {
        console.log('Login API Error Response:', error);
        return Promise.reject(error);
      }
    );
    
    // Make the API call
    return API.post('/login/', credentials)
      .finally(() => {
        // Remove the interceptor after the call
        API.interceptors.response.eject(interceptor);
      });
  },
  
  verifyOTP: (otpData) => {
    console.log('Verify OTP endpoint:', `${API.defaults.baseURL}/verify-otp/`);
    console.log('OTP payload:', otpData);
    return API.post('/verify-otp/', otpData);
  },
  
  logout: (refreshToken) => API.post('/logout/', { refresh: refreshToken }),
  changePassword: (passwords) => API.post('/change-password/', passwords),
  getCurrentUser: () => API.get('/profile/'),
  updateProfile: (userData) => API.put('/profile/', userData),
};

// Products API Services
const productsAPI = {
  getProducts: (params) => API.get('/products/', { params }),
  getProduct: (slug) => API.get(`/products/${slug}/`),
  searchProducts: (query) => API.get(`/products/search/?q=${query}`),
  getFeaturedProducts: () => API.get('/products/featured/'),
  getCategories: () => API.get('/categories/'),
  getCategoryProducts: (slug) => API.get(`/categories/${slug}/`),
};

// Cart API Services
const cartAPI = {
  // Replace the getCart method:
  getCart: () => {
    // For authenticated users, this just works with the token
    // For guest users, we need to create or get a cart with session ID
    const sessionId = localStorage.getItem('cart_session_id') || 
                      Math.random().toString(36).substring(2, 15);
    
    // Store the session ID if not exist
    if (!localStorage.getItem('cart_session_id')) {
      localStorage.setItem('cart_session_id', sessionId);
    }
    
    // Create or get a cart
    return API.post('/carts/create_or_get/', { 
      session_id: sessionId 
    });
  },

  addToCart: (cartId, productData) => API.post(`/carts/${cartId}/add_item/`, productData),
  removeFromCart: (cartId, cartItemId) => API.post(`/carts/${cartId}/remove_item/`, { cart_item_id: cartItemId }),
  updateCartItem: (cartId, cartItemId, quantity) => 
    API.post(`/carts/${cartId}/update_item/`, { cart_item_id: cartItemId, quantity }),
  clearCart: (cartId) => API.post(`/carts/${cartId}/clear/`),
  
  // Add method to merge guest cart with user cart after login
  mergeCart: (cartId, sessionId) => API.post(`/carts/${cartId}/merge/`, { session_id: sessionId }),
};

// Order API Services
const orderAPI = {
  getOrders: () => API.get('/orders/'),
  getOrder: (id) => API.get(`/orders/${id}/`),
  checkout: (checkoutData) => API.post('/orders/checkout/', checkoutData),
};

// Admin API Services
const adminAPI = {
  // Product management
  createProduct: (productData) => API.post('/products/', productData),
  updateProduct: (slug, productData) => API.put(`/products/${slug}/`, productData),
  deleteProduct: (slug) => API.delete(`/products/${slug}/`),
  
  // Category management
  createCategory: (categoryData) => API.post('/categories/', categoryData),
  updateCategory: (slug, categoryData) => API.put(`/categories/${slug}/`, categoryData),
  deleteCategory: (slug) => API.delete(`/categories/${slug}/`),
  
  // Order management
  getAllOrders: () => API.get('/orders/'),
  updateOrderStatus: (id, statusData) => API.patch(`/orders/${id}/update_status/`, statusData),
  
  // User management - these may need to be updated since we don't have a UserViewSet
  // You'll need to add these endpoints to your views and URLs
  // getAllUsers: () => API.get('/users/'),
  // getUserDetails: (id) => API.get(`/users/${id}/`),
  // updateUser: (id, userData) => API.patch(`/users/${id}/`, userData),
  // deleteUser: (id) => API.delete(`/users/${id}/`),
};

export { API, authAPI, productsAPI, cartAPI, orderAPI, adminAPI };
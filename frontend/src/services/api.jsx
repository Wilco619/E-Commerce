import axios from "axios";
import { ACCESS_TOKEN, REFRESH_TOKEN, GUEST_SESSION_ID } from "./constants";
import { getCookie } from '../utils/cookieUtils';

const apiUrl = "https://api.jemsa.co.ke/api/";

// const apiUrl = "http://127.0.0.1:8000/api/";
// Base URL with /api/ prefix to match Django router patterns

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL : apiUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
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

// Update the API interceptor configuration
API.interceptors.request.use(
    (config) => {
        try {
            // Add CSRF token to headers if available
            const csrfToken = getCookie('csrftoken');
            if (csrfToken) {
                config.headers['X-CSRFToken'] = csrfToken;
            }
        } catch (error) {
            console.error('Error getting CSRF token:', error);
        }
        
        // Add withCredentials for cookie handling
        config.withCredentials = true;
        
        return config;
    },
    (error) => Promise.reject(error)
);

// Add token refresh queue to prevent multiple refresh requests
let isRefreshing = false;
let refreshSubscribers = [];

// Add callback to queue
const addRefreshSubscriber = (callback) => {
  refreshSubscribers.push(callback);
};

// Execute callbacks with new token
const onRefreshed = (token) => {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
};

// Update the API interceptor
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.code === 'ECONNABORTED') {
      console.error("Request timed out:", error.message);
      return Promise.reject(error); // Handle timeout error appropriately
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue the requests if a refresh is already in progress
        return new Promise(resolve => {
          addRefreshSubscriber(token => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            resolve(API(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN);
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${apiUrl}token/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        localStorage.setItem(ACCESS_TOKEN, access);
        API.defaults.headers.common['Authorization'] = `Bearer ${access}`;
        originalRequest.headers['Authorization'] = `Bearer ${access}`;

        onRefreshed(access);

        // After successful refresh, update auth state if available
        if (window.authState && window.authState.setIsAuthenticated) {
          window.authState.setIsAuthenticated(true);
        }

        return API(originalRequest);
      } catch (err) {
        onRefreshed(null);
        localStorage.removeItem(ACCESS_TOKEN);
        localStorage.removeItem(REFRESH_TOKEN);

        // Update global auth state if available
        if (window.authState) {
          if (window.authState.setIsAuthenticated) {
            window.authState.setIsAuthenticated(false);
          }
          if (window.authState.setUser) {
            window.authState.setUser(null);
          }
          if (window.authState.setIsAdmin) {
            window.authState.setIsAdmin(false);
          }
        }
        
        window.location.href = '/';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Add interceptor to handle checkout attempts
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && error.config.url.includes('/checkout/')) {
      sessionStorage.setItem('checkoutAttempted', 'true');
      window.location.href = '/login';
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

// Auth API Services
const authAPI = {
  baseURL: API.defaults.baseURL,  
  register: (userData) => {
    const checkoutAttempted = sessionStorage.getItem('checkoutAttempted');
    return API.post('/register/', {
      ...userData,
      checkout_attempted: checkoutAttempted ? true : false
    });
  },
  
  login: (credentials) => {
    const loginInstance = axios.create({
      baseURL: API.defaults.baseURL,
      timeout: 60000, // Increase timeout to 60 seconds
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    // Add request interceptor for debugging
    loginInstance.interceptors.request.use(
      (config) => {
        console.log('Login request started');
        return config;
      },
      (error) => {
        console.error('Login request error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for debugging
    loginInstance.interceptors.response.use(
      (response) => {
        console.log('Login response received');
        return response;
      },
      (error) => {
        if (error.code === 'ECONNABORTED') {
          console.error('Login request timed out');
          throw new Error('Login request timed out. Please try again.');
        }
        if (!error.response) {
          console.error('Network error during login');
          throw new Error('Network error. Please check your connection.');
        }
        console.error('Login error:', error.response?.data || error.message);
        throw error;
      }
    );

    return loginInstance.post('/login/', credentials);
  },
  
  verifyOTP: (otpData) => API.post('/verify-otp/', otpData),
  resendOTP: (otpData) => API.post('/resend-otp/', otpData),
  
  logout: (refreshToken) => API.post('/logout/', { refresh: refreshToken }),
  changePassword: (passwords) => API.post('/change-password/', passwords),
  forgotPassword: (email) => API.post('/forgot-password/', { email }),
  getCurrentUser: () => API.get('/profile/'),
  updateProfile: (userData) => API.put('/profile/', userData),
  resetPassword: ({ uid, token, new_password }) => 
        API.post(`/reset-password/${uid}/${token}/`, { new_password }),
};

// Products API Services
const productsAPI = {
  getProducts: (params = {}) => {
    const queryParams = new URLSearchParams();
    
    // Add all possible parameters
    if (params.search) queryParams.append('search', params.search);
    if (params.category) queryParams.append('category', params.category);
    if (params.ordering) queryParams.append('ordering', params.ordering);
    if (params.in_stock) queryParams.append('in_stock', params.in_stock);
    if (params.price_min) queryParams.append('price_min', params.price_min);
    if (params.price_max) queryParams.append('price_max', params.price_max);
    if (params.page) queryParams.append('page', params.page);
    
    return API.get(`/products/?${queryParams.toString()}`);
  },
  getProduct: (slug) => API.get(`/products/${slug}/`),
  searchProducts: (query) => API.get(`/products/search/?q=${query}`),
  getFeaturedProducts: () => API.get('/products/featured/'),
  getCategories: () => {
    console.log('Fetching categories...');
    return API.get('/categories/').then(response => {
      console.log('Categories response:', response.data);
      return response;
    }).catch(error => {
      console.error('Categories fetch error:', error.response || error);
      throw error;
    });
  },
  // getCategoryProducts: (categorySlug) => {
  //   return API.get(`/products/`, {
  //     params: {
  //       category_slug: categorySlug  // Change this parameter name to match your backend
  //     }
  //   });
  // },
  getPopularProducts: () => {
    return API.get('/products/popular/').then(response => {
      // Handle the new response structure that includes count
      return {
        ...response,
        data: response.data.results || response.data
      };
    });
  },
  getCategory: (slug) => API.get(`/categories/${slug}/`),
  createGuestCart: (sessionId) => 
    API.post('/carts/guest/', { user_session_id: sessionId }),
  getGuestCart: (sessionId) => {
    if (!sessionId) {
      throw new Error('Guest session ID is required');
    }
    return API.get('/carts/guest_cart/', {
      params: { user_session_id: sessionId }
    });
  },
  addToGuestCart: (data) => {
    if (!data.user_session_id) {
      throw new Error('Guest session ID is required');
    }
    return API.post('/carts/add_guest_item/', data);
  },
  migrateGuestCart: async (data) => {
    if (!data.user_session_id) {
      throw new Error('Guest session ID is required for migration');
    }
    return API.post('/carts/migrate_cart/', data);
  },
  getUserCart: () => {
    return API.get('/carts/user_cart/');
  },
  addToUserCart: (productId, quantity) => {
    return API.post('/carts/add_item/', { 
      product_id: productId, 
      quantity 
    });
  },
  removeFromUserCart: async (itemId) => {
    try {
        const cartResponse = await productsAPI.getUserCart();
        const cartId = cartResponse.data.id;
        
        return API.post(`/carts/${cartId}/remove_item/`, {
            cart_item_id: itemId
        });
    } catch (error) {
        console.error('Error removing from cart:', error);
        throw error;
    }
  },
  updateUserCartItem: async (itemId, quantity) => {
    const cartResponse = await API.get('/carts/');
    if (!cartResponse.data || !cartResponse.data.id) {
      throw new Error('No valid cart found');
    }
    return API.post(`/carts/${cartResponse.data.id}/update_item/`, {
      cart_item_id: itemId,
      quantity
    });
  },
  
  clearUserCart: async () => {
    const cartResponse = await API.get('/carts/');
    if (!cartResponse.data || !cartResponse.data.id) {
      throw new Error('No valid cart found');
    }
    return API.post(`/carts/${cartResponse.data.id}/clear/`);
  },

  // Guest cart operations remain the same
  removeFromGuestCart: (sessionId, itemId) => 
    API.post('/carts/remove_guest_item/', {
      user_session_id: sessionId,
      cart_item_id: itemId
    }),
  
  updateGuestCartItem: (sessionId, itemId, quantity) => 
    API.post('/carts/update_guest_item/', {
      user_session_id: sessionId,
      cart_item_id: itemId,
      quantity
    }),
  
  clearGuestCart: (sessionId) => 
    API.post('/carts/clear_guest_cart/', {
      user_session_id: sessionId
    }),

  subscribeNewsletter: (data) => {
    return API.post('/newsletter/subscribe/', data);
  },
  getCategoryProducts: (slug, params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.search) queryParams.append('search', params.search);
    if (params.ordering) queryParams.append('ordering', params.ordering);
    if (params.in_stock) queryParams.append('in_stock', params.in_stock);
    if (params.price_min) queryParams.append('price_min', params.price_min);
    if (params.price_max) queryParams.append('price_max', params.price_max);
    if (params.page) queryParams.append('page', params.page);
    
    return API.get(`/categories/${slug}/products/?${queryParams.toString()}`);
  },
  
};

//kong 
//venture

// Cart API Services
const cartAPI = {
  getCart: () => {
    const sessionId = sessionStorage.getItem(GUEST_SESSION_ID);
    return API.get('carts/current/', {
      params: {
        user_session_id: sessionId
      }
    });
  },

  getCurrentCart: () => {
    const sessionId = sessionStorage.getItem(GUEST_SESSION_ID);
    if (!sessionId) {
      const newSessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem(GUEST_SESSION_ID, newSessionId);
    }
    return API.get('carts/current/', {
      params: {
        user_session_id: sessionStorage.getItem(GUEST_SESSION_ID)
      }
    });
  },

  addItem: (data) => {
    const sessionId = sessionStorage.getItem(GUEST_SESSION_ID);
    return API.post('/carts/add_item/', {
      ...data,
      user_session_id: sessionId
    });
  },

  updateItem: (data) => {
    const sessionId = sessionStorage.getItem(GUEST_SESSION_ID);
    return API.post('/carts/update_item/', {
      ...data,
      user_session_id: sessionId
    });
  },

  removeItem: (cartItemId) => {
    const sessionId = sessionStorage.getItem(GUEST_SESSION_ID);
    return API.post('/carts/remove_item/', {
      cart_item_id: cartItemId,
      user_session_id: sessionId
    });
  },

  clearCart: () => {
    const sessionId = sessionStorage.getItem(GUEST_SESSION_ID);
    return API.post('carts/clear/', {
      user_session_id: sessionId
    });
  },

  migrateCart: (sessionId) => {
    return API.post('carts/migrate/', {
      user_session_id: sessionId
    });
  }
};

// Order API Services
const orderAPI = {
  getOrders: () => API.get('/orders/'),
  getOrder: (orderId) => API.get(`/orders/${orderId}/`),
  getCurrentUserOrders: () => API.get('/orders/my-orders/'),
  checkout: async (checkoutData) => {
    console.log('Checkout request data:', checkoutData);
    try {
      // Ensure proper delivery_location format and POST method
      const formattedData = {
        ...checkoutData,
        // If pickup, use KENCOM, otherwise use selected delivery location
        delivery_location: checkoutData.is_pickup ? 'PICKUP' : checkoutData.delivery_location || '',
      };

      const response = await API.post('/orders/checkout/', formattedData, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('Checkout response data:', response.data);
      return response;
    } catch (error) {
      console.error('Checkout error details:', {
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });
      throw error;
    }
  },
  initiateMpesaPayment: (paymentData) => API.post('/mpesa/initiate_payment/', paymentData),
  queryMpesaStatus: (queryData) => API.post('/mpesa/query_status/', queryData),
  updateOrderStatus: (orderId, status) => API.patch(`orders/${orderId}/update_status/`, { status }),
};

// Admin API Services
const adminAPI = {
  // Product management
  createProduct: (productData) => {
    // Create config with multipart/form-data header
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };
    return API.post('/products/', productData, config);
  },
  updateProduct: (slug, productData) => {
    // Create config with multipart/form-data header
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };
    return API.put(`/products/${slug}/`, productData, config);
  },
  deleteProduct: (slug) => API.delete(`/products/${slug}/`),
  deleteProductImage: (slug, imageId) => {
    return API.delete(`/products/${slug}/images/${imageId}/`);
  },
  
  // Category management
  createCategory: (categoryData) => API.post('/categories/', categoryData),
  updateCategory: (slug, categoryData) => {
    const formData = new FormData();
    Object.keys(categoryData).forEach(key => {
        if (key === 'is_active') {
            formData.append(key, categoryData[key].toString());
        } else {
            formData.append(key, categoryData[key]);
        }
    });
    
    return API.put(`/categories/${slug}/`, formData);
  },
  deleteCategory: (slug) => API.delete(`/categories/${slug}/`),
  getCategories: () => API.get('/categories/', {
    params: {
      page_size: 1000 // Adjust based on your needs
    }
  }),

  // Order management - Using the existing orders endpoints
  getAllOrders: () => API.get('/orders/'),
  getOrder: (id) => API.get(`/orders/${id}/`),
  updateOrderStatus: (orderId, statusData) => API.patch(`/orders/${orderId}/update_status/`, statusData),

  getDashboardData: () => API.get('/admin/dashboard/').then(response => {
    console.log('Dashboard data:', response.data);
    return response;
  }),
  // getDashboardData: (timeRange = 'month') => API.get(`/admin/get_dashboard_data/?time_range=${timeRange}`),
  getProductPerformance: () => API.get('/admin/dashboard/product-performance/'),
  getCategoryDistribution: () => API.get('/admin/dashboard/category-distribution/'),
  getSalesOverview: (timeRange) => API.get(`/admin/dashboard/sales-overview/?time_range=${timeRange}`)
};

// Add to your existing API services

const wishlistAPI = {
  getWishlist: () => API.get('/wishlist/items/'),
  toggleWishlist: (productId) => API.post('/wishlist/toggle/', { product_id: productId }),
  migrateWishlist: (sessionId) => API.post('/wishlist/migrate/', { session_id: sessionId }),
  checkWishlistItem: (productId) => API.get(`/wishlist/check/${productId}/`),
};

// Update the exports
export { 
    API, 
    authAPI, 
    productsAPI, 
    cartAPI, 
    wishlistAPI,
    orderAPI,
    adminAPI
};
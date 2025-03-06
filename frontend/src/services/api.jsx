import axios from "axios";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "./constants";

const apiUrl = "http://localhost:8000/api/";
// Base URL with /api/ prefix to match Django router patterns

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL : apiUrl,
  timeout: 10000,
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
        return API(originalRequest);
      } catch (err) {
        onRefreshed(null);
        localStorage.removeItem(ACCESS_TOKEN);
        localStorage.removeItem(REFRESH_TOKEN);
        window.location.href = '/login';
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
        // Eject the interceptor after the request is complete
        API.interceptors.response.eject(interceptor);
      });
  },
  
  verifyOTP: (otpData) => API.post('/verify-otp/', otpData),
  resendOTP: (otpData) => API.post('/resend-otp/', otpData),
  
  logout: (refreshToken) => API.post('/logout/', { refresh: refreshToken }),
  changePassword: (passwords) => API.post('/change-password/', passwords),
  getCurrentUser: () => API.get('/profile/'),
  updateProfile: (userData) => API.put('/profile/', userData),
};

// Products API Services
const productsAPI = {
  getProducts: (params = {}) => {
    const queryParams = new URLSearchParams();
    
    // Add search param if exists
    if (params.search) queryParams.append('search', params.search);
    
    // Add category filter
    if (params.category) queryParams.append('category', params.category);
    
    // Add sorting
    if (params.sort) queryParams.append('ordering', params.sort);
    
    // Add stock filter
    if (params.inStock !== undefined) {
        queryParams.append('inStock', params.inStock);
    }
    
    // Add price range
    if (params.price_min !== undefined) {
        queryParams.append('price_min', params.price_min);
    }
    if (params.price_max !== undefined) {
        queryParams.append('price_max', params.price_max);
    }
    
    // Add pagination
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
  getCategoryProducts: (categorySlug) => {
    return API.get(`/products/`, {
      params: {
        category_slug: categorySlug  // Change this parameter name to match your backend
      }
    });
  },
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
  getGuestCart: (sessionId) => 
    API.get('/carts/guest_cart/', { 
      params: { 
        user_session_id: sessionId 
      }
    }),
  addToGuestCart: (sessionId, productId, quantity) => 
    API.post('/carts/add_guest_item/', {
      user_session_id: sessionId,
      product_id: productId,
      quantity: quantity
    }),
  migrateGuestCart: (sessionId) => 
    API.post('/carts/migrate/', { 
      user_session_id: sessionId 
    }).catch(error => {
      // Ignore specific errors that are expected
      if (error.response?.data?.error?.includes('not found')) {
        return { data: null };
      }
      throw error;
    }),
  getUserCart: async () => {
    // First try to get existing cart
    const response = await API.get('/carts/');
    
    // If no cart exists, create one
    if (!response.data || !response.data.id) {
        const newCartResponse = await API.post('/carts/');
        return newCartResponse;
    }
    
    return response;
  },
  addToUserCart: async (productId, quantity) => {
    try {
        // Get or create cart
        const cartResponse = await productsAPI.getUserCart();
        const cartId = cartResponse.data.id;
        
        // Add item to cart
        return API.post(`/carts/${cartId}/add_item/`, {
            product_id: productId,
            quantity: quantity
        });
    } catch (error) {
        console.error('Error adding to cart:', error);
        throw error;
    }
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
};

// Cart API Services
const cartAPI = {
  getCart: () => API.get('/carts/'),
  createCart: () => API.post('/carts/'),
  addToCart: async (productId, quantity) => {
    // Get or create cart first
    const cartResponse = await API.get('/carts/');
    const cart = cartResponse.data;
    return API.post(`/carts/${cart.id}/add_item/`, { 
        product_id: productId, 
        quantity 
    });
  },
  updateCartItem: async (cartItemId, quantity) => {
    try {
      const response = await API.get('/carts/');
      const cart = response.data.results[0];
      
      if (!cart) {
        throw new Error('No cart found');
      }
      
      return API.post(`/carts/${cart.id}/update_item/`, {
        cart_item_id: cartItemId,
        quantity
      });
    } catch (error) {
      console.error('Error updating cart item:', error);
      throw error;
    }
  },
  removeFromCart: async (cartItemId) => {
    try {
      const response = await API.get('/carts/');
      const cart = response.data.results[0];
      
      if (!cart) {
        throw new Error('No cart found');
      }
      
      return API.post(`/carts/${cart.id}/remove_item/`, {
        cart_item_id: cartItemId
      });
    } catch (error) {
      console.error('Error removing cart item:', error);
      throw error;
    }
  },
  clearCart: async () => {
    try {
      const response = await API.get('/carts/');
      const cart = response.data.results[0];
      
      if (!cart) {
        throw new Error('No cart found');
      }
      
      return API.post(`/carts/${cart.id}/clear/`);
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  }
};

// Order API Services
const orderAPI = {
  getOrders: () => API.get('/orders/'),
  getOrder: (id) => API.get(`/orders/${id}/`),
  checkout: async (checkoutData) => {
    console.log('Checkout request data:', checkoutData);
    try {
      const response = await API.post('/orders/checkout/', checkoutData);
      console.log('Checkout response data:', response.data);
      return response;
    } catch (error) {
      console.error('Checkout error:', error.response?.data || error.message);
      throw error;
    }
  },
  initiateMpesaPayment: (paymentData) => API.post('/mpesa/initiate_payment/', paymentData),
  queryMpesaStatus: (queryData) => API.post('/mpesa/query_status/', queryData),
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

  getDashboardData: () => API.get('/admin/dashboard/'),
};

export { API, authAPI, productsAPI, cartAPI, orderAPI, adminAPI };
import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate, BrowserRouter as Router } from 'react-router-dom';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoutes';
import PreLoader from './components/PreLoader';
import { useAuth } from './authentication/AuthContext';
import PasswordReset from './components/auth/PasswordReset';
// Public Pages
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CategoryPage from './pages/CategoryPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CartPage from './pages/CartPage';
import NotFoundPage from './pages/NotFoundPage';
import OTPVerification from './pages/OTPVerification';
import PasswordChange from './pages/PasswordChange';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import WishlistPage from './pages/WishlistPage';

// Customer Pages
import ProfilePage from './pages/customer/ProfilePage';
import OrdersPage from './pages/customer/OrdersPage';
import OrderDetailPage from './pages/customer/OrderDetailPage';
import CheckoutPage from './pages/customer/CheckoutPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminProductForm from './pages/admin/AdminProductForm';
import AdminCategories from './pages/admin/AdminCategories';
import AdminCategoryForm from './pages/admin/AdminCategoryForm';
import AdminOrders from './pages/admin/AdminOrders';
import AdminOrderDetail from './pages/admin/AdminOrderDetails';


function App() {
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { fetchCurrentUser } = useAuth();
  
  useEffect(() => {
    const handleInitialLoad = async () => {
      try {
        // Check if we just completed OTP verification
        const justVerified = sessionStorage.getItem('justVerified');
        if (justVerified) {
          sessionStorage.removeItem('justVerified');
          await fetchCurrentUser();
          // Navigate to home or intended path
          const intendedPath = sessionStorage.getItem('redirectAfterLogin') || '/';
          sessionStorage.removeItem('redirectAfterLogin');
          navigate(intendedPath);
        }
        
        // Check if we just completed authentication
        const justAuthenticated = sessionStorage.getItem('justAuthenticated');
        if (justAuthenticated) {
          sessionStorage.removeItem('justAuthenticated');
          const intendedPath = sessionStorage.getItem('redirectAfterLogin') || '/';
          sessionStorage.removeItem('redirectAfterLogin');
          navigate(intendedPath);
        }
      } finally {
        setIsLoading(false);
      }
    };

    handleInitialLoad();
  }, [navigate, fetchCurrentUser]);
  
  if (isLoading) {
    return <PreLoader />;
  }
  
  return <AppRoutes />;
}

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/shop" element={<ShopPage />} />
      <Route path="/product/:slug" element={<ProductDetailPage />} />
      <Route path="/category/:slug" element={<CategoryPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/verify-otp" element={<OTPVerification />} />
      <Route path="/password-change" element={<PasswordChange />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/wishlist" element={<WishlistPage />} />
      <Route path="/reset-password/:uid/:token" element={<PasswordReset />} />
      
      {/* Protected Customer Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/:id" element={<OrderDetailPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
      </Route>
      
      {/* Protected Admin Routes */}
      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/products" element={<AdminProducts />} />
        <Route path="/admin/products/new" element={<AdminProductForm />} />
        <Route path="/admin/products/edit/:slug" element={<AdminProductForm />} />
        <Route path="/admin/categories" element={<AdminCategories />} />
        <Route path="/admin/categories/new" element={<AdminCategoryForm />} />
        <Route path="/admin/categories/edit/:slug" element={<AdminCategoryForm />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/admin/orders/:id" element={<AdminOrderDetail />} />
      </Route>
      
      {/* 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default App;
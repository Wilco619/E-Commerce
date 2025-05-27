import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, TextField, Typography, Alert, CircularProgress, Paper, Stack, AlertTitle } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { authAPI } from '../services/api';
import { useAuth } from '../authentication/AuthContext';
import { useCart } from '../authentication/CartContext';
import { ACCESS_TOKEN, REFRESH_TOKEN, GUEST_SESSION_ID } from '../services/constants';
import { refreshAppState } from '../main';

const OTPVerification = () => {
  const { refreshUserProfile, verifyOTP, verificationState, setIsAuthenticated } = useAuth();
  const { refreshCart } = useCart();

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const navigate = useNavigate();

  // Get user_id from session storage (set during login)
  const [userId, setUserId] = useState(() => {
    // Try to get from sessionStorage first
    const storedId = sessionStorage.getItem('user_id');
    
    // If not in sessionStorage, try localStorage (as a backup)
    if (!storedId) {
      const localId = localStorage.getItem('userId');
      return localId || null;
    }
  
    return storedId;
  });

  // Check if already verified on mount
  useEffect(() => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN);
    
    if (accessToken && refreshToken) {
      setSuccess(true);
    }
  }, []);

  const handleVerification = async (otpValue) => {
    if (loading) return; // Prevent multiple submissions
    
    setLoading(true);
    try {
      const result = await verifyOTP({
        user_id: verificationState.userId || userId,
        otp: otpValue
      });
  
      if (result.success) {
        // Set flag for App.jsx to handle refresh
        sessionStorage.setItem('justVerified', 'true');
        
        // Display success message first
        setSuccess(true);
        
        // DIRECT FIX: Set isAuthenticated directly
        setIsAuthenticated(true);
        
        // Broadcast authentication change
        const authEvent = new CustomEvent('auth_state_updated', { 
          detail: { authenticated: true }
        });
        window.dispatchEvent(authEvent);
        
        // Navigate instead of reloading
        setTimeout(() => {
          navigate('/');
        }, 1500);
      }
    } catch (error) {
      console.error('OTP verification failed:', error);
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || success) return; // Prevent multiple submissions
    
    if (!userId) {
      setError('User ID is missing. Please login again.');
      return;
    }
    
    setLoading(true);
    setError('');
  
    try {
      const sessionId = localStorage.getItem(GUEST_SESSION_ID);
      
      console.log("Submitting OTP verification with user ID:", userId);
      
      const response = await authAPI.verifyOTP({
        user_id: userId,
        otp,
        user_session_id: sessionId
      });
  
      console.log("Verification response:", response);
  
      // Show success message immediately
      setSuccess(true);
  
      // Store tokens
      localStorage.setItem(ACCESS_TOKEN, response.data.access);
      localStorage.setItem(REFRESH_TOKEN, response.data.refresh);
  
      // Clear guest session data
      sessionStorage.removeItem('user_id');
      
      // Store userId in localStorage for persistence
      if (response.data.user_id) {
        setUserId(response.data.user_id);
        localStorage.setItem("userId", response.data.user_id);
      }
      
      if (response.data.cart_migrated) {
        localStorage.removeItem(GUEST_SESSION_ID);
      }
  
      // CRITICAL FIX: Directly set isAuthenticated to true in the auth context
      setIsAuthenticated(true);
  
      // Important: Update auth state with refreshUserProfile 
      await refreshUserProfile();
  
      // Then trigger cart refresh
      await refreshCart();
  
      // Broadcast the auth state change using the consistent function
      refreshAppState('auth', { 
        isAuthenticated: true,
        timestamp: Date.now()
      });
      
      // Navigate to home after a delay
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      console.log("Verification error:", err);
      setLoading(false);
      setError(err.response?.data?.error || 'Invalid OTP. Please try again.');
    }
  };

  // REMOVE the useEffect that causes the infinite reload loop
  // This was causing the page to constantly reload:
  /*
  useEffect(() => {
    if (success) {
      const reloadTimer = setTimeout(() => {
        window.location.reload();
      }, 2000);
      
      return () => clearTimeout(reloadTimer);
    }
  }, [success]);
  */

  const handleResendOTP = async () => {
    if (!userId) {
      setError('Session expired. Please login again.');
      return;
    }

    setResendLoading(true);
    setResendSuccess(false);
    setError('');

    try {
      const response = await authAPI.resendOTP({ user_id: userId });
      setResendSuccess(true);
      
      // Auto-hide resend success message after 5 seconds
      setTimeout(() => {
        setResendSuccess(false);
      }, 5000);
    } catch (err) {
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  // Show a clean success view when verification is complete
  if (success) {
    return (
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Alert severity="success" sx={{ maxWidth: 400, mx: 'auto' }}>
          <AlertTitle>Verification Successful</AlertTitle>
          Your account has been verified. Redirecting you to the dashboard...
        </Alert>
        <CircularProgress sx={{ mt: 4 }} />
      </Box>
    );
  }

  if (!userId) {
    return (
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Alert severity="error">
          <AlertTitle>Session Expired</AlertTitle>
          Your session has expired. Please login again.
        </Alert>
        <Button variant="contained" onClick={() => navigate('/login')} sx={{ mt: 2 }}>
          Back to Login
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 400, mx: 'auto' }}>
        <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 2, borderRadius: '50%', mb: 2 }}>
          <LockOutlinedIcon />
        </Box>

        <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
          Verify Your Account
        </Typography>

        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
          A verification code has been sent to your email.
          Please enter the 6-digit code to verify your account.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            {error}
          </Alert>
        )}

        {resendSuccess && (
          <Alert severity="info" sx={{ width: '100%', mb: 2 }}>
            A new verification code has been sent to your email.
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="otp"
            label="Verification Code"
            name="otp"
            autoComplete="one-time-code"
            autoFocus
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            inputProps={{ maxLength: 6 }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Verify'}
          </Button>

          <Stack direction="row" justifyContent="space-between" spacing={2}>
            <Button
              variant="text"
              color="primary"
              onClick={() => navigate('/login')}
              disabled={loading}
            >
              Back to Login
            </Button>

            <Button
              variant="text"
              color="primary"
              onClick={handleResendOTP}
              disabled={resendLoading}
            >
              {resendLoading ? <CircularProgress size={24} /> : 'Resend Code'}
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
};

export default OTPVerification;
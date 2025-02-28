import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, TextField, Typography, Alert, CircularProgress, Paper, Stack, AlertTitle } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { authAPI } from '../services/api';
import { ACCESS_TOKEN, REFRESH_TOKEN } from '../services/constants';

const OTPVerification = () => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const navigate = useNavigate();
  
  // Get user_id from session storage (set during login)
  const userId = sessionStorage.getItem('user_id');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.verifyOTP({ user_id: userId, otp });

      // Store tokens in localStorage
      localStorage.setItem(ACCESS_TOKEN, response.data.access);
      localStorage.setItem(REFRESH_TOKEN, response.data.refresh);

      // Clear user_id from session storage
      sessionStorage.removeItem('user_id');

      setSuccess(true);

      // Redirect to home or dashboard after successful verification
      navigate('/');
    } catch (err) {
      setLoading(false);
      setError('Invalid OTP. Please try again.');
    }
  };
  
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
    } catch (err) {
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };
  
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
        
        {success && (
          <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
            {success === true ? 'Verification successful!' : success}
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
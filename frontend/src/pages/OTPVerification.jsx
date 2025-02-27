import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, TextField, Typography, Alert, CircularProgress } from '@mui/material';
import { authAPI } from '../services/api';

const OTPVerification = () => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  
  // Get user_id from session storage (set during login)
  const userId = sessionStorage.getItem('user_id');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await authAPI.verifyOTP({ user_id: userId, otp });
      setSuccess(true);
      navigate('/dashboard');  // Redirect to dashboard or desired page after successful OTP verification
    } catch (err) {
      setLoading(false);
      setError('Invalid OTP. Please try again.');
    }
  };
  
  const handleResendOTP = async () => {
    // Implement resend OTP logic if needed
  };
  
  if (!userId) {
    return (
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h6">Session expired. Please login again.</Typography>
        <Button variant="contained" onClick={() => navigate('/login')}>Go to Login</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 8, textAlign: 'center' }}>
      <Typography variant="h5">OTP Verification</Typography>
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mt: 2 }}>OTP verified successfully!</Alert>}
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        <TextField
          label="Enter OTP"
          variant="outlined"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Verify OTP'}
        </Button>
      </Box>
      <Button onClick={handleResendOTP} sx={{ mt: 2 }}>Resend OTP</Button>
    </Box>
  );
};

export default OTPVerification;
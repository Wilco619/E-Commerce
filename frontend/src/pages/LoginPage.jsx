import React, { useState } from 'react';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Paper,
  Divider,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress
} from '@mui/material';
import { Visibility, VisibilityOff, LockOutlined } from '@mui/icons-material';
import { authAPI, cartAPI } from '../services/api';
import { useAuth } from '../authentication/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // Get redirect path from location state or default to home
  const from = location.state?.from?.pathname || '/';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    console.log(`Field ${name} updated to: ${value}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('=== LOGIN ATTEMPT STARTED ===');
    console.log('Form data:', formData);
    
    if (!formData.email || !formData.password) {
      const errorMsg = 'Please enter both username and password';
      console.log('Validation error:', errorMsg);
      setError(errorMsg);
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Prepare payload and log it
      const payload = {
        username_or_email: formData.email,
        password: formData.password
      };
      console.log('Login payload:', payload);
      console.log('API endpoint:', `${authAPI.baseURL || ''}/login/`);
      
      // Make API call
      console.log('Sending login request...');
      const response = await authAPI.login(payload);
      
      // Log successful response
      console.log('Login successful!');
      console.log('Response:', response.data);
      
      // Store user_id in session storage
      sessionStorage.setItem('user_id', response.data.user_id);
      
      // Redirect to OTP verification page
      console.log('Redirecting to OTP verification');
      navigate('/verify-otp', { state: { user_id: response.data.user_id } });
      
    } catch (err) {
      setLoading(false);
      console.error('=== LOGIN ERROR ===');
      console.error('Error object:', err);
      
      if (err.response) {
        console.error('Status code:', err.response.status);
        console.error('Response headers:', err.response.headers);
        console.error('Response data:', err.response.data);
        
        if (err.response.status === 401) {
          setError('Invalid username or password');
        } else if (err.response.data && err.response.data.detail) {
          setError(err.response.data.detail);
        } else if (err.response.data && err.response.data.non_field_errors) {
          // Handle non-field errors array specifically
          setError(err.response.data.non_field_errors.join(', '));
        } else {
          setError('Login failed. Please try again.');
        }
      } else if (err.request) {
        console.error('No response received:', err.request);
        setError('No response from server. Please check your connection.');
      } else {
        console.error('Error message:', err.message);
        setError('Login failed. Please try again.');
      }
      console.error('=== END LOGIN ERROR ===');
    } finally {
      console.log('Login attempt completed');
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm" sx={{ mb: 4 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          mt: 8, 
          p: 4, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center' 
        }}
      >
        <Box 
          sx={{
            my: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Box sx={{ 
            backgroundColor: 'primary.main', 
            borderRadius: '50%', 
            p: 1, 
            mb: 2 
          }}>
            <LockOutlined sx={{ color: 'white' }} />
          </Box>
          <Typography component="h1" variant="h5">
            Sign In
          </Typography>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email"
            name="email"
            autoComplete="email"
            autoFocus
            value={formData.email}
            onChange={handleChange}
            disabled={loading}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            id="password"
            autoComplete="current-password"
            value={formData.password}
            onChange={handleChange}
            disabled={loading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Sign In'}
          </Button>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Link component={RouterLink} to="/forgot-password" variant="body2">
              Forgot password?
            </Link>
            <Link component={RouterLink} to="/register" variant="body2">
              {"Don't have an account? Sign Up"}
            </Link>
          </Box>
        </Box>
        
        <Divider sx={{ my: 3, width: '100%' }}>
          <Typography variant="body2" color="text.secondary">
            OR
          </Typography>
        </Divider>
        
        <Button
          component={RouterLink}
          to="/shop"
          fullWidth
          variant="outlined"
          sx={{ mt: 1 }}
        >
          Continue as Guest
        </Button>
      </Paper>
    </Container>
  );
};

export default LoginPage;
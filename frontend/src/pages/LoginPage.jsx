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
import { authAPI } from '../services/api';
import { ACCESS_TOKEN, REFRESH_TOKEN } from '../services/constants';
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
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.login({
        username_or_email: formData.email,
        password: formData.password,
      });

      console.log('Login response:', response);

      // Check if the response indicates OTP generation
      if (response.data.message === 'OTP generated. Check your email.' && response.data.user_id) {
        // Store user_id in session storage
        sessionStorage.setItem('user_id', response.data.user_id);

        // Redirect to OTP verification page
        navigate('/verify-otp', { state: { user_id: response.data.user_id } });
      } else if (response.data.access && response.data.refresh && response.data.user_id) {
        // Store tokens in localStorage
        localStorage.setItem(ACCESS_TOKEN, response.data.access);
        localStorage.setItem(REFRESH_TOKEN, response.data.refresh);

        // Store user_id in session storage
        sessionStorage.setItem('user_id', response.data.user_id);

        // Redirect to home or dashboard
        navigate(from, { replace: true });
      } else {
        throw new Error('Invalid response data');
      }
    } catch (err) {
      console.error('Login error:', err);
      setLoading(false);
      setError('Login failed. Please try again.');
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
import React, { useState, useEffect, useCallback } from 'react';
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
  CircularProgress,
  Grid,
} from '@mui/material';
import { Visibility, VisibilityOff, LockOutlined } from '@mui/icons-material';
import { authAPI } from '../services/api';
import { ACCESS_TOKEN, REFRESH_TOKEN } from '../services/constants';
import { useAuth } from '../authentication/AuthContext';
import { useSnackbar } from 'notistack';
import { useAuthStateChange } from '../hooks/useAuthStateChange';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const handleAuthStateChange = useAuthStateChange();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Check if user attempted checkout
    const checkoutAttempted = sessionStorage.getItem('checkoutAttempted');
    if (checkoutAttempted) {
      setMessage('Please log in to complete your checkout');
    }
  }, []);

  // Get redirect path from location state or default to home
  const from = location.state?.from?.pathname || '/';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    console.log(`Field ${name} updated to: ${value}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Step 1: Attempt login
      const result = await login({
        username_or_email: formData.email,
        password: formData.password,
      });

      if (result.success) {
        if (result.requiresOTP) {
          enqueueSnackbar('Please verify your account with OTP sent to your email', {
            variant: 'success'
          });
          navigate('/verify-otp');
          return;
        }

        // Step 2: Wait for auth state to fully update
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to ensure token is set

        // Step 3: Trigger all necessary data refreshes
        await handleAuthStateChange();

        // Step 4: Clear any stored paths and navigate
        const redirectPath = sessionStorage.getItem('redirectAfterLogin') || '/';
        sessionStorage.removeItem('redirectAfterLogin');
        sessionStorage.removeItem('checkoutAttempted');

        // Step 5: Dispatch a custom event to notify other components
        window.dispatchEvent(new CustomEvent('login-complete', {
          detail: { success: true }
        }));

        // Step 6: Navigate to the intended path
        navigate(redirectPath, { replace: true });

        enqueueSnackbar('Successfully logged in!', { variant: 'success' });
      } else {
        throw new Error(result.error || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'An error occurred during login');
      enqueueSnackbar(err.message || 'Login failed', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Add cleanup effect
  useEffect(() => {
    return () => {
      // Cleanup any stored temporary data on component unmount
      sessionStorage.removeItem('checkoutAttempted');
    };
  }, []);

  return (
    <>





      <Container component="main" maxWidth="lg" sx={{ my: 8 }}>

        <Paper
          elevation={6}
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            overflow: 'hidden',
            borderRadius: 2,
            minHeight: '600px',
          }}
        >
          {/* Left Side - Image */}
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              flex: 1,
              bgcolor: 'primary.dark',
              position: 'relative',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              backgroundImage: 'url("https://source.unsplash.com/random?login")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Dark overlay for better text visibility */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 1,
              }}
            />

            {/* Welcome text overlay */}
            <Box
              sx={{
                position: 'relative',
                zIndex: 2,
                p: 4,
                textAlign: 'center',
                maxWidth: '80%'
              }}
            >
              <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
                Welcome Back
              </Typography>
              <Typography variant="body1">
                Sign in to access your account and continue your shopping experience
              </Typography>
            </Box>
          </Box>

          {/* Right Side - Login Form */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              p: { xs: 3, sm: 6 },
            }}
          >
            <Box
              sx={{
                width: '100%',
                maxWidth: 400,
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

              <Typography component="h2" variant="h5" fontWeight="bold" mb={3}>
                Sign In
              </Typography>

              {error && (
                <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                  {error}
                </Alert>
              )}

              {message && (
                <Alert severity="info" sx={{ width: '100%', mb: 2 }}>
                  {message}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
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
                  variant="outlined"
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
                  variant="outlined"
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
                  sx={{
                    mt: 3,
                    mb: 2,
                    py: 1.5,
                    borderRadius: 2,
                    fontWeight: 'bold',
                  }}
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
                sx={{
                  mt: 1,
                  py: 1.5,
                  borderRadius: 2,
                }}
              >
                Continue as Guest
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
    </>
  );
};

export default LoginPage;
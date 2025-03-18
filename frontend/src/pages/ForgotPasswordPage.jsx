import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import {
  Container,
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Fade,
  Divider,
  Link,
  InputAdornment,
  alpha
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LockResetIcon from '@mui/icons-material/LockReset';
import { motion } from 'framer-motion';
import { authAPI } from '../services/api';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [emailError, setEmailError] = useState('');

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    
    if (value && !validateEmail(value)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await authAPI.forgotPassword(email);
      setSuccess(true);
      enqueueSnackbar('Password reset email has been sent', { 
        variant: 'success',
        anchorOrigin: { vertical: 'top', horizontal: 'center' }
      });
      
    } catch (err) {
      // For security reasons, we don't disclose if the email exists or not
      setSuccess(true); // Still show success to prevent email enumeration
      enqueueSnackbar('If your email exists in our system, you will receive reset instructions', {
        variant: 'info',
        anchorOrigin: { vertical: 'top', horizontal: 'center' }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          marginBottom: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ width: '100%' }}
        >
          <Paper 
            elevation={4} 
            sx={{ 
              p: 5, 
              width: '100%',
              borderRadius: 2,
              boxShadow: (theme) => `0 8px 24px ${alpha(theme.palette.primary.main, 0.12)}`,
              overflow: 'hidden',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                backgroundColor: 'primary.main',
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <LockResetIcon color="primary" sx={{ fontSize: 28, mr: 1.5 }} />
              <Typography component="h1" variant="h5" fontWeight="500">
                Reset Your Password
              </Typography>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Enter your email address and we'll send you instructions to reset your password.
            </Typography>
            
            <Divider sx={{ mb: 4 }} />

            {error && (
              <Fade in={!!error}>
                <Alert 
                  severity="error" 
                  sx={{ mb: 3 }}
                  onClose={() => setError('')}
                >
                  {error}
                </Alert>
              </Fade>
            )}

            {success ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Alert 
                  severity="success" 
                  variant="outlined"
                  sx={{ 
                    mb: 3,
                    borderRadius: 1,
                    py: 2
                  }}
                >
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>Check your inbox</strong>
                  </Typography>
                  <Typography variant="body2">
                    We've sent password reset instructions to <strong>{email}</strong>. 
                    Please check your email and follow the link to reset your password.
                  </Typography>
                </Alert>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, mt: 2 }}>
                  Didn't receive an email? Check your spam folder or request another reset.
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                  <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/login')}
                    sx={{ 
                      flex: 1,
                      py: 1.2
                    }}
                  >
                    Back to Login
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => setSuccess(false)}
                    sx={{ 
                      flex: 1,
                      py: 1.2
                    }}
                  >
                    Try Again
                  </Button>
                </Box>
              </motion.div>
            ) : (
              <Box component="form" onSubmit={handleSubmit}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={handleEmailChange}
                  disabled={loading}
                  error={!!emailError}
                  helperText={emailError}
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1,
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
                
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading}
                  sx={{ 
                    mt: 1, 
                    mb: 3,
                    py: 1.5,
                    borderRadius: 1,
                    boxShadow: 2,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {loading ? (
                    <CircularProgress 
                      size={24} 
                      sx={{ 
                        color: (theme) => alpha(theme.palette.common.white, 0.8)
                      }} 
                    />
                  ) : (
                    'Send Reset Instructions'
                  )}
                </Button>
                
                <Box 
                  sx={{ 
                    textAlign: 'center',
                    mt: 2
                  }}
                >
                  <Link
                    component="button"
                    variant="body2"
                    onClick={() => navigate('/login')}
                    sx={{ 
                      display: 'inline-flex',
                      alignItems: 'center',
                      color: 'text.secondary',
                      textDecoration: 'none',
                      '&:hover': {
                        color: 'primary.main',
                        textDecoration: 'underline'
                      }
                    }}
                  >
                    <ArrowBackIcon fontSize="small" sx={{ mr: 0.5 }} />
                    Remember your password? Sign in
                  </Link>
                </Box>
              </Box>
            )}
          </Paper>
        </motion.div>
      </Box>
    </Container>
  );
};

export default ForgotPasswordPage;
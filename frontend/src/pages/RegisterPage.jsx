import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Link,
  Grid,
  Stepper,
  Step,
  StepLabel,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress
} from '@mui/material';
import { PersonAddOutlined, Visibility, VisibilityOff } from '@mui/icons-material';
import { authAPI } from '../services/api';
import { useAuth } from '../authentication/AuthContext'; // Assuming you have an AuthContext

const RegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    address: ''
  });
  
  // Password validation states
  const [passwordErrors, setPasswordErrors] = useState({
    length: false,
    hasNumber: false,
    hasUpper: false,
    hasLower: false
  });
  
  const steps = ['Account Information', 'Personal Details'];
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Validate password
    if (name === 'password') {
      validatePassword(value);
    }
  };
  
  const validatePassword = (password) => {
    setPasswordErrors({
      length: password.length >= 8,
      hasNumber: /\d/.test(password),
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password)
    });
  };
  
  const isPasswordValid = () => {
    return Object.values(passwordErrors).every(value => value === true);
  };
  
  const handleNext = () => {
    const isAccountInfoValid = formData.username && formData.email && 
                              formData.password && formData.password === formData.password_confirm &&
                              isPasswordValid();
    
    if (activeStep === 0 && !isAccountInfoValid) {
      setError('Please fill in all required fields and ensure passwords match and meet requirements');
      return;
    }
    
    setError('');
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };
  
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.password_confirm) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const response = await authAPI.register(formData);
      
      // Redirect to login page after successful registration
      navigate('/login');
      
    } catch (err) {
      setLoading(false);
      console.error('Registration error:', err);
      
      if (err.response && err.response.data) {
        if (err.response.data.details) {
          // Handle detailed validation errors
          const errorDetails = err.response.data.details;
          
          // Check if the error details is an object with field names as keys
          if (typeof errorDetails === 'object' && !Array.isArray(errorDetails)) {
            // Join all error messages into a single string
            const errorMessages = Object.entries(errorDetails)
              .map(([field, errors]) => {
                // If errors is an array, join them
                if (Array.isArray(errors)) {
                  return `${field}: ${errors.join(' ')}`;
                }
                // If errors is a string
                return `${field}: ${errors}`;
              })
              .join('\n');
            
            setError(errorMessages || 'Registration failed. Please try again.');
          } else if (errorDetails.message) {
            // If it's a simple message
            setError(errorDetails.message);
          } else {
            setError(JSON.stringify(errorDetails));
          }
        } else {
          setError(err.response.data.error || 'Registration failed. Please try again.');
        }
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
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
            <PersonAddOutlined sx={{ color: 'white' }} />
          </Box>
          <Typography component="h1" variant="h5">
            Create an Account
          </Typography>
        </Box>
        
        <Stepper activeStep={activeStep} sx={{ width: '100%', mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {error && (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" sx={{ width: '100%' }}>
          {activeStep === 0 ? (
            // Account Information Step
            <>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    id="username"
                    label="Username"
                    name="username"
                    autoComplete="username"
                    value={formData.username}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    id="email"
                    label="Email Address"
                    name="email"
                    autoComplete="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    name="password"
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleChange}
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
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    name="password_confirm"
                    label="Confirm Password"
                    type={showPassword ? 'text' : 'password'}
                    id="password_confirm"
                    value={formData.password_confirm}
                    onChange={handleChange}
                    error={formData.password !== formData.password_confirm && formData.password_confirm !== ''}
                    helperText={formData.password !== formData.password_confirm && formData.password_confirm !== '' ? 'Passwords do not match' : ''}
                  />
                </Grid>
              </Grid>
              
              {formData.password && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Password Requirements:
                  </Typography>
                  <Alert severity={passwordErrors.length ? "success" : "warning"} sx={{ mb: 1 }}>
                    At least 8 characters
                  </Alert>
                  <Alert severity={passwordErrors.hasNumber ? "success" : "warning"} sx={{ mb: 1 }}>
                    At least one number
                  </Alert>
                  <Alert severity={passwordErrors.hasUpper ? "success" : "warning"} sx={{ mb: 1 }}>
                    At least one uppercase letter
                  </Alert>
                  <Alert severity={passwordErrors.hasLower ? "success" : "warning"} sx={{ mb: 1 }}>
                    At least one lowercase letter
                  </Alert>
                </Box>
              )}
              
              <Button
                fullWidth
                variant="contained"
                onClick={handleNext}
                sx={{ mt: 3, mb: 2 }}
              >
                Next
              </Button>
            </>
          ) : (
            // Personal Details Step
            <>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    id="first_name"
                    label="First Name"
                    name="first_name"
                    autoComplete="given-name"
                    value={formData.first_name}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    id="last_name"
                    label="Last Name"
                    name="last_name"
                    autoComplete="family-name"
                    value={formData.last_name}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="phone_number"
                    label="Phone Number"
                    name="phone_number"
                    autoComplete="tel"
                    value={formData.phone_number}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="address"
                    label="Address"
                    name="address"
                    autoComplete="street-address"
                    multiline
                    rows={3}
                    value={formData.address}
                    onChange={handleChange}
                  />
                </Grid>
              </Grid>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, mb: 2 }}>
                <Button
                  variant="outlined"
                  onClick={handleBack}
                >
                  Back
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Register'}
                </Button>
              </Box>
            </>
          )}
          
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2">
              Already have an account?{' '}
              <Link component={RouterLink} to="/login" variant="body2">
                Sign in
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default RegisterPage;

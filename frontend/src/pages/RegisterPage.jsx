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
  CircularProgress,
  Divider,
  StepConnector,
  styled
} from '@mui/material';
import { 
  PersonAddOutlined, 
  Visibility, 
  VisibilityOff, 
  CheckCircleOutlined,
  AccountCircleOutlined,
  ContactMailOutlined 
} from '@mui/icons-material';
import { authAPI } from '../services/api';
import { useAuth } from '../authentication/AuthContext';

// Custom styled StepConnector
const ColorlibConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${StepConnector.alternativeLabel}`]: {
    top: 22,
  },
  [`& .${StepConnector.line}`]: {
    height: 3,
    border: 0,
    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : '#eaeaf0',
    borderRadius: 1,
  },
  [`&.Mui-active .${StepConnector.line}`]: {
    backgroundImage: `linear-gradient(to right, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
  },
  [`&.Mui-completed .${StepConnector.line}`]: {
    backgroundImage: `linear-gradient(to right, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
  },
}));

// Custom styled Step Icon
const ColorlibStepIconRoot = styled('div')(({ theme, ownerState }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[700] : '#ccc',
  zIndex: 1,
  color: '#fff',
  width: 45,
  height: 45,
  display: 'flex',
  borderRadius: '50%',
  justifyContent: 'center',
  alignItems: 'center',
  ...(ownerState.active && {
    backgroundImage: `linear-gradient(136deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
    boxShadow: '0 4px 10px 0 rgba(0,0,0,.25)',
  }),
  ...(ownerState.completed && {
    backgroundImage: `linear-gradient(136deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
  }),
}));

function ColorlibStepIcon(props) {
  const { active, completed, className, icon } = props;

  const icons = {
    1: <AccountCircleOutlined />,
    2: <ContactMailOutlined />,
  };

  return (
    <ColorlibStepIconRoot ownerState={{ completed, active }} className={className}>
      {completed ? <CheckCircleOutlined /> : icons[icon]}
    </ColorlibStepIconRoot>
  );
}

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
    <Container component="main" maxWidth="sm" sx={{ my: 8 }}>
      <Paper 
        elevation={6} 
        sx={{ 
          display: 'flex',
          flexDirection: { xs: 'column', md: 'column' },
          overflow: 'hidden',
          borderRadius: 2,
          minHeight: '700px',
        }}
      >
        {/* Top/Header Section - Image and Progress Indicator */}
        <Box
          sx={{
            bgcolor: 'primary.dark',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            backgroundImage: 'url("https://source.unsplash.com/random?signup")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            p: 3,
            height: '200px',
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
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              zIndex: 1,
            }}
          />
          
          {/* Content overlay */}
          <Box 
            sx={{ 
              position: 'relative', 
              zIndex: 2, 
              textAlign: 'center',
              width: '100%',
            }}
          >
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
              Join Our Community
            </Typography>
            <Typography variant="body1">
              Create an account to get access to exclusive deals
            </Typography>
          </Box>
        </Box>

        {/* Registration Form Section */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            p: { xs: 3, sm: 4 },
            overflow: 'auto'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%'
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
            
            <Typography component="h2" variant="h5" fontWeight="bold">
              Create an Account
            </Typography>
            
            {/* Stepper */}
            <Box sx={{ width: '100%', my: 3 }}>
              <Stepper activeStep={activeStep} alternativeLabel connector={<ColorlibConnector />}>
                {steps.map((label, index) => (
                  <Step key={label}>
                    <StepLabel StepIconComponent={ColorlibStepIcon}>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>
            
            {error && (
              <Alert severity="error" sx={{ width: '100%', my: 2 }}>
                {error}
              </Alert>
            )}
            
            <Box component="form" sx={{ width: '100%', mt: 2 }}>
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
                        variant="outlined"
                        size="medium"
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
                        variant="outlined"
                        size="medium"
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
                        variant="outlined"
                        size="medium"
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
                        variant="outlined"
                        size="medium"
                        error={formData.password !== formData.password_confirm && formData.password_confirm !== ''}
                        helperText={formData.password !== formData.password_confirm && formData.password_confirm !== '' ? 'Passwords do not match' : ''}
                      />
                    </Grid>
                  </Grid>
                  
                  {formData.password && (
                    <Box sx={{ mt: 3, mb: 2, bgcolor: 'background.paper', borderRadius: 1, p: 2 }}>
                      <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                        Password Requirements:
                      </Typography>
                      <Grid container spacing={1}>
                        <Grid item xs={12} sm={6}>
                          <Alert 
                            severity={passwordErrors.length ? "success" : "warning"} 
                            icon={passwordErrors.length ? <CheckCircleOutlined /> : undefined}
                            sx={{ 
                              py: 0, 
                              '& .MuiAlert-message': { py: 1 },
                              '& .MuiAlert-icon': { my: 1 }
                            }}
                          >
                            At least 8 characters
                          </Alert>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Alert 
                            severity={passwordErrors.hasNumber ? "success" : "warning"} 
                            icon={passwordErrors.hasNumber ? <CheckCircleOutlined /> : undefined}
                            sx={{ 
                              py: 0, 
                              '& .MuiAlert-message': { py: 1 },
                              '& .MuiAlert-icon': { my: 1 }
                            }}
                          >
                            At least one number
                          </Alert>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Alert 
                            severity={passwordErrors.hasUpper ? "success" : "warning"} 
                            icon={passwordErrors.hasUpper ? <CheckCircleOutlined /> : undefined}
                            sx={{ 
                              py: 0, 
                              '& .MuiAlert-message': { py: 1 },
                              '& .MuiAlert-icon': { my: 1 }
                            }}
                          >
                            At least one uppercase letter
                          </Alert>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Alert 
                            severity={passwordErrors.hasLower ? "success" : "warning"} 
                            icon={passwordErrors.hasLower ? <CheckCircleOutlined /> : undefined}
                            sx={{ 
                              py: 0, 
                              '& .MuiAlert-message': { py: 1 },
                              '& .MuiAlert-icon': { my: 1 }
                            }}
                          >
                            At least one lowercase letter
                          </Alert>
                        </Grid>
                      </Grid>
                    </Box>
                  )}
                  
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleNext}
                    sx={{ 
                      mt: 3, 
                      mb: 2,
                      py: 1.5,
                      borderRadius: 2,
                      fontWeight: 'bold'
                    }}
                  >
                    Continue to Personal Details
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
                        variant="outlined"
                        size="medium"
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
                        variant="outlined"
                        size="medium"
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
                        variant="outlined"
                        size="medium"
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
                        variant="outlined"
                        size="medium"
                      />
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, mb: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={handleBack}
                      sx={{ py: 1.5, px: 4, borderRadius: 2 }}
                    >
                      Back
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleSubmit}
                      disabled={loading}
                      sx={{ py: 1.5, px: 4, borderRadius: 2, fontWeight: 'bold' }}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Create Account'}
                    </Button>
                  </Box>
                </>
              )}
              
              <Divider sx={{ my: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  OR
                </Typography>
              </Divider>
              
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Already have an account?
                </Typography>
                <Button 
                  component={RouterLink} 
                  to="/login" 
                  variant="outlined"
                  fullWidth
                  sx={{ py: 1.5, borderRadius: 2 }}
                >
                  Sign In
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default RegisterPage;
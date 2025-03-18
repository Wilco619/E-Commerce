import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  CircularProgress,
  Alert,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  LinearProgress,
  Fade,
  useTheme,
  useMediaQuery,
  Container,
  alpha 
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { authAPI } from '../services/api';

const PasswordChange = () => {

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [formData, setFormData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });

  const [passwordVisibility, setPasswordVisibility] = useState({
    old_password: false,
    new_password: false,
    confirm_password: false
  });

  // Calculate password strength
  const calculatePasswordStrength = () => {
    const requirements = Object.values(passwordRequirements).filter(Boolean).length;
    return (requirements / 6) * 100;
  };

  const getStrengthColor = (strength) => {
    if (strength < 30) return theme.palette.error.main;
    if (strength < 60) return theme.palette.warning.main;
    return theme.palette.success.main;
  };
  
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    special: false,
    match: false
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (name === 'new_password') {
      validatePassword(value, formData.confirm_password);
    } else if (name === 'confirm_password') {
      validatePassword(formData.new_password, value);
    }
  };
  
  const validatePassword = (password, confirmPassword) => {
    setPasswordRequirements({
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
      match: password === confirmPassword && password !== ''
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const { old_password, new_password, confirm_password } = formData;
    
    if (!old_password || !new_password || !confirm_password) {
      setError('All fields are required');
      return;
    }
    
    if (new_password !== confirm_password) {
      setError('New passwords do not match');
      return;
    }
    
    // Check if password meets all requirements
    const allRequirementsMet = Object.values(passwordRequirements).every(val => val);
    if (!allRequirementsMet) {
      setError('Please make sure your password meets all requirements');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await authAPI.changePassword({
        old_password,
        new_password
      });
      
      setSuccess(true);
      setFormData({
        old_password: '',
        new_password: '',
        confirm_password: ''
      });
      
      // Reset password requirements
      setPasswordRequirements({
        length: false,
        lowercase: false,
        uppercase: false,
        number: false,
        special: false,
        match: false
      });
      
    } catch (err) {
      console.error('Password change failed:', err.response?.data || err.message);
      
      if (err.response?.data?.errors) {
        setError(err.response.data.errors.join('. '));
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Failed to change password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const togglePasswordVisibility = (field) => {
    setPasswordVisibility(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const passwordStrength = calculatePasswordStrength();
  
  return (
    <Container maxWidth="sm">
    <Fade in={true} timeout={800}>
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          my: 4
        }}
      >
        <Paper 
          elevation={3} 
          sx={{ 
            p: isMobile ? 3 : 4, 
            borderRadius: 2,
            width: '100%',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              boxShadow: '0 12px 32px rgba(0,0,0,0.15)'
            }
          }}
        >
        <Box 
          sx={{ 
            bgcolor: 'primary.main', 
            color: 'white', 
            p: 1.5, 
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            mb: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
        >
          <LockOutlinedIcon fontSize="medium" />
        </Box>
        
        <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
          Change Password
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
            Password successfully changed!
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            name="old_password"
            label="Current Password"
            type={passwordVisibility.old_password ? 'text' : 'password'}
            id="old_password"
            autoComplete="current-password"
            value={formData.old_password}
            onChange={handleChange}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => togglePasswordVisibility('old_password')}
                    edge="end"
                  >
                    {passwordVisibility.old_password ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="new_password"
            label="New Password"
            type={passwordVisibility.new_password ? 'text' : 'password'}
            id="new_password"
            autoComplete="new-password"
            value={formData.new_password}
            onChange={handleChange}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => togglePasswordVisibility('new_password')}
                    edge="end"
                  >
                    {passwordVisibility.new_password ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {formData.new_password && (
            <Box sx={{ mt: 1, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Password Strength
                </Typography>
                <Typography variant="caption" sx={{ color: getStrengthColor(passwordStrength) }}>
                  {passwordStrength < 30 ? 'Weak' : passwordStrength < 60 ? 'Moderate' : 'Strong'}
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={passwordStrength} 
                sx={{ 
                  height: 6, 
                  borderRadius: 3,
                  backgroundColor: theme.palette.grey[200],
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: getStrengthColor(passwordStrength)
                  }
                }} 
              />
            </Box>
          )}
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirm_password"
            label="Confirm New Password"
            type={passwordVisibility.confirm_password ? 'text' : 'password'}
            id="confirm_password"
            autoComplete="new-password"
            value={formData.confirm_password}
            onChange={handleChange}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => togglePasswordVisibility('confirm_password')}
                    edge="end"
                  >
                    {passwordVisibility.confirm_password ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Password Requirements:
          </Typography>
          
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: 1.5
          }}>
            {Object.entries(passwordRequirements).map(([key, value]) => (
              <Box 
                key={key} 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  transition: 'all 0.2s ease-in-out',
                  p: 1,
                  borderRadius: 1,
                  backgroundColor: value ? 
                    alpha(theme.palette.success.main, 0.08) : 
                    'transparent'
                }}
              >
                {value ? 
                  <CheckCircleOutlineIcon 
                    color="success" 
                    fontSize="small" 
                    sx={{ mr: 1 }} 
                  /> : 
                  <ErrorOutlineIcon 
                    color="error" 
                    fontSize="small" 
                    sx={{ mr: 1 }} 
                  />
                }
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: value ? 
                      theme.palette.success.dark : 
                      theme.palette.text.secondary,
                    fontWeight: value ? 500 : 400
                  }}
                >
                  {key === 'length' && 'At least 8 characters'}
                  {key === 'lowercase' && 'One lowercase letter'}
                  {key === 'uppercase' && 'One uppercase letter'}
                  {key === 'number' && 'One number'}
                  {key === 'special' && 'One special character'}
                  {key === 'match' && 'Passwords match'}
                </Typography>
              </Box>
            ))}
          </Box>
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            sx={{ 
              mt: 4, 
              mb: 2,
              py: 1.5,
              borderRadius: 1.5,
              textTransform: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              fontWeight: 600,
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
                transform: 'translateY(-1px)'
              }
            }}
            disabled={loading}
          >
            {loading ? 
              <CircularProgress size={24} color="inherit" /> : 
              'Change Password'
            }
          </Button>
        </Box>
        </Paper>
      </Box>
    </Fade>
  </Container>
  );
};

export default PasswordChange;

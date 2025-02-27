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
  Divider
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { authAPI } from '../services/api';

const PasswordChange = () => {
  const [formData, setFormData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });
  
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    switch (field) {
      case 'old_password':
        setShowOldPassword(!showOldPassword);
        break;
      case 'new_password':
        setShowNewPassword(!showNewPassword);
        break;
      case 'confirm_password':
        setShowConfirmPassword(!showConfirmPassword);
        break;
      default:
        break;
    }
  };
  
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        mt: 4,
        mb: 4 
      }}
    >
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          maxWidth: 500,
          mx: 'auto',
          width: '100%'
        }}
      >
        <Box 
          sx={{ 
            bgcolor: 'primary.main', 
            color: 'white', 
            p: 2, 
            borderRadius: '50%',
            mb: 2
          }}
        >
          <LockOutlinedIcon />
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
            type={showOldPassword ? 'text' : 'password'}
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
                    {showOldPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
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
            type={showNewPassword ? 'text' : 'password'}
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
                    {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirm_password"
            label="Confirm New Password"
            type={showConfirmPassword ? 'text' : 'password'}
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
                    {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Password Requirements:
          </Typography>
          
          <List dense sx={{ bgcolor: 'background.paper' }}>
            <ListItem>
              <ListItemIcon>
                {passwordRequirements.length ? 
                  <CheckCircleOutlineIcon color="success" /> : 
                  <ErrorOutlineIcon color="error" />}
              </ListItemIcon>
              <ListItemText primary="At least 8 characters long" />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                {passwordRequirements.lowercase ? 
                  <CheckCircleOutlineIcon color="success" /> : 
                  <ErrorOutlineIcon color="error" />}
              </ListItemIcon>
              <ListItemText primary="At least one lowercase letter" />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                {passwordRequirements.uppercase ? 
                  <CheckCircleOutlineIcon color="success" /> : 
                  <ErrorOutlineIcon color="error" />}
              </ListItemIcon>
              <ListItemText primary="At least one uppercase letter" />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                {passwordRequirements.number ? 
                  <CheckCircleOutlineIcon color="success" /> : 
                  <ErrorOutlineIcon color="error" />}
              </ListItemIcon>
              <ListItemText primary="At least one number" />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                {passwordRequirements.special ? 
                  <CheckCircleOutlineIcon color="success" /> : 
                  <ErrorOutlineIcon color="error" />}
              </ListItemIcon>
              <ListItemText primary="At least one special character" />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                {passwordRequirements.match ? 
                  <CheckCircleOutlineIcon color="success" /> : 
                  <ErrorOutlineIcon color="error" />}
              </ListItemIcon>
              <ListItemText primary="Passwords match" />
            </ListItem>
          </List>
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Change Password'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default PasswordChange;

import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Container, 
  Paper, 
  Grid, 
  TextField, 
  Button, 
  Box, 
  Divider, 
  CircularProgress,
  Snackbar,
  Alert,
  Avatar,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  styled
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import ReceiptIcon from '@mui/icons-material/Receipt';
import LockIcon from '@mui/icons-material/Lock';
import { authAPI } from '../../services/api';
import { motion } from 'framer-motion';

// Styled components for enhanced visuals
const ProfileCard = styled(Paper)(({ theme }) => ({
  borderRadius: 16,
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)',
  overflow: 'hidden',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    boxShadow: '0 12px 28px rgba(0, 0, 0, 0.08)',
    transform: 'translateY(-4px)',
  }
}));

const GradientAvatar = styled(Avatar)(({ theme }) => ({
  width: 120,
  height: 120,
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
  boxShadow: '0 12px 24px rgba(0, 0, 0, 0.1)',
  border: `4px solid ${theme.palette.background.paper}`,
}));

const ProfileButton = styled(Button)(({ theme }) => ({
  borderRadius: 8,
  padding: '10px 16px',
  textTransform: 'none',
  fontWeight: 500,
  transition: 'all 0.2s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  }
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 8,
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.primary.main,
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderWidth: 2,
    }
  },
  '& .MuiInputLabel-root': {
    fontSize: '0.9rem',
  }
}));

const ProfilePage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    address: ''
  });
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getCurrentUser();
      setUser(response.data);
      setFormData({
        first_name: response.data.first_name || '',
        last_name: response.data.last_name || '',
        phone_number: response.data.phone_number || '',
        address: response.data.address || ''
      });
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      showToast('Failed to load profile', 'error');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Simple validation
    if (formData.phone_number && !/^\+?[0-9]{10,15}$/.test(formData.phone_number)) {
      newErrors.phone_number = 'Please enter a valid phone number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSaving(true);
      await authAPI.updateProfile(formData);
      
      // Refresh user data
      await fetchUserProfile();
      
      showToast('Profile updated successfully', 'success');
      setSaving(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      showToast('Failed to update profile', 'error');
      setSaving(false);
      
      // Handle API validation errors
      if (err.response && err.response.data) {
        setErrors(err.response.data);
      }
    }
  };

  const showToast = (message, severity) => {
    setToast({ open: true, message, severity });
  };

  const handleCloseToast = () => {
    setToast({ ...toast, open: false });
  };

  if (loading) {
    return (
      <Container sx={{ height: '70vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress size={60} thickness={4} />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Typography variant="h4" fontWeight="500" sx={{ mb: 4, color: 'text.primary' }}>
        Your Profile
      </Typography>
      
      <Grid container spacing={4}>
        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Box component={motion.div} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <ProfileCard sx={{ p: 0, mb: 3 }}>
              <Box sx={{ 
                height: 80, 
                background: `linear-gradient(120deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              }}/>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: -8, mb: 3, px: 3 }}>
                <GradientAvatar>
                  <PersonIcon sx={{ fontSize: 60 }} />
                </GradientAvatar>
                
                <Typography variant="h5" sx={{ mt: 2, fontWeight: 600 }}>
                  {user?.username || 'User'}
                </Typography>
                
                <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                  {user?.email || 'email@example.com'}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                  <Box sx={{ 
                    px: 2, 
                    py: 0.5, 
                    borderRadius: 4, 
                    backgroundColor: theme.palette.primary.main + '10',
                    color: theme.palette.primary.main,
                    fontWeight: 500,
                    fontSize: '0.875rem'
                  }}>
                    {user?.user_type === 'CUSTOMER' ? 'Customer' : (user?.user_type ? user.user_type.toLowerCase() : 'N/A')}
                  </Box>
                </Box>
              </Box>
              
              <Divider />
              
              <Box sx={{ p: 3 }}>                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Member Since
                  </Typography>
                  <Typography variant="body2" fontWeight="500">
                    {user?.date_joined ? new Date(user.date_joined).toLocaleDateString() : 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </ProfileCard>
            
            <ProfileCard sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="500" gutterBottom>
                Account Actions
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <ProfileButton 
                variant="outlined" 
                color="primary" 
                fullWidth 
                sx={{ mb: 2 }}
                href="/customer/orders"
                startIcon={<ReceiptIcon />}
              >
                View My Orders
              </ProfileButton>
              
              <ProfileButton 
                variant="outlined" 
                color="secondary" 
                fullWidth
                href="/change-password"
                startIcon={<LockIcon />}
              >
                Change Password
              </ProfileButton>
            </ProfileCard>
          </Box>
        </Grid>
        
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          <Box component={motion.div} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
            <ProfileCard sx={{ p: 0, overflow: 'hidden' }}>
              <Box sx={{ 
                p: 3, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                borderBottom: `1px solid ${theme.palette.divider}` 
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <EditIcon sx={{ mr: 1.5, color: theme.palette.primary.main }} />
                  <Typography variant="h6" fontWeight="500">
                    Profile Information
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ p: 3 }}>
                <form onSubmit={handleSubmit}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <StyledTextField
                        label="First Name"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        fullWidth
                        error={!!errors.first_name}
                        helperText={errors.first_name}
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <StyledTextField
                        label="Last Name"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        fullWidth
                        error={!!errors.last_name}
                        helperText={errors.last_name}
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <StyledTextField
                        label="Phone Number"
                        name="phone_number"
                        value={formData.phone_number}
                        onChange={handleChange}
                        fullWidth
                        error={!!errors.phone_number}
                        helperText={errors.phone_number || "Format: +1XXXXXXXXXX"}
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <StyledTextField
                        label="Address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        fullWidth
                        multiline
                        rows={3}
                        error={!!errors.address}
                        helperText={errors.address}
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                        <ProfileButton
                          type="submit"
                          variant="contained"
                          color="primary"
                          startIcon={<SaveIcon />}
                          disabled={saving}
                          size="large"
                        >
                          {saving ? 'Saving...' : 'Save Changes'}
                        </ProfileButton>
                      </Box>
                    </Grid>
                  </Grid>
                </form>
              </Box>
            </ProfileCard>
          </Box>
        </Grid>
      </Grid>
      
      <Snackbar 
        open={toast.open} 
        autoHideDuration={6000} 
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseToast} 
          severity={toast.severity} 
          elevation={6}
          variant="filled"
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ProfilePage;
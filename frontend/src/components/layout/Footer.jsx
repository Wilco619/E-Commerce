import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Box, Container, Grid, Typography, Link, Stack, Divider, 
  IconButton, TextField, Button, useTheme, useMediaQuery,
  Snackbar, Alert 
} from '@mui/material';
import { 
  Facebook, Twitter, Instagram, LinkedIn, 
  Phone, Email, LocationOn, Send 
} from '@mui/icons-material';
import { productsAPI } from '../../services/api';

const Footer = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Add state for newsletter
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });

  // Add newsletter submit handler
  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    try {
      setLoading(true);
      await productsAPI.subscribeNewsletter({ email });
      setAlert({
        open: true,
        message: 'Successfully subscribed! Please check your email for confirmation.',
        severity: 'success'
      });
      setEmail('');
    } catch (error) {
      // Handle the duplicate email error specifically
      if (error.response?.data?.email?.[0]?.includes('already exists')) {
        setAlert({
          open: true,
          message: 'This email is already subscribed to our newsletter.',
          severity: 'warning' // Using warning instead of error for better UX
        });
      } else {
        setAlert({
          open: true,
          message: error.response?.data?.error || 'Failed to subscribe. Please try again.',
          severity: 'error'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        bgcolor: 'primary.main',
        color: 'white',
        py: 6,
        mt: 'auto',
      }}
      component="footer"
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography
              variant="h6"
              component={RouterLink}
              to="/"
              sx={{ textDecoration: 'none', color: 'inherit', fontWeight: 700, mb: 2, display: 'block' }}
            >
              JEMSA<Box component="span" sx={{ color: 'primary.light' }}>TECHS</Box>
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Your one-stop shop for quality products at competitive prices.
              We provide a seamless shopping experience from browsing to delivery.
            </Typography>
            <Stack direction="row" spacing={1}>
              <IconButton color="inherit" aria-label="Facebook" size="small">
                <Facebook />
              </IconButton>
              <IconButton color="inherit" aria-label="Twitter" size="small">
                <Twitter />
              </IconButton>
              <IconButton color="inherit" aria-label="Instagram" size="small">
                <Instagram />
              </IconButton>
              <IconButton color="inherit" aria-label="LinkedIn" size="small">
                <LinkedIn />
              </IconButton>
            </Stack>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Quick Links
            </Typography>
            <Stack spacing={1}>
              <Link component={RouterLink} to="/" color="inherit" underline="hover">
                Home
              </Link>
              <Link component={RouterLink} to="/shop" color="inherit" underline="hover">
                Shop
              </Link>
              <Link component={RouterLink} to="/cart" color="inherit" underline="hover">
                Cart
              </Link>
              <Link component={RouterLink} to="/profile" color="inherit" underline="hover">
                My Account
              </Link>
              <Link component={RouterLink} to="/orders" color="inherit" underline="hover">
                Orders
              </Link>
            </Stack>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Contact Us
            </Typography>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LocationOn sx={{ mr: 1 }} fontSize="small" />
                <Typography variant="body2">
                  Bazzar Street, Nairobi City, Kenya
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Phone sx={{ mr: 1 }} fontSize="small" />
                <Typography variant="body2">
                  +254 (712) 834-651
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Email sx={{ mr: 1 }} fontSize="small" />
                <Typography variant="body2">
                  info@jemsa.co.ke
                </Typography>
              </Box>
            </Stack>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Newsletter
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Subscribe to our newsletter for the latest deals and updates.
            </Typography>
            <Box 
              component="form" 
              sx={{ display: 'flex' }}
              onSubmit={handleNewsletterSubmit}
            >
              <TextField
                size="small"
                placeholder="Your email"
                variant="outlined"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                fullWidth
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  input: { color: 'white' },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                    '&.Mui-focused fieldset': { borderColor: 'primary.light' }
                  }
                }}
              />
              <Button 
                type="submit"
                variant="contained" 
                color="secondary" 
                aria-label="subscribe"
                disabled={loading}
                sx={{ ml: 1 }}
              >
                <Send fontSize="small" />
              </Button>
            </Box>
          </Grid>
        </Grid>
        
        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', my: 4 }} />
        
        <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center' }}>
          <Typography variant="body2" sx={{ mb: isMobile ? 2 : 0 }}>
            © {new Date().getFullYear()} JEMSATECHS. All rights reserved.
          </Typography>
          <Stack direction="row" spacing={3}>
            <Link component={RouterLink} to="/terms" color="inherit" underline="hover" variant="body2">
              Terms of Service
            </Link>
            <Link component={RouterLink} to="/privacy" color="inherit" underline="hover" variant="body2">
              Privacy Policy
            </Link>
            <Link component={RouterLink} to="/faq" color="inherit" underline="hover" variant="body2">
              FAQ
            </Link>
          </Stack>
        </Box>
      </Container>

      {/* Add Snackbar for notifications */}
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={() => setAlert({ ...alert, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setAlert({ ...alert, open: false })} 
          severity={alert.severity}
          sx={{ width: '100%' }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Footer;
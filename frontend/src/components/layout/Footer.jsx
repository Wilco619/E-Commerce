import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Box, Container, Grid, Typography, Link, Stack, Divider, 
  IconButton, TextField, Button, useTheme, useMediaQuery 
} from '@mui/material';
import { 
  Facebook, Twitter, Instagram, LinkedIn, 
  Phone, Email, LocationOn, Send 
} from '@mui/icons-material';

const Footer = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
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
              SHOP<Box component="span" sx={{ color: 'primary.light' }}>HUB</Box>
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
                  123 Shopping St., E-commerce City, EC 12345
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Phone sx={{ mr: 1 }} fontSize="small" />
                <Typography variant="body2">
                  +1 (555) 123-4567
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Email sx={{ mr: 1 }} fontSize="small" />
                <Typography variant="body2">
                  support@shophub.com
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
            <Box component="form" sx={{ display: 'flex' }}>
              <TextField
                size="small"
                placeholder="Your email"
                variant="outlined"
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
                variant="contained" 
                color="secondary" 
                aria-label="subscribe"
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
            © {new Date().getFullYear()} SHOPHUB. All rights reserved.
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
    </Box>
  );
};

export default Footer;

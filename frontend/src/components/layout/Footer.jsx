import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Box, Container, Grid, Typography, Link, Stack, Divider, 
  IconButton, TextField, Button, useTheme, useMediaQuery,
  Snackbar, Alert, Paper
} from '@mui/material';
import { 
  Facebook, X, Instagram, LinkedIn, 
  Phone, Email, LocationOn, Send, ArrowForward
} from '@mui/icons-material';
import { productsAPI } from '../../services/api';

const Footer = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State for newsletter
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });

  // Newsletter submit handler
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
          severity: 'warning'
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
        pt: 8,
        pb: 6,
        mt: 'auto',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.1) 0%, transparent 60%)',
          pointerEvents: 'none'
        }
      }}
      component="footer"
    >
      <Container maxWidth="lg">
        <Grid container spacing={5}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography
              variant="h5"
              component={RouterLink}
              to="/"
              sx={{ 
                textDecoration: 'none', 
                color: 'inherit', 
                fontWeight: 800, 
                mb: 3, 
                display: 'block',
                letterSpacing: '0.5px'
              }}
            >
              JEMSA<Box component="span" sx={{ color: theme.palette.secondary.main }}>TECHS</Box>
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, opacity: 0.9, lineHeight: 1.6 }}>
              Your one-stop shop for quality products at competitive prices.
              We provide a seamless shopping experience from browsing to delivery.
            </Typography>
            <Stack direction="row" spacing={1.5}>
              <IconButton 
                color="inherit" 
                aria-label="Facebook" 
                sx={{ 
                  bgcolor: 'rgba(255, 255, 255, 0.1)', 
                  transition: 'all 0.2s ease',
                  '&:hover': { 
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    transform: 'translateY(-3px)' 
                  } 
                }}
              >
                <Facebook fontSize="small" />
              </IconButton>
              <IconButton 
                color="inherit" 
                aria-label="Twitter" 
                sx={{ 
                  bgcolor: 'rgba(255, 255, 255, 0.1)', 
                  transition: 'all 0.2s ease',
                  '&:hover': { 
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    transform: 'translateY(-3px)' 
                  } 
                }}
              >
                <X fontSize="small" />
              </IconButton>
              <IconButton 
                color="inherit" 
                aria-label="Instagram" 
                sx={{ 
                  bgcolor: 'rgba(255, 255, 255, 0.1)', 
                  transition: 'all 0.2s ease',
                  '&:hover': { 
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    transform: 'translateY(-3px)' 
                  } 
                }}
              >
                <Instagram fontSize="small" />
              </IconButton>
              <IconButton 
                color="inherit" 
                aria-label="LinkedIn" 
                sx={{ 
                  bgcolor: 'rgba(255, 255, 255, 0.1)', 
                  transition: 'all 0.2s ease',
                  '&:hover': { 
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    transform: 'translateY(-3px)' 
                  } 
                }}
              >
                <LinkedIn fontSize="small" />
              </IconButton>
            </Stack>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" sx={{ 
              mb: 3, 
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: -8,
                left: 0,
                width: 40,
                height: 3,
                backgroundColor: theme.palette.secondary.main,
                borderRadius: 2
              }
            }}>
              Quick Links
            </Typography>
            <Stack spacing={2}>
              {[
                { text: 'Home', link: '/' },
                { text: 'Shop', link: '/shop' },
                { text: 'Cart', link: '/cart' },
                { text: 'My Account', link: '/profile' },
                { text: 'Orders', link: '/orders' }
              ].map((item, index) => (
                <Link 
                  key={index}
                  component={RouterLink} 
                  to={item.link} 
                  color="inherit"
                  underline="none"
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'all 0.2s ease',
                    opacity: 0.9,
                    '&:hover': { 
                      opacity: 1,
                      transform: 'translateX(5px)',
                      color: theme.palette.secondary.light
                    }
                  }}
                >
                  <ArrowForward sx={{ mr: 1, fontSize: '0.9rem', opacity: 0.7 }} />
                  {item.text}
                </Link>
              ))}
            </Stack>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" sx={{ 
              mb: 3, 
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: -8,
                left: 0,
                width: 40,
                height: 3,
                backgroundColor: theme.palette.secondary.main,
                borderRadius: 2
              }
            }}>
              Contact Us
            </Typography>
            <Stack spacing={2.5}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <Paper sx={{ 
                p: 1, 
                borderRadius: 1.5, 
                mr: 1.5, 
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <LocationOn fontSize="small" />
              </Paper>
              <Link 
                href="https://maps.google.com/?q=Bazzar+Plaza,+Nairobi+City,+Kenya" 
                target="_blank"
                rel="noopener noreferrer"
                color="inherit"
                underline="hover"
                sx={{ opacity: 0.9, mt: 0.5 }}
              >
                Bazaar Plaza, Nairobi City, Kenya
              </Link>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <Paper sx={{ 
                p: 1, 
                borderRadius: 1.5, 
                mr: 1.5, 
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Phone fontSize="small" />
              </Paper>
              <Link 
                href="tel:+254720399250" 
                color="inherit"
                underline="hover"
                sx={{ opacity: 0.9, mt: 0.5 }}
              >
                +254 (720) 399-250
              </Link>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <Paper sx={{ 
                p: 1, 
                borderRadius: 1.5, 
                mr: 1.5, 
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Email fontSize="small" />
              </Paper>
              <Link 
                href="mailto:info@jemsa.co.ke" 
                color="inherit"
                underline="hover"
                sx={{ opacity: 0.9, mt: 0.5 }}
              >
                info@jemsa.co.ke
              </Link>
            </Box>
            </Stack>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" sx={{ 
              mb: 3, 
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: -8,
                left: 0,
                width: 40,
                height: 3,
                backgroundColor: theme.palette.secondary.main,
                borderRadius: 2
              }
            }}>
              Newsletter
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, opacity: 0.9, lineHeight: 1.6 }}>
              Subscribe to our newsletter for the latest deals and updates.
            </Typography>
            <Box 
              component="form" 
              sx={{ 
                display: 'flex',
                flexDirection: 'column'
              }}
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
                  mb: 1.5,
                  bgcolor: 'rgba(255, 255, 255, 0.06)',
                  borderRadius: 1,
                  input: { color: 'white', px: 1.5, py: 1.2 },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: 'transparent' },
                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                    '&.Mui-focused fieldset': { borderColor: theme.palette.secondary.main }
                  }
                }}
              />
              <Button 
                type="submit"
                variant="contained" 
                color="secondary" 
                aria-label="subscribe"
                disabled={loading}
                sx={{ 
                  alignSelf: 'flex-start',
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 3
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                Subscribe
              </Button>
            </Box>
          </Grid>
        </Grid>
        
        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)', my: 5 }} />
        
        <Box sx={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row', 
          justifyContent: 'space-between', 
          alignItems: isMobile ? 'center' : 'center',
          textAlign: isMobile ? 'center' : 'inherit' 
        }}>
          <Typography variant="body2" sx={{ mb: isMobile ? 2 : 0, opacity: 0.8 }}>
            © {new Date().getFullYear()} JEMSATECHS. All rights reserved.
          </Typography>
          <Stack 
            direction={isMobile ? 'column' : 'row'} 
            spacing={isMobile ? 1.5 : 3}
            alignItems="center"
          >
            {[
              { text: 'Terms of Service', link: '/terms' },
              { text: 'Privacy Policy', link: '/privacy' },
              { text: 'FAQ', link: '/faq' }
            ].map((item, index) => (
              <Link 
                key={index}
                component={RouterLink} 
                to={item.link} 
                color="inherit" 
                underline="hover" 
                variant="body2"
                sx={{ opacity: 0.8, '&:hover': { opacity: 1 } }}
              >
                {item.text}
              </Link>
            ))}
          </Stack>
        </Box>
      </Container>

      {/* Snackbar for notifications */}
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
import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Alert, 
  Snackbar, 
  Container, 
  useTheme, 
  useMediaQuery,
  Paper,
  Stack
} from '@mui/material';
import { Mail as MailIcon } from '@mui/icons-material';
import { productsAPI } from '../services/api';

const Newsletter = () => {
  const theme = useTheme();
  const isXsScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const isMdScreen = useMediaQuery(theme.breakpoints.down('md'));
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });

  const handleSubscribe = async (e) => {
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
      // Handle duplicate email error specifically
      if (error.response?.data?.email?.[0]?.includes('already exists')) {
        setAlert({
          open: true,
          message: 'You are already subscribed to our newsletter.',
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
    <Container maxWidth="lg" disableGutters>
      <Paper
        elevation={3}
        sx={{
          borderRadius: { xs: 2, md: 3 },
          overflow: 'hidden',
          position: 'relative',
          background: `linear-gradient(135deg, ${theme.palette.grey[900]} 0%, ${theme.palette.grey[800]} 100%)`, // Dark gradient
          color: 'white', // Ensure text remains visible
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: 'radial-gradient(circle at 10% 90%, rgba(255,255,255,0.05) 0%, transparent 40%)', // Subtle highlight
            zIndex: 1
          }
        }}
      >

        <Box
          component="form"
          onSubmit={handleSubscribe}
          sx={{
            position: 'relative',
            zIndex: 2,
            color: 'white',
            p: { xs: 3, sm: 4, md: 5 },
            display: 'flex',
            flexDirection: isMdScreen ? 'column' : 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: { xs: 3, md: 4 }
          }}
        >
          <Box 
            sx={{ 
              textAlign: isMdScreen ? 'center' : 'left',
              width: '100%'
            }}
          >
            <Stack 
              direction="row" 
              spacing={1.5} 
              alignItems="center" 
              justifyContent={isMdScreen ? 'center' : 'flex-start'}
              sx={{ mb: 1.5 }}
            >
              <Box 
                sx={{ 
                  backgroundColor: 'rgba(255,255,255,0.15)', 
                  borderRadius: '50%', 
                  p: 1,
                  display: 'flex'
                }}
              >
                <MailIcon fontSize={isXsScreen ? "small" : "medium"} />
              </Box>
              <Typography 
                variant={isXsScreen ? "h6" : "h5"} 
                component="h2" 
                sx={{ 
                  fontWeight: 600,
                  letterSpacing: 0.5
                }}
              >
                Stay Updated
              </Typography>
            </Stack>
            <Typography 
              variant="body2" 
              sx={{ 
                opacity: 0.85,
                maxWidth: isMdScreen ? '100%' : '90%',
                lineHeight: 1.6
              }}
            >
              Subscribe to our newsletter for exclusive offers, product updates, and industry insights delivered directly to your inbox.
            </Typography>
          </Box>

          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: isXsScreen ? 'column' : 'row',
              alignItems: 'center',
              width: isMdScreen ? '100%' : '60%',
              gap: isXsScreen ? 2 : 1
            }}
          >
            <TextField
              variant="outlined"
              placeholder="Enter your email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              size="small"
              required
              sx={{
                flexGrow: 1,
                width: isXsScreen ? '100%' : 'auto',
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  borderRadius: 1.5,
                  '&:hover': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.secondary.light
                    }
                  },
                  '&.Mui-focused': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.secondary.main
                    }
                  }
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'transparent'
                }
              }}
            />
            <Button
              variant="contained"
              color="secondary"
              type="submit"
              disabled={loading}
              sx={{
                px: { xs: 2, sm: 3 },
                py: { xs: 1, sm: 1.2 },
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 1.5,
                width: isXsScreen ? '100%' : 'auto',
                boxShadow: theme.shadows[2],
                '&:hover': {
                  boxShadow: theme.shadows[4],
                  backgroundColor: theme.palette.secondary.dark
                },
                transition: 'all 0.3s ease'
              }}
            >
              {loading ? 'Subscribing...' : 'Subscribe'}
            </Button>
          </Box>
        </Box>
      </Paper>

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
    </Container>
  );
};

export default Newsletter;
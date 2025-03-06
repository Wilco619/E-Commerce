import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Alert, Snackbar } from '@mui/material';
import { productsAPI } from '../services/api';

const Newsletter = () => {
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
      setAlert({
        open: true,
        message: error.response?.data?.error || 'Failed to subscribe. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box 
      component="form"
      onSubmit={handleSubscribe}
      sx={{ 
        backgroundColor: 'primary.main', 
        color: 'white', 
        p: 4, 
        borderRadius: 2, 
        textAlign: 'center', 
        mb: { xs: 4, md: 6 },
      }}
    >
      <Typography variant="h5" component="h2" gutterBottom>
        Subscribe to our Newsletter
      </Typography>
      <Typography variant="body1" gutterBottom>
        Get the latest updates and offers.
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <TextField 
          variant="outlined" 
          placeholder="Enter your email" 
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          size="small"
          required
          sx={{ 
            mr: 1, 
            flexGrow: 1,
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'white'
            }
          }} 
        />
        <Button 
          variant="contained" 
          color="secondary"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Subscribing...' : 'Subscribe'}
        </Button>
      </Box>

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

export default Newsletter;

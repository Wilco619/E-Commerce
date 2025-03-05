import React from 'react';
import { Box, Typography, TextField, Button } from '@mui/material';

const Newsletter = () => (
  <Box 
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
        size="small" 
        sx={{ mr: 1, flexGrow: 1 }} 
      />
      <Button variant="contained" color="secondary">
        Subscribe
      </Button>
    </Box>
  </Box>
);

export default Newsletter;

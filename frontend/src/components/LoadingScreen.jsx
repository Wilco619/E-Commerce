import React from 'react';
import { Container, Box, Typography, CircularProgress } from '@mui/material';

const LoadingScreen = ({ message = 'Loading...' }) => {
  return (
    <Container sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '50vh' 
    }}>
      <Box sx={{ textAlign: 'center' }}>
        <CircularProgress size={40} />
        <Typography sx={{ mt: 2 }}>{message}</Typography>
      </Box>
    </Container>
  );
};

export default LoadingScreen;
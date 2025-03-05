import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const HeroSection = ({ isSmallScreen }) => (
  <Paper 
    elevation={3}
    sx={{ 
      py: { xs: 4, md: 8 }, 
      px: { xs: 2, md: 4 },
      textAlign: 'center',
      borderRadius: 2,
      mb: { xs: 4, md: 6 },
      mt: 3,
      backgroundImage: 'url(/src/assets/back.jpg)', // Background image placeholder
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      color: 'white',
      position: 'relative',
      overflow: 'hidden'
    }}
  >
    <Box sx={{ 
      position: 'absolute', 
      top: 0, 
      left: 0, 
      width: '100%', 
      height: '100%', 
      backdropFilter: 'blur(0.8px)',
      backgroundColor: 'rgba(0, 0, 0, 0.46)', // Semi-transparent blue overlay
      zIndex: 0
    }} />
    
    <Box sx={{ position: 'relative', zIndex: 2 }}>
      <Typography 
        variant={isSmallScreen ? "h3" : "h2"} 
        component="h1" 
        gutterBottom
        sx={{ fontWeight: 'bold' }}
      >
        Welcome to Jemsa Techs
      </Typography>
      <Typography 
        variant={isSmallScreen ? "body1" : "h5"} 
        paragraph
        sx={{ mb: 4, maxWidth: '800px', mx: 'auto' }}
      >
        Discover amazing products at great prices. Shop our latest collections and enjoy exclusive deals.
      </Typography>
      <Button 
        variant="contained" 
        size={isSmallScreen ? "medium" : "large"} 
        component={RouterLink} 
        to="/shop"
        sx={{ 
          mt: 2, 
          bgcolor: 'white', 
          color: 'primary.main',
          px: 4,
          py: 1,
          '&:hover': {
            bgcolor: 'rgba(255,255,255,0.9)'
          }
        }}
      >
        Shop Now
      </Button>
    </Box>
  </Paper>
);

export default HeroSection;

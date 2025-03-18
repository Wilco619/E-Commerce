import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const HeroSection = ({ isSmallScreen }) => (
  <Box
    sx={{
      py: { xs: 4, md: 6 },
      px: { xs: 2, md: 4 },
      textAlign: 'center',
      borderRadius: 0,
      mb: 0,
      mt: 0,
      backgroundImage: 'url(/back.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      color: 'white',
      position: 'relative',
      overflow: 'hidden',
      width: '100%',
      minHeight: { xs: '250px', sm: '300px', md: '350px' },
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center' // This ensures horizontal centering
    }}
  >
    <Box sx={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backdropFilter: 'blur(0.8px)',
      backgroundColor: 'rgba(0, 0, 0, 0.46)',
      zIndex: 0
    }} />
    
    <Box sx={{ 
      position: 'relative', 
      zIndex: 2, 
      maxWidth: '1000px',
      width: '100%', // Added to ensure the content box takes full width
      margin: '0 auto', // Added to center the content box
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center', // Center children horizontally
      justifyContent: 'center' // Center children vertically
    }}>
      <Typography
        variant={isSmallScreen ? "h3" : "h2"}
        component="h1"
        gutterBottom
        sx={{
          fontWeight: 'bold',
          textShadow: '1px 1px 3px rgba(0,0,0,0.6)',
          textAlign: 'center' // Ensure text is centered
        }}
      >
        Welcome to Jemsa Techs
      </Typography>
      <Typography
        variant={isSmallScreen ? "body1" : "h5"}
        paragraph
        sx={{
          mb: 4,
          maxWidth: '800px',
          mx: 'auto', // Center this text block
          textShadow: '1px 1px 2px rgba(0,0,0,0.4)',
          textAlign: 'center' // Ensure text is centered
        }}
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
          py: 1.5,
          fontWeight: 'bold',
          '&:hover': {
            bgcolor: 'rgba(255,255,255,0.9)'
          }
        }}
      >
        Shop Now
      </Button>
    </Box>
  </Box>
);

export default HeroSection;
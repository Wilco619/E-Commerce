import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const HeroSection = ({ isSmallScreen }) => (
  <Box
    sx={{
      mb: { xs: 3, md: 4 },
      width: '100%',
      height: { xs: '60vh', md: '70vh' },
      backgroundImage: 'url("/back.jpg")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 1
      }
    }}
  >
    <Container 
      maxWidth="lg" 
      sx={{ 
        position: 'relative',
        zIndex: 2
      }}
    >
      <Box
        sx={{
          maxWidth: { xs: '100%', md: '50%' },
          color: 'white',
          textAlign: { xs: 'center', md: 'left' },
          p: { xs: 3, md: 0 }
        }}
      >
        <Typography 
          variant="h2" 
          component="h1" 
          fontWeight="bold"
          sx={{ mb: 2 }}
        >
          Welcome to Jemsa Techs
        </Typography>
        
        <Typography 
          variant="h6" 
          component="p"
          sx={{ mb: 4, opacity: 0.9 }}
        >
          Discover amazing products at great prices. Shop our latest collections and enjoy exclusive deals.
        </Typography>
        
        <Button
          component={RouterLink}
          to="/shop"
          variant="contained"
          size="large"
          fontWeight="bold"
          
          sx={{
            px: 4,
            py: 1.5,
            backgroundColor: 'secondary.main',
            color: 'white',
            '&:hover': {
              backgroundColor: 'secondary.dark'
            }
          }}
        >
          Shop Now
        </Button>
      </Box>
    </Container>
  </Box>
);

export default HeroSection;
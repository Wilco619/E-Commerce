import React, { useState } from 'react';
import Slider from 'react-slick';
import { Box, Typography, Button, Container, Grid } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

const HeroSection = ({ isSmallScreen, categories = [] }) => {
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const navigate = useNavigate();

  // Slider settings
  const settings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    fade: true,
    cssEase: 'linear'
  };

  // Array of background images (adjust paths as needed)
  const backgroundImages = [
    '/back.jpeg',
    '/back1.jpeg',
    '/back2.jpeg',
    '/back3.jpeg'
  ];

  const handleCategoryClick = (slug) => {
    navigate(`/category/${slug}`);
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: { xs: '80vh', md: '80vh' },
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Category Menu */}
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          zIndex: 5,
          borderTopRightRadius: 8,
          borderBottomRightRadius: 8,
          boxShadow: 3,
          width: 130, // Reduced from 150
          display: { xs: 'none', md: 'block' }
        }}
      >
        {/* Category Header */}
        <Typography
          variant="subtitle1" // Changed from h6
          sx={{
            p: 1.5, // Reduced padding from 2
            borderBottom: 1,
            borderColor: 'divider',
            fontWeight: 600,
            fontSize: '0.9rem', // Added explicit font size
            textAlign: 'center',
            backgroundColor: 'primary.main',
            color: 'primary.contrastText',
            borderTopRightRadius: 8
          }}
        >
          Categories
        </Typography>

        {categories.map((category) => (
          <Box
            key={category.id}
            onClick={() => handleCategoryClick(category.slug)}
            onMouseEnter={() => setHoveredCategory(category.id)}
            onMouseLeave={() => setHoveredCategory(null)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 1.5, // Reduced padding from 2
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: 'primary.light',
                color: 'primary.main',
              },
              borderBottom: 1,
              borderColor: 'divider'
            }}
          >   
            <Typography 
              variant="body2" // Changed from body1
              sx={{ fontSize: '0.85rem' }} // Added explicit font size
            >
              {category.name}
            </Typography>
            <KeyboardArrowRightIcon 
              sx={{
                fontSize: '1rem', // Added smaller icon size
                transform: hoveredCategory === category.id ? 'translateX(5px)' : 'none',
                transition: 'transform 0.3s ease'
              }}
            />
          </Box>
        ))}
      </Box>

      {/* Full-Width Background Slider */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1
        }}
      >
        <Slider {...settings}>
          {backgroundImages.map((image, index) => (
            <Box
              key={index}
              sx={{
                backgroundImage: `url(${image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                width: '100%',
                height: { xs: '90vh', md: '80vh' }
              }}
            />
          ))}
        </Slider>
        
        {/* Overlay */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.6)',
            zIndex: 2
          }}
        />
      </Box>

      {/* Content Container */}
      <Container
        maxWidth="lg"
        sx={{
          position: 'relative',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          zIndex: 3
        }}
      >
        <Grid 
          container 
          spacing={2} 
          sx={{ 
            height: '100%',
            position: 'relative'
          }}
        >
          {/* Text Column */}
          <Grid 
            item 
            xs={12} 
            md={6}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              height: '100%',
              textAlign: { xs: 'center', md: 'left' },
              color: 'white',
              zIndex: 4,
              position: 'relative',
              pr: { md: 4 }
            }}
          >
            <Box
              sx={{
                maxWidth: { xs: '100%', md: '100%' },
                width: '100%'
              }}
            >
              <Typography
                variant="h1"
                component="h1"
                sx={{
                  fontSize: { xs: '2.5rem', sm: '3rem', md: '4rem' },
                  fontWeight: 700,
                  mb: 3,
                  lineHeight: 1.2,
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}
              >
                Welcome to Jemsa Techs
              </Typography>

              <Typography
                variant="h5"
                component="p"
                sx={{
                  fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
                  mb: 4,
                  opacity: 0.9,
                  fontWeight: 300,
                  lineHeight: 1.6
                }}
              >
                Discover amazing products at great prices. Shop our latest collections and enjoy exclusive deals from cutting-edge technology to innovative solutions.
              </Typography>

              <Button
                component={RouterLink}
                to="/shop"
                variant="contained"
                size="large"
                sx={{
                  px: { xs: 3, md: 4 },
                  py: { xs: 1, md: 1.5 },
                  fontSize: { xs: '0.875rem', md: '1rem' },
                  backgroundColor: 'secondary.main',
                  color: 'white',
                  borderRadius: 2,
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: 'secondary.dark',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 8px rgba(0,0,0,0.2)'
                  }
                }}
              >
                Shop Now
              </Button>
            </Box>
          </Grid>

          {/* Image Column (Desktop) */}
          <Grid 
            item 
            md={6}
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              position: 'relative',
              zIndex: 4
            }}
          >
            <Box
              sx={{
                width: '100%',
                maxWidth: '500px',
                height: '70%',
                borderRadius: 2,
                overflow: 'hidden',
                boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
              }}
            >
              <Slider {...settings}>
                {backgroundImages.map((image, index) => (
                  <Box
                    key={index}
                    sx={{
                      backgroundImage: `url(${image})`,
                      backgroundSize: 'contain',
                      backgroundPosition: 'center',
                      width: '100%',
                      height: '55vh'
                    }}
                  />
                ))}
              </Slider>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default HeroSection;
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Container, 
  Grid, 
  SwipeableDrawer, 
  IconButton,
  Fade,
  Grow,
  Chip,
  useTheme,
  alpha,
  Skeleton
} from '@mui/material';
import {
  Category as CategoryIcon,
  KeyboardArrowRight as ArrowRightIcon,
  ShoppingBag as ShopIcon,
  Storefront as StorefrontIcon,
  Devices as DevicesIcon,
  Computer as ComputerIcon,
  Phone as PhoneIcon,
  Watch as WatchIcon,
  Headphones as HeadphonesIcon,
  Camera as CameraIcon,
  Menu as MenuIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import Slider from 'react-slick';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

const HeroSection = ({ isSmallScreen, categories = [] }) => {
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [textVisible, setTextVisible] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();

  // Enhanced slider settings with better performance
  const settings = {
    dots: true,
    infinite: true,
    speed: 800,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    fade: true,
    cssEase: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    pauseOnHover: true,
    beforeChange: (current, next) => setCurrentSlide(next),
    customPaging: (i) => (
      <Box
        sx={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          backgroundColor: i === currentSlide ? '#ffffff' : 'rgba(255,255,255,0.5)',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: '#ffffff',
            transform: 'scale(1.2)'
          }
        }}
      />
    ),
    dotsClass: 'slick-dots custom-dots'
  };

  // Enhanced background images array
  const backgroundImages = [
    '/back.jpeg',
    '/back1.jpeg', 
    '/back2.jpeg',
    '/back3.jpeg'
  ];

  // Category icons mapping
  const categoryIcons = {
    electronics: DevicesIcon,
    computers: ComputerIcon,
    phones: PhoneIcon,
    accessories: WatchIcon,
    audio: HeadphonesIcon,
    cameras: CameraIcon,
    default: StorefrontIcon
  };

  // Enhanced category click handler
  const handleCategoryClick = useCallback((slug) => {
    navigate(`/category/${slug}`);
    setDrawerOpen(false);
  }, [navigate]);

  // Image preloading effect
  useEffect(() => {
    const preloadImages = async () => {
      const imagePromises = backgroundImages.map((src) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = resolve;
          img.onerror = reject;
          img.src = src;
        });
      });
      
      try {
        await Promise.all(imagePromises);
        setImagesLoaded(true);
        setTimeout(() => setTextVisible(true), 300);
      } catch (error) {
        console.error('Error loading images:', error);
        setImagesLoaded(true);
        setTextVisible(true);
      }
    };

    preloadImages();
  }, []);

  // Enhanced Category Menu Component
  const CategoryMenu = ({ mobile = false }) => (
    <Box
      sx={{
        background: mobile 
          ? 'rgba(0,0,0,0.2)'  // More transparent background
          : 'rgba(0,0,0,0.1)',  // Almost invisible when not hovered
        backdropFilter: 'blur(2px)',
        borderRadius: mobile ? 0 : '0 16px 16px 0',
        boxShadow: mobile 
          ? 'none' 
          : '0 20px 40px rgba(0,0,0,0.06)',
        width: mobile ? '100%' : 140,
        minHeight: mobile ? '100%' : 'auto',
        overflow: 'hidden',
        border: mobile ? 'none' : `1px solid rgba(255,255,255,0.1)`,
        transition: 'all 0.3s ease',
        '&:hover': {
          background: 'rgba(0,0,0,0.75)',  // More visible on hover
          backdropFilter: 'blur(12px)',
          border: mobile ? 'none' : `1px solid rgba(255,255,255,0.2)`,
        }
      }}
    >
      {/* Header - Update the background to be more transparent initially */}
      <Box
        sx={{
          background: (theme) => `linear-gradient(135deg, 
            ${alpha(theme.palette.primary.main, 0.6)} 0%, 
            ${alpha(theme.palette.primary.dark, 0.6)} 100%)`,
          p: mobile ? 1.5 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 2,
          borderTopRightRadius: mobile ? 0 : 16,
          transition: 'all 0.3s ease',
          '.MuiBox-root:hover &': {
            background: (theme) => `linear-gradient(135deg, 
              ${theme.palette.primary.main} 0%, 
              ${theme.palette.primary.dark} 100%)`
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CategoryIcon sx={{ color: '#ffffff', fontSize: mobile ? '1.5rem' : '1.2rem' }} />
          <Typography
            variant={mobile ? "h6" : "subtitle1"}
            sx={{
              color: '#ffffff',
              fontWeight: 600,
              fontSize: mobile ? '1.1rem' : '0.95rem'
            }}
          >
            Categories
          </Typography>
        </Box>
        {mobile && (
          <IconButton
            onClick={() => setDrawerOpen(false)}
            sx={{ color: '#ffffff', p: 0.5 }}
          >
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      {/* Categories List - Update individual category items */}
      <Box sx={{ p: mobile ? 1 : 0.5 }}>
        {categories.map((category, index) => {
          const IconComponent = categoryIcons[category.slug] || categoryIcons.default;
          return (
            <Box
              key={category.id}
              onClick={() => handleCategoryClick(category.slug)}
              onMouseEnter={() => setHoveredCategory(category.id)}
              onMouseLeave={() => setHoveredCategory(null)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: mobile ? 2 : 1.5,
                p: mobile ? 1.5 : 1,
                m: mobile ? 1 : 0.5,
                cursor: 'pointer',
                borderRadius: 2,
                transition: 'all 0.2s ease',
                opacity: 0.7,  // Initially more transparent
                background: hoveredCategory === category.id 
                  ? 'rgba(255,255,255,0.15)'
                  : 'transparent',
                '&:hover': {
                  background: 'rgba(255,255,255,0.15)',
                  opacity: 1,  // Fully visible on hover
                  transform: 'translateX(5px)'
                },
                '&:active': {
                  transform: 'translateX(2px) scale(0.98)'
                }
              }}
            >
              <IconComponent 
                sx={{ 
                  fontSize: mobile ? '1.3rem' : '1.1rem',
                  color: '#ffffff',
                  opacity: 0.8,
                  transition: 'opacity 0.2s ease',
                  '.MuiBox-root:hover &': {
                    opacity: 1
                  }
                }} 
              />
              <Typography 
                variant={mobile ? "body1" : "body2"}
                sx={{ 
                  fontSize: mobile ? '1rem' : '0.9rem',
                  fontWeight: 500,
                  color: '#ffffff',
                  opacity: 0.9,
                  flex: 1
                }}
              >
                {category.name}
              </Typography>
              <ArrowRightIcon 
                sx={{
                  fontSize: mobile ? '1.3rem' : '1.1rem',
                  color: '#ffffff',
                  opacity: 0.7
                }}
              />
            </Box>
          );
        })}
      </Box>

      {/* Footer */}
      {mobile && (
        <Box
          sx={{
            p: 2,
            mt: 'auto',
            borderTop: (theme) => `1px solid ${alpha(theme.palette.divider, 0.05)}`,
            transition: 'all 0.3s ease',
            '.MuiBox-root:hover &': {
              borderTop: (theme) => `1px solid ${alpha(theme.palette.divider, 0.1)}`
            }
          }}
        >
          <Chip
            icon={<ShopIcon />}
            label="View All Products"
            onClick={() => {
              navigate('/shop');
              setDrawerOpen(false);
            }}
            sx={{
              width: '100%',
              height: 40,
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.2)
              }
            }}
          />
        </Box>
      )}
    </Box>
  );

  return (
    <Box 
      sx={{ 
        width: '100%', 
        height: { xs: '100vh', md: '90vh' }, 
        position: 'relative', 
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center'
      }}
    >
      {/* Enhanced Mobile Category Button */}
      <Fade in={imagesLoaded} timeout={800}>
        <Button
          onClick={() => setDrawerOpen(true)}
          startIcon={<MenuIcon />}
          variant="contained"
          sx={{
            position: 'fixed',
            left: 16,
            top: 90,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: '#ffffff',
            zIndex: 1000,
            display: { xs: 'flex', md: 'none' },
            textTransform: 'none',
            borderRadius: 3,
            px: 2,
            py: 1,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha('#ffffff', 0.2)}`,
            transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
            },
            '&:active': {
              transform: 'translateY(0)',
            }
          }}
        >
          Menu
        </Button>
      </Fade>

      {/* Enhanced Mobile Category Drawer */}
      <SwipeableDrawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onOpen={() => setDrawerOpen(true)}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: '85%',
            maxWidth: 350,
            boxSizing: 'border-box',
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(20px)'
          },
        }}
        disableBackdropTransition
        disableDiscovery
      >
        <CategoryMenu mobile />
      </SwipeableDrawer>

      {/* Enhanced Desktop Category Menu */}
      <Fade in={imagesLoaded} timeout={1000}>
        <Box
          sx={{
            position: 'absolute',
            left: 16,
            top: 20,
            zIndex: 5,
            display: { xs: 'none', md: 'block' }
          }}
        >
          <CategoryMenu />
        </Box>
      </Fade>

      {/* Enhanced Background Slider */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
          '& .custom-dots': {
            bottom: 30,
            '& li': {
              margin: '0 8px',
            }
          }
        }}
      >
        {!imagesLoaded ? (
          <Skeleton
            variant="rectangular"
            width="100%"
            height="100%"
            animation="wave"
            sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.1) }}
          />
        ) : (
          <Slider {...settings}>
            {backgroundImages.map((image, index) => (
              <Box
                key={index}
                sx={{
                  backgroundImage: `url(${image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundAttachment: { md: 'fixed' },
                  width: '100%',
                  height: { xs: '100vh', md: '90vh' },
                  position: 'relative'
                }}
              />
            ))}
          </Slider>
        )}
        
        {/* Enhanced Gradient Overlay */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: `linear-gradient(135deg, 
              rgba(0,0,0,0.7) 0%, 
              rgba(0,0,0,0.4) 50%, 
              rgba(0,0,0,0.6) 100%)`,
            zIndex: 2
          }}
        />
      </Box>

      {/* Enhanced Content Container */}
      <Container
        maxWidth="xl"
        sx={{
          position: 'relative',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          zIndex: 3,
          px: { xs: 2, md: 4 }
        }}
      >
        <Grid 
          container 
          spacing={4}
          sx={{ 
            height: '100%',
            alignItems: 'center'
          }}
        >
          {/* Enhanced Text Column */}
          <Grid 
            item 
            xs={12} 
            md={7}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              textAlign: { xs: 'center', md: 'left' },
                                          color: '#ffffff',
              zIndex: 4,
              pl: { md: 20 }
            }}
          >
            <Fade in={textVisible} timeout={1000}>
              <Box>
                {/* Subtitle */}
                <Grow in={textVisible} timeout={800}>
                  <Typography
                    variant="overline"
                    sx={{
                      fontSize: { xs: '0.8rem', md: '0.9rem' },
                      fontWeight: 600,
                      letterSpacing: 2,
                      color: theme.palette.secondary.main,
                      mb: 2,
                      display: 'block',
                      textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                    }}
                  >
                    Welcome to the Future
                  </Typography>
                </Grow>

                {/* Main Title */}
                <Grow in={textVisible} timeout={1200}>
                  <Typography
                    variant="h1"
                    component="h1"
                    sx={{
                      fontSize: { 
                        xs: '2.5rem', 
                        sm: '3.5rem', 
                        md: '4.5rem',
                        lg: '5rem'
                      },
                      fontWeight: 800,
                      mb: 3,
                      lineHeight: 1.1,
                      background: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      textShadow: 'none',
                      position: 'relative',
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: -8,
                        left: { xs: '50%', md: 0 },
                        transform: { xs: 'translateX(-50%)', md: 'none' },
                        width: 100,
                        height: 4,
                        background: `linear-gradient(90deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.light})`,
                        borderRadius: 2
                      }
                    }}
                  >
                    Jemsa Techs
                  </Typography>
                </Grow>

                {/* Description */}
                <Grow in={textVisible} timeout={1400}>
                  <Typography
                    variant="h5"
                    component="p"
                    sx={{
                      fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.4rem' },
                      mb: 4,
                      opacity: 0.95,
                      fontWeight: 300,
                      lineHeight: 1.6,
                      maxWidth: { md: '90%' },
                      textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                  >
                    Discover cutting-edge technology and innovative solutions. 
                    Experience the perfect blend of quality, performance, and style 
                    with our curated collection of premium products.
                  </Typography>
                </Grow>

                {/* CTA Buttons */}
                <Grow in={textVisible} timeout={1600}>
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      gap: 2, 
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'center', md: 'flex-start' }
                    }}
                  >
                    <Button
                      component={RouterLink}
                      to="/shop"
                      variant="contained"
                      size="large"
                      startIcon={<ShopIcon />}
                      sx={{
                        px: 3,
                        py: 1.2,
                        fontSize: '1rem',
                        fontWeight: 600,
                        background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
                        color: '#ffffff',
                        borderRadius: 3,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                        textTransform: 'none',
                        minWidth: 160,
                        transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                        '&:hover': {
                          transform: 'translateY(-3px)',
                          boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
                        },
                        '&:active': {
                          transform: 'translateY(-1px)',
                        }
                      }}
                    >
                      Shop Now
                    </Button>
                  </Box>
                </Grow>
              </Box>
            </Fade>
          </Grid>

          {/* Enhanced Feature Cards Column (Desktop) */}
          <Grid 
            item 
            md={5}
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              position: 'relative',
              zIndex: 4
            }}
          >
            <Fade in={textVisible} timeout={1800}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  width: '100%',
                  maxWidth: 400
                }}
              >
                {/* Feature Cards */}
                {[
                  { icon: DevicesIcon, title: 'Latest Technology', desc: 'Cutting-edge innovations' },
                  { icon: ShopIcon, title: 'Premium Quality', desc: 'Curated excellence' },
                  { icon: StorefrontIcon, title: 'Fast Delivery', desc: 'Quick & reliable' }
                ].map((feature, index) => (
                  <Grow key={index} in={textVisible} timeout={2000 + index * 200}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        p: 2.5,
                        background: 'rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: 3,
                        border: '1px solid rgba(255,255,255,0.2)',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        '&:hover': {
                          background: 'rgba(255,255,255,0.15)',
                          transform: 'translateX(8px)',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
                        }
                      }}
                    >
                      <feature.icon 
                        sx={{ 
                          fontSize: '2rem', 
                          color: theme.palette.secondary.main 
                        }} 
                      />
                      <Box>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            color: '#ffffff', 
                            fontWeight: 600,
                            fontSize: '1.1rem'
                          }}
                        >
                          {feature.title}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: 'rgba(255,255,255,0.8)',
                            fontSize: '0.9rem'
                          }}
                        >
                          {feature.desc}
                        </Typography>
                      </Box>
                    </Box>
                  </Grow>
                ))}
              </Box>
            </Fade>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default HeroSection;
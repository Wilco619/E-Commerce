import React, { useRef, useEffect } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import ProductCard from './ProductCard';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import IconButton from '@mui/material/IconButton';

const FeaturedProducts = ({ products = [], isSmallScreen, setSelectedImage }) => {
  const theme = useTheme();
  // Create refs for navigation
  const prevRef = useRef(null);
  const nextRef = useRef(null);
  
  // Ensure we have an array, even if products is null or undefined
  const featuredProducts = Array.isArray(products) ? products : [];

  return (
    <Box sx={{ 
      mb: { xs: 4, md: 6 },
      mt: { xs: 5, md: 7 },
      overflow: 'hidden',
      width: '100%',
      mx: 0
    }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: 3,
        borderBottom: '2px solid',
        borderColor: 'primary.light',
        pb: 1,
        px: { xs: 2, sm: 2 }
      }}>
        <Typography
          variant="h3"
          sx={{
            textDecoration: 'none',
            color: 'inherit',
            fontWeight: 600,
            letterSpacing: 0.5,
            display: 'flex',
            alignItems: 'center',
            fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.8rem', lg: '3rem' }
          }}
        >
          Featured
          <Box component="span" sx={{ color: theme.palette.secondary.main }}>
            Products
          </Box>
        </Typography>
      </Box>
      
      {featuredProducts.length > 0 ? (
        <Box 
          sx={{ 
            position: 'relative',
            mx: 0,
            '.swiper': {
              overflow: 'visible',
              px: { xs: 1, sm: 2 }
            },
            '.swiper-wrapper': {
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'nowrap',
            },
            '.swiper-pagination': {
              bottom: 0
            }
          }}
        >
          <Box 
            ref={prevRef}
            sx={{
              position: 'absolute',
              left: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              cursor: 'pointer'
            }}
          >
            <IconButton
              size="small"
              sx={{
                bgcolor: 'background.paper',
                boxShadow: 2,
                '&:hover': {
                  bgcolor: 'grey.100'
                }
              }}
            >
              <KeyboardArrowLeft fontSize="small" />
            </IconButton>
          </Box>
          
          <Swiper
            modules={[Autoplay, Pagination, Navigation]}
            spaceBetween={10}
            slidesPerView="auto"
            autoplay={{
              delay: 5000,
              disableOnInteraction: false,
            }}
            pagination={{
              clickable: true,
            }}
            navigation={{
              prevEl: prevRef.current,
              nextEl: nextRef.current,
            }}
            onBeforeInit={(swiper) => {
              // Update Swiper with navigation elements when Swiper is initialized
              if (swiper.params.navigation) {
                swiper.params.navigation.prevEl = prevRef.current;
                swiper.params.navigation.nextEl = nextRef.current;
              }
            }}
            style={{ 
              padding: '10px 0 30px',
              display: 'flex',
              width: '100%'
            }}
            breakpoints={{
              320: { slidesPerView: 2.2, spaceBetween: 10 },
              480: { slidesPerView: 3.2, spaceBetween: 10 },
              768: { slidesPerView: 4.2, spaceBetween: 10 },
              1024: { slidesPerView: 5.2, spaceBetween: 10 },
              1200: { slidesPerView: 6.2, spaceBetween: 10 }
            }}
          >
            {featuredProducts.map((product) => (
              <SwiperSlide 
                key={product.id}
                style={{
                  height: 'auto',
                  display: 'flex',
                  justifyContent: 'center',
                  width: '85%'
                }}
              >
                <Box sx={{ 
                  width: '100%',
                  '& .MuiPaper-root': {
                    width: '100%',
                    height: '100%',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 6px 12px rgba(0,0,0,0.1)'
                    }
                  }
                }}>
                  <ProductCard 
                    product={product} 
                    setSelectedImage={setSelectedImage}
                    compact
                  />
                </Box>
              </SwiperSlide>
            ))}
          </Swiper>
          
          <Box 
            ref={nextRef}
            sx={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              cursor: 'pointer'
            }}
          >
            <IconButton
              size="small"
              sx={{
                bgcolor: 'background.paper',
                boxShadow: 2,
                '&:hover': {
                  bgcolor: 'grey.100'
                }
              }}
            >
              <KeyboardArrowRight fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      ) : (
        <Typography variant="body1" align="center">
          No featured products available at the moment.
        </Typography>
      )}
    </Box>
  );
};

export default FeaturedProducts;
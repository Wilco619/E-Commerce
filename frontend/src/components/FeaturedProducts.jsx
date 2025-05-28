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
  const prevRef = useRef(null);
  const nextRef = useRef(null);
  
  const featuredProducts = Array.isArray(products) ? products : [];

  return (
    <Box sx={{ 
      mb: { xs: 3, md: 4 },
      mt: { xs: 4, md: 5 },
      overflow: 'hidden',
      width: '100%',
      mx: 0
    }}>
      {/* Updated Elegant Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: 3,
        px: { xs: 2, sm: 2 }
      }}>
        <Typography
          variant="h4"
          sx={{
            textDecoration: 'none',
            color: 'inherit',
            fontWeight: 600,
            letterSpacing: 0.5,
            display: 'flex',
            alignItems: 'center',
            fontSize: { xs: '1.5rem', sm: '1.8rem', md: '2.2rem' },
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -12,
              left: 0,
              width: '100%',
              height: '2px',
              backgroundColor: theme.palette.primary.light,
              borderRadius: '1px'
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              bottom: -12,
              left: 0,
              width: '80px',
              height: '2px',
              backgroundColor: theme.palette.secondary.main,
              borderRadius: '1px',
              zIndex: 1
            }
          }}
        >
          Featured
          <Box 
            component="span" 
            sx={{ 
              color: theme.palette.secondary.main, 
              ml: 1,
              fontWeight: 700
            }}
          >
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
            '.swiper-pagination': {
              bottom: -10,
              '& .swiper-pagination-bullet': {
                bgcolor: 'primary.main',
                opacity: 0.4,
                '&.swiper-pagination-bullet-active': {
                  opacity: 1,
                }
              }
            }
          }}
        >
          <Box 
            ref={prevRef}
            sx={{
              position: 'absolute',
              left: { xs: 4, sm: 8 },
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              cursor: 'pointer'
            }}
          >
            <IconButton
              size="small"
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                boxShadow: 3,
                width: { xs: 32, sm: 40 },
                height: { xs: 32, sm: 40 },
                '&:hover': {
                  bgcolor: 'background.paper',
                  transform: 'scale(1.1)',
                }
              }}
            >
              <KeyboardArrowLeft fontSize="small" />
            </IconButton>
          </Box>
          
          <Swiper
            modules={[Autoplay, Pagination, Navigation]}
            spaceBetween={8}
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
              if (swiper.params.navigation) {
                swiper.params.navigation.prevEl = prevRef.current;
                swiper.params.navigation.nextEl = nextRef.current;
              }
            }}
            style={{ 
              padding: '10px 0 40px',
              display: 'flex',
              width: '100%'
            }}
            breakpoints={{
              320: { slidesPerView: 2.3, spaceBetween: 8 },
              480: { slidesPerView: 3.2, spaceBetween: 8 },
              768: { slidesPerView: 4.5, spaceBetween: 10 },
              1024: { slidesPerView: 5.8, spaceBetween: 10 },
              1200: { slidesPerView: 6.5, spaceBetween: 12 }
            }}
          >
            {featuredProducts.map((product) => (
              <SwiperSlide 
                key={product.id}
                style={{
                  height: 'auto',
                  display: 'flex',
                  justifyContent: 'center',
                  width: 'auto'
                }}
              >
                <ProductCard 
                  product={product} 
                  setSelectedImage={setSelectedImage}
                  compact
                />
              </SwiperSlide>
            ))}
          </Swiper>
          
          <Box 
            ref={nextRef}
            sx={{
              position: 'absolute',
              right: { xs: 4, sm: 8 },
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              cursor: 'pointer'
            }}
          >
            <IconButton
              size="small"
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                boxShadow: 3,
                width: { xs: 32, sm: 40 },
                height: { xs: 32, sm: 40 },
                '&:hover': {
                  bgcolor: 'background.paper',
                  transform: 'scale(1.1)',
                }
              }}
            >
              <KeyboardArrowRight fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            py: 4,
            backgroundColor: theme.palette.grey[50],
            borderRadius: 2,
            border: `1px dashed ${theme.palette.grey[300]}`,
            mx: 2
          }}
        >
          <Typography variant="body1" color="text.secondary">
            No featured products available at the moment.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default FeaturedProducts;
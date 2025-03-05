import React from 'react';
import { Box, Typography } from '@mui/material';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import ProductCard from './ProductCard';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import IconButton from '@mui/material/IconButton';

const FeaturedProducts = ({ featuredProducts, isSmallScreen, prevRef, nextRef, setSelectedImage }) => (
  <Box sx={{ 
    mb: { xs: 4, md: 6 },
    overflow: 'hidden',
    width: '100%'
  }}>
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      mb: 3,
      borderBottom: '2px solid',
      borderColor: 'primary.light',
      pb: 1
    }}>
      <Typography 
        variant={isSmallScreen ? "h5" : "h4"} 
        component="h2" 
        sx={{ fontWeight: 'bold' }}
      >
        Featured Products
      </Typography>
    </Box>
    
    {featuredProducts.length > 0 ? (
      <Box 
        sx={{ 
          position: 'relative',
          mx: { xs: 1, sm: 2 },
          '.swiper': {
            overflow: 'hidden'
          },
          '.swiper-wrapper': {
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'nowrap',
            gap: { xs: '8px', sm: '4px' }
          }
        }}
      >
        <Box 
          ref={prevRef}
          sx={{
            position: 'absolute',
            left: -16,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10,
            cursor: 'pointer'
          }}
        >
          <IconButton
            sx={{
              bgcolor: 'background.paper',
              boxShadow: 2,
              '&:hover': {
                bgcolor: 'grey.100'
              }
            }}
          >
            <KeyboardArrowLeft />
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
          style={{ 
            padding: '20px 0 40px',
            display: 'flex',
            width: '100%'
          }}
          breakpoints={{
            320: {
              slidesPerView: 2,
              spaceBetween: 8
            },
            480: {
              slidesPerView: 3,
              spaceBetween: 8
            },
            768: {
              slidesPerView: 4,
              spaceBetween: 4
            },
            1024: {
              slidesPerView: 5,
              spaceBetween: 8
            }
          }}
        >
          {featuredProducts.map((product) => (
            <SwiperSlide 
              key={product.id}
              style={{
                width: '160px',
                height: 'auto',
                display: 'flex',
                justifyContent: 'center'
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
            right: -16,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10,
            cursor: 'pointer'
          }}
        >
          <IconButton
            sx={{
              bgcolor: 'background.paper',
              boxShadow: 2,
              '&:hover': {
                bgcolor: 'grey.100'
              }
            }}
          >
            <KeyboardArrowRight />
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

export default FeaturedProducts;

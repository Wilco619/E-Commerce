import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import ProductCard from './ProductCard';
import 'swiper/css';
import 'swiper/css/navigation';

const PopularProducts = ({ popularProducts, isSmallScreen }) => {
  const prevRef = React.useRef(null);
  const nextRef = React.useRef(null);
  const theme = useTheme();

  if (!popularProducts || popularProducts.length === 0) {
    return null; // Don't render if no popular products
  }

  return (
    <Box sx={{ my: 4 }}>
      <Typography
        variant="h5"
        component="h2"
        sx={{
          mb: 3,
          fontWeight: 'bold',
          textAlign: { xs: 'center', md: 'left' }
        }}
      >
        Popular Products
      </Typography>

      <Box sx={{ position: 'relative' }}>
        <Swiper
          modules={[Navigation]}
          spaceBetween={16}
          slidesPerView={isSmallScreen ? 1 : 4}
          navigation={{
            prevEl: prevRef.current,
            nextEl: nextRef.current,
          }}
          onBeforeInit={(swiper) => {
            swiper.params.navigation.prevEl = prevRef.current;
            swiper.params.navigation.nextEl = nextRef.current;
          }}
        >
          {popularProducts.map((product) => (
            <SwiperSlide key={product.id}>
              <ProductCard product={product} />
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Navigation Buttons */}
        <Box
          ref={prevRef}
          sx={{
            position: 'absolute',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 2,
            cursor: 'pointer',
            display: { xs: 'none', md: 'block' },
            '&.swiper-button-disabled': {
              opacity: 0.5,
              cursor: 'not-allowed',
            }
          }}
        >
          {/* Previous button icon */}
        </Box>
        <Box
          ref={nextRef}
          sx={{
            position: 'absolute',
            right: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 2,
            cursor: 'pointer',
            display: { xs: 'none', md: 'block' },
            '&.swiper-button-disabled': {
              opacity: 0.5,
              cursor: 'not-allowed',
            }
          }}
        >
          {/* Next button icon */}
        </Box>
      </Box>
    </Box>
  );
};

export default PopularProducts;

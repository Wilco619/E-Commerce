import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import ProductCard from './ProductCard';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import IconButton from '@mui/material/IconButton';

const FeaturedProducts = ({ featuredProducts, isSmallScreen, prevRef, nextRef, setSelectedImage }) => {
  const theme = useTheme(); // Moved inside the component

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
            fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.8rem', lg: '3rem' } // Adjust sizes
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
            spaceBetween={2}
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
              padding: '10px 0 30px',
              display: 'flex',
              width: '100%'
            }}
            breakpoints={{
              320: { slidesPerView: 2, spaceBetween: 2 },
              480: { slidesPerView: 3, spaceBetween: 2 },
              768: { slidesPerView: 4, spaceBetween: 2 },
              1024: { slidesPerView: 5, spaceBetween: 2 }
            }}
          >
            {featuredProducts.map((product) => (
              <SwiperSlide 
                key={product.id}
                style={{
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

import React, { useState } from 'react';
import { Card, CardMedia, Typography, Box, Button, IconButton, Skeleton, Chip } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import FavoriteIcon from '@mui/icons-material/Favorite';
import Rating from '@mui/material/Rating';
import { useWishlist } from '../authentication/WishlistContext';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { useAuth } from '../authentication/AuthContext';
import { useSnackbar } from 'notistack';
import { useInView } from 'react-intersection-observer';

const GUEST_WISHLIST_ID = 'guest_wishlist';

const ProductCard = ({ product, selectedImage, setSelectedImage, compact, onAddToCart, loading: addingToCart }) => {
  const { isInWishlist, toggleWishlistItem } = useWishlist();
  const { isAuthenticated } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [isToggling, setIsToggling] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const handleWishlistClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isToggling) return;
    
    try {
      setIsToggling(true);
      if (!isAuthenticated) {
        const guestWishlist = JSON.parse(localStorage.getItem(GUEST_WISHLIST_ID) || '[]');
        const isInList = guestWishlist.some(item => item.product.id === product.id);
        
        if (isInList) {
          const newWishlist = guestWishlist.filter(item => item.product.id !== product.id);
          localStorage.setItem(GUEST_WISHLIST_ID, JSON.stringify(newWishlist));
          enqueueSnackbar('Removed from wishlist', { variant: 'info' });
        } else {
          guestWishlist.push({
            product: product,
            created_at: new Date().toISOString()
          });
          localStorage.setItem(GUEST_WISHLIST_ID, JSON.stringify(guestWishlist));
          enqueueSnackbar('Added to wishlist', { variant: 'success' });
        }
        return;
      }
      
      await toggleWishlistItem(product);
    } catch (error) {
      console.error('Error updating wishlist:', error);
      enqueueSnackbar('Failed to update wishlist', { variant: 'error' });
    } finally {
      setIsToggling(false);
    }
  };

  const inWishlist = isInWishlist(product.id);

  // Responsive dimensions
  const cardWidth = compact ? { xs: 140, sm: 160, md: 180 } : { xs: 200, sm: 240, md: 280 };
  const cardHeight = compact ? { xs: 180, sm: 200, md: 220 } : { xs: 240, sm: 280, md: 320 };

  return (
    <Card
      sx={{
        height: cardHeight,
        width: cardWidth,
        flex: '0 0 auto',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 2,
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-6px) scale(1.02)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
          '& .overlay-content': {
            opacity: 1,
            transform: 'translateY(0)',
          },
          '& .card-image': {
            transform: 'scale(1.05)',
          }
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Full Height Image */}
      <Box 
        sx={{ 
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden'
        }}
        component={RouterLink}
        to={`/product/${product.slug}`}
      >
        <div ref={ref} style={{ height: '100%' }}>
          {inView ? (
            <CardMedia
              component="img"
              className="card-image"
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.5s ease',
              }}
              image={selectedImage || product.feature_image || '/placeholder-product.jpg'}
              alt={product.name}
            />
          ) : (
            <Skeleton variant="rectangular" sx={{ width: '100%', height: '100%' }} />
          )}
        </div>

        {/* Discount Badge */}
        {product.discount_price && (
          <Chip
            label={`${Math.round((1 - (product.discount_price / product.price)) * 100)}% OFF`}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: 'error.main',
              color: 'white',
              fontWeight: 'bold',
              fontSize: { xs: '0.6rem', sm: '0.7rem' },
              height: { xs: 20, sm: 24 },
              '& .MuiChip-label': {
                px: { xs: 0.5, sm: 1 }
              }
            }}
          />
        )}

        {/* Wishlist Button */}
        <IconButton
          size="small"
          onClick={handleWishlistClick}
          disabled={isToggling}
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            color: inWishlist ? 'error.main' : 'action.active',
            width: { xs: 28, sm: 32 },
            height: { xs: 28, sm: 32 },
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 1)',
              transform: 'scale(1.1)',
            },
            transition: 'all 0.2s ease',
          }}
        >
          {inWishlist ? (
            <FavoriteIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />
          ) : (
            <FavoriteBorderIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />
          )}
        </IconButton>

        {/* Dark Gradient Overlay */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '60%',
            background: 'linear-gradient(transparent, rgba(0,0,0,0.3), rgba(0,0,0,0.8))',
            pointerEvents: 'none',
          }}
        />

       {/* Content Overlay */}
        <Box
          className="overlay-content"
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            p: { xs: 1, sm: 1.5 },
            color: 'white',
            opacity: 1,
            transform: 'translateY(0)',
            transition: 'all 0.3s ease',
            background: 'linear-gradient(transparent, rgba(0,0,0,0.4), rgba(0,0,0,0.9))',
          }}
        >
          {/* Product Info */}
          <Box>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <Rating
                  value={product.rating || 4.5}
                  precision={0.5}
                  size="small"
                  readOnly
                  sx={{ 
                    fontSize: { xs: '0.8rem', sm: '1rem' },
                    '& .MuiRating-iconFilled': {
                      color: '#ffc107'
                    }
                  }}
                />
              </Box>

            <Typography
              variant="subtitle2"
              sx={{ 
                fontWeight: 600,
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                lineHeight: 1.2,
                mb: 0.5,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {product.name}
            </Typography>


            {/* Price */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              {product.discount_price ? (
                <>
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        px: 2 // optional horizontal padding
                      }}
                    >
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          textDecoration: 'line-through', 
                          color: 'orange',
                          fontWeight: 700,
                          opacity: 0.7,
                          fontSize: { xs: '0.6rem', sm: '0.7rem' },
                          
                        }}
                      >
                        Ksh {product.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                      </Typography>

                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontSize: { xs: '0.7rem', sm: '0.8rem' },
                          fontWeight: 700,
                          color: '#80e27e',
                          paddingLeft: 3.5,
                        }}
                      >
                        Ksh {product.discount_price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                      </Typography>
                    </Box>
                </>
              ) : (
                <Typography 
                  variant="body2"
                  sx={{ 
                    fontSize: { xs: '0.7rem', sm: '0.8rem' },
                    fontWeight: 600
                  }}
                >
                  Ksh {product.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                </Typography>
              )}
            </Box>

            {product.weekly_orders > 0 && (
              <Typography
                variant="caption"
                sx={{
                  opacity: 0.8,
                  fontSize: { xs: '0.6rem', sm: '0.7rem' },
                  display: 'block'
                }}
              >
                {product.weekly_orders} orders this week
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    </Card>
  );
};

export default ProductCard;
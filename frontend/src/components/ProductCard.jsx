import React, { useState } from 'react';
import { Card, CardMedia, CardContent, Typography, Box, CardActions, Button, IconButton } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import FavoriteIcon from '@mui/icons-material/Favorite';
import Rating from '@mui/material/Rating';
import { useWishlist } from '../authentication/WishlistContext';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { useAuth } from '../authentication/AuthContext';
import { useSnackbar } from 'notistack';

const GUEST_WISHLIST_ID = 'guest_wishlist';

const ProductCard = ({ product, selectedImage, setSelectedImage, compact, onAddToCart, loading: addingToCart }) => {
  const { isInWishlist, toggleWishlistItem } = useWishlist();
  const { isAuthenticated } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [isToggling, setIsToggling] = useState(false);

  const handleWishlistClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isToggling) return;
    
    try {
      setIsToggling(true);
      if (!isAuthenticated) {
        // Handle guest wishlist
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

  return (
    <Card
      sx={{
        height: '100%',
        width: compact ? 190 : 280, // Increased width for compact mode from 150 to 170
        flex: '0 0 auto',
        display: 'flex',
        flexDirection: 'column',
        margin: '0 1px', // Further reduced margin from 2px to 1px
        transition: 'transform 0.3s, box-shadow 0.3s',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: '0 12px 20px rgba(0, 0, 0, 0.1)'
        }
      }}
    >
      <Box 
        sx={{ 
          position: 'relative',
          cursor: 'pointer' // Add cursor pointer to indicate clickable area
        }}
        component={RouterLink}
        to={`/product/${product.slug}`}
      >
        <CardMedia
          component="img"
          height={compact ? "120" : "200"} // Keep the same height
          image={selectedImage || product.feature_image || '/placeholder-product.jpg'}
          alt={product.name}
        />
        {product.discount_price && (
          <Box
            sx={{
              position: 'absolute',
              top: 10,
              right: 10,
              bgcolor: 'error.main',
              color: 'white',
              borderRadius: '50%',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '0.7rem',
              textAlign: 'center',
              lineHeight: 1
            }}
          >
            {Math.round((1 - (product.discount_price / product.price)) * 100)}% OFF
          </Box>
        )}
      </Box>
      
      <CardContent sx={{ flexGrow: 1, p: compact ? 1 : 2, pt: compact ? 1 : 1.5 }}> {/* Reduced top padding slightly */}
        <Typography
          gutterBottom
          variant={compact ? "subtitle1" : "h6"}
          component="h3"
          noWrap
          sx={{ 
            fontSize: compact ? '0.9rem' : undefined,
            mb: 0.5 // Reduced bottom margin
          }}
        >
          {product.name}
        </Typography>
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ mb: 0.5 }} // Reduced margin
        >
          {product.category_name || product.category?.name || "Uncategorized"}
        </Typography>
        <Rating
          value={product.rating || 4.5}
          precision={0.5}
          size="small"
          readOnly
          sx={{ mb: 0.5 }} // Reduced margin
        />
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {product.discount_price ? (
            <>
              <Typography variant="h6" color="primary" sx={{ mr: 1, fontSize: '0.85rem' }}>
                Ksh {product.discount_price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              </Typography>
              <Typography variant="body2" color="error" sx={{ textDecoration: 'line-through', fontSize: '0.80rem' }}>
                Ksh {product.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              </Typography>
            </>
          ) : (
            <Typography variant="h6">
              Ksh {product.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            </Typography>
          )}
        </Box>
        {product.weekly_orders > 0 && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: 'block',
              mt: 0.5 // Reduced margin
            }}
          >
            {product.weekly_orders} orders this week
          </Typography>
        )}
      </CardContent>
      <CardActions sx={{ justifyContent: 'space-between', px: compact ? 1 : 2, pb: compact ? 1 : 2, pt: 0 }}> {/* Remove top padding */}
        <Button
          variant="outlined"
          size="small"
          component={RouterLink}
          to={`/product/${product.slug}`}
          startIcon={<ShoppingBagIcon />}
        >
          View
        </Button>
        <IconButton
          size="small"
          onClick={handleWishlistClick}
          disabled={isToggling}
          sx={{
            color: inWishlist ? 'error.main' : 'action.active',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
              transform: 'scale(1.1)',
            },
            transition: 'all 0.2s ease',
          }}
        >
          {inWishlist ? (
            <FavoriteIcon sx={{ color: 'error.main' }} />
          ) : (
            <FavoriteBorderIcon />
          )}
        </IconButton>
      </CardActions>
    </Card>
  );
};

export default ProductCard;
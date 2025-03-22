import React, { useEffect } from 'react';
import { 
  Container, Typography, Grid, Box, 
  Button, CircularProgress, Paper
} from '@mui/material';
import { useWishlist } from '../authentication/WishlistContext';
import ProductCard from '../components/ProductCard';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../authentication/AuthContext';

const WishlistPage = () => {
  const { wishlistItems, loading, toggleWishlistItem, fetchWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const safeWishlistItems = Array.isArray(wishlistItems) ? wishlistItems : [];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress size={40} />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Typography variant="h5" component="h1" fontWeight="600" sx={{ mb: 2 }}>
        {isAuthenticated ? 'My Wishlist' : 'Guest Wishlist'}
      </Typography>

      {safeWishlistItems.length === 0 ? (
        <Paper elevation={0} sx={{ textAlign: "center", py: 4, px: 2, bgcolor: "background.default" }}>
          <Typography variant="h6" gutterBottom>
            Your wishlist is empty
          </Typography>
          {!isAuthenticated && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Log in to save your wishlist permanently
            </Typography>
          )}
          <Button 
            variant="contained" 
            color="primary"
            size="medium"
            onClick={() => navigate('/shop')}
            sx={{ mt: 1 }}
          >
            Continue Shopping
          </Button>
        </Paper>
      ) : (
        <>
          {!isAuthenticated && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Note: Your wishlist items will be saved once you Log in.
            </Typography>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Box sx={{ width: '95%', maxWidth: '1400px' }}>
              <Grid container spacing={3}>
                {safeWishlistItems.map((item) => (
                  <Grid 
                    item 
                    key={item.id || item.product.id} 
                    xs={6} 
                    sm={6} 
                    md={3} 
                    lg={2.4} 
                    xl={2}
                    sx={{ 
                      p: 1,
                      '& .MuiPaper-root': {
                        height: '100%',
                        width: '100%',
                        margin: '0 auto',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 6px 12px rgba(0,0,0,0.1)'
                        }
                      }
                    }}
                  >
                    <ProductCard 
                      product={item.product} 
                      onWishlistToggle={() => toggleWishlistItem(item.product)}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Box>
        </>
      )}
    </Container>
  );
};

export default WishlistPage;
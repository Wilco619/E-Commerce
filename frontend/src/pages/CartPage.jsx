import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  IconButton,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Divider,
  Skeleton,
  TextField,
  Paper,
  useMediaQuery
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../authentication/AuthContext';
import { useCart } from '../authentication/CartContext';
import { useSnackbar } from 'notistack';

import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@mui/material/styles';
import StoreIcon from '@mui/icons-material/Store';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined'; 
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const CartPage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { cart, error, updateCartItem, removeFromCart, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [toast, setToast] = useState({ open: false, message: '', severity: 'info' });
  const [loading, setLoading] = useState(true);


  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  // Add debugging effect
  useEffect(() => {

    // Set loading to false when cart data is available
    if (cart !== undefined) {
      setLoading(false);
    }

    console.log('Cart state:', {
      isAuthenticated,
      cartExists: !!cart,
      itemsCount: cart?.items?.length,
      cartType: cart?.cart_type
    });
  }, [cart, isAuthenticated]);

  const handleQuantityChange = (cartItemId, newQuantity) => {
    if (newQuantity >= 1) {
      updateCartItem(cartItemId, newQuantity);
    }
  };

  const handleRemoveItem = (cartItemId) => {
    removeFromCart(cartItemId);
  };

  const handleClearCart = () => {
    clearCart();
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      enqueueSnackbar('Please login to checkout', { variant: 'warning' });
      navigate('/login', { state: { from: '/cart' } });
      return;
    }
    navigate('/checkout');
  };  

  // Render skeleton loader
  const renderSkeletonLoader = () => (
    <Box sx={{ py: 2 }}>
      {[1, 2, 3].map((item) => (
        <Card key={item} sx={{ mb: 2, overflow: 'visible' }}>
          <CardContent sx={{ p: isMobile ? 2 : 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={3} sm={2}>
                <Skeleton variant="rectangular" width="100%" height={80} sx={{ borderRadius: 1 }} />
              </Grid>
              <Grid item xs={9} sm={4}>
                <Skeleton variant="text" width="80%" height={28} />
                <Skeleton variant="text" width="40%" height={20} />
              </Grid>
              <Grid item xs={6} sm={2} sx={{ display: 'flex', justifyContent: isMobile ? 'flex-start' : 'center' }}>
                <Skeleton variant="rectangular" width={120} height={40} />
              </Grid>
              <Grid item xs={6} sm={2} sx={{ textAlign: 'right' }}>
                <Skeleton variant="text" width="100%" height={28} />
              </Grid>
              <Grid item xs={12} sm={2} sx={{ textAlign: isMobile ? 'right' : 'center' }}>
                <Skeleton variant="circular" width={40} height={40} sx={{ ml: isMobile ? 'auto' : 0 }} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      ))}
      <Box sx={{ mt: 4 }}>
        <Skeleton variant="rectangular" width="100%" height={150} sx={{ borderRadius: 2 }} />
      </Box>
    </Box>
  );

  const renderEmptyCart = () => (
    <Paper elevation={0} sx={{ p: 4, textAlign: 'center', borderRadius: 3, backgroundColor: 'background.paper' }}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <ShoppingBagOutlinedIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h5" sx={{ mb: 1, fontWeight: 500 }}>Your cart is empty</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Looks like you haven't added anything to your cart yet.
        </Typography>
        <Button
          variant="contained"
          size="large"
          color="primary"
          onClick={() => navigate('/shop')}
          startIcon={<StoreIcon />}
          sx={{ 
            borderRadius: '50px',
            px: 4
          }}
        >
          Shop Now
        </Button>
      </motion.div>
    </Paper>
  );

  if (error) {
    return (
      <Container>
        <Typography color="error">Error loading cart: {error}</Typography>
      </Container>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <Container>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <ShoppingCartIcon sx={{ fontSize: 60, color: 'text.secondary' }} />
          <Typography variant="h5" sx={{ mt: 2 }}>Your cart is empty</Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/shop')}
            sx={{ mt: 2 }}
          >
            Continue Shopping
          </Button>
        </Box>
      </Container>
    );
  }

  const renderCartItems = () => (
    <Box sx={{ py: 2 }}>
      <AnimatePresence>
        {cart.items.map(item => renderCartItem(item))}
      </AnimatePresence>
    </Box>
  );

  const renderCartItem = (item) => {
    const price = parseFloat(item.product?.discount_price || item.product?.price || 0);
    const total = price * item.quantity;
    const isDiscounted = item.product?.discount_price && item.product?.discount_price < item.product?.price;
  
    return (
      <motion.div
        key={item.id}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card sx={{ 
          mb: 2, 
          overflow: 'visible', 
          boxShadow: '0 4px 15px rgba(0,0,0,0.05)', 
          ':hover': { boxShadow: '0 8px 20px rgba(0,0,0,0.08)' },
          transition: 'box-shadow 0.3s ease-in-out'
        }}>
          <CardContent sx={{ p: isMobile ? 2 : 3 }}>
            <Grid container spacing={2} alignItems="center">
              {/* Product Image & Details */}
              <Grid item xs={12} sm={6} container spacing={2} alignItems="center">
                <Grid item xs={4} sm={3}>
                  {item.product?.images?.[0]?.image ? (
                    <Box 
                      sx={{ 
                        borderRadius: 1,
                        overflow: 'hidden',
                        position: 'relative',
                        paddingTop: '100%',
                        backgroundColor: '#f5f5f5'
                      }}
                    >
                      <img
                        src={item.product.images[0].image}
                        alt={item.product.name}
                        style={{ 
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    </Box>
                  ) : (
                    <Box sx={{ 
                      backgroundColor: '#f5f5f5', 
                      borderRadius: 1, 
                      height: 0, 
                      paddingTop: '100%', 
                      position: 'relative' 
                    }} />
                  )}
                </Grid>
                <Grid item xs={8} sm={9}>
                  <Typography variant="subtitle1" fontWeight={500} noWrap>
                    {item.product?.name}
                  </Typography>
                  {isDiscounted && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ textDecoration: 'line-through', mr: 1 }}
                      >
                        Ksh {formatPrice(parseFloat(item.product?.price))}
                      </Typography>
                      <Chip
                        label={`${Math.round((1 - item.product.discount_price / item.product.price) * 100)}% OFF`}
                        size="small"
                        color="error"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    </Box>
                  )}
                  <Typography variant="subtitle1" color="primary" fontWeight={500} sx={{ mt: isDiscounted ? 0.5 : 1 }}>
                    Ksh {formatPrice(price)}
                  </Typography>
                </Grid>
              </Grid>
  
              {/* Quantity Controls */}
              <Grid item xs={5} sm={2} sx={{ display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'flex-start' : 'center' }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 1
                }}>
                  <IconButton
                    size="small"
                    onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    sx={{ p: isMobile ? 0.5 : 1 }}
                  >
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                  <TextField
                    size="small"
                    value={item.quantity}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (!isNaN(value)) {
                        handleQuantityChange(item.id, value);
                      }
                    }}
                    inputProps={{
                      min: 1,
                      max: item.product?.stock,
                      style: { 
                        textAlign: 'center', 
                        width: isMobile ? '30px' : '40px',
                        padding: isMobile ? '4px 0' : '8px 0'
                      }
                    }}
                    variant="standard"
                    sx={{ mx: 0.5 }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                    disabled={item.quantity >= (item.product?.stock || 0)}
                    sx={{ p: isMobile ? 0.5 : 1 }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Grid>
  
              {/* Item Total & Remove Button */}
              <Grid item xs={4} sm={2} sx={{ textAlign: 'right' }}>
                <Typography variant="subtitle1" fontWeight={500}>
                  Ksh {formatPrice(total)}
                </Typography>
              </Grid>
              <Grid item xs={3} sm={2} sx={{ textAlign: 'right' }}>
                <IconButton
                  color="error"
                  onClick={() => handleRemoveItem(item.id)}
                  sx={{ 
                    border: '1px solid rgba(211, 47, 47, 0.2)',
                    p: isMobile ? 0.5 : 1,
                    '&:hover': {
                      backgroundColor: 'rgba(211, 47, 47, 0.1)'
                    }
                  }}
                >
                  <DeleteOutlineIcon fontSize={isMobile ? 'small' : 'medium'} />
                </IconButton>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </motion.div>
    );
  };


  const renderCartSummary = () => {
    const cartTotal = cart.items.reduce((sum, item) => {
      const price = parseFloat(item.product?.discount_price || item.product?.price || 0);
      return sum + (price * item.quantity);
    }, 0);
  
    const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  
    return (
      <Card sx={{ 
        mt: 3, 
        overflow: 'visible', 
        boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
        borderRadius: 3
      }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={500} sx={{ mb: 2 }}>
            Order Summary
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body1" color="text.secondary">
              Items ({itemCount})
            </Typography>
            <Typography variant="body1">
              Ksh {formatPrice(cartTotal)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body1" color="text.secondary">
              Shipping
            </Typography>
            <Typography variant="body1">
              -
            </Typography>
          </Box>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6" fontWeight={500}>
              Total
            </Typography>
            <Typography variant="h6" fontWeight={600} color="primary">
              Ksh {formatPrice(cartTotal)}
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            onClick={handleCheckout}
            endIcon={<ArrowForwardIcon />}
            sx={{ 
              borderRadius: '50px',
              py: 1.5
            }}
          >
            Proceed to Checkout
          </Button>
          <Button
            variant="outlined"
            color="error"
            fullWidth
            size="medium"
            onClick={handleClearCart}
            disabled={!cart?.items?.length}
            sx={{ 
              mt: 2,
              borderRadius: '50px',
            }}
          >
            Clear Cart
          </Button>
        </CardContent>
      </Card>
    );
  };


  const cartTotal = cart.items.reduce((sum, item) => {
    const price = parseFloat(item.product?.discount_price || item.product?.price || 0);
    return sum + (price * item.quantity);
  }, 0);

  // Add this utility function
  const formatPrice = (price) => {
    return price.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Main return method
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 500 }}>Your Shopping Cart</Typography>
        {renderSkeletonLoader()}
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 500 }}>Your Shopping Cart</Typography>
        <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
          <Typography color="error">Error loading cart: {error}</Typography>
          <Button variant="outlined" onClick={() => window.location.reload()} sx={{ mt: 2 }}>
            Try Again
          </Button>
        </Paper>
      </Container>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 500 }}>Your Shopping Cart</Typography>
        {renderEmptyCart()}
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 500 }}>Your Shopping Cart</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {renderCartItems()}
        </Grid>
        <Grid item xs={12} md={4}>
          {renderCartSummary()}
        </Grid>
      </Grid>
    </Container>
  );

};

export default CartPage;
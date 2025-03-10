import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Typography, 
  Container, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Button,
  IconButton,
  Box,
  Grid,
  Divider,
  TextField,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { productsAPI } from '../services/api';
import { useAuth } from '../authentication/AuthContext';
import { useCart } from '../authentication/CartContext';
import { useNavigate } from 'react-router-dom';
import { GUEST_SESSION_ID } from '../services/constants';

const CartPage = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    fetchCart();
  }, []);

  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { cartType } = useCart();  // Add cartType from useCart

  const fetchCart = async () => {
    try {
      setLoading(true);
      setError(null);

      let response;
      if (isAuthenticated) {
        response = await productsAPI.getUserCart();
      } else {
        const sessionId = localStorage.getItem(GUEST_SESSION_ID);
        if (!sessionId) {
          setCart(null);
          return;
        }
        // Use the guest cart endpoint that includes product details
        response = await productsAPI.getGuestCart(sessionId);
      }

      // The cart data should now include complete product details
      setCart(response.data);
    } catch (err) {
      console.error('Error fetching cart:', err);
      setError('Failed to load your shopping cart');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (cartItemId, quantity, currentStock) => {
    try {
      if (quantity <= 0) {
        await handleRemoveItem(cartItemId);
        return;
      }

      const sessionId = !isAuthenticated ? localStorage.getItem(GUEST_SESSION_ID) : null;
      
      if (isAuthenticated) {
        await productsAPI.updateUserCartItem(cartItemId, quantity);
      } else {
        await productsAPI.updateGuestCartItem(sessionId, cartItemId, quantity);
      }

      await fetchCart();
      showToast('Cart updated successfully', 'success');
    } catch (err) {
      console.error('Error updating cart:', err);
      showToast(err.response?.data?.error || 'Failed to update cart', 'error');
    }
  };

  const handleRemoveItem = async (cartItemId) => {
    try {
      const sessionId = !isAuthenticated ? localStorage.getItem(GUEST_SESSION_ID) : null;

      if (isAuthenticated) {
        await productsAPI.removeFromUserCart(cartItemId);
      } else {
        await productsAPI.removeFromGuestCart(sessionId, cartItemId);
      }

      await fetchCart();
      showToast('Item removed from cart', 'success');
    } catch (err) {
      console.error('Error removing item:', err);
      showToast('Failed to remove item', 'error');
    }
  };

  const handleClearCart = async () => {
    try {
      const sessionId = !isAuthenticated ? localStorage.getItem(GUEST_SESSION_ID) : null;

      if (isAuthenticated) {
        await productsAPI.clearUserCart();
      } else {
        await productsAPI.clearGuestCart(sessionId);
      }

      await fetchCart();
      showToast('Cart cleared successfully', 'success');
    } catch (err) {
      console.error('Error clearing cart:', err);
      showToast('Failed to clear cart', 'error');
    }
  };

  // Calculate cart items count
  const cartItemsCount = useMemo(() => {
    if (loading) return 0;
    return cart?.items?.reduce((total, item) => total + item.quantity, 0) || 0;
  }, [cart, loading]);

  const handleCheckoutClick = useCallback(() => {
    if (!isAuthenticated && cartItemsCount > 0) {
      sessionStorage.setItem('redirectAfterLogin', '/checkout');
      navigate('/login');
    } else {
      navigate('/checkout', { state: { cartId: cart.id } });
    }
  }, [isAuthenticated, cartItemsCount, navigate, cart]); // Added cart to the dependency array

  const showToast = (message, severity = 'info') => {
    setToast({ open: true, message, severity });
  };

  const handleCloseToast = () => {
    setToast({ ...toast, open: false });
  };

  // Update the cart items rendering with proper price calculations
  const renderCartItems = () => {
    if (!cart?.items?.length) {
      return (
        <TableRow>
          <TableCell colSpan={5} align="center">
            <Typography variant="body1">Your cart is empty</Typography>
          </TableCell>
        </TableRow>
      );
    }

    return cart.items.map((item) => {
      const price = parseFloat(item.product?.discount_price || item.product?.price || 0);
      const quantity = parseInt(item.quantity || 0);
      const itemTotal = price * quantity;

      return (
        <TableRow key={item.id}>
          <TableCell>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {item.product?.images?.[0]?.image && (
                <Box 
                  component="img" 
                  src={item.product.images[0].image}
                  alt={item.product.name}
                  sx={{ width: 60, height: 60, objectFit: 'contain', mr: 2 }}
                />
              )}
              <Box>
                <Typography variant="subtitle2">{item.product?.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {item.product?.sku}
                </Typography>
              </Box>
            </Box>
          </TableCell>
          <TableCell align="right">
            <Typography>
              Ksh {price.toFixed(2)}
            </Typography>
          </TableCell>
          <TableCell align="center">
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconButton 
                size="small"
                onClick={() => handleUpdateQuantity(item.id, quantity - 1)}
                disabled={quantity <= 1}
              >
                <RemoveIcon />
              </IconButton>
              <Typography sx={{ mx: 2 }}>{quantity}</Typography>
              <IconButton 
                size="small"
                onClick={() => handleUpdateQuantity(item.id, quantity + 1)}
                disabled={quantity >= item.product?.stock}
              >
                <AddIcon />
              </IconButton>
            </Box>
          </TableCell>
          <TableCell align="right">
            <Typography>
              Ksh {itemTotal.toFixed(2)}
            </Typography>
          </TableCell>
          <TableCell align="center">
            <IconButton 
              color="error"
              onClick={() => handleRemoveItem(item.id)}
            >
              <DeleteIcon />
            </IconButton>
          </TableCell>
        </TableRow>
      );
    });
  };

  // Calculate cart totals with proper number handling
  const cartTotals = useMemo(() => {
    if (!cart?.items?.length) return { totalItems: 0, subtotal: 0 };
    
    return cart.items.reduce((totals, item) => {
      const price = parseFloat(item.product?.discount_price || item.product?.price || 0);
      const quantity = parseInt(item.quantity || 0);
      const itemTotal = price * quantity;

      return {
        totalItems: totals.totalItems + quantity,
        subtotal: totals.subtotal + itemTotal
      };
    }, { totalItems: 0, subtotal: 0 });
  }, [cart]);

  // Update the Order Summary component with proper formatting
  const OrderSummary = () => (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Order Summary</Typography>
      <Divider sx={{ mb: 2 }} />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography>Subtotal ({cartTotals.totalItems} items):</Typography>
        <Typography fontWeight="bold">
          Ksh {cartTotals.subtotal.toFixed(2)}
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography>Shipping:</Typography>
        <Typography>Calculated at checkout</Typography>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Total:</Typography>
        <Typography variant="h6" color="primary">
          Ksh {cartTotals.subtotal.toFixed(2)}
        </Typography>
      </Box>
      
      <Button 
        variant="contained" 
        color="primary" 
        fullWidth
        size="large"
        onClick={handleCheckoutClick}
        disabled={cartTotals.totalItems === 0}
      >
        Proceed to Checkout
      </Button>
    </Paper>
  );

  if (loading) {
    return (
      <Container sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        <ShoppingCartIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Your Shopping Cart
      </Typography>
      
      {cart && cart.items && cart.items.length > 0 ? (
        <>
          <TableContainer component={Paper} sx={{ mb: 4 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell align="right">Price</TableCell>
                  <TableCell align="center">Quantity</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {renderCartItems()}
              </TableBody>
            </Table>
          </TableContainer>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Button 
                variant="outlined" 
                color="error" 
                onClick={handleClearCart}
                sx={{ mb: 2 }}
              >
                Clear Cart
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <OrderSummary />
            </Grid>
          </Grid>
        </>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>Your cart is empty</Typography>
          <Typography color="textSecondary" paragraph>
            Looks like you haven't added any products to your cart yet.
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => navigate('/')}
            sx={{ mt: 2 }}
          >
            Continue Shopping
          </Button>
        </Paper>
      )}

      <Snackbar 
        open={toast.open} 
        autoHideDuration={6000} 
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseToast} severity={toast.severity} sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CartPage;
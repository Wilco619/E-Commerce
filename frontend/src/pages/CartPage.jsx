import React, { useState, useEffect } from 'react';
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
import { cartAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

const CartPage = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ open: false, message: '', severity: 'info' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      // First try to get an existing cart
      let response = await cartAPI.getCart();
      
      // If no cart exists, create one
      if (response.data.results.length === 0) {
        response = await cartAPI.createCart();
        setCart(response.data);
      } else {
        setCart(response.data.results[0]); // Take the first cart
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching cart:', err);
      setError('Failed to load your shopping cart');
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (cartItemId, quantity, currentStock) => {
    try {
        if (quantity <= 0) {
            await handleRemoveItem(cartItemId);
            return;
        }
        
        // Check if requested quantity exceeds available stock
        if (quantity > currentStock) {
            showToast(`Only ${currentStock} items available`, 'error');
            return;
        }
        
        await cartAPI.updateCartItem(cartItemId, quantity);
        await fetchCart();
        showToast('Cart updated successfully', 'success');
    } catch (err) {
        console.error('Error updating cart:', err);
        showToast(err.response?.data?.error || 'Failed to update cart', 'error');
    }
  };

  const handleRemoveItem = async (cartItemId) => {
    try {
      await cartAPI.removeFromCart(cartItemId);
      await fetchCart(); // Refresh cart after removal
      showToast('Item removed from cart', 'success');
    } catch (err) {
      console.error('Error removing item:', err);
      showToast('Failed to remove item', 'error');
    }
  };

  const handleClearCart = async () => {
    try {
      await cartAPI.clearCart();
      await fetchCart(); // Refresh cart after clearing
      showToast('Cart cleared successfully', 'success');
    } catch (err) {
      console.error('Error clearing cart:', err);
      showToast('Failed to clear cart', 'error');
    }
  };

  const handleCheckout = () => {
    navigate('/checkout', { state: { cartId: cart.id } });
  };

  const showToast = (message, severity) => {
    setToast({ open: true, message, severity });
  };

  const handleCloseToast = () => {
    setToast({ ...toast, open: false });
  };

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
                {cart.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {item.product.feature_image && (
                          <Box 
                            component="img" 
                            src={item.product.feature_image} 
                            alt={item.product.name}
                            sx={{ width: 60, height: 60, objectFit: 'cover', mr: 2 }}
                          />
                        )}
                        <Typography>{item.product.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      Ksh {item.product.discount_price ?? item.product.price}
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <IconButton 
                          size="small" 
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1, item.product.stock)}
                          disabled={item.quantity <= 1}
                        >
                          <RemoveIcon />
                        </IconButton>
                        <TextField
                          size="small"
                          value={item.quantity}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (!isNaN(value)) {
                              handleUpdateQuantity(item.id, value, item.product.stock);
                            }
                          }}
                          inputProps={{ 
                              min: 1, 
                              max: item.product.stock,
                              style: { textAlign: 'center' } 
                          }}
                          sx={{ width: 60, mx: 1 }}
                        />
                        <IconButton 
                          size="small"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1, item.product.stock)}
                          disabled={item.quantity >= item.product.stock}
                        >
                          <AddIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell align="right">Ksh {item.total_price}</TableCell>
                    <TableCell align="center">
                                        <IconButton 
                                          color="error" 
                                          onClick={() => handleRemoveItem(item.id)}
                                        >
                                          <DeleteIcon />
                                        </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
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
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Order Summary</Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Subtotal ({cart.total_items} items):</Typography>
                  <Typography fontWeight="bold">Ksh {cart.total_price}</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography>Shipping:</Typography>
                  <Typography>Calculated at checkout</Typography>
                </Box>
                
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">Total:</Typography>
                  <Typography variant="h6" color="primary">Ksh {cart.total_price}</Typography>
                </Box>
                
                <Button 
                  variant="contained" 
                  color="primary" 
                  fullWidth
                  size="large"
                  onClick={handleCheckout}
                >
                  Proceed to Checkout
                </Button>
              </Paper>
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

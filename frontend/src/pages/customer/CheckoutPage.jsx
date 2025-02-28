import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  Divider,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  FormLabel,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { cartAPI, orderAPI } from '../../services/api';

const steps = ['Shipping Information', 'Payment Method', 'Review Order'];

const CheckoutPage = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    address: '',
    city: '',
    postal_code: '',
    country: '',
    payment_method: 'CREDIT_CARD',
    order_notes: ''
  });

  useEffect(() => {
    const fetchCart = async () => {
      try {
        setLoading(true);
        const response = await cartAPI.getCart();
        setCart(response.data.results[0]); // Ensure to set the first cart from results
      } catch (err) {
        setError('Failed to load your cart. Please try again.');
        console.error('Error fetching cart:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, []);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      handlePlaceOrder();
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const validateStep = () => {
    if (activeStep === 0) {
      // Validate shipping information
      return !!(
        formData.full_name && 
        formData.email && 
        formData.phone_number && 
        formData.address && 
        formData.city && 
        formData.postal_code && 
        formData.country
      );
    }
    if (activeStep === 1) {
      // Validate payment method
      return !!formData.payment_method;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    try {
      setLoading(true);
      const orderData = {
        ...formData,
        cart_id: cart.id,
        order_total: cart.total_price // Include the order_total field
      };
      
      const response = await orderAPI.checkout(orderData);
      setOrderSuccess(true);
      setOrderId(response.data.id);
      
      // Clear the form and navigate to order confirmation
      setTimeout(() => {
        navigate(`/orders/${response.data.id}`);
      }, 3000);
    } catch (err) {
      setError('Failed to place your order. Please try again.');
      console.error('Error placing order:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderShippingForm = () => (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <TextField
          required
          fullWidth
          label="Full Name"
          name="full_name"
          value={formData.full_name}
          onChange={handleFormChange}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          required
          fullWidth
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleFormChange}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          required
          fullWidth
          label="Phone Number"
          name="phone_number"
          value={formData.phone_number}
          onChange={handleFormChange}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          required
          fullWidth
          label="Address"
          name="address"
          multiline
          rows={2}
          value={formData.address}
          onChange={handleFormChange}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          required
          fullWidth
          label="City"
          name="city"
          value={formData.city}
          onChange={handleFormChange}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          required
          fullWidth
          label="Postal Code"
          name="postal_code"
          value={formData.postal_code}
          onChange={handleFormChange}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          required
          fullWidth
          label="Country"
          name="country"
          value={formData.country}
          onChange={handleFormChange}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Order Notes (Optional)"
          name="order_notes"
          multiline
          rows={3}
          value={formData.order_notes}
          onChange={handleFormChange}
        />
      </Grid>
    </Grid>
  );

  const renderPaymentForm = () => (
    <FormControl component="fieldset">
      <FormLabel component="legend">Payment Method</FormLabel>
      <RadioGroup
        name="payment_method"
        value={formData.payment_method}
        onChange={handleFormChange}
      >
        <FormControlLabel 
          value="CREDIT_CARD" 
          control={<Radio />} 
          label="Credit Card" 
        />
        <FormControlLabel 
          value="PAYPAL" 
          control={<Radio />} 
          label="PayPal" 
        />
        <FormControlLabel 
          value="BANK_TRANSFER" 
          control={<Radio />} 
          label="Bank Transfer" 
        />
      </RadioGroup>
    </FormControl>
  );

  const renderOrderSummary = () => {
    if (!cart || !cart.items) return <Typography>Loading cart data...</Typography>;
    
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Order Summary
        </Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="right">Quantity</TableCell>
                <TableCell align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cart.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.product.name}</TableCell>
                  <TableCell align="right">
                    ${parseFloat(item.product.discount_price || item.product.price).toFixed(2)}
                  </TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell align="right">${parseFloat(item.total_price).toFixed(2)}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>
                  Order Total:
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  ${parseFloat(cart.total_price).toFixed(2)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
          Shipping Information
        </Typography>
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Typography><strong>Name:</strong> {formData.full_name}</Typography>
          <Typography><strong>Email:</strong> {formData.email}</Typography>
          <Typography><strong>Phone:</strong> {formData.phone_number}</Typography>
          <Typography><strong>Address:</strong> {formData.address}</Typography>
          <Typography><strong>City:</strong> {formData.city}</Typography>
          <Typography><strong>Postal Code:</strong> {formData.postal_code}</Typography>
          <Typography><strong>Country:</strong> {formData.country}</Typography>
          {formData.order_notes && (
            <Typography><strong>Notes:</strong> {formData.order_notes}</Typography>
          )}
        </Paper>

        <Typography variant="h6" sx={{ mb: 2 }}>
          Payment Method
        </Typography>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography>
            {formData.payment_method === 'CREDIT_CARD' && 'Credit Card'}
            {formData.payment_method === 'PAYPAL' && 'PayPal'}
            {formData.payment_method === 'BANK_TRANSFER' && 'Bank Transfer'}
          </Typography>
        </Paper>
      </Box>
    );
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return renderShippingForm();
      case 1:
        return renderPaymentForm();
      case 2:
        return renderOrderSummary();
      default:
        return 'Unknown step';
    }
  };

  if (loading && !cart) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ my: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button 
          variant="contained" 
          sx={{ mt: 2 }}
          onClick={() => navigate('/cart')}
        >
          Return to Cart
        </Button>
      </Container>
    );
  }

  if (cart && cart.items && cart.items.length === 0) {
    return (
      <Container maxWidth="md" sx={{ my: 4 }}>
        <Alert severity="info">Your cart is empty. Add some products before checkout.</Alert>
        <Button 
          variant="contained" 
          sx={{ mt: 2 }}
          onClick={() => navigate('/products')}
        >
          Browse Products
        </Button>
      </Container>
    );
  }

  if (orderSuccess) {
    return (
      <Container maxWidth="md" sx={{ my: 4 }}>
        <Alert severity="success">
          Your order has been placed successfully! Order #{orderId}
        </Alert>
        <Typography sx={{ mt: 2 }}>
          Redirecting to order details...
        </Typography>
        <CircularProgress size={24} sx={{ mt: 2 }} />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Checkout
        </Typography>
        
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <Divider sx={{ mb: 4 }} />
        
        <Box>
          {getStepContent(activeStep)}
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
            {activeStep > 0 && (
              <Button
                onClick={handleBack}
                sx={{ mr: 1 }}
                disabled={loading}
              >
                Back
              </Button>
            )}
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!validateStep() || loading}
            >
              {loading ? (
                <CircularProgress size={24} />
              ) : activeStep === steps.length - 1 ? (
                'Place Order'
              ) : (
                'Next'
              )}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default CheckoutPage;

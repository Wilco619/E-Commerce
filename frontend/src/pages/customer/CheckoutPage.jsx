import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
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
  TableRow,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import { cartAPI, orderAPI, authAPI } from '../../services/api';

const steps = ['Shipping Information', 'Payment Method', 'Review Order'];

const CheckoutPage = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);
  
  // M-Pesa specific states
  const [mpesaDialogOpen, setMpesaDialogOpen] = useState(false);
  const [checkoutRequestId, setCheckoutRequestId] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [mpesaProcessing, setMpesaProcessing] = useState(false);
  const [mpesaOrderPlaced, setMpesaOrderPlaced] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    address: '',
    city: '',
    postal_code: '',
    country: '',
    payment_method: 'CREDIT_CARD',
    order_notes: '',
    delivery_location: '',
    is_pickup: false,
    delivery_fee: 0
  });

  useEffect(() => {
    const fetchCartAndProfile = async () => {
      try {
        setLoading(true);
        const [cartResponse, profileResponse] = await Promise.all([
          cartAPI.getCart(),
          authAPI.getCurrentUser()
        ]);

        setCart(cartResponse.data.results[0]); // Ensure to set the first cart from results

        const profileData = profileResponse.data;
        setFormData((prevFormData) => ({
          ...prevFormData,
          full_name: `${profileData.first_name} ${profileData.last_name}`,
          email: profileData.email,
          phone_number: profileData.phone_number,
          address: profileData.address
        }));
      } catch (err) {
        setError('Failed to load your cart or profile information. Please try again.');
        console.error('Error fetching cart or profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCartAndProfile();
  }, []);

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: newValue,
      delivery_fee: name === 'is_pickup' && checked ? 0 : 0 // Set delivery fee to 100 if not pickup
    }));
  };

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      if (formData.payment_method === 'Mpesa') {
        handleMpesaPayment();
      } else {
        handlePlaceOrder();
      }
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

  // M-Pesa payment handling
  const handleMpesaPayment = async () => {
    try {
      setMpesaProcessing(true);
      setMpesaDialogOpen(true);
      
      const orderTotal = parseFloat(cart.total_price) + parseFloat(formData.delivery_fee);
      
      // Format the phone number for M-Pesa
      let phoneNumber = formData.phone_number;
      if (!phoneNumber.startsWith('+') && !phoneNumber.startsWith('0') && !phoneNumber.startsWith('254')) {
        phoneNumber = '0' + phoneNumber;
      }
      
      const mpesaPaymentData = {
        phone_number: phoneNumber,
        amount: orderTotal
      };
      
      const response = await orderAPI.initiateMpesaPayment(mpesaPaymentData);
      
      if (response.data.success) {
        setCheckoutRequestId(response.data.checkout_request_id);
        // Poll for payment status
        pollPaymentStatus(response.data.checkout_request_id);
      } else {
        setError(response.data.message || 'M-Pesa payment initiation failed');
        setMpesaProcessing(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while processing M-Pesa payment');
      setMpesaProcessing(false);
    }
  };

  const pollPaymentStatus = async (checkoutId) => {
    let statusInterval;
    let timeoutId;
    
    // Store interval ID so we can clear it properly
    statusInterval = setInterval(async () => {
      try {
        const statusResponse = await orderAPI.queryMpesaStatus({
          checkout_request_id: checkoutId
        });
        
        console.log('M-Pesa polling response:', statusResponse.data);
        
        // Check if we have a valid response with status
        if (statusResponse.data && statusResponse.data.status) {
          const resultCode = statusResponse.data.status.ResultCode;
          
          // Convert string ResultCode to number for comparison
          const resultCodeNum = resultCode !== undefined ? parseInt(resultCode, 10) : null;
          
          if (resultCodeNum === 0) {
            // Payment successful - IMPORTANT: clear both interval and timeout
            clearInterval(statusInterval);
            clearTimeout(timeoutId);
            setPaymentStatus('Success');
            // Place the order after successful payment
            handlePlaceOrder(checkoutId);
          } else if (resultCodeNum === 1032) {
            // Transaction cancelled by user
            clearInterval(statusInterval);
            clearTimeout(timeoutId);
            setPaymentStatus('Cancelled');
            setMpesaProcessing(false);
          } else if (resultCodeNum === 17) {
            // Rule limited
            clearInterval(statusInterval);
            clearTimeout(timeoutId);
            setPaymentStatus('Failed');
            setError('Payment failed due to rule limitation. Please try again after few seconds or choose another payment method.');
            setMpesaProcessing(false);
          } else if (resultCode !== null && resultCode !== undefined && resultCodeNum !== 0) {
            // Any other error code
            clearInterval(statusInterval);
            clearTimeout(timeoutId);
            setPaymentStatus('Failed');
            setMpesaProcessing(false);
          }
          // Continue polling if result code is not available yet
        }
      } catch (err) {
        console.error('Error checking payment status:', err);
        // Don't stop polling on network errors - just log them
      }
    }, 5000);
    
    // Set a maximum time for polling (2 minutes)
    timeoutId = setTimeout(() => {
      clearInterval(statusInterval);
      // Only update state if no other status was set
      if (!paymentStatus || paymentStatus === null) {
        setPaymentStatus('Timeout');
        setMpesaProcessing(false);
      }
    }, 120000);
    
    // Store the interval and timeout IDs for cleanup if component unmounts
    return () => {
      clearInterval(statusInterval);
      clearTimeout(timeoutId);
    };
  };

  const handleCloseMpesaDialog = () => {
    setMpesaDialogOpen(false);
    // Reset payment status if cancelled or failed
    if (paymentStatus === 'Cancelled' || paymentStatus === 'Failed' || paymentStatus === 'Timeout') {
      setPaymentStatus(null);
      setCheckoutRequestId(null);
    }
  };

  const handlePlaceOrder = async (mpesaCheckoutId = null) => {
    try {
      setLoading(true);
      const orderData = {
        ...formData,
        cart_id: cart.id,
        order_total: parseFloat(cart.total_price) + parseFloat(formData.delivery_fee),
        phone_number: formData.phone_number,
      };
      
      // If this is an M-Pesa payment, add the checkout ID
      if (mpesaCheckoutId) {
        orderData.mpesa_checkout_id = mpesaCheckoutId;
        orderData.payment_status = 'COMPLETED'; // Use a valid choice for payment_status
        setMpesaOrderPlaced(true);
        console.log('Placing order with M-Pesa payment:', orderData);
      }
      
      console.log('Placing order with data:', orderData);
      const response = await orderAPI.checkout(orderData);
      console.log('Order placed successfully:', response.data);
      setOrderSuccess(true);
      setOrderId(response.data.id);
      
      // If M-Pesa dialog is open, close it
      if (mpesaDialogOpen) {
        setMpesaDialogOpen(false);
      }
      
      // Clear the form and navigate to order confirmation
      setTimeout(() => {
        navigate(`/order/${response.data.id}`);
      }, 3000);
    } catch (err) {
      console.error('Detailed error placing order:', err.response?.data || err);
      setError('Failed to place your order. Please try again.');
      console.error('Error placing order:', err);
    } finally {
      setLoading(false);
      setMpesaProcessing(false);
    }
  };

  const renderMpesaDialog = () => (
    <Dialog
      open={mpesaDialogOpen}
      onClose={mpesaProcessing || paymentStatus === 'Success' ? undefined : handleCloseMpesaDialog}
    >
      <DialogTitle>M-Pesa Payment</DialogTitle>
      <DialogContent>
        {mpesaProcessing && !paymentStatus && (
          <>
            <DialogContentText>
              Please check your phone and enter your M-Pesa PIN to complete the transaction.
            </DialogContentText>
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <CircularProgress />
            </Box>
            {checkoutRequestId && (
              <Typography variant="body2" color="text.secondary">
                Checkout ID: {checkoutRequestId}
              </Typography>
            )}
          </>
        )}
        
        {paymentStatus === 'Success' && (
          <>
            <DialogContentText>
              Payment successful! Processing your order...
            </DialogContentText>
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <CircularProgress />
            </Box>
          </>
        )}
        
        {paymentStatus === 'Cancelled' && (
          <DialogContentText>
            The payment was cancelled. Please try again or choose another payment method.
          </DialogContentText>
        )}
        
        {paymentStatus === 'Failed' && (
          <DialogContentText>
            The payment failed to process. Please try again or choose another payment method.
          </DialogContentText>
        )}
        
        {paymentStatus === 'Timeout' && (
          <DialogContentText>
            The payment request timed out. Please check your M-Pesa messages to confirm if payment was processed.
          </DialogContentText>
        )}
      </DialogContent>
      <DialogActions>
        {!mpesaProcessing && (
          <Button onClick={handleCloseMpesaDialog}>Close</Button>
        )}
        {(paymentStatus === 'Cancelled' || paymentStatus === 'Failed' || paymentStatus === 'Timeout') && (
          <Button variant="contained" onClick={handleMpesaPayment}>
            Try Again
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );

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
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Delivery Location"
          name="delivery_location"
          value={formData.delivery_location}
          onChange={handleFormChange}
          disabled={formData.is_pickup}
        />
      </Grid>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.is_pickup}
              onChange={handleFormChange}
              name="is_pickup"
              color="primary"
            />
          }
          label="I will pick up the item at the Office/Shop"
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
        <FormControlLabel 
          value="Mpesa" 
          control={<Radio />} 
          label="Mpesa" 
        />
      </RadioGroup>
      
      {formData.payment_method === 'Mpesa' && (
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            You will receive an M-Pesa payment request on your phone number: <strong>{formData.phone_number}</strong>
          </Typography>
        </Alert>
      )}
    </FormControl>
  );

  const renderOrderSummary = () => {
    if (!cart || !cart.items) return <Typography>Loading cart data...</Typography>;
    
    const orderTotal = parseFloat(cart.total_price) + parseFloat(formData.delivery_fee);
    
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
                    Ksh{parseFloat(item.product.discount_price || item.product.price).toFixed(2)}
                  </TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell align="right">Ksh{parseFloat(item.total_price).toFixed(2)}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>
                  Subtotal:
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  Ksh{parseFloat(cart.total_price).toFixed(2)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>
                  Delivery Fee:
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  Ksh{parseFloat(formData.delivery_fee).toFixed(2)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>
                  Order Total:
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  Ksh{orderTotal.toFixed(2)}
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
          {formData.delivery_location && (
            <Typography><strong>Delivery Location:</strong> {formData.delivery_location}</Typography>
          )}
          {formData.is_pickup && (
            <Typography><strong>Pickup:</strong> Yes</Typography>
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
            {formData.payment_method === 'Mpesa' && 'Mpesa'}
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
      
      {/* M-Pesa Dialog */}
      {renderMpesaDialog()}
    </Container>
  );
};

export default CheckoutPage;
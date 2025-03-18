import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import { useSnackbar } from 'notistack';
import ShippingForm from './ShippingForm';
import PaymentForm from './PaymentForm';
import OrderSummary from './OrderSummary';
import MpesaDialog from './MpesaDialog';
import { cartAPI, orderAPI, authAPI } from '../../services/api';
import { deliveryAreas } from '../../services/constants';

const steps = ['Shipping Information', 'Payment Method', 'Review Order'];

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [activeStep, setActiveStep] = useState(0);
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  
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
    payment_method: '',
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
          cartAPI.getCurrentCart(),
          authAPI.getCurrentUser()
        ]);

        setCart(cartResponse.data);
        setUserProfile(profileResponse.data);

        // Prefill form with user profile data
        if (profileResponse.data) {
          // Combine first_name and last_name into full_name
          const fullName = `${profileResponse.data.first_name || ''} ${profileResponse.data.last_name || ''}`.trim();
          
          setFormData(prevData => ({
            ...prevData,
            full_name: fullName || '',
            email: profileResponse.data.email || '',
            phone_number: profileResponse.data.phone_number || '',
            address: profileResponse.data.address || '',
            city: profileResponse.data.city || '',
            postal_code: profileResponse.data.postal_code || '',
            country: profileResponse.data.country || '',
            delivery_location: profileResponse.data.delivery_location || '',
          }));
        }

      } catch (error) {
        console.error('Error fetching cart or profile:', error);
        setError('Failed to load checkout data');
        enqueueSnackbar('Error loading checkout data', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchCartAndProfile();
  }, [enqueueSnackbar]);

  // Add a debug effect to monitor data loading
  useEffect(() => {
    console.log('User Profile:', userProfile);
    console.log('Form Data:', formData);
  }, [userProfile, formData]);

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData(prevFormData => {
      const updates = {
        ...prevFormData,
        [name]: newValue,
      };

      // Handle pickup and delivery location updates
      if (name === 'is_pickup') {
        if (checked) {
          // If pickup is selected, clear delivery location and set fee to 0
          updates.delivery_location = '';
          updates.delivery_fee = 0;
        }
      } else if (name === 'delivery_location') {
        // Only update delivery fee if not pickup
        if (!prevFormData.is_pickup) {
          updates.delivery_fee = findDeliveryFee(value);
        }
      }

      return updates;
    });
  };

  // Add helper function to find delivery fee
  const findDeliveryFee = (locationValue) => {
    for (const [_, areas] of Object.entries(deliveryAreas)) {
      const area = areas.find(area => area.value === locationValue);
      if (area) return area.fee;
    }
    return 0;
  };

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      if (formData.payment_method === 'M-Pesa') {
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
      // Check required shipping fields
      const hasRequiredFields = !!(
        formData.full_name && 
        formData.email && 
        formData.phone_number && 
        formData.address && 
        formData.city && 
        formData.postal_code && 
        formData.country
      );

      // Check either pickup or delivery location is selected
      const hasDeliveryMethod = !!(
        formData.is_pickup || 
        (!formData.is_pickup && formData.delivery_location)
      );

      return hasRequiredFields && hasDeliveryMethod;
    }
    // ... rest of the validation logic
    return true;
  };

  // M-Pesa payment handling
  const handleMpesaPayment = async () => {
    try {
      setMpesaProcessing(true);
      setMpesaDialogOpen(true);
      
      // Calculate total including delivery fee
      const subtotal = cart.items.reduce((total, item) => {
        const itemPrice = parseFloat(item.product.discount_price || item.product.price);
        return total + (itemPrice * item.quantity);
      }, 0);
      
      const orderTotal = subtotal + parseFloat(formData.delivery_fee || 0);
      
      // Format the phone number for M-Pesa
      let phoneNumber = formData.phone_number;
      if (!phoneNumber.startsWith('+') && !phoneNumber.startsWith('0') && !phoneNumber.startsWith('254')) {
        phoneNumber = '0' + phoneNumber;
      }
      
      const mpesaPaymentData = {
        phone_number: phoneNumber,
        amount: orderTotal.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") // Ensure amount is properly formatted
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

      // Validate delivery method
      if (!formData.is_pickup && !formData.delivery_location) {
        enqueueSnackbar('Please select a delivery location or choose pickup option', {
          variant: 'error'
        });
        return;
      }

      // Calculate totals
      const subtotal = cart.items.reduce((total, item) => {
        const itemPrice = parseFloat(item.product.discount_price || item.product.price);
        return total + (itemPrice * item.quantity);
      }, 0);

      const deliveryFee = formData.is_pickup ? 0 : findDeliveryFee(formData.delivery_location);
      const orderTotal = subtotal + deliveryFee;

      const orderData = {
        ...formData,
        cart_id: cart.id,
        subtotal: subtotal.toFixed(2),
        delivery_fee: deliveryFee.toFixed(2),
        order_total: orderTotal.toFixed(2),
        delivery_location: formData.is_pickup ? 'KENCOM' : formData.delivery_location,
        phone_number: formData.phone_number.replace(/\s+/g, ''), // Remove any whitespace
      };

      if (mpesaCheckoutId) {
        orderData.mpesa_checkout_id = mpesaCheckoutId;
        orderData.payment_status = 'PENDING';
      }

      console.log('Sending order data:', orderData);
      const response = await orderAPI.checkout(orderData);
      console.log('Order placed successfully:', response.data);
      
      // Handle success
      setOrderSuccess(true);
      setOrderId(response.data.id);
      
      if (mpesaDialogOpen) {
        setMpesaDialogOpen(false);
      }

      // Navigate to order confirmation
      navigate(`/order/${response.data.id}`);
      
    } catch (err) {
      console.error('Error placing order:', err.response?.data || err);
      const errorMessage = err.response?.data?.delivery_location?.[0] || 
                          err.response?.data?.detail ||
                          'Failed to place order';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Add a useEffect to calculate cart totals
  useEffect(() => {
    if (cart?.items) {
      const subtotal = cart.items.reduce((total, item) => {
        const itemPrice = parseFloat(item.product.discount_price || item.product.price);
        return total + (itemPrice * item.quantity);
      }, 0);
      
      setCart(prevCart => ({
        ...prevCart,
        subtotal: subtotal.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","),
        total_price: (subtotal + parseFloat(formData.delivery_fee || 0)).toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
      }));
    }
  }, [cart?.items, formData.delivery_fee]);

  const renderShippingForm = () => (
    <ShippingForm formData={formData} handleFormChange={handleFormChange} />
  );

  const renderPaymentForm = () => (
    <PaymentForm formData={formData} handleFormChange={handleFormChange} />
  );

  const renderOrderSummary = () => (
    <OrderSummary cart={cart} formData={formData} />
  );

  const renderMpesaDialog = () => (
    <MpesaDialog
      mpesaDialogOpen={mpesaDialogOpen}
      mpesaProcessing={mpesaProcessing}
      paymentStatus={paymentStatus}
      handleCloseMpesaDialog={handleCloseMpesaDialog}
      handleMpesaPayment={handleMpesaPayment}
    />
  );

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
          Redirecting to cart...
        </Typography>
        <CircularProgress size={24} sx={{ mt: 2 }} />
        {setTimeout(() => {
          navigate('/cart');
        }, 3000)}
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
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: '4' }}>
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
import React, { useState, useEffect, useCallback } from 'react';
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
import ReceiptIcon from '@mui/icons-material/Receipt';
import HistoryIcon from '@mui/icons-material/History';

const STEPS = ['Shipping Information', 'Payment Method', 'Review Order'];
const MPESA_POLL_INTERVAL = 5000;
const MPESA_POLL_TIMEOUT = 120000;

// Custom hook for cart calculations
function useCartCalculations(cart, deliveryFee = 0) {
  const [calculations, setCalculations] = useState({
    subtotal: 0,
    orderTotal: 0
  });

  useEffect(() => {
    if (cart?.items) {
      const subtotalValue = cart.items.reduce((total, item) => {
        const itemPrice = parseFloat(item.product.discount_price || item.product.price);
        return total + (itemPrice * item.quantity);
      }, 0);
      
      const deliveryFeeValue = parseFloat(deliveryFee || 0);
      const orderTotalValue = subtotalValue + deliveryFeeValue;
      
      setCalculations({
        subtotal: subtotalValue,
        orderTotal: orderTotalValue
      });
    }
  }, [cart?.items, deliveryFee]);

  return calculations;
}

const initialFormData = {
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
};

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
  const [formData, setFormData] = useState(initialFormData);
  
  // M-Pesa states
  const [mpesaState, setMpesaState] = useState({
    dialogOpen: false,
    checkoutRequestId: null,
    paymentStatus: null,
    processing: false,
    orderPlaced: false
  });

  // Calculate cart totals using custom hook
  const { subtotal, orderTotal } = useCartCalculations(cart, formData.delivery_fee);

  // Fetch cart and user profile data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [cartResponse, profileResponse] = await Promise.all([
          cartAPI.getCurrentCart(),
          authAPI.getCurrentUser()
        ]);

        setCart(cartResponse.data);
        setUserProfile(profileResponse.data);
        
        if (profileResponse.data) {
          prefillFormWithUserData(profileResponse.data);
        }
      } catch (error) {
        console.error('Error fetching checkout data:', error);
        setError('Failed to load checkout data');
        enqueueSnackbar('Error loading checkout data', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [enqueueSnackbar]);

  // Helper function to prefill form with user data
  const prefillFormWithUserData = useCallback((userData) => {
    if (!userData) return;
    
    console.log('Prefilling form with user data:', userData);
    
    const fullName = `${userData.first_name || ''} ${userData.last_name || ''}`.trim();
    
    setFormData(prevData => ({
      ...prevData,
      full_name: fullName || prevData.full_name || '',
      email: userData.email || prevData.email || '',
      phone_number: userData.phone_number || prevData.phone_number || '',
      address: userData.address || prevData.address || '',
      city: userData.city || prevData.city || '',
      postal_code: userData.postal_code || prevData.postal_code || '',
      country: userData.country || prevData.country || '',
      delivery_location: userData.delivery_location || prevData.delivery_location || '',
    }));
  }, []);

  // Handle form field changes
  const handleFormChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData(prevFormData => {
      const updates = { ...prevFormData, [name]: newValue };

      // Handle delivery method updates
      if (name === 'is_pickup') {
        if (checked) {
          updates.delivery_location = '';
          updates.delivery_fee = 0;
        }
      } else if (name === 'delivery_location' && !prevFormData.is_pickup) {
        updates.delivery_fee = findDeliveryFee(value);
      }

      return updates;
    });
  }, []);

  // Find delivery fee based on location
  const findDeliveryFee = useCallback((locationValue) => {
    for (const [_, areas] of Object.entries(deliveryAreas)) {
      const area = areas.find(area => area.value === locationValue);
      if (area) return area.fee;
    }
    return 0;
  }, []);

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (activeStep === STEPS.length - 1) {
      if (formData.payment_method === 'M-Pesa') {
        handleMpesaPayment();
      } else {
        handlePlaceOrder();
      }
    } else {
      setActiveStep(prevStep => prevStep + 1);
    }
  }, [activeStep, formData.payment_method]);

  const handleBack = useCallback(() => {
    setActiveStep(prevStep => prevStep - 1);
  }, []);

  // Validate current step
  const validateStep = useCallback(() => {
    if (activeStep === 0) {
      // Shipping validation
      const requiredFields = [
        formData.full_name,
        formData.email, 
        formData.phone_number,
        formData.address,
        formData.city,
        formData.postal_code,
        formData.country
      ];
      
      const hasRequiredFields = requiredFields.every(field => !!field);
      const hasDeliveryMethod = formData.is_pickup || (!formData.is_pickup && formData.delivery_location);
      
      return hasRequiredFields && hasDeliveryMethod;
    } else if (activeStep === 1) {
      // Payment validation
      return !!formData.payment_method;
    }
    
    return true;
  }, [activeStep, formData]);

  // Place order - Move this function before other functions that use it
  const handlePlaceOrder = useCallback(async (mpesaCheckoutId = null) => {
    try {
      setLoading(true);

      // Retrieve stored checkout form data
      const storedFormData = JSON.parse(sessionStorage.getItem('checkoutFormData'));
      
      if (!storedFormData && mpesaCheckoutId) {
        throw new Error('Checkout form data not found');
      }

      const finalFormData = {
        ...(storedFormData || formData),
        payment_method: 'M-Pesa',
        cart_id: cart?.id,
        subtotal: subtotal.toFixed(2),
        delivery_fee: (formData.is_pickup ? 0 : findDeliveryFee(formData.delivery_location)).toFixed(2),
        order_total: orderTotal.toFixed(2),
        delivery_location: formData.is_pickup ? 'PICKUP' : formData.delivery_location,
        order_notes: formData.order_notes || '',
        special_instructions: formData.special_instructions || '',
        is_pickup: formData.is_pickup,
        // Set payment status to COMPLETED for successful M-Pesa payments
        payment_status: mpesaCheckoutId ? 'COMPLETED' : 'PENDING'
      };

      // Add mpesa checkout details if present
      if (mpesaCheckoutId) {
        finalFormData.mpesa_checkout_id = mpesaCheckoutId;
      }

      console.log('Placing order with data:', finalFormData);

      const response = await orderAPI.checkout(finalFormData);
      
      // Clear stored form data
      sessionStorage.removeItem('checkoutFormData');
      
      // Set order data first
      const newOrderId = response.data.id;
      setOrderId(newOrderId);
      setOrderSuccess(true);
      
      if (mpesaState.dialogOpen) {
        setMpesaState(prev => ({
          ...prev,
          dialogOpen: false
        }));
      }

      enqueueSnackbar('Order placed successfully!', { 
        variant: 'success',
        autoHideDuration: 3000 
      });
      
    } catch (err) {
      console.error('Error placing order:', err);
      const errorMessage = err.response?.data?.detail || 
                          Object.values(err.response?.data || {}).flat().join(', ') ||
                          err.message ||
                          'Failed to place order';
      
      enqueueSnackbar(errorMessage, { variant: 'error' });
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [
    formData,
    userProfile,
    cart,
    subtotal,
    orderTotal,
    findDeliveryFee,
    mpesaState.dialogOpen,
    enqueueSnackbar,
    navigate
  ]);

  // M-Pesa payment handling
  const handleMpesaPayment = useCallback(async () => {
    try {
      // First validate all required fields before initiating payment
      const requiredFields = {
        full_name: formData.full_name || userProfile?.first_name,
        email: formData.email || userProfile?.email,
        phone_number: formData.phone_number || userProfile?.phone_number,
        address: formData.address || userProfile?.address,
        city: formData.city || userProfile?.city,
        postal_code: formData.postal_code || userProfile?.postal_code,
        country: formData.country || userProfile?.country,
      };

      const missingFields = Object.entries(requiredFields)
        .filter(([_, value]) => !value)
        .map(([key]) => key);

      if (missingFields.length > 0) {
        throw new Error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      }

      // Store the validated form data in state for later use
      sessionStorage.setItem('checkoutFormData', JSON.stringify({
        ...formData,
        ...requiredFields
      }));

      setMpesaState(prev => ({
        ...prev,
        processing: true,
        dialogOpen: true,
        paymentStatus: null,
        error: null
      }));
      
      // Format phone number for M-Pesa
      let phoneNumber = formData.phone_number || userProfile?.phone_number;
      if (!phoneNumber.startsWith('+254')) {
        phoneNumber = phoneNumber.replace(/^0+/, '');
        if (!phoneNumber.startsWith('254')) {
          phoneNumber = '254' + phoneNumber;
        }
      }
      
      const mpesaPaymentData = {
        phone_number: phoneNumber,
        amount: orderTotal.toFixed(2),
        cart_id: cart.id,
        delivery_fee: formData.delivery_fee
      };
      
      console.log('Initiating M-Pesa payment with data:', mpesaPaymentData);
      
      const response = await orderAPI.initiateMpesaPayment(mpesaPaymentData);
      
      if (response.data.success) {
        const checkoutId = response.data.checkout_request_id;
        console.log('M-Pesa checkout initiated:', checkoutId);
        
        setMpesaState(prev => ({
          ...prev,
          checkoutRequestId: checkoutId,
          error: null
        }));
        
        return pollMpesaPaymentStatus(checkoutId);
      } else {
        throw new Error(response.data.message || 'M-Pesa payment initiation failed');
      }
    } catch (err) {
      console.error('M-Pesa payment error:', err);
      setError(err.response?.data?.message || err.message || 'Error processing M-Pesa payment');
      setMpesaState(prev => ({
        ...prev,
        processing: false,
        paymentStatus: 'Failed',
        error: err.message
      }));
      enqueueSnackbar(err.message, { variant: 'error' });
    }
  }, [formData, userProfile, orderTotal, cart?.id]);

  // Poll M-Pesa payment status
  const pollMpesaPaymentStatus = useCallback(async (checkoutId) => {
    let statusInterval;
    let timeoutId;
    let attempts = 0;
    const MAX_ATTEMPTS = 24;
    
    const checkStatus = async () => {
      try {
        const statusResponse = await orderAPI.queryMpesaStatus({
          checkout_request_id: checkoutId
        });
        
        if (statusResponse.data?.status) {
          const resultCode = parseInt(statusResponse.data.status.ResultCode, 10);
          
          switch (resultCode) {
            case 0: // Success
              clearInterval(statusInterval);
              clearTimeout(timeoutId);
              
              setMpesaState(prev => ({
                ...prev,
                paymentStatus: 'Success',
                error: null
              }));
              
              // Place order with completed payment status
              return handlePlaceOrder(checkoutId);
              
            case 1032: // Cancelled
              clearInterval(statusInterval);
              clearTimeout(timeoutId);
              
              setMpesaState(prev => ({
                ...prev,
                paymentStatus: 'Cancelled',
                processing: false,
                error: 'Payment was cancelled'
              }));
              break;
              
            case 17: // Failed - Rule limitation
              clearInterval(statusInterval);
              clearTimeout(timeoutId);
              
              setMpesaState(prev => ({
                ...prev,
                paymentStatus: 'Failed',
                processing: false,
                error: 'Payment failed due to rule limitation. Please try again after few seconds.'
              }));
              break;
              
            default:
              attempts++;
              if (attempts >= MAX_ATTEMPTS) {
                clearInterval(statusInterval);
                clearTimeout(timeoutId);
                
                setMpesaState(prev => ({
                  ...prev,
                  paymentStatus: 'Timeout',
                  processing: false,
                  error: 'Payment verification timed out. Please check your M-Pesa messages.'
                }));
              }
          }
        }
      } catch (err) {
        console.error('Error checking payment status:', err);
        attempts++;
        
        if (attempts >= MAX_ATTEMPTS) {
          clearInterval(statusInterval);
          clearTimeout(timeoutId);
          
          setMpesaState(prev => ({
            ...prev,
            paymentStatus: 'Error',
            processing: false,
            error: 'Error verifying payment status'
          }));
        }
      }
    };
    
    // Start polling
    statusInterval = setInterval(checkStatus, MPESA_POLL_INTERVAL);
    
    // Set timeout
    timeoutId = setTimeout(() => {
      clearInterval(statusInterval);
      
      setMpesaState(prev => ({
        ...prev,
        paymentStatus: 'Timeout',
        processing: false,
        error: 'Payment verification timed out. Please check your M-Pesa messages.'
      }));
    }, MPESA_POLL_TIMEOUT);
    
    // Initial check
    await checkStatus();
    
    return () => {
      clearInterval(statusInterval);
      clearTimeout(timeoutId);
    };
  }, [handlePlaceOrder]);

  // Close M-Pesa dialog
  const handleCloseMpesaDialog = useCallback(() => {
    setMpesaState(prev => {
      const updates = {
        ...prev,
        dialogOpen: false
      };
      
      // Reset payment status if cancelled or failed
      if (['Cancelled', 'Failed', 'Timeout'].includes(prev.paymentStatus)) {
        updates.paymentStatus = null;
        updates.checkoutRequestId = null;
      }
      
      return updates;
    });
  }, []);

  // Render functions for each step
  const renderStepContent = useCallback((step) => {
    switch (step) {
      case 0:
        return <ShippingForm formData={formData} handleFormChange={handleFormChange} />;
      case 1:
        return <PaymentForm formData={formData} handleFormChange={handleFormChange} />;
      case 2:
        return <OrderSummary cart={cart} formData={formData} />;
      default:
        return 'Unknown step';
    }
  }, [formData, handleFormChange, cart]);

  // Loading state
  if (loading && !cart) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Error state
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

  // Empty cart state
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

  // Order success state
  if (orderSuccess) {
    return (
      <Container maxWidth="md" sx={{ my: 4 }}>
        <Alert 
          severity="success"
          sx={{ mb: 3 }}
        >
          Your order has been placed successfully! Order #{orderId}
        </Alert>
        
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 3 }}>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => navigate(`/orders/${orderId}`)}
            startIcon={<ReceiptIcon />}
          >
            View Order Details
          </Button>
          <Button 
            variant="outlined"
            onClick={() => navigate('/orders')}
            startIcon={<HistoryIcon />}
          >
            View All Orders
          </Button>
        </Box>

        <Typography variant="body2" color="text.secondary" align="center">
          You will be redirected to your order details in a moment...
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <CircularProgress size={24} />
        </Box>
        {setTimeout(() => {
          navigate(`/orders/${orderId}`);
        }, 3000)}
      </Container>
    );
  }

  // Main checkout UI
  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Checkout
        </Typography>
        
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <Divider sx={{ mb: 4 }} />
        
        <Box>
          {renderStepContent(activeStep)}
          
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
              ) : activeStep === STEPS.length - 1 ? (
                'Place Order'
              ) : (
                'Next'
              )}
            </Button>
          </Box>
        </Box>
      </Paper>
      
      {/* M-Pesa Dialog */}
      <MpesaDialog
        mpesaDialogOpen={mpesaState.dialogOpen}
        mpesaProcessing={mpesaState.processing}
        paymentStatus={mpesaState.paymentStatus}
        handleCloseMpesaDialog={handleCloseMpesaDialog}
        handleMpesaPayment={handleMpesaPayment}
      />
    </Container>
  );
};

export default CheckoutPage;
import React from 'react';
import { 
  Box, 
  Typography, 
  Divider, 
  List,
  ListItem,
  ListItemText,
  Paper
} from '@mui/material';
import { deliveryAreas } from '../../services/constants';

const findDeliveryArea = (locationValue) => {
  for (const [_, areas] of Object.entries(deliveryAreas)) {
    const area = areas.find(area => area.value === locationValue);
    if (area) return area;
  }
  return null;
};

const OrderSummary = ({ cart, formData }) => {
  // Calculate totals with proper number handling
  const calculateTotals = () => {
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
  };

  const cartTotals = calculateTotals();
  const selectedArea = formData.delivery_location ? findDeliveryArea(formData.delivery_location) : null;
  const deliveryFee = parseFloat(selectedArea?.fee || 0);
  const subtotal = parseFloat(cartTotals.subtotal);
  const totalAmount = (subtotal + deliveryFee).toFixed(2);

  if (!cart || !cart.items) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>No items in cart</Typography>
      </Box>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>Order Summary</Typography>
      <Divider sx={{ mb: 2 }} />

      {/* Cart Items */}
      <List disablePadding>
        {cart.items.map((item) => (
          <ListItem key={item.id} sx={{ py: 1, px: 0 }}>
            <ListItemText
              primary={item.product.name}
              secondary={`Quantity: ${item.quantity}`}
            />
            <Typography variant="body2">
              Ksh {(item.quantity * item.product.discount_price).toFixed(2)}
            </Typography>
          </ListItem>
        ))}
      </List>
      
      <Divider sx={{ my: 2 }} />
      
      {/* Subtotal */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography>Subtotal ({cartTotals.totalItems} items):</Typography>
        <Typography>Ksh {subtotal.toFixed(2)}</Typography>
      </Box>
      
      {/* Delivery Fee */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography>
          Delivery Fee ({selectedArea?.label || 'PICK UP AT SHOP'}):
        </Typography>
        <Typography>Ksh {deliveryFee.toFixed(2)}</Typography>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      {/* Total */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Total:</Typography>
        <Typography variant="h6" color="primary">
          Ksh {totalAmount}
        </Typography>
      </Box>

      {/* Delivery Information */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1" gutterBottom>Delivery Information</Typography>
        <Typography variant="body2">{formData.full_name}</Typography>
        <Typography variant="body2">{formData.phone_number}</Typography>
        <Typography variant="body2">{formData.email}</Typography>
        {selectedArea && (
          <>
            <Typography variant="body2">{selectedArea.label}</Typography>
            <Typography variant="body2" color="text.secondary">
              Delivery Fee: Ksh {selectedArea.fee.toFixed(2)}
            </Typography>
          </>
        )}
      </Box>

      {/* Payment Method */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1" gutterBottom>Payment Method</Typography>
        <Typography variant="body2">
          {formData.payment_method || 'Not selected'}
        </Typography>
      </Box>

      {/* Special Instructions */}
      {formData.special_instructions && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Special Instructions
          </Typography>
          <Typography variant="body2">
            {formData.special_instructions}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default OrderSummary;
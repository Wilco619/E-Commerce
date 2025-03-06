import React from 'react';
import { Box, Typography, Divider } from '@mui/material';
import { deliveryAreas } from '../../services/constants';

const findDeliveryArea = (locationValue) => {
  for (const [_, areas] of Object.entries(deliveryAreas)) {
    const area = areas.find(area => area.value === locationValue);
    if (area) return area;
  }
  return null;
};

const OrderSummary = ({ cart, formData }) => {
  const selectedArea = formData.delivery_location ? findDeliveryArea(formData.delivery_location) : null;
  const deliveryFee = selectedArea?.fee || 0;
  const subtotal = parseFloat(cart?.total_price || 0);
  const totalAmount = (subtotal + deliveryFee).toFixed(2);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Order Summary</Typography>
      <Divider sx={{ mb: 2 }} />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography>Subtotal ({cart?.total_items || 0} items):</Typography>
        <Typography>Ksh {subtotal.toFixed(2)}</Typography>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography>Delivery Fee ({selectedArea?.label || 'PICK UP AT SHOP'}):</Typography>
        <Typography>Ksh {deliveryFee.toFixed(2)}</Typography>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Total:</Typography>
        <Typography variant="h6" color="primary">
          Ksh {totalAmount}
        </Typography>
      </Box>

      {selectedArea && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2">Delivery Location:</Typography>
          <Typography>{selectedArea.label}</Typography>
          <Typography variant="body2" color="text.secondary">
            Delivery Fee: Ksh {selectedArea.fee.toFixed(2)}
          </Typography>
        </Box>
      )}

      {formData.special_instructions && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2">Special Instructions:</Typography>
          <Typography>{formData.special_instructions}</Typography>
        </Box>
      )}
    </Box>
  );
};

export default OrderSummary;

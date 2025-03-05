import React from 'react';
import { Box, Typography, Divider } from '@mui/material';

// Define delivery areas and their types
const deliveryAreas = {
  'CBD Areas': [
    { value: 'KENCOM', label: 'Kencom', fee: 150 },
    { value: 'KENYATTA_AVE', label: 'Kenyatta Avenue', fee: 150 },
    { value: 'MOI_AVE', label: 'Moi Avenue', fee: 150 },
    { value: 'TOM_MBOYA', label: 'Tom Mboya Street', fee: 150 },
    { value: 'MAMA_NGINA', label: 'Mama Ngina Street', fee: 150 },
    { value: 'KIMATHI', label: 'Kimathi Street', fee: 150 },
    { value: 'STANDARD_ST', label: 'Standard Street', fee: 150 },
    { value: 'BAZAAR_ST', label: 'Bazaar Street', fee: 150 },
    { value: 'BIASHARA_ST', label: 'Biashara Street', fee: 150 }
  ],
  'Government Areas': [
    { value: 'PARLIAMENT_RD', label: 'Parliament Road', fee: 150 },
    { value: 'HARAMBEE_AVE', label: 'Harambee Avenue', fee: 150 },
    { value: 'WABERA', label: 'Wabera Street', fee: 150 },
    { value: 'CENTRAL_POLICE', label: 'Central Police Station Area', fee: 150 },
    { value: 'PARLIAMENT_BUILDINGS', label: 'Parliament Buildings', fee: 150 },
    { value: 'SUPREME_COURT', label: 'Supreme Court Area', fee: 150 },
    { value: 'CITY_HALL', label: 'Nairobi City Hall', fee: 150 }
  ],
  'Residential Areas': [
    { value: 'KIAMBU', label: 'Kiambu Town', fee: 300 },
    { value: 'RUIRU', label: 'Ruiru', fee: 300 },
    { value: 'THIKA', label: 'Thika', fee: 300 },
    { value: 'LIMURU', label: 'Limuru', fee: 300 },
    { value: 'KIKUYU', label: 'Kikuyu', fee: 300 },
    { value: 'GITHUNGURI', label: 'Githunguri', fee: 300 }
  ],
  'Suburban Areas': [
    { value: 'ATHI_RIVER', label: 'Athi River', fee: 300 },
    { value: 'SYOKIMAU', label: 'Syokimau', fee: 300 },
    { value: 'KITENGELA', label: 'Kitengela', fee: 300 },
    { value: 'ONGATA_RONGAI', label: 'Ongata Rongai', fee: 300 },
    { value: 'KISERIAN', label: 'Kiserian', fee: 300 },
    { value: 'NGONG', label: 'Ngong', fee: 300 }
  ]
};

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
  const totalAmount = (parseFloat(cart?.total_price || 0) + deliveryFee).toFixed(2);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Order Summary</Typography>
      <Divider sx={{ mb: 2 }} />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography>Subtotal ({cart?.total_items || 0} items):</Typography>
        <Typography>Ksh {cart?.total_price || 0}</Typography>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography>Delivery Fee:</Typography>
        <Typography>Ksh {deliveryFee}</Typography>
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

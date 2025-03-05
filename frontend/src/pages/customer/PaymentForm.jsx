import React from 'react';
import { FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, Alert, Typography } from '@mui/material';

const PaymentForm = ({ formData, handleFormChange }) => {
  return (
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
          value="M-Pesa" 
          control={<Radio />} 
          label="M-Pesa" 
        />
      </RadioGroup>
      
      {formData.payment_method === 'M-Pesa' && (
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            You will receive an M-Pesa payment request on your phone number: <strong>{formData.phone_number}</strong>
          </Typography>
        </Alert>
      )}
    </FormControl>
  );
};

export default PaymentForm;

import React from 'react';
import { 
  FormControl, 
  FormLabel, 
  RadioGroup, 
  FormControlLabel, 
  Radio, 
  Alert, 
  Typography, 
  Paper, 
  Box, 
  Divider, 
  useTheme, 
  alpha,
  Zoom
} from '@mui/material';
import PaymentIcon from '@mui/icons-material/Payment';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const PaymentMethodOption = ({ value, label, icon, disabled = false }) => {
  const theme = useTheme();
  
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        mb: 2, 
        border: '1px solid',
        borderColor: theme.palette.divider,
        borderRadius: 1,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          borderColor: theme.palette.primary.main,
          boxShadow: `0 0 0 1px ${alpha(theme.palette.primary.main, 0.2)}`
        }
      }}
    >
      <FormControlLabel
        value={value}
        control={<Radio color="primary" />}
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
            {icon && React.cloneElement(icon, { 
              sx: { 
                mr: 1.5, 
                color: theme.palette.primary.main,
                fontSize: 24
              } 
            })}
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontWeight: 500,
                color: disabled ? theme.palette.text.disabled : 'inherit'
              }}
            >
              {label}
            </Typography>
          </Box>
        }
        sx={{ 
          m: 0, 
          width: '100%', 
          '& .MuiFormControlLabel-label': { width: '100%' } 
        }}
        disabled={disabled}
      />
    </Paper>
  );
};

const PaymentForm = ({ formData, handleFormChange }) => {
  const theme = useTheme();
  
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 3, 
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        borderRadius: 2,
        background: alpha(theme.palette.background.paper, 0.8)
      }}
    >
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h6"
          sx={{
            display: 'flex',
            alignItems: 'center',
            color: theme.palette.primary.main,
            fontWeight: 500,
          }}
        >
          <PaymentIcon sx={{ mr: 1, fontSize: '1.25rem' }} />
          Payment Method
        </Typography>
        <Divider sx={{ mt: 1 }} />
      </Box>
      
      <FormControl component="fieldset" sx={{ width: '100%' }}>
        <RadioGroup
          name="payment_method"
          value={formData.payment_method}
          onChange={handleFormChange}
        >
          {/* Commented out payment methods kept for future implementation */}
          {/* 
          <PaymentMethodOption 
            value="CREDIT_CARD" 
            label="Credit Card"
            icon={<PaymentIcon />}
            disabled={true}
          />
          <PaymentMethodOption 
            value="PAYPAL" 
            label="PayPal"
            icon={<AccountBalanceWalletIcon />}
            disabled={true}
          />
          <PaymentMethodOption 
            value="BANK_TRANSFER" 
            label="Bank Transfer"
            icon={<AccountBalanceWalletIcon />}
            disabled={true}
          /> 
          */}
          <PaymentMethodOption 
            value="M-Pesa" 
            label="M-Pesa"
            icon={<AccountBalanceWalletIcon />}
          />
        </RadioGroup>
        
        <Zoom in={formData.payment_method === 'M-Pesa'} mountOnEnter unmountOnExit>
          <Alert 
            severity="info" 
            variant="outlined"
            icon={<InfoOutlinedIcon />}
            sx={{ 
              mt: 3, 
              borderRadius: 1,
              '& .MuiAlert-icon': {
                color: theme.palette.info.main,
                opacity: 0.9
              }
            }}
          >
            <Typography variant="body2" sx={{ color: theme.palette.info.dark }}>
              You will receive an M-Pesa payment request on your phone number: <strong>{formData.phone_number || '[No phone number provided]'}</strong>
            </Typography>
          </Alert>
        </Zoom>
      </FormControl>
    </Paper>
  );
};

export default PaymentForm;
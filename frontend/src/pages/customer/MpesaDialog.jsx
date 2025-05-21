import React from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogContentText, 
  DialogActions, 
  Button, 
  Box, 
  CircularProgress, 
  Typography, 
  useTheme, 
  alpha, 
  Paper, 
  Divider,
  IconButton
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import TimerOffIcon from '@mui/icons-material/TimerOff';
import CloseIcon from '@mui/icons-material/Close';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import ReplayIcon from '@mui/icons-material/Replay';

// Custom styled progress indicator with text underneath
const PaymentProgressIndicator = ({ color = "primary", text }) => {
  const theme = useTheme();
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      p: 4,
      position: 'relative'
    }}>
      <Box sx={{ position: 'relative' }}>
        <CircularProgress 
          color={color} 
          size={80} 
          thickness={4} 
          sx={{
            boxShadow: `0 0 15px ${alpha(theme.palette.primary.main, 0.2)}`
          }}
        />
        <SmartphoneIcon 
          color={color} 
          sx={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            fontSize: 32
          }} 
        />
      </Box>
      <Typography 
        variant="body1" 
        color="text.secondary" 
        sx={{ 
          mt: 3, 
          textAlign: 'center',
          maxWidth: 250,
          fontWeight: 500
        }}
      >
        {text}
      </Typography>
    </Box>
  );
};

// Custom status component
const PaymentStatus = ({ status }) => {
  const theme = useTheme();
  
  const statusConfig = {
    Success: {
      icon: <CheckCircleOutlineIcon sx={{ fontSize: 64, color: theme.palette.success.main }} />,
      color: theme.palette.success.main,
      bgColor: alpha(theme.palette.success.light, 0.15),
      title: 'Payment Successful!',
      message: 'Your M-PESA payment has been confirmed. We are now processing your order.'
    },
    Cancelled: {
      icon: <CancelOutlinedIcon sx={{ fontSize: 64, color: theme.palette.warning.main }} />,
      color: theme.palette.warning.main,
      bgColor: alpha(theme.palette.warning.light, 0.15),
      title: 'Payment Cancelled',
      message: 'The payment request was cancelled. Please try again or select a different payment method.'
    },
    Failed: {
      icon: <ErrorOutlineIcon sx={{ fontSize: 64, color: theme.palette.error.main }} />,
      color: theme.palette.error.main,
      bgColor: alpha(theme.palette.error.light, 0.15),
      title: 'Payment Failed',
      message: 'We encountered an issue processing your payment. Please check your M-PESA account and try again.'
    },
    Timeout: {
      icon: <TimerOffIcon sx={{ fontSize: 64, color: theme.palette.text.secondary }} />,
      color: theme.palette.text.secondary,
      bgColor: alpha(theme.palette.text.disabled, 0.15),
      title: 'Payment Timeout',
      message: 'The payment request has timed out. Please check your M-PESA messages to confirm if the payment was processed before trying again.'
    }
  };

  const config = statusConfig[status];

  return (
    <Paper 
      elevation={0}
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        p: 3,
        bgcolor: config.bgColor,
        borderRadius: 2,
        my: 2
      }}
    >
      {config.icon}
      <Typography 
        variant="h6" 
        sx={{ 
          mt: 2, 
          color: config.color,
          fontWeight: 600
        }}
      >
        {config.title}
      </Typography>
      <Typography 
        variant="body2" 
        color="text.secondary" 
        sx={{ 
          mt: 1, 
          textAlign: 'center',
          maxWidth: 300
        }}
      >
        {config.message}
      </Typography>
    </Paper>
  );
};

const MpesaDialog = ({ 
  mpesaDialogOpen, 
  mpesaProcessing, 
  paymentStatus, 
  handleCloseMpesaDialog, 
  handleMpesaPayment 
}) => {
  const theme = useTheme();
  
  // Determine if dialog should be closeable
  const isDialogCloseable = !mpesaProcessing && paymentStatus !== 'Success';

  return (
    <Dialog
      open={mpesaDialogOpen}
      onClose={isDialogCloseable ? handleCloseMpesaDialog : undefined}
      PaperProps={{ 
        sx: { 
          borderRadius: 2, 
          maxWidth: 'sm', 
          width: '100%',
          overflow: 'hidden'
        } 
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        bgcolor: alpha(theme.palette.primary.main, 0.08),
        py: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <SmartphoneIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            M-PESA Payment
          </Typography>
        </Box>
        {isDialogCloseable && (
          <IconButton 
            edge="end" 
            color="inherit" 
            onClick={handleCloseMpesaDialog} 
            aria-label="close"
            size="small"
          >
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>
      
      <Divider />
      
      <DialogContent sx={{ px: 3, py: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {mpesaProcessing && !paymentStatus && (
          <PaymentProgressIndicator 
            text="Please check your phone and enter your M-PESA PIN to complete the transaction."
          />
        )}
        
        {paymentStatus === 'Success' && (
          <Box sx={{ width: '100%' }}>
            <PaymentStatus status="Success" />
            
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              mt: 3 
            }}>
              <CircularProgress 
                color="success" 
                size={30} 
                thickness={4} 
                sx={{ mr: 2 }} 
              />
              <Typography variant="body2" sx={{ color: theme.palette.success.dark }}>
                Finalizing your order...
              </Typography>
            </Box>
          </Box>
        )}
        
        {['Cancelled', 'Failed', 'Timeout'].includes(paymentStatus) && (
          <PaymentStatus status={paymentStatus} />
        )}
      </DialogContent>
      
      {(paymentStatus && paymentStatus !== 'Success') && (
        <>
          <Divider />
          <DialogActions sx={{ justifyContent: 'space-between', px: 3, py: 2 }}>
            <Button 
              onClick={handleCloseMpesaDialog}
              sx={{ 
                color: theme.palette.text.secondary,
                fontWeight: 500
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleMpesaPayment}
              startIcon={<ReplayIcon />}
              sx={{ fontWeight: 500 }}
            >
              Try Again
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
};

export default MpesaDialog;
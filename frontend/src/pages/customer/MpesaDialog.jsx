import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Box, CircularProgress } from '@mui/material';

const MpesaDialog = ({ 
  mpesaDialogOpen, 
  mpesaProcessing, 
  paymentStatus, 
  handleCloseMpesaDialog, 
  handleMpesaPayment 
}) => {
  return (
    <Dialog
      open={mpesaDialogOpen}
      onClose={mpesaProcessing || paymentStatus === 'Success' ? undefined : handleCloseMpesaDialog}
    >
      <DialogTitle>M-Pesa Payment</DialogTitle>
      <DialogContent>
        {mpesaProcessing && !paymentStatus && (
          <>
            <DialogContentText sx={{ textAlign: 'center', mb: 3, fontWeight: 500 }}>
              Please check your phone and enter your M-Pesa PIN to complete the transaction.
            </DialogContentText>
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
              <CircularProgress color="primary" size={60} thickness={4} />
            </Box>
          </>
        )}
        
        {paymentStatus === 'Success' && (
          <>
            <DialogContentText sx={{ 
              textAlign: 'center', 
              mb: 3,
              fontWeight: 500,
              color: 'success.main'
            }}>
              Payment successful! Processing your order...
            </DialogContentText>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              my: 3 
            }}>
              <CircularProgress color="success" size={60} thickness={4} />
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
};

export default MpesaDialog;

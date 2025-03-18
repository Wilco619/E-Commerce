import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Divider, 
  Chip, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  TextField,
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  LocalShipping as ShippingIcon, 
  Payment as PaymentIcon, 
  Person as PersonIcon,
  ShoppingCart as CartIcon
} from '@mui/icons-material';
import { orderAPI, adminAPI } from '../../services/api';

const AdminOrderDetail = ({ match }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState({
    order_status: '',
    payment_status: '',
    tracking_number: ''
  });
  const [updating, setUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const orderId = match.params.id;
        const response = await orderAPI.getOrder(orderId);
        setOrder(response.data);
        setStatusUpdate({
          order_status: response.data.order_status,
          payment_status: response.data.payment_status,
          tracking_number: response.data.tracking_number || ''
        });
      } catch (err) {
        setError('Failed to load order details. Please try again later.');
        console.error('Error fetching order:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [match.params.id]);

  const handleStatusDialogOpen = () => {
    setOpenStatusDialog(true);
  };

  const handleStatusDialogClose = () => {
    setOpenStatusDialog(false);
    setUpdateSuccess(false);
  };

  const handleStatusChange = (e) => {
    const { name, value } = e.target;
    setStatusUpdate(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStatusUpdate = async () => {
    try {
      setUpdating(true);
      await adminAPI.updateOrderStatus(order.id, statusUpdate);
      // Update order data with new status
      const response = await orderAPI.getOrder(order.id);
      setOrder(response.data);
      setUpdateSuccess(true);
      setTimeout(() => {
        handleStatusDialogClose();
      }, 1500);
    } catch (err) {
      setError('Failed to update order status. Please try again.');
      console.error('Error updating order status:', err);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'PROCESSING':
        return 'info';
      case 'SHIPPED':
        return 'primary';
      case 'DELIVERED':
        return 'success';
      case 'CANCELLED':
        return 'error';
      case 'COMPLETED':
        return 'success';
      case 'FAILED':
        return 'error';
      case 'REFUNDED':
        return 'secondary';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!order) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Order not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Order #{order.id}</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleStatusDialogOpen}
        >
          Update Status
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Order Status Section */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Order Information</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
                <Chip 
                  label={`Status: ${order.order_status}`}
                  color={getStatusColor(order.order_status)}
                  icon={<ShippingIcon />}
                />
                <Chip 
                  label={`Payment: ${order.payment_status}`}
                  color={getStatusColor(order.payment_status)}
                  icon={<PaymentIcon />}
                />
                <Chip 
                  label={`Method: ${order.payment_method.replace('_', ' ')}`}
                  variant="outlined"
                />
                {order.tracking_number && (
                  <Chip 
                    label={`Tracking: ${order.tracking_number}`}
                    variant="outlined"
                  />
                )}
              </Box>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                Ordered on: {new Date(order.created_at).toLocaleString()}
              </Typography>
              {order.updated_at !== order.created_at && (
                <Typography variant="body2" color="textSecondary">
                  Last updated: {new Date(order.updated_at).toLocaleString()}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Customer Information */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PersonIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Customer Information</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body1" gutterBottom><strong>Name:</strong> {order.full_name}</Typography>
              <Typography variant="body1" gutterBottom><strong>Email:</strong> {order.email}</Typography>
              <Typography variant="body1" gutterBottom><strong>Phone:</strong> {order.phone_number}</Typography>
              <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>Shipping Address</Typography>
              <Typography variant="body1">{order.address}</Typography>
              <Typography variant="body1">{order.city}, {order.postal_code}</Typography>
              <Typography variant="body1">{order.country}</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Order Summary */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CartIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Order Summary</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body1" gutterBottom>
                <strong>Order Total:</strong> Ksh{order.order_total.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Items:</strong> {order.items.reduce((acc, item) => acc + item.quantity, 0)}
              </Typography>
              {order.order_notes && (
                <>
                  <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>Order Notes</Typography>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.100' }}>
                    <Typography variant="body2">{order.order_notes}</Typography>
                  </Paper>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Order Items Table */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Order Items</Typography>
              <TableContainer component={Paper} elevation={0} variant="outlined">
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
                    {order.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell component="th" scope="row">
                          {item.product_name}
                        </TableCell>
                        <TableCell align="right">Ksh{item.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">Ksh{item.total.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} align="right"><strong>Order Total</strong></TableCell>
                      <TableCell align="right"><strong>Ksh{order.order_total.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</strong></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Update Status Dialog */}
      <Dialog open={openStatusDialog} onClose={handleStatusDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Update Order Status</DialogTitle>
        <DialogContent>
          {updateSuccess ? (
            <Alert severity="success" sx={{ mt: 2 }}>
              Order status updated successfully!
            </Alert>
          ) : (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Order Status</InputLabel>
                    <Select
                      name="order_status"
                      value={statusUpdate.order_status}
                      onChange={handleStatusChange}
                      label="Order Status"
                    >
                      <MenuItem value="PENDING">Pending</MenuItem>
                      <MenuItem value="PROCESSING">Processing</MenuItem>
                      <MenuItem value="SHIPPED">Shipped</MenuItem>
                      <MenuItem value="DELIVERED">Delivered</MenuItem>
                      <MenuItem value="CANCELLED">Cancelled</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Payment Status</InputLabel>
                    <Select
                      name="payment_status"
                      value={statusUpdate.payment_status}
                      onChange={handleStatusChange}
                      label="Payment Status"
                    >
                      <MenuItem value="PENDING">Pending</MenuItem>
                      <MenuItem value="COMPLETED">Completed</MenuItem>
                      <MenuItem value="FAILED">Failed</MenuItem>
                      <MenuItem value="REFUNDED">Refunded</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Tracking Number"
                    name="tracking_number"
                    value={statusUpdate.tracking_number}
                    onChange={handleStatusChange}
                    placeholder="Enter tracking number"
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleStatusDialogClose} disabled={updating}>
            Cancel
          </Button>
          <Button 
            onClick={handleStatusUpdate} 
            variant="contained" 
            color="primary"
            disabled={updating || updateSuccess}
            startIcon={updating ? <CircularProgress size={20} /> : null}
          >
            {updating ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminOrderDetail;

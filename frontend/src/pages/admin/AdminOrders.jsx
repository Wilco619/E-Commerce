import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, IconButton, Button,
  Chip, Box, CircularProgress, Collapse, TextField,
  Snackbar, Alert, MenuItem, Select, FormControl, InputLabel,
  Menu, Divider, Grid, TablePagination
} from '@mui/material';
import { 
  MoreVert, ExpandMore, ExpandLess, Search, 
  Refresh, LocalShipping
} from '@mui/icons-material';
import { adminAPI } from '../../services/api';
import moment from 'moment';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [showTrackingInput, setShowTrackingInput] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getAllOrders();
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      showAlert('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPage(0);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(0);
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const toggleOrderDetails = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const handleMenuClick = (event, order) => {
    setAnchorEl(event.currentTarget);
    setSelectedOrder(order);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setShowTrackingInput(false);
  };

  const handleTrackingNumberChange = (e) => {
    setTrackingNumber(e.target.value);
  };

  const updateOrderStatus = async (newStatus) => {
    if (!selectedOrder) return;

    try {
      await adminAPI.updateOrderStatus(selectedOrder.id, { order_status: newStatus });
      
      // Update the order in the local state
      setOrders(orders.map(order => 
        order.id === selectedOrder.id ? { ...order, order_status: newStatus } : order
      ));
      
      showAlert(`Order status updated to ${newStatus}`, 'success');
    } catch (error) {
      console.error('Error updating order status:', error);
      showAlert('Failed to update order status', 'error');
    } finally {
      handleMenuClose();
    }
  };

  const updatePaymentStatus = async (newStatus) => {
    if (!selectedOrder) return;

    try {
      await adminAPI.updateOrderStatus(selectedOrder.id, { payment_status: newStatus });
      
      // Update the order in the local state
      setOrders(orders.map(order => 
        order.id === selectedOrder.id ? { ...order, payment_status: newStatus } : order
      ));
      
      showAlert(`Payment status updated to ${newStatus}`, 'success');
    } catch (error) {
      console.error('Error updating payment status:', error);
      showAlert('Failed to update payment status', 'error');
    } finally {
      handleMenuClose();
    }
  };

  const addTrackingNumber = async () => {
    if (!selectedOrder || !trackingNumber.trim()) return;

    try {
      await adminAPI.updateOrderStatus(selectedOrder.id, { tracking_number: trackingNumber });
      
      // Update the order in the local state
      setOrders(orders.map(order => 
        order.id === selectedOrder.id ? { ...order, tracking_number: trackingNumber } : order
      ));
      
      showAlert('Tracking number added successfully', 'success');
      setTrackingNumber('');
    } catch (error) {
      console.error('Error adding tracking number:', error);
      showAlert('Failed to add tracking number', 'error');
    } finally {
      handleMenuClose();
    }
  };

  const showAlert = (message, severity) => {
    setAlert({ open: true, message, severity });
  };

  const handleAlertClose = () => {
    setAlert({ ...alert, open: false });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'PROCESSING': return 'info';
      case 'SHIPPED': return 'primary';
      case 'DELIVERED': return 'success';
      case 'CANCELLED': return 'error';
      case 'COMPLETED': return 'success';
      case 'FAILED': return 'error';
      case 'REFUNDED': return 'secondary';
      default: return 'default';
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === '' || 
      order.id.toString().includes(searchTerm) ||
      order.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.tracking_number && order.tracking_number.includes(searchTerm));
    
    const matchesStatus = statusFilter === '' || order.order_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Orders Management
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Search orders"
              variant="outlined"
              value={searchTerm}
              onChange={handleSearch}
              InputProps={{
                startAdornment: <Search color="action" sx={{ mr: 1 }} />
              }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Status</InputLabel>
              <Select
                value={statusFilter}
                label="Filter by Status"
                onChange={handleStatusFilterChange}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="PROCESSING">Processing</MenuItem>
                <MenuItem value="SHIPPED">Shipped</MenuItem>
                <MenuItem value="DELIVERED">Delivered</MenuItem>
                <MenuItem value="CANCELLED">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              startIcon={<Refresh />} 
              variant="outlined" 
              onClick={fetchOrders}
              disabled={loading}
            >
              Refresh
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper elevation={3}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" />
                  <TableCell>Order ID</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Payment</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredOrders
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((order) => (
                    <React.Fragment key={order.id}>
                      <TableRow hover>
                        <TableCell padding="checkbox">
                          <IconButton size="small" onClick={() => toggleOrderDetails(order.id)}>
                            {expandedOrderId === order.id ? <ExpandLess /> : <ExpandMore />}
                          </IconButton>
                        </TableCell>
                        <TableCell>#{order.id}</TableCell>
                        <TableCell>{order.full_name}</TableCell>
                        <TableCell>{moment(order.created_at).format('MMM D, YYYY')}</TableCell>
                        <TableCell>${parseFloat(order.order_total).toFixed(2)}</TableCell>
                        <TableCell>
                          <Chip 
                            label={order.order_status} 
                            color={getStatusColor(order.order_status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={order.payment_status} 
                            color={getStatusColor(order.payment_status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton 
                            size="small"
                            onClick={(e) => handleMenuClick(e, order)}
                          >
                            <MoreVert />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={8} style={{ paddingTop: 0, paddingBottom: 0 }}>
                          <Collapse in={expandedOrderId === order.id} timeout="auto" unmountOnExit>
                            <Box p={3}>
                              <Box display="flex" justifyContent="space-between">
                                <Typography variant="h6" gutterBottom component="div">
                                  Order Details
                                </Typography>
                                {order.tracking_number && (
                                  <Typography variant="body2" color="textSecondary">
                                    Tracking: {order.tracking_number}
                                  </Typography>
                                )}
                              </Box>
                              
                              <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                  <Typography variant="subtitle2">Shipping Information</Typography>
                                  <Typography variant="body2">{order.full_name}</Typography>
                                  <Typography variant="body2">{order.address}</Typography>
                                  <Typography variant="body2">{order.city}, {order.postal_code}</Typography>
                                  <Typography variant="body2">{order.country}</Typography>
                                  <Typography variant="body2">{order.phone_number}</Typography>
                                  <Typography variant="body2">{order.email}</Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                  <Typography variant="subtitle2">Order Information</Typography>
                                  <Typography variant="body2">Payment Method: {order.payment_method}</Typography>
                                  <Typography variant="body2">Date: {moment(order.created_at).format('MMMM D, YYYY, h:mm a')}</Typography>
                                  {order.order_notes && (
                                    <>
                                      <Typography variant="subtitle2" sx={{ mt: 1 }}>Order Notes</Typography>
                                      <Typography variant="body2">{order.order_notes}</Typography>
                                    </>
                                  )}
                                </Grid>
                              </Grid>
                              
                              <Typography variant="subtitle1" sx={{ my: 2 }}>Items</Typography>
                              <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
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
                                        <TableCell>{item.product_name}</TableCell>
                                        <TableCell align="right">${parseFloat(item.price).toFixed(2)}</TableCell>
                                        <TableCell align="right">{item.quantity}</TableCell>
                                        <TableCell align="right">${parseFloat(item.total).toFixed(2)}</TableCell>
                                      </TableRow>
                                    ))}
                                    <TableRow>
                                      <TableCell colSpan={3} align="right"><strong>Order Total:</strong></TableCell>
                                      <TableCell align="right"><strong>${parseFloat(order.order_total).toFixed(2)}</strong></TableCell>
                                    </TableRow>
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredOrders.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        </Paper>
      )}

      {/* Status Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <Typography variant="subtitle2" sx={{ px: 2, py: 1 }}>
          Order Status
        </Typography>
        <MenuItem onClick={() => updateOrderStatus('PENDING')}>Set as Pending</MenuItem>
        <MenuItem onClick={() => updateOrderStatus('PROCESSING')}>Set as Processing</MenuItem>
        <MenuItem onClick={() => updateOrderStatus('SHIPPED')}>Set as Shipped</MenuItem>
        <MenuItem onClick={() => updateOrderStatus('DELIVERED')}>Set as Delivered</MenuItem>
        <MenuItem onClick={() => updateOrderStatus('CANCELLED')}>Set as Cancelled</MenuItem>
        
        <Divider sx={{ my: 1 }} />
        
        <Typography variant="subtitle2" sx={{ px: 2, py: 1 }}>
          Payment Status
        </Typography>
        <MenuItem onClick={() => updatePaymentStatus('PENDING')}>Set as Pending</MenuItem>
        <MenuItem onClick={() => updatePaymentStatus('COMPLETED')}>Set as Completed</MenuItem>
        <MenuItem onClick={() => updatePaymentStatus('FAILED')}>Set as Failed</MenuItem>
        <MenuItem onClick={() => updatePaymentStatus('REFUNDED')}>Set as Refunded</MenuItem>
        
        <Divider sx={{ my: 1 }} />
        
        <MenuItem onClick={() => setShowTrackingInput(!showTrackingInput)}>
          <LocalShipping fontSize="small" sx={{ mr: 1 }} />
          Add Tracking Number
        </MenuItem>
        
        {showTrackingInput && (
          <Box sx={{ px: 2, py: 1, width: 300 }}>
            <TextField
              fullWidth
              size="small"
              label="Tracking Number"
              value={trackingNumber}
              onChange={handleTrackingNumberChange}
              variant="outlined"
              sx={{ mb: 1 }}
            />
            <Button 
              fullWidth 
              variant="contained" 
              size="small"
              onClick={addTrackingNumber}
            >
              Save
            </Button>
          </Box>
        )}
      </Menu>

      {/* Alert Snackbar */}
      <Snackbar 
        open={alert.open} 
        autoHideDuration={6000} 
        onClose={handleAlertClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleAlertClose} severity={alert.severity}>
          {alert.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminOrders;

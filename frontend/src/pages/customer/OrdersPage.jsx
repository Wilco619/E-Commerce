import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Container, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Button,
  Box,
  Chip,
  CircularProgress,
  Collapse,
  IconButton,
  Divider,
  Grid,
  Alert
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { orderAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';

// Status chip colors
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

// Order row component with expandable details
const OrderRow = ({ order }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  
  return (
    <>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }} onClick={() => navigate(`/orders/${order.id}`)} style={{ cursor: 'pointer' }}>
        <TableCell>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(!open);
            }}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">
          #{order.id}
        </TableCell>
        <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
        <TableCell align="right">${order.order_total}</TableCell>
        <TableCell align="center">
          <Chip 
            label={order.order_status.replace('_', ' ')} 
            color={getStatusColor(order.order_status)} 
            size="small" 
          />
        </TableCell>
        <TableCell align="center">
          <Chip 
            label={order.payment_status.replace('_', ' ')} 
            color={getStatusColor(order.payment_status)} 
            size="small" 
          />
        </TableCell>
      </TableRow>
      
      {/* Expandable Details */}
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2 }}>
              <Typography variant="h6" gutterBottom component="div">
                Order Details
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Shipping Information</Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="body2" component="p">
                      <strong>Name:</strong> {order.full_name}
                    </Typography>
                    <Typography variant="body2" component="p">
                      <strong>Address:</strong> {order.address}
                    </Typography>
                    <Typography variant="body2" component="p">
                      <strong>City:</strong> {order.city}
                    </Typography>
                    <Typography variant="body2" component="p">
                      <strong>Postal Code:</strong> {order.postal_code}
                    </Typography>
                    <Typography variant="body2" component="p">
                      <strong>Country:</strong> {order.country}
                    </Typography>
                    <Typography variant="body2" component="p">
                      <strong>Phone:</strong> {order.phone_number}
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Order Information</Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="body2" component="p">
                      <strong>Payment Method:</strong> {order.payment_method.replace('_', ' ')}
                    </Typography>
                    <Typography variant="body2" component="p">
                      <strong>Date:</strong> {new Date(order.created_at).toLocaleString()}
                    </Typography>
                    {order.tracking_number && (
                      <Typography variant="body2" component="p">
                        <strong>Tracking Number:</strong> {order.tracking_number}
                      </Typography>
                    )}
                    {order.order_notes && (
                      <Typography variant="body2" component="p">
                        <strong>Order Notes:</strong> {order.order_notes}
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              </Grid>
              
              <Typography variant="subtitle2" sx={{ mt: 2 }}>Items</Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="center">Quantity</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {order.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.product_name}</TableCell>
                        <TableCell align="right">${item.price}</TableCell>
                        <TableCell align="center">{item.quantity}</TableCell>
                        <TableCell align="right">${item.total}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} align="right"><strong>Order Total</strong></TableCell>
                      <TableCell align="right"><strong>${order.order_total}</strong></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderAPI.getOrders();
      setOrders(response.data.results); // Ensure to set the orders from results
      setLoading(false);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load your orders');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <ReceiptIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          My Orders
        </Typography>
      </Box>

      {orders.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell />
                <TableCell>Order #</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="center">Order Status</TableCell>
                <TableCell align="center">Payment Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <OrderRow key={order.id} order={order} />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <LocalShippingIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>You haven't placed any orders yet</Typography>
          <Typography color="textSecondary" paragraph>
            Once you place an order, it will appear here for you to track.
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => navigate('/products')}
            sx={{ mt: 2 }}
          >
            Browse Products
          </Button>
        </Paper>
      )}
    </Container>
  );
};

export default OrdersPage;

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Grid, 
  Divider, 
  Chip, 
  Table,
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  CircularProgress,
  Button,
  Alert
} from '@mui/material';
import { orderAPI } from '../../services/api';

const OrderDetailPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const response = await orderAPI.getOrder(orderId);
        setOrder(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to load order details. Please try again later.');
        console.error('Error fetching order:', err);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'PROCESSING': return 'info';
      case 'SHIPPED': return 'primary';
      case 'DELIVERED': return 'success';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'PENDING': return 'warning';
      case 'FAILED': return 'error';
      case 'REFUNDED': return 'info';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ my: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container maxWidth="md" sx={{ my: 4 }}>
        <Alert severity="info">Order not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1">
            Order #{order.id}
          </Typography>
          <Box>
            <Chip 
              label={`Order: ${order.order_status}`} 
              color={getStatusColor(order.order_status)} 
              sx={{ mr: 1 }}
            />
            <Chip 
              label={`Payment: ${order.payment_status}`} 
              color={getPaymentStatusColor(order.payment_status)}
            />
          </Box>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Shipping Information
              </Typography>
              <Typography><strong>Name:</strong> {order.full_name}</Typography>
              <Typography><strong>Address:</strong> {order.address}</Typography>
              <Typography><strong>City:</strong> {order.city}</Typography>
              <Typography><strong>Postal Code:</strong> {order.postal_code}</Typography>
              <Typography><strong>Country:</strong> {order.country}</Typography>
              <Typography><strong>Phone:</strong> {order.phone_number}</Typography>
              <Typography><strong>Email:</strong> {order.email}</Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Order Information
              </Typography>
              <Typography><strong>Date:</strong> {formatDate(order.created_at)}</Typography>
              <Typography><strong>Payment Method:</strong> {order.payment_method.replace('_', ' ')}</Typography>
              {order.tracking_number && (
                <Typography><strong>Tracking:</strong> {order.tracking_number}</Typography>
              )}
              {order.order_notes && (
                <Typography><strong>Notes:</strong> {order.order_notes}</Typography>
              )}
              <Typography><strong>Last Updated:</strong> {formatDate(order.updated_at)}</Typography>
            </Paper>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Order Items
          </Typography>
          <TableContainer component={Paper} variant="outlined">
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
                    <TableCell>{item.product_name}</TableCell>
                    <TableCell align="right">Ksh{parseFloat(item.price).toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</TableCell>
                    <TableCell align="right">{item.quantity}</TableCell>
                    <TableCell align="right">Ksh{parseFloat(item.total).toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>
                    Order Total:
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    Ksh{parseFloat(order.order_total).toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="outlined" onClick={() => window.print()}>
            Print Order
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default OrderDetailPage;

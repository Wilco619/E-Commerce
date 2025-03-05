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
  TablePagination,
  Button,
  Box,
  Chip,
  CircularProgress,
  Collapse,
  IconButton,
  Divider,
  Grid,
  Alert,
  Card,
  CardContent,
  useTheme,
  useMediaQuery
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ReceiptIcon from '@mui/icons-material/Receipt';
import FilterListIcon from '@mui/icons-material/FilterList';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
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
const OrderRow = ({ order, isEvenRow }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  
  return (
    <>
      <TableRow 
        sx={{ 
          '& > *': { borderBottom: 'unset' },
          backgroundColor: isEvenRow ? 'rgba(0, 0, 0, 0.02)' : 'inherit',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
          }
        }} 
        onClick={() => navigate(`/orders/${order.id}`)} 
        style={{ cursor: 'pointer' }}
      >
        <TableCell>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(!open);
            }}
            sx={{ 
              transition: 'transform 0.3s',
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)'
            }}
          >
            <KeyboardArrowDownIcon />
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row" sx={{ fontWeight: 'medium' }}>
          #{order.id}
        </TableCell>
        <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
        <TableCell align="right" sx={{ fontWeight: 'medium' }}>${order.order_total}</TableCell>
        <TableCell align="center">
          <Chip 
            label={order.order_status.replace('_', ' ')} 
            color={getStatusColor(order.order_status)} 
            size="small"
            sx={{ fontWeight: 'medium' }}
          />
        </TableCell>
        <TableCell align="center">
          <Chip 
            label={order.payment_status.replace('_', ' ')} 
            color={getStatusColor(order.payment_status)} 
            size="small"
            sx={{ fontWeight: 'medium' }}
          />
        </TableCell>
      </TableRow>
      
      {/* Expandable Details */}
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2 }}>
              <Typography variant="h6" gutterBottom component="div" sx={{ color: theme.palette.primary.main }}>
                Order Details
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', color: theme.palette.text.secondary }}>
                    Shipping Information
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <Typography variant="body2" component="p" sx={{ mb: 1 }}>
                      <strong>Name:</strong> {order.full_name}
                    </Typography>
                    <Typography variant="body2" component="p" sx={{ mb: 1 }}>
                      <strong>Address:</strong> {order.address}
                    </Typography>
                    <Typography variant="body2" component="p" sx={{ mb: 1 }}>
                      <strong>City:</strong> {order.city}
                    </Typography>
                    <Typography variant="body2" component="p" sx={{ mb: 1 }}>
                      <strong>Postal Code:</strong> {order.postal_code}
                    </Typography>
                    <Typography variant="body2" component="p" sx={{ mb: 1 }}>
                      <strong>Country:</strong> {order.country}
                    </Typography>
                    <Typography variant="body2" component="p">
                      <strong>Phone:</strong> {order.phone_number}
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', color: theme.palette.text.secondary }}>
                    Order Information
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <Typography variant="body2" component="p" sx={{ mb: 1 }}>
                      <strong>Payment Method:</strong> {order.payment_method.replace('_', ' ')}
                    </Typography>
                    <Typography variant="body2" component="p" sx={{ mb: 1 }}>
                      <strong>Date:</strong> {new Date(order.created_at).toLocaleString()}
                    </Typography>
                    {order.tracking_number && (
                      <Typography variant="body2" component="p" sx={{ mb: 1 }}>
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
              
              <Typography variant="subtitle2" sx={{ mt: 3, mb: 1, fontWeight: 'bold', color: theme.palette.text.secondary }}>
                Items
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <Table size="small">
                  <TableHead sx={{ backgroundColor: 'rgba(0, 0, 0, 0.03)' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Product</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Price</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>Quantity</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {order.items.map((item, index) => (
                      <TableRow key={item.id} sx={{ backgroundColor: index % 2 === 0 ? 'rgba(0, 0, 0, 0.01)' : 'inherit' }}>
                        <TableCell>{item.product_name}</TableCell>
                        <TableCell align="right">${item.price}</TableCell>
                        <TableCell align="center">{item.quantity}</TableCell>
                        <TableCell align="right">${item.total}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}>
                      <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>Order Total</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                        ${order.order_total}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/orders/${order.id}`);
                  }}
                >
                  View Full Details
                </Button>
              </Box>
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
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading) {
    return (
      <Container sx={{ py: 8, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography variant="body1" color="textSecondary">Loading your orders...</Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert 
          severity="error" 
          sx={{ 
            mb: 2,
            borderRadius: 1,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          {error}
        </Alert>
        <Button
          variant="contained"
          onClick={fetchOrders}
        >
          Try Again
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Card 
        sx={{ 
          mb: 4, 
          borderRadius: 2,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <ReceiptIcon sx={{ mr: 1, color: 'primary.main', fontSize: 28 }} />
            <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
              My Orders
            </Typography>
          </Box>
          <Typography variant="body2" color="textSecondary">
            View and manage all your orders in one place
          </Typography>
        </CardContent>
      </Card>

      {orders.length > 0 ? (
        <Card sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1.5, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
              {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
            </Typography>
            <Button 
              startIcon={<FilterListIcon />}
              size="small"
              sx={{ display: { xs: 'none', sm: 'flex' } }}
            >
              Filter
            </Button>
          </Box>
          
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: '48px', backgroundColor: theme.palette.background.paper }} />
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: theme.palette.background.paper }}>
                    Order #
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: theme.palette.background.paper }}>
                    Date
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', backgroundColor: theme.palette.background.paper }}>
                    Total
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: theme.palette.background.paper }}>
                    Order Status
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: theme.palette.background.paper }}>
                    Payment Status
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((order, index) => (
                    <OrderRow key={order.id} order={order} isEvenRow={index % 2 === 0} />
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            component="div"
            count={orders.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25]}
            labelRowsPerPage={isMobile ? '' : 'Rows per page:'}
          />
        </Card>
      ) : (
        <Card sx={{ p: 4, textAlign: 'center', borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <LocalShippingIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium' }}>
            You haven't placed any orders yet
          </Typography>
          <Typography color="textSecondary" paragraph>
            Once you place an order, it will appear here for you to track.
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => navigate('/products')}
            sx={{ mt: 2 }}
            startIcon={<ShoppingCartIcon />}
          >
            Browse Products
          </Button>
        </Card>
      )}
    </Container>
  );
};

export default OrdersPage;
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Paper, 
  Container,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  CircularProgress,
  Alert,
  Button
} from '@mui/material';
import { 
  PieChart as PieChartIcon, 
  ShoppingCart as ShoppingCartIcon,
  Inventory as InventoryIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { adminAPI } from '../../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalProducts: 0,
    lowStockProducts: 0,
    totalRevenue: 0
  });
  
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data } = await adminAPI.getDashboardData();
          setStats({
          totalOrders: data.stats.totalOrders || 0,
          pendingOrders: data.stats.pendingOrders || 0,
          totalProducts: data.stats.totalProducts || 0,
          lowStockProducts: data.stats.lowStockProducts || 0,
          totalRevenue: data.stats.totalRevenue || 0
        });
        setRecentOrders(Array.isArray(data.recentOrders) ? data.recentOrders : []);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Dashboard
        </Typography>
        
        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <ShoppingCartIcon color="primary" />
                <Typography variant="h5" component="div">
                  {stats.totalOrders}
                </Typography>
                <Typography color="text.secondary">
                  Total Orders
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <InventoryIcon color="primary" />
                <Typography variant="h5" component="div">
                  {stats.totalProducts}
                </Typography>
                <Typography color="text.secondary">
                  Products
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <MoneyIcon color="primary" />
                <Typography variant="h5" component="div">
                  Ksh{stats.totalRevenue.toFixed(2)}
                </Typography>
                <Typography color="text.secondary">
                  Revenue
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <PeopleIcon color="primary" />
                <Typography variant="h5" component="div">
                  {stats.pendingOrders}
                </Typography>
                <Typography color="text.secondary">
                  Pending Orders
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        {/* Recent Orders and Low Stock Warning */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Recent Orders
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {recentOrders.length > 0 ? (
                <List>
                  {recentOrders.map((order) => (
                    <ListItem key={order.id} divider>
                      <ListItemText
                        primary={`Order #${order.id} - ${order.full_name}`}
                        secondary={`${new Date(order.created_at).toLocaleDateString()} | $${parseFloat(order.order_total).toFixed(2)} | Status: ${order.order_status}`}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography>No recent orders found.</Typography>
              )}
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Inventory Alerts
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {stats.lowStockProducts > 0 ? (
                <Box>
                  <Typography color="error" sx={{ mb: 2 }}>
                    {stats.lowStockProducts} products with low stock!
                  </Typography>
                  <ListItemButton component="a" href="/admin/products">
                    <ListItemIcon>
                      <InventoryIcon />
                    </ListItemIcon>
                    <ListItemText primary="View Inventory" />
                  </ListItemButton>
                </Box>
              ) : (
                <Typography color="success.main">
                  All products are well-stocked.
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
        <Box sx={{ mt: 4 }}>
          <Button
            component={RouterLink}
            to="/admin/products/new"
            variant="contained"
            color="primary"
            sx={{ mr: 2 }}
          >
            Add New Product
          </Button>
          <Button
            component={RouterLink}
            to="/admin/categories/new"
            variant="contained"
            color="secondary"
          >
            Add New Category
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default AdminDashboard;

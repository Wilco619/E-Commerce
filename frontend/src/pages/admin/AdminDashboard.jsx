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
  ListItemButton
} from '@mui/material';
import { 
  PieChart as PieChartIcon, 
  ShoppingCart as ShoppingCartIcon,
  Inventory as InventoryIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { adminAPI, orderAPI, productsAPI } from '../../services/api';

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
        setLoading(true);
        
        // Fetch orders
        const ordersResponse = await orderAPI.getOrders();
        const orders = ordersResponse.data;
        
        // Fetch products
        const productsResponse = await productsAPI.getProducts();
        const products = productsResponse.data;
        
        // Calculate dashboard stats
        const pendingOrders = orders.filter(order => 
          order.order_status === 'PENDING' || order.order_status === 'PROCESSING'
        );
        
        const lowStockProducts = products.filter(product => 
          product.stock < 10 && product.is_available
        );
        
        const totalRevenue = orders
          .filter(order => order.payment_status === 'COMPLETED')
          .reduce((sum, order) => sum + parseFloat(order.order_total), 0);
        
        setStats({
          totalOrders: orders.length,
          pendingOrders: pendingOrders.length,
          totalProducts: products.length,
          lowStockProducts: lowStockProducts.length,
          totalRevenue: totalRevenue
        });
        
        // Get recent orders
        setRecentOrders(orders.slice(0, 5));
        setLoading(false);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data. Please try again.");
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  if (loading) return <Typography>Loading dashboard...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;
  
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
                  ${stats.totalRevenue.toFixed(2)}
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
      </Box>
    </Container>
  );
};

export default AdminDashboard;

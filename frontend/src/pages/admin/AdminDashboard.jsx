import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Container, 
  Alert, 
  CircularProgress, 
  Tabs, 
  Tab, 
  Paper,
  Chip,
  Divider,
  Stack
} from '@mui/material';
import { 
  TrendingUp as TrendingUpIcon, 
  TrendingDown as TrendingDownIcon,
  ShoppingCart as ShoppingCartIcon,
  AttachMoney as AttachMoneyIcon,
  Pending as PendingIcon,
  Inventory as InventoryIcon
} from '@mui/icons-material';
import StatsCard from './StatsCard.jsx';
import TimeRangeSelector from './TimeRangeSelector.jsx';
import SalesOverview from './SalesOverview.jsx';
import CategoryDistribution from './CategoryDistribution.jsx';
import ProductPerformance from './ProductPerformance.jsx';
import { adminAPI } from '../../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState({});
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('week');
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data } = await adminAPI.getDashboardData();
        setStats(data.stats);
        setRecentOrders(data.recentOrders || []);
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const renderGrowthIndicator = (growth) => {
    const isPositive = growth >= 0;
    return (
      <Chip
        icon={isPositive ? <TrendingUpIcon color="success" /> : <TrendingDownIcon color="error" />}
        label={`${Math.abs(growth)}%`}
        color={isPositive ? 'success' : 'error'}
        variant="outlined"
        size="small"
      />
    );
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl">
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4, mb: 8 }}>
        <Typography variant="h4" component="h1" fontWeight="bold" sx={{ mb: 3 }}>
          Admin Dashboard
        </Typography>

        {/* Enhanced Overview Section */}
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Overview</Typography>
            <TimeRangeSelector timeRange={timeRange} setTimeRange={setTimeRange} />
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 2, 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between' 
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" color="text.secondary">Total Orders</Typography>
                  <ShoppingCartIcon color="primary" />
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {stats.totalOrders}
                  </Typography>
                  {renderGrowthIndicator(stats.orderGrowth)}
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 2, 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between' 
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" color="text.secondary">Total Revenue</Typography>
                  {/* <AttachMoneyIcon color="success" /> */}
                  Ksh
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    Ksh{stats.totalRevenue.toLocaleString()}
                  </Typography>
                  {renderGrowthIndicator(stats.revenueGrowth)}
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 2, 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between' 
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" color="text.secondary">Pending Orders</Typography>
                  <PendingIcon color="warning" />
                </Box>
                <Typography variant="h5" fontWeight="bold">
                  {stats.pendingOrders}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 2, 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between' 
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" color="text.secondary">Total Products</Typography>
                  <InventoryIcon color="info" />
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {stats.totalProducts}
                  </Typography>
                  {stats.lowStockProducts > 0 && (
                    <Chip 
                      label={`${stats.lowStockProducts} Low Stock`} 
                      color="warning" 
                      size="small" 
                      variant="outlined" 
                    />
                  )}
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Paper>

        {/* Tabbed Sections */}
        <Paper elevation={3} sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab label="Sales" />
            <Tab label="Categories" />
            <Tab label="Products" />
          </Tabs>
        </Paper>

        {/* Conditional Rendering of Tabs */}
        {activeTab === 0 && <SalesOverview timeRange={timeRange} />}
        {activeTab === 1 && <CategoryDistribution />}
        {activeTab === 2 && <ProductPerformance />}
      </Box>
    </Container>
  );
};

export default AdminDashboard;

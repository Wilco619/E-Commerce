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
  ListItemText,
  ListItemIcon,
  ListItemButton,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Tooltip,
  Tab,
  Tabs,
  Menu,
  MenuItem,
  Avatar,
  useTheme,
  Badge
} from '@mui/material';
import { 
  ShoppingCart as ShoppingCartIcon, 
  Inventory as InventoryIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  CalendarToday as CalendarIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  MoreVert as MoreVertIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Warning as WarningIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Helper function to format currency
const formatCurrency = (amount) => {
  return `Ksh${parseFloat(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const AdminDashboard = () => {
  const theme = useTheme();
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalProducts: 0,
    lowStockProducts: 0,
    totalRevenue: 0,
    orderGrowth: 5.2,
    revenueGrowth: 7.8,
    topSellingProducts: [],
    customerGrowth: 12.3
  });
  
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [timeRange, setTimeRange] = useState('week');
  const [anchorEl, setAnchorEl] = useState(null);

  // Sample data for charts
  const [salesData, setSalesData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [productPerformance, setProductPerformance] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data } = await adminAPI.getDashboardData();
        setStats({
          totalOrders: data.stats.totalOrders || 0,
          pendingOrders: data.stats.pendingOrders || 0,
          totalProducts: data.stats.totalProducts || 0,
          lowStockProducts: data.stats.lowStockProducts || 0,
          totalRevenue: data.stats.totalRevenue || 0,
          orderGrowth: data.stats.orderGrowth || 5.2,
          revenueGrowth: data.stats.revenueGrowth || 7.8,
          customerGrowth: data.stats.customerGrowth || 12.3,
          topSellingProducts: data.stats.topSellingProducts || []
        });
        setRecentOrders(Array.isArray(data.recentOrders) ? data.recentOrders : []);
        
        // Sample data for charts (in a real app, this would come from the API)
        setSalesData([
          { name: 'Jan', orders: 400, revenue: 24000 },
          { name: 'Feb', orders: 300, revenue: 18500 },
          { name: 'Mar', orders: 500, revenue: 31000 },
          { name: 'Apr', orders: 450, revenue: 28000 },
          { name: 'May', orders: 470, revenue: 29500 },
          { name: 'Jun', orders: 600, revenue: 37000 },
        ]);
        
        setCategoryData([
          { name: 'Electronics', value: 35 },
          { name: 'Clothing', value: 25 },
          { name: 'Home', value: 20 },
          { name: 'Books', value: 15 },
          { name: 'Other', value: 5 },
        ]);
        
        setProductPerformance([
          { name: 'Product A', sales: 120, profit: 1800, returns: 5 },
          { name: 'Product B', sales: 95, profit: 2200, returns: 2 },
          { name: 'Product C', sales: 86, profit: 1100, returns: 8 },
          { name: 'Product D', sales: 79, profit: 950, returns: 3 },
          { name: 'Product E', sales: 65, profit: 780, returns: 1 },
        ]);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    // Re-fetch data
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleTimeRangeMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleTimeRangeMenuClose = () => {
    setAnchorEl(null);
  };

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
    setAnchorEl(null);
    // In a real app, you would fetch new data based on the selected time range
  };

  const COLORS = [
    theme.palette.primary.main, 
    theme.palette.secondary.main, 
    theme.palette.success.main, 
    theme.palette.warning.main, 
    theme.palette.error.main
  ];

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
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Admin Dashboard
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
              <Button
                variant="outlined"
                startIcon={<CalendarIcon />}
                onClick={handleTimeRangeMenuOpen}
                sx={{ textTransform: 'none' }}
              >
                {timeRange === 'week' ? 'This Week' : timeRange === 'month' ? 'This Month' : 'This Year'}
              </Button>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleTimeRangeMenuClose}
              >
                <MenuItem onClick={() => handleTimeRangeChange('week')}>This Week</MenuItem>
                <MenuItem onClick={() => handleTimeRangeChange('month')}>This Month</MenuItem>
                <MenuItem onClick={() => handleTimeRangeChange('year')}>This Year</MenuItem>
                <MenuItem onClick={() => handleTimeRangeChange('custom')}>Custom Range</MenuItem>
              </Menu>
            </Box>
            
            <Tooltip title="Refresh Data">
              <IconButton onClick={handleRefresh} color="primary">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Notifications">
              <IconButton color="default">
                <Badge badgeContent={4} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Settings">
              <IconButton color="default">
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', boxShadow: 3, borderRadius: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography color="text.secondary" variant="body2" gutterBottom>
                      Total Orders
                    </Typography>
                    <Typography variant="h4" component="div" fontWeight="bold">
                      {stats.totalOrders.toLocaleString()}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      {stats.orderGrowth > 0 ? (
                        <ArrowUpwardIcon fontSize="small" color="success" />
                      ) : (
                        <ArrowDownwardIcon fontSize="small" color="error" />
                      )}
                      <Typography variant="body2" color={stats.orderGrowth > 0 ? "success.main" : "error.main"} sx={{ ml: 0.5 }}>
                        {Math.abs(stats.orderGrowth)}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                        vs last {timeRange}
                      </Typography>
                    </Box>
                  </Box>
                  <Avatar sx={{ bgcolor: theme.palette.primary.light, height: 56, width: 56 }}>
                    <ShoppingCartIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', boxShadow: 3, borderRadius: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography color="text.secondary" variant="body2" gutterBottom>
                      Total Revenue
                    </Typography>
                    <Typography variant="h4" component="div" fontWeight="bold">
                      {formatCurrency(stats.totalRevenue)}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      {stats.revenueGrowth > 0 ? (
                        <ArrowUpwardIcon fontSize="small" color="success" />
                      ) : (
                        <ArrowDownwardIcon fontSize="small" color="error" />
                      )}
                      <Typography variant="body2" color={stats.revenueGrowth > 0 ? "success.main" : "error.main"} sx={{ ml: 0.5 }}>
                        {Math.abs(stats.revenueGrowth)}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                        vs last {timeRange}
                      </Typography>
                    </Box>
                  </Box>
                  <Avatar sx={{ bgcolor: theme.palette.success.light, height: 56, width: 56 }}>
                    <MoneyIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', boxShadow: 3, borderRadius: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography color="text.secondary" variant="body2" gutterBottom>
                      Pending Orders
                    </Typography>
                    <Typography variant="h4" component="div" fontWeight="bold">
                      {stats.pendingOrders.toLocaleString()}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <Typography variant="body2" color={stats.pendingOrders > 10 ? "warning.main" : "success.main"}>
                        {stats.pendingOrders > 10 ? "Needs attention" : "All good"}
                      </Typography>
                    </Box>
                  </Box>
                  <Avatar sx={{ bgcolor: theme.palette.warning.light, height: 56, width: 56 }}>
                    <ShoppingCartIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', boxShadow: 3, borderRadius: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography color="text.secondary" variant="body2" gutterBottom>
                      Products
                    </Typography>
                    <Typography variant="h4" component="div" fontWeight="bold">
                      {stats.totalProducts.toLocaleString()}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <Typography variant="body2" color={stats.lowStockProducts > 0 ? "error.main" : "success.main"}>
                        {stats.lowStockProducts > 0 ? `${stats.lowStockProducts} low stock` : "Well stocked"}
                      </Typography>
                    </Box>
                  </Box>
                  <Avatar sx={{ bgcolor: theme.palette.secondary.light, height: 56, width: 56 }}>
                    <InventoryIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        {/* Tabs for different chart views */}
        <Box sx={{ width: '100%', mb: 3 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            textColor="primary"
            indicatorColor="primary"
            variant="fullWidth"
            sx={{ 
              borderBottom: 1, 
              borderColor: 'divider',
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 'medium',
              }
            }}
          >
            <Tab icon={<BarChartIcon />} iconPosition="start" label="Sales Overview" />
            <Tab icon={<PieChartIcon />} iconPosition="start" label="Category Distribution" />
            <Tab icon={<TimelineIcon />} iconPosition="start" label="Product Performance" />
          </Tabs>
        </Box>
        
        {/* Tab Panel Contents */}
        <Box sx={{ mb: 4 }}>
          {/* Sales Overview Tab */}
          {tabValue === 0 && (
            <Paper sx={{ p: 3, boxShadow: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                Sales & Revenue Overview
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Performance metrics for {timeRange === 'week' ? 'this week' : timeRange === 'month' ? 'this month' : 'this year'}
              </Typography>
              <Box sx={{ height: 350, mt: 3 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={salesData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" stroke={theme.palette.primary.main} />
                    <YAxis yAxisId="right" orientation="right" stroke={theme.palette.success.main} />
                    <RechartsTooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="orders" name="Orders" fill={theme.palette.primary.main} />
                    <Bar yAxisId="right" dataKey="revenue" name="Revenue (Ksh)" fill={theme.palette.success.main} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          )}
          
          {/* Category Distribution Tab */}
          {tabValue === 1 && (
            <Paper sx={{ p: 3, boxShadow: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                Sales by Category
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Distribution of sales across product categories
              </Typography>
              <Box sx={{ height: 350, mt: 3, display: 'flex' }}>
                <ResponsiveContainer width="50%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
                <Box sx={{ width: '50%', p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>Category Insights</Typography>
                  <List>
                    {categoryData.map((category, index) => (
                      <ListItem key={category.name} disableGutters>
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          <Box 
                            sx={{ 
                              width: 12, 
                              height: 12, 
                              borderRadius: '50%', 
                              bgcolor: COLORS[index % COLORS.length],
                              mr: 1.5
                            }} 
                          />
                          <ListItemText 
                            primary={category.name} 
                            secondary={`${category.value}% of total sales`} 
                            primaryTypographyProps={{ variant: 'body2' }}
                            secondaryTypographyProps={{ variant: 'caption' }}
                          />
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </Box>
            </Paper>
          )}
          
          {/* Product Performance Tab */}
          {tabValue === 2 && (
            <Paper sx={{ p: 3, boxShadow: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                Product Performance
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Sales, profit, and returns for top products
              </Typography>
              <Box sx={{ height: 350, mt: 3 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={productPerformance}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" stroke={theme.palette.primary.main} />
                    <YAxis yAxisId="right" orientation="right" stroke={theme.palette.success.main} />
                    <RechartsTooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="sales" name="Sales" stroke={theme.palette.primary.main} />
                    <Line yAxisId="right" type="monotone" dataKey="profit" name="Profit (Ksh)" stroke={theme.palette.success.main} />
                    <Line yAxisId="right" type="monotone" dataKey="returns" name="Returns" stroke={theme.palette.error.main} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          )}
        </Box>
        
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

import React, { useState, useEffect } from 'react';
import {  useNavigate } from 'react-router-dom';
import { Grid, Container,MenuItem,
  ListItemIcon,
  ListItemText,Typography,Divider } from '@mui/material';
import {Dashboard,
    Category,
    Inventory,
    Receipt,
  } from '@mui/icons-material';
import { adminAPI } from '../../services/api';
import SalesOverview from './SalesOverview';
import ProductPerformance from './ProductPerformance';
import CategoryDistribution from './CategoryDistribution';
import StatsCard from './StatsCard';
import { useAuth } from '../../authentication/AuthContext';

const AdminDashboard = () => {
  const { isAdmin, user } = useAuth();
  
  useEffect(() => {
    console.log('Admin Dashboard - Auth state:', { isAdmin, user });
  }, [isAdmin, user]);

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    sales_overview: [],
    product_performance: [],
    category_distribution: []
  });
  const navigate = useNavigate();

  // Add stats state
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    lowStockProducts: 0,
    growthRate: 0,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await adminAPI.getDashboardData();
        setDashboardData(response.data);
        
        // Update stats
        setStats({
          totalOrders: response.data.total_orders || 0,
          totalRevenue: response.data.total_revenue || 0,
          totalProducts: response.data.total_products || 0,
          lowStockProducts: response.data.low_stock_products || 0,
          growthRate: response.data.growth_rate || 0,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" fontWeight="bold" sx={{ mb: 3 }}>
          Admin Dashboard
        </Typography>
        <>
          <MenuItem 
            onClick={() => navigate('/admin')}
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'flex-start',
              padding: '10px 16px'
            }}
          >
            <ListItemIcon>
              <Dashboard fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Admin Dashboard" />
          </MenuItem>
          <Divider />
          <MenuItem 
            onClick={() => navigate('/admin/products/new')}
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'flex-start',
              padding: '10px 16px'
            }}
          >
            <ListItemIcon>
              <Inventory fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Manage Products" />
          </MenuItem>
          <MenuItem 
            onClick={() => navigate('/admin/categories/new')}
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'flex-start',
              padding: '10px 16px'
            }}
          >
            <ListItemIcon>
              <Category fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Manage Categories" />
          </MenuItem>
          <MenuItem 
            onClick={() => navigate('/admin/orders')}
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'flex-start',
              padding: '10px 16px'
            }}
          >
            <ListItemIcon>
              <Receipt fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Manage Orders" />
          </MenuItem>
        </>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Total Orders"
              value={stats.totalOrders}
              growth={stats.growthRate}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Revenue"
              value={`KES ${stats.totalRevenue.toLocaleString()}`}
              growth={stats.growthRate}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Products"
              value={stats.totalProducts}
              lowStock={stats.lowStockProducts}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Growth Rate"
              value={`${stats.growthRate}%`}
              growth={stats.growthRate}
            />
          </Grid>
        </Grid>

        <StatsCard/>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <SalesOverview data={dashboardData.sales_overview} loading={loading} />
        </Grid>
        <Grid item xs={12} md={6}>
          <ProductPerformance data={dashboardData.product_performance} loading={loading} />
        </Grid>
        <Grid item xs={12} md={6}>
          <CategoryDistribution 
            data={dashboardData.category_distribution || []} 
            loading={loading}
          />
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdminDashboard;
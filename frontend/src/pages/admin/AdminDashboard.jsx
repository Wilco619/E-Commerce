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

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    sales_overview: [],
    product_performance: [],
    category_distribution: []
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await adminAPI.getDashboardData();
        setDashboardData(response.data);
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
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <SalesOverview data={dashboardData.sales_overview} loading={loading} />
        </Grid>
        <Grid item xs={12} md={6}>
          <ProductPerformance data={dashboardData.product_performance} loading={loading} />
        </Grid>
        <Grid item xs={12} md={6}>
          <CategoryDistribution data={dashboardData.category_distribution} loading={loading} />
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdminDashboard;
import React from 'react';
import { 
  Box, 
  Paper, 
  Typography 
} from '@mui/material';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

const SalesOverview = ({ timeRange }) => {
  const salesData = [
    { name: 'Jan', orders: 400, revenue: 24000 },
    { name: 'Feb', orders: 300, revenue: 18500 },
    { name: 'Mar', orders: 500, revenue: 31000 },
    { name: 'Apr', orders: 450, revenue: 28000 },
    { name: 'May', orders: 470, revenue: 29500 },
    { name: 'Jun', orders: 600, revenue: 37000 },
  ];

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Paper 
          elevation={3} 
          sx={{ 
            p: 2, 
            borderRadius: 2 
          }}
        >
          <Typography variant="subtitle2" color="primary">
            {label}
          </Typography>
          {payload.map((entry) => (
            <Typography 
              key={entry.name} 
              variant="body2" 
              color={entry.color}
            >
              {entry.name}: {entry.value}
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };

  return (
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
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              yAxisId="left"
              dataKey="orders" 
              fill="#8884d8" 
              name="Orders"
            />
            <Bar 
              yAxisId="right"
              dataKey="revenue" 
              fill="#82ca9d" 
              name="Revenue ($)"
            />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default SalesOverview;
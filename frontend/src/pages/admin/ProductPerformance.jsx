import React from 'react';
import { 
  Box, 
  Paper, 
  Typography 
} from '@mui/material';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

const ProductPerformance = ({ data }) => {
  if (!data) return null;

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
        Product Performance
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Sales, profit, and returns for top products
      </Typography>
      <Box sx={{ height: 350, mt: 3 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
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
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="sales" 
              stroke="#8884d8" 
              activeDot={{ r: 8 }} 
            />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="profit" 
              stroke="#82ca9d" 
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="returns" 
              stroke="#ffc658" 
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default ProductPerformance;
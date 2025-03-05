import React from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid 
} from '@mui/material';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const CategoryDistribution = () => {
  const categoryData = [
    { name: 'Electronics', value: 35 },
    { name: 'Clothing', value: 25 },
    { name: 'Home', value: 20 },
    { name: 'Books', value: 15 },
    { name: 'Other', value: 5 },
  ];

  const getColorForCategory = (categoryName) => {
    const colorMap = {
      'Electronics': '#3f51b5',
      'Clothing': '#f50057',
      'Home': '#4caf50',
      'Books': '#ff9800',
      'Other': '#9c27b0'
    };
    return colorMap[categoryName] || '#607d8b';
  };

  // Custom tooltip for the pie chart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <Paper 
          elevation={3} 
          sx={{ 
            p: 2, 
            borderRadius: 2 
          }}
        >
          <Typography variant="body2" color="primary">
            {data.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {data.value}% of Total Sales
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  return (
    <Paper sx={{ 
      p: 3, 
      boxShadow: 3, 
      borderRadius: 2 
    }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={4}>
          <Box sx={{ pl: 2 }}>
            <Typography variant="h6" gutterBottom>
              Sales by Category
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Distribution of sales across product categories
            </Typography>
            <Box sx={{ mt: 2 }}>
              {categoryData.map((category) => (
                <Box 
                  key={category.name} 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    mb: 1 
                  }}
                >
                  <Box 
                    sx={{ 
                      width: 12, 
                      height: 12, 
                      borderRadius: '50%', 
                      mr: 2,
                      backgroundColor: getColorForCategory(category.name)
                    }} 
                  />
                  <Typography variant="body2">
                    {category.name}: {category.value}%
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Grid>
        <Grid item xs={12} md={8}>
          <Box sx={{ height: 350, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius="80%"
                  dataKey="value"
                  paddingAngle={2}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryData.map((entry) => (
                    <Cell 
                      key={entry.name} 
                      fill={getColorForCategory(entry.name)} 
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default CategoryDistribution;
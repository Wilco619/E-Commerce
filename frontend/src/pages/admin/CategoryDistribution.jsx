import React from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid,
  CircularProgress 
} from '@mui/material';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const CategoryDistribution = ({ data, loading }) => {
  // Handle loading state
  if (loading) {
    return (
      <Paper sx={{ p: 3, boxShadow: 3, borderRadius: 2, minHeight: 400, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress />
      </Paper>
    );
  }

  // Handle empty or invalid data
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <Paper sx={{ p: 3, boxShadow: 3, borderRadius: 2 }}>
        <Typography variant="h6" color="text.secondary" align="center">
          No category data available
        </Typography>
      </Paper>
    );
  }

  const getColorForCategory = (categoryName) => {
    if (!categoryName) return '#607d8b'; // Default color for undefined

    const baseColors = {
      'Electronics': '#3f51b5',
      'Clothing': '#f50057',
      'Home': '#4caf50',
      'Books': '#ff9800',
      'Other': '#9c27b0',
      'Uncategorized': '#607d8b'
    };

    return baseColors[categoryName] || generateColorFromString(categoryName);
  };

  const generateColorFromString = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 50%)`;
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Paper elevation={3} sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="body2" color="primary">
            {data.name || 'Unknown'}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            {(data.value || 0).toFixed(1)}% of Total Sales
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            {data.sales || 0} Orders
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  return (
    <Paper sx={{ p: 3, boxShadow: 3, borderRadius: 2 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={4}>
          <Box sx={{ pl: 2 }}>
            <Typography variant="h6" gutterBottom>
              Sales by Category
            </Typography>
            <Box sx={{ mt: 2 }}>
              {data.map((category) => (
                <Box 
                  key={category.name || 'unknown'} 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    mb: 1,
                    pr: 2 
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
                      {category.name || 'Unknown'}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {(category.value || 0).toFixed(1)}%
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
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius="80%"
                  dataKey="value"
                  paddingAngle={2}
                  label={({ name, percent }) => 
                    `${name || 'Unknown'} ${((percent || 0) * 100).toFixed(1)}%`
                  }
                >
                  {data.map((entry) => (
                    <Cell 
                      key={entry.name || 'unknown'} 
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
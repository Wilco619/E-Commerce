import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';

const StatsCard = ({ title, value, growth, lowStock }) => {
  return (
    <Paper sx={{ height: '100%', boxShadow: 3, borderRadius: 2 }}>
      <Box sx={{ p: 2 }}>
        <Typography color="text.secondary" variant="body2" gutterBottom>{title}</Typography>
        <Typography variant="h4" component="div" fontWeight="bold">{value}</Typography>
        {growth !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            {growth > 0 ? <ArrowUpward color="success" /> : <ArrowDownward color="error" />}
            <Typography variant="body2" color={growth > 0 ? "success.main" : "error.main"}>{Math.abs(growth)}%</Typography>
          </Box>
        )}
        {lowStock !== undefined && lowStock > 0 && (
          <Typography color="error" sx={{ mt: 1 }}>{lowStock} low stock!</Typography>
        )}
      </Box>
    </Paper>
  );
};

export default StatsCard;

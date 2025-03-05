import React from 'react';
import { Button, Menu, MenuItem } from '@mui/material';

const TimeRangeSelector = ({ timeRange, setTimeRange }) => {
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
    handleMenuClose();
  };

  return (
    <div>
      <Button onClick={handleMenuOpen}>{timeRange}</Button>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => handleTimeRangeChange('week')}>This Week</MenuItem>
        <MenuItem onClick={() => handleTimeRangeChange('month')}>This Month</MenuItem>
        <MenuItem onClick={() => handleTimeRangeChange('year')}>This Year</MenuItem>
      </Menu>
    </div>
  );
};

export default TimeRangeSelector;

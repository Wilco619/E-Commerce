import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  List,
  ListItem,
  FormControlLabel,
  Checkbox,
  Button,
  Slider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const FilterDrawer = ({
  open,
  onClose,
  inStockOnly,
  setInStockOnly,
  priceRange,
  setPriceRange,
  onApply,
  onReset
}) => {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: 300 } }}
    >
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Filters</Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>
      
      <Divider />
      
      <List>
        <ListItem>
          <FormControlLabel
            control={
              <Checkbox 
                checked={inStockOnly} 
                onChange={(e) => setInStockOnly(e.target.checked)} 
              />
            }
            label="In Stock Only"
          />
        </ListItem>
        
        <ListItem>
          <Box sx={{ width: '100%' }}>
            <Typography variant="subtitle1" gutterBottom>
              Price Range
            </Typography>
            <Slider
              value={priceRange}
              onChange={(_, newValue) => setPriceRange(newValue)}
              valueLabelDisplay="auto"
              min={0}
              max={50000}
              step={1000}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography variant="body2">
                Ksh {priceRange[0].toLocaleString()}
              </Typography>
              <Typography variant="body2">
                Ksh {priceRange[1].toLocaleString()}
              </Typography>
            </Box>
          </Box>
        </ListItem>
      </List>
      
      <Box sx={{ p: 2, mt: 'auto' }}>
        <Button
          variant="contained"
          fullWidth
          onClick={onApply}
          sx={{ mb: 1 }}
        >
          Apply Filters
        </Button>
        <Button
          variant="outlined"
          fullWidth
          onClick={onReset}
        >
          Reset Filters
        </Button>
      </Box>
    </Drawer>
  );
};

export default FilterDrawer;
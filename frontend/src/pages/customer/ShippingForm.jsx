import React from 'react';
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  ListSubheader,
  FormControlLabel,
  Checkbox,
  Box,
  Typography,
  Divider,
  Paper,
  useTheme,
  alpha
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import NoteIcon from '@mui/icons-material/Note';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { deliveryAreas } from '../../services/constants';

const findDeliveryFee = (location) => {
  const area = Object.values(deliveryAreas).flat().find(area => area.value === location);
  return area ? area.fee : 0;
};

const SectionHeader = ({ children, icon }) => {
  const theme = useTheme();
  return (
    <Box sx={{ mb: 3, mt: 2 }}>
      <Typography
        variant="h6"
        sx={{
          display: 'flex',
          alignItems: 'center',
          color: theme.palette.primary.main,
          fontWeight: 500,
        }}
      >
        {icon && React.cloneElement(icon, { sx: { mr: 1, fontSize: '1.25rem' } })}
        {children}
      </Typography>
      <Divider sx={{ mt: 1 }} />
    </Box>
  );
};

const ShippingForm = ({ formData, handleFormChange }) => {
  const theme = useTheme();

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 3, 
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        borderRadius: 2,
        background: alpha(theme.palette.background.paper, 0.8)
      }}
    >
      <Box component="form" noValidate>
        <SectionHeader icon={<LocationOnIcon />}>Personal Information</SectionHeader>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              id="full_name"
              name="full_name"
              label="Full Name"
              value={formData.full_name}
              onChange={handleFormChange}
              autoComplete="name"
              variant="outlined"
              InputProps={{ sx: { borderRadius: 1 } }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              required
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleFormChange}
              autoComplete="email"
              variant="outlined"
              InputProps={{ sx: { borderRadius: 1 } }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              required
              fullWidth
              label="Phone Number"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleFormChange}
              autoComplete="tel"
              variant="outlined"
              InputProps={{ sx: { borderRadius: 1 } }}
            />
          </Grid>
        </Grid>

        <SectionHeader icon={<LocationOnIcon />}>Shipping Address</SectionHeader>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              label="Address"
              name="address"
              value={formData.address}
              onChange={handleFormChange}
              autoComplete="street-address"
              variant="outlined"
              InputProps={{ sx: { borderRadius: 1 } }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <TextField
              required
              fullWidth
              label="City"
              name="city"
              value={formData.city}
              onChange={handleFormChange}
              autoComplete="address-level2"
              variant="outlined"
              InputProps={{ sx: { borderRadius: 1 } }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <TextField
              required
              fullWidth
              label="Postal Code"
              name="postal_code"
              value={formData.postal_code}
              onChange={handleFormChange}
              autoComplete="postal-code"
              variant="outlined"
              InputProps={{ sx: { borderRadius: 1 } }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              required
              fullWidth
              label="Country"
              name="country"
              value={formData.country}
              onChange={handleFormChange}
              autoComplete="country"
              variant="outlined"
              InputProps={{ sx: { borderRadius: 1 } }}
            />
          </Grid>
        </Grid>

        <SectionHeader icon={<LocalShippingIcon />}>Delivery Options</SectionHeader>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.is_pickup}
                  onChange={handleFormChange}
                  name="is_pickup"
                  color="primary"
                  sx={{ '& .MuiSvgIcon-root': { fontSize: 22 } }}
                />
              }
              label={
                <Typography sx={{ fontWeight: 500 }}>
                  I will pick up the item at the Office/Shop
                </Typography>
              }
              sx={{ mb: 1 }}
            />
          </Grid>

          <Grid item xs={12}>
            <FormControl 
              fullWidth 
              required 
              error={!formData.is_pickup && !formData.delivery_location}
              disabled={formData.is_pickup}
              variant="outlined"
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1
                }
              }}
            >
              <InputLabel>Delivery Location</InputLabel>
              <Select
                name="delivery_location"
                value={formData.delivery_location || ''}
                onChange={handleFormChange}
                label="Delivery Location"
              >
                {Object.entries(deliveryAreas).map(([groupName, areas]) => [
                  <ListSubheader key={groupName} sx={{ 
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    color: theme.palette.primary.main,
                    fontWeight: 500
                  }}>
                    {groupName}
                  </ListSubheader>,
                  ...areas.map(area => (
                    <MenuItem key={area.value} value={area.value} sx={{ pl: 3 }}>
                      {area.label} 
                    </MenuItem>
                  ))
                ])}
              </Select>
              <FormHelperText sx={{ mx: 0, mt: 1 }}>
                {formData.is_pickup 
                  ? 'Delivery location not required for pickup orders' 
                  : !formData.delivery_location
                    ? 'Please select a delivery location or choose pickup option'
                    : (
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        color: theme.palette.primary.main,
                        fontWeight: 500,
                        mt: 0.5 
                      }}>
                        Delivery fee: Ksh {findDeliveryFee(formData.delivery_location)}
                      </Box>
                    )
                }
              </FormHelperText>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              name="special_instructions"
              label="Special Delivery Instructions"
              value={formData.special_instructions}
              onChange={handleFormChange}
              variant="outlined"
              placeholder="Provide any specific details for delivery (e.g., gate code, landmarks, etc.)"
              InputProps={{ sx: { borderRadius: 1 } }}
            />
          </Grid>
        </Grid>

        <SectionHeader icon={<NoteIcon />}>Additional Information</SectionHeader>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Order Notes (Optional)"
              name="order_notes"
              multiline
              rows={3}
              value={formData.order_notes}
              onChange={handleFormChange}
              variant="outlined"
              placeholder="Add any additional notes or special requests for your order"
              InputProps={{ sx: { borderRadius: 1 } }}
            />
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default ShippingForm;
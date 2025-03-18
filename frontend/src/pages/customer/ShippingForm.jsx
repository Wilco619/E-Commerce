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
  Box
} from '@mui/material';
import { deliveryAreas } from '../../services/constants';

const findDeliveryFee = (location) => {
  const area = Object.values(deliveryAreas).flat().find(area => area.value === location);
  return area ? area.fee : 0;
};

const ShippingForm = ({ formData, handleFormChange }) => {
  return (
    <Box component="form" noValidate>
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
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleFormChange}
            autoComplete="email"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            label="Phone Number"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleFormChange}
            autoComplete="tel"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            label="Address"
            name="address"
            value={formData.address}
            onChange={handleFormChange}
            autoComplete="street-address"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            required
            fullWidth
            label="City"
            name="city"
            value={formData.city}
            onChange={handleFormChange}
            autoComplete="address-level2"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            required
            fullWidth
            label="Postal Code"
            name="postal_code"
            value={formData.postal_code}
            onChange={handleFormChange}
            autoComplete="postal-code"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            label="Country"
            name="country"
            value={formData.country}
            onChange={handleFormChange}
            autoComplete="country"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Order Notes (Optional)"
            name="order_notes"
            multiline
            rows={3}
            value={formData.order_notes}
            onChange={handleFormChange}
          />
        </Grid>
        <Grid item xs={12}>
          <FormControl 
            fullWidth 
            required 
            error={!formData.is_pickup && !formData.delivery_location}
            disabled={formData.is_pickup}
          >
            <InputLabel>Delivery Location</InputLabel>
            <Select
              name="delivery_location"
              value={formData.delivery_location || ''}
              onChange={handleFormChange}
            >
              {Object.entries(deliveryAreas).map(([groupName, areas]) => [
                <ListSubheader key={groupName}>{groupName}</ListSubheader>,
                ...areas.map(area => (
                  <MenuItem key={area.value} value={area.value}>
                    {area.label} 
                  </MenuItem>
                ))
              ])}
            </Select>
            <FormHelperText>
              {formData.is_pickup 
                ? 'Delivery location not required for pickup orders' 
                : !formData.delivery_location
                  ? 'Please select a delivery location or choose pickup option'
                  : `Delivery fee: Ksh ${findDeliveryFee(formData.delivery_location)}`}
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
          />
        </Grid>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.is_pickup}
                onChange={handleFormChange}
                name="is_pickup"
                color="primary"
              />
            }
            label="I will pick up the item at the Office/Shop"
          />
          {!formData.is_pickup && !formData.delivery_location && (
            <FormHelperText error>
              Please either select a delivery location or choose pickup option
            </FormHelperText>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default ShippingForm;

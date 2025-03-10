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
  Checkbox
} from '@mui/material';
import { deliveryAreas } from '../../services/constants';

const ShippingForm = ({ formData, handleFormChange }) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <TextField
          required
          fullWidth
          label="Full Name"
          name="full_name"
          value={formData.full_name}
          onChange={handleFormChange}
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
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          required
          fullWidth
          label="Address"
          name="address"
          multiline
          rows={2}
          value={formData.address}
          onChange={handleFormChange}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          required
          fullWidth
          label="City"
          name="city"
          value={formData.city}
          onChange={handleFormChange}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          required
          fullWidth
          label="Postal Code"
          name="postal_code"
          value={formData.postal_code}
          onChange={handleFormChange}
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
          disabled={formData.is_pickup}
          error={!formData.is_pickup && !formData.delivery_location}
        >
          <InputLabel>Delivery Location</InputLabel>
          <Select
            name="delivery_location"
            value={formData.delivery_location}
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
              : formData.delivery_location
                ? 'Delivery fee will be calculated based on location'
                : 'Please select a delivery location or choose pickup option'}
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
  );
};

export default ShippingForm;

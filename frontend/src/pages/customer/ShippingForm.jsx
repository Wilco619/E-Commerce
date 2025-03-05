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

const ShippingForm = ({ formData, handleFormChange }) => {
  // Define delivery areas and their types
  const deliveryAreas = {
    'CBD Areas': [
      { value: 'KENCOM', label: 'Kencom', fee: 150 },
      { value: 'KENYATTA_AVE', label: 'Kenyatta Avenue', fee: 150 },
      { value: 'MOI_AVE', label: 'Moi Avenue', fee: 150 },
      // ... add all CBD areas
    ],
    'Residential Areas': [
      { value: 'KIAMBU', label: 'Kiambu Town', fee: 300 },
      { value: 'RUIRU', label: 'Ruiru', fee: 300 },
      // ... add all residential areas
    ],
    'Satellite Towns': [
      { value: 'ATHI_RIVER', label: 'Athi River', fee: 300 },
      { value: 'SYOKIMAU', label: 'Syokimau', fee: 300 },
      // ... add all satellite towns
    ]
  };

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
        <FormControl fullWidth>
          <InputLabel>Delivery Location</InputLabel>
          <Select
            name="delivery_location"
            value={formData.delivery_location}
            onChange={(e) => {
              // Find the selected location's fee
              let fee = 150; // default CBD fee
              Object.values(deliveryAreas).forEach(areas => {
                const area = areas.find(a => a.value === e.target.value);
                if (area) fee = area.fee;
              });
              
              // Update both location and fee
              handleFormChange({
                target: { name: 'delivery_location', value: e.target.value }
              });
              handleFormChange({
                target: { name: 'delivery_fee', value: fee }
              });
            }}
          >
            {Object.entries(deliveryAreas).map(([groupName, areas]) => [
              <ListSubheader key={groupName}>{groupName}</ListSubheader>,
              ...areas.map(area => (
                <MenuItem key={area.value} value={area.value}>
                  {area.label} - Ksh {area.fee}
                </MenuItem>
              ))
            ])}
          </Select>
          <FormHelperText>
            Delivery fee will be calculated based on location
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
      </Grid>
    </Grid>
  );
};

export default ShippingForm;

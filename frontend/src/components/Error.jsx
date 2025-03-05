import React from 'react';
import { Typography, Box } from '@mui/material';

const Error = ({ message }) => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
    <Typography color="error" variant="h5">
      {message}
    </Typography>
  </Box>
);

export default Error;

import React from 'react';
import { 
  Typography, 
  Container, 
  Box, 
  Button, 
  Paper
} from '@mui/material';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import { useNavigate } from 'react-router-dom';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '70vh',
          textAlign: 'center'
        }}
      >
        <Paper 
          elevation={3} 
          sx={{ 
            p: 5, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            width: '100%',
            maxWidth: 600
          }}
        >
          <SentimentDissatisfiedIcon sx={{ fontSize: 100, color: 'text.secondary', mb: 2 }} />
          
          <Typography variant="h1" component="h1" sx={{ mb: 2, fontSize: { xs: '3rem', md: '6rem' } }}>
            404
          </Typography>
          
          <Typography variant="h4" component="h2" sx={{ mb: 2 }}>
            Page Not Found
          </Typography>
          
          <Typography variant="body1" color="text.secondary" paragraph>
            The page you are looking for might have been removed, had its name changed,
            or is temporarily unavailable.
          </Typography>
          
          <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => navigate('/')}
              size="large"
            >
              Go to Homepage
            </Button>
            
            <Button 
              variant="outlined" 
              onClick={() => navigate(-1)}
              size="large"
            >
              Go Back
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default NotFoundPage;

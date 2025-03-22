// src/components/CookieConsent.js

import React, { useState } from 'react';
import { useCookies } from '../authentication/CookieContext';
import {
  Box,
  Paper,
  Typography,
  Button,
  Collapse,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  useTheme,
  Stack,
  Container,
  Fade,
  useMediaQuery
} from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CookieIcon from '@mui/icons-material/Cookie';
import SecurityIcon from '@mui/icons-material/Security';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import TrackChangesIcon from '@mui/icons-material/TrackChanges'; // Changed from Gps to TrackChanges

const CookieConsent = () => {
  const { cookieConsent, handleCookieConsent } = useCookies();
  const [showDetails, setShowDetails] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // If consent is already given, don't show the banner
  if (cookieConsent) {
    return null;
  }
  
  return (
    <Fade in={!cookieConsent}>
      <Paper
        elevation={8}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1300,
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
          borderTop: `1px solid ${theme.palette.divider}`,
          boxShadow: theme.shadows[8],
          overflow: 'hidden',
          mb: 0
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ p: 2, pt: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <CookieIcon color="primary" sx={{ mr: 1.5 }} />
              <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
                We value your privacy
              </Typography>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 900 }}>
              This website uses cookies to improve your experience, personalize content, 
              and analyze our traffic. By using our site, you consent to our use of cookies.
            </Typography>
            
            <Collapse in={showDetails} sx={{ mb: showDetails ? 2 : 0 }}>
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 2, 
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                  borderRadius: 2
                }}
              >
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                  Cookie Details:
                </Typography>
                
                <List dense disablePadding>
                  <ListItem alignItems="flex-start" sx={{ py: 0.75 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <SecurityIcon color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Essential Cookies" 
                      secondary="These cookies are necessary for the website to function and cannot be switched off in our systems."
                      primaryTypographyProps={{ fontWeight: 500, variant: 'body2' }}
                      secondaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                  
                  <ListItem alignItems="flex-start" sx={{ py: 0.75 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <BarChartIcon color="info" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Analytics Cookies" 
                      secondary="These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site."
                      primaryTypographyProps={{ fontWeight: 500, variant: 'body2' }}
                      secondaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                  
                  <ListItem alignItems="flex-start" sx={{ py: 0.75 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <SettingsIcon color="warning" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Functional Cookies" 
                      secondary="These cookies enable the website to provide enhanced functionality and personalization."
                      primaryTypographyProps={{ fontWeight: 500, variant: 'body2' }}
                      secondaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                  
                  <ListItem alignItems="flex-start" sx={{ py: 0.75 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <TrackChangesIcon color="error" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Targeting Cookies" 
                      secondary="These cookies may be set through our site by our advertising partners to build a profile of your interests."
                      primaryTypographyProps={{ fontWeight: 500, variant: 'body2' }}
                      secondaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                </List>
              </Paper>
            </Collapse>
            
            <Divider sx={{ mb: 2 }} />
            
            <Stack 
              direction={isMobile ? "column" : "row"}
              justifyContent="space-between" 
              alignItems={isMobile ? "stretch" : "center"}
              spacing={2}
            >
              <Button
                variant="text"
                color="inherit"
                onClick={() => setShowDetails(!showDetails)}
                endIcon={showDetails ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                sx={{ textTransform: 'none' }}
              >
                {showDetails ? 'Hide Details' : 'Show Details'}
              </Button>
              
              <Stack 
                direction="row" 
                spacing={1.5}
                sx={{ width: isMobile ? '100%' : 'auto' }}
              >
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => handleCookieConsent(false)}
                  sx={{ 
                    textTransform: 'none',
                    flex: isMobile ? 1 : 'auto',
                    whiteSpace: 'nowrap',
                    borderRadius: 6,
                    px: 2.5
                  }}
                >
                  Essential Only
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  disableElevation
                  onClick={() => handleCookieConsent(true)}
                  sx={{ 
                    textTransform: 'none',
                    flex: isMobile ? 1 : 'auto',
                    fontWeight: 500,
                    borderRadius: 6,
                    px: 2.5
                  }}
                >
                  Accept All
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Container>
      </Paper>
    </Fade>
  );
};

export default CookieConsent;
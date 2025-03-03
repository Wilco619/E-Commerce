import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  IconButton, 
  Menu, 
  MenuItem, 
  Container,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

const Navbar = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = useState(null);
  
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          {/* Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: { xs: 1, md: 0 } }}>
            <Typography
              variant="h6"
              component={RouterLink}
              to="/"
              sx={{
                mr: 2,
                fontWeight: 700,
                color: 'inherit',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <img 
                src="/logo.png" 
                alt="E-Shop Logo" 
                style={{ height: 40, marginRight: 8 }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/40x40?text=E-Shop";
                }}
              />
              E-Shop
            </Typography>
          </Box>

          {/* Desktop Navigation Links */}
          {!isMobile && (
            <Box sx={{ flexGrow: 1, display: 'flex' }}>
              <Button 
                component={RouterLink} 
                to="/" 
                sx={{ my: 2, color: 'inherit' }}
              >
                Home
              </Button>
              <Button 
                component={RouterLink} 
                to="/shop" 
                sx={{ my: 2, color: 'inherit' }}
              >
                Shop
              </Button>
              <Button 
                component={RouterLink} 
                to="/category/:slug" 
                sx={{ my: 2, color: 'inherit' }}
              >
                Categories
              </Button>
            </Box>
          )}

          {/* Mobile Navigation */}
          {isMobile && (
            <>
              <IconButton
                size="large"
                aria-label="menu"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenuOpen}
                color="inherit"
              >
                <MenuIcon />
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'left',
                }}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem onClick={handleMenuClose} component={RouterLink} to="/">
                  Home
                </MenuItem>
                <MenuItem onClick={handleMenuClose} component={RouterLink} to="/shop">
                  Shop
                </MenuItem>
                <MenuItem onClick={handleMenuClose} component={RouterLink} to="/categories">
                  Categories
                </MenuItem>
              </Menu>
            </>
          )}

          {/* Cart Icon - Always visible */}
          <IconButton color="inherit" component={RouterLink} to="/cart" sx={{ ml: { xs: 0, sm: 1 } }}>
            <ShoppingCartIcon />
          </IconButton>

          {/* Authentication Buttons */}
          {isMobile ? (
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              sx={{ mt: '45px' }}
            >
              <MenuItem onClick={handleMenuClose} component={RouterLink} to="/login">
                Login
              </MenuItem>
              <MenuItem onClick={handleMenuClose} component={RouterLink} to="/register">
                Register
              </MenuItem>
            </Menu>
          ) : (
            <Box sx={{ flexGrow: 0, display: 'flex' }}>
              <Button 
                color="inherit" 
                component={RouterLink} 
                to="/login"
                sx={{ ml: 1 }}
              >
                Login
              </Button>
              <Button 
                variant="contained" 
                color="primary" 
                component={RouterLink} 
                to="/register"
                sx={{ ml: 1 }}
              >
                Register
              </Button>
            </Box>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;

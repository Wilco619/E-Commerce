import React, { useState, useEffect, useCallback } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, Button, IconButton, Badge,
  Box, Menu, MenuItem, InputBase, Avatar, Drawer, List, ListItem,
  ListItemText, ListItemIcon, Divider, useMediaQuery, Tooltip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  ShoppingCart, Menu as MenuIcon, Person, Search,
  Logout, Dashboard, Inventory, Category, Receipt,
  AccountCircle, Home, Store
} from '@mui/icons-material';
import { styled, alpha } from '@mui/material/styles';
import { useAuth } from '../../authentication/AuthContext';
import { useCart } from '../../authentication/CartContext';

const SearchBox = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },
}));

const Header = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, isAdmin, isAuthenticated, logout } = useAuth();
  const { cartItemsCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [headerKey, setHeaderKey] = useState(0); // Add a key to force re-render
  
  // Force a re-render when auth state or location changes
  useEffect(() => {
    setHeaderKey(prevKey => prevKey + 1);
  }, [isAuthenticated, isAdmin, user, location.pathname]);
  
  const handleSearch = useCallback((e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${searchQuery}`);
      setSearchQuery('');
    }
  }, [navigate, searchQuery]);
  
  const handleUserMenuOpen = useCallback((event) => {
    setUserMenuAnchor(event.currentTarget);
  }, []);
  
  const handleUserMenuClose = useCallback(() => {
    setUserMenuAnchor(null);
  }, []);
  
  const handleLogout = useCallback(() => {
    logout();
    handleUserMenuClose();
    navigate('/');
  }, [logout, handleUserMenuClose, navigate]);
  
  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen(prevState => !prevState);
  }, []);

  // Use debug logging to see when auth state changes
  useEffect(() => {
    console.log('Auth state in Header:', { isAuthenticated, isAdmin, user });
  }, [isAuthenticated, isAdmin, user]);

  return (
    <div key={headerKey}>
      <AppBar position="sticky" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={toggleMobileMenu}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{
              textDecoration: 'none',
              color: 'inherit',
              display: 'flex',
              alignItems: 'center',
              fontWeight: 700
            }}
          >
            SHOP<Box component="span" sx={{ color: 'primary.light' }}>HUB</Box>
          </Typography>
          
          {!isMobile && (
            <>
              <Button color="inherit" component={RouterLink} to="/" startIcon={<Home />}>
                Home
              </Button>
              <Button color="inherit" component={RouterLink} to="/shop" startIcon={<Store />}>
                Shop
              </Button>
              {isAdmin && (
                <Button color="inherit" component={RouterLink} to="/admin/categories/new" startIcon={<Dashboard />}>
                  Admin
                </Button>
              )}
            </>
          )}
          
          <Box component="form" onSubmit={handleSearch} sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
            <SearchBox>
              <SearchIconWrapper>
                <Search />
              </SearchIconWrapper>
              <StyledInputBase
                placeholder="Search products…"
                inputProps={{ 'aria-label': 'search' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </SearchBox>
          </Box>
          
          <Box sx={{ display: 'flex' }}>
            <Tooltip title="Cart">
              <IconButton 
                color="inherit" 
                component={RouterLink} 
                to="/cart"
                aria-label={`${cartItemsCount} items in cart`}
              >
                <Badge badgeContent={cartItemsCount} color="error">
                  <ShoppingCart />
                </Badge>
              </IconButton>
            </Tooltip>
            
            {isAuthenticated ? (
              <>
                <Tooltip title="Account">
                  <IconButton
                    onClick={handleUserMenuOpen}
                    color="inherit"
                    aria-controls="user-menu"
                    aria-haspopup="true"
                  >
                    <Avatar 
                      sx={{ 
                        width: 32, 
                        height: 32, 
                        bgcolor: 'primary.main',
                        fontSize: '0.875rem'
                      }}
                    >
                      {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                    </Avatar>
                  </IconButton>
                </Tooltip>
                
                <Menu
                  id="user-menu"
                  anchorEl={userMenuAnchor}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  open={Boolean(userMenuAnchor)}
                  onClose={handleUserMenuClose}
                >
                  <MenuItem onClick={() => { handleUserMenuClose(); navigate('/profile'); }}>
                    <ListItemIcon>
                      <Person fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Profile" />
                  </MenuItem>
                  
                  <MenuItem onClick={() => { handleUserMenuClose(); navigate('/orders'); }}>
                    <ListItemIcon>
                      <Receipt fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="My Orders" />
                  </MenuItem>
                  
                  {isAdmin && (
                    <MenuItem onClick={() => { handleUserMenuClose(); navigate('/admin/categories/new'); }}>
                      <ListItemIcon>
                        <Dashboard fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="Admin Dashboard" />
                    </MenuItem>
                  )}
                  
                  <Divider />
                  
                  <MenuItem onClick={handleLogout}>
                    <ListItemIcon>
                      <Logout fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Logout" />
                  </MenuItem>
                </Menu>
              </>
            ) : (
              !isMobile && (
                <>
                  <Button color="inherit" component={RouterLink} to="/login">
                    Login
                  </Button>
                  <Button color="inherit" component={RouterLink} to="/register" variant="outlined" sx={{ ml: 1 }}>
                    Register
                  </Button>
                </>
              )
            )}
          </Box>
        </Toolbar>
      </AppBar>
      
      {/* Mobile drawer menu */}
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={toggleMobileMenu}
      >
        <Box
          sx={{ width: 250 }}
          role="presentation"
          onClick={toggleMobileMenu}
          onKeyDown={toggleMobileMenu}
        >
          <List>
            <ListItem button component={RouterLink} to="/">
              <ListItemIcon><Home /></ListItemIcon>
              <ListItemText primary="Home" />
            </ListItem>
            
            <ListItem button component={RouterLink} to="/shop">
              <ListItemIcon><Store /></ListItemIcon>
              <ListItemText primary="Shop" />
            </ListItem>
            
            <ListItem button component={RouterLink} to="/cart">
              <ListItemIcon>
                <Badge badgeContent={cartItemsCount} color="error">
                  <ShoppingCart />
                </Badge>
              </ListItemIcon>
              <ListItemText primary="Cart" />
            </ListItem>
            
            <Divider />
            
            {isAuthenticated ? (
              <>
                <ListItem button component={RouterLink} to="/profile">
                  <ListItemIcon><Person /></ListItemIcon>
                  <ListItemText primary="Profile" />
                </ListItem>
                
                <ListItem button component={RouterLink} to="/orders">
                  <ListItemIcon><Receipt /></ListItemIcon>
                  <ListItemText primary="My Orders" />
                </ListItem>
                
                {isAdmin && (
                  <>
                    <Divider />
                    <ListItem button component={RouterLink} to="/admin/categories/new">
                      <ListItemIcon><Dashboard /></ListItemIcon>
                      <ListItemText primary="Admin Dashboard" />
                    </ListItem>
                    
                    <ListItem button component={RouterLink} to="/admin/products/new">
                      <ListItemIcon><Inventory /></ListItemIcon>
                      <ListItemText primary="Manage Products" />
                    </ListItem>
                    
                    <ListItem button component={RouterLink} to="/admin/categories/new">
                      <ListItemIcon><Category /></ListItemIcon>
                      <ListItemText primary="Manage Categories" />
                    </ListItem>
                    
                    <ListItem button component={RouterLink} to="/admin/orders">
                      <ListItemIcon><Receipt /></ListItemIcon>
                      <ListItemText primary="Manage Orders" />
                    </ListItem>
                  </>
                )}
                
                <Divider />
                
                <ListItem button onClick={handleLogout}>
                  <ListItemIcon><Logout /></ListItemIcon>
                  <ListItemText primary="Logout" />
                </ListItem>
              </>
            ) : (
              <>
                <ListItem button component={RouterLink} to="/login">
                  <ListItemIcon><AccountCircle /></ListItemIcon>
                  <ListItemText primary="Login" />
                </ListItem>
                
                <ListItem button component={RouterLink} to="/register">
                  <ListItemIcon><Person /></ListItemIcon>
                  <ListItemText primary="Register" />
                </ListItem>
              </>
            )}
          </List>
        </Box>
      </Drawer>
    </div>
  );
};

export default Header;

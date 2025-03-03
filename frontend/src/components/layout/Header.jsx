import React, { useState, useCallback, useMemo } from 'react';
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

// Styled components
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

const LogoText = styled(Typography)(({ theme }) => ({
  textDecoration: 'none',
  color: 'inherit',
  display: 'flex',
  alignItems: 'center',
  fontWeight: 700,
  marginRight: theme.spacing(2)
}));

const Header = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, isAdmin, isAuthenticated, logout } = useAuth();
  const { cartItemsCount } = useCart();
  const navigate = useNavigate();
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  
  // Memoized user initial
  const userInitial = useMemo(() => {
    return user?.username?.charAt(0)?.toUpperCase() || 'U';
  }, [user?.username]);

  // Handlers
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
    setUserMenuAnchor(null);
    navigate('/');
  }, [logout, navigate]);
  
  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen(prevState => !prevState);
  }, []);
  
  const navigateAndCloseMenus = useCallback((path) => {
    setUserMenuAnchor(null);
    setMobileMenuOpen(false);
    navigate(path);
  }, [navigate]);

  // Admin menu items memoized
  const adminMenuItems = useMemo(() => (
    <>
      <MenuItem onClick={() => navigateAndCloseMenus('/admin')}>
        <ListItemIcon>
          <Dashboard fontSize="small" />
        </ListItemIcon>
        <ListItemText primary="Admin Dashboard" />
      </MenuItem>
      <Divider />
      <MenuItem onClick={() => navigateAndCloseMenus('/admin/products/new')}>
        <ListItemIcon>
          <Inventory fontSize="small" />
        </ListItemIcon>
        <ListItemText primary="Manage Products" />
      </MenuItem>
      <MenuItem onClick={() => navigateAndCloseMenus('/admin/categories/new')}>
        <ListItemIcon>
          <Category fontSize="small" />
        </ListItemIcon>
        <ListItemText primary="Manage Categories" />
      </MenuItem>
      <MenuItem onClick={() => navigateAndCloseMenus('/admin/orders')}>
        <ListItemIcon>
          <Receipt fontSize="small" />
        </ListItemIcon>
        <ListItemText primary="Manage Orders" />
      </MenuItem>
    </>
  ), [navigateAndCloseMenus]);

  // Admin mobile menu items memoized
  const adminMobileItems = useMemo(() => (
    <>
      <Divider />
      <ListItem button onClick={() => navigateAndCloseMenus('/admin')}>
        <ListItemIcon><Dashboard /></ListItemIcon>
        <ListItemText primary="Admin Dashboard" />
      </ListItem>
      <ListItem button onClick={() => navigateAndCloseMenus('/admin/products/new')}>
        <ListItemIcon><Inventory /></ListItemIcon>
        <ListItemText primary="Manage Products" />
      </ListItem>
      <ListItem button onClick={() => navigateAndCloseMenus('/admin/categories/new')}>
        <ListItemIcon><Category /></ListItemIcon>
        <ListItemText primary="Manage Categories" />
      </ListItem>
      <ListItem button onClick={() => navigateAndCloseMenus('/admin/orders')}>
        <ListItemIcon><Receipt /></ListItemIcon>
        <ListItemText primary="Manage Orders" />
      </ListItem>
    </>
  ), [navigateAndCloseMenus]);

  return (
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
        
        <LogoText
          variant="h6"
          component={RouterLink}
          to="/"
        >
          SHOP<Box component="span" sx={{ color: 'primary.light' }}>HUB</Box>
        </LogoText>
        
        {!isMobile && (
          <Box sx={{ flexGrow: 0 }}>
            <Button color="inherit" component={RouterLink} to="/" startIcon={<Home />}>
              Home
            </Button>
            <Button color="inherit" component={RouterLink} to="/shop" startIcon={<Store />}>
              Shop
            </Button>
            {isAdmin && (
              <Button color="inherit" component={RouterLink} to="/admin" startIcon={<Dashboard />}>
                Admin
              </Button>
            )}
          </Box>
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
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
                    {userInitial}
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
                <MenuItem onClick={() => navigateAndCloseMenus('/profile')}>
                  <ListItemIcon>
                    <Person fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Profile" />
                </MenuItem>
                
                <MenuItem onClick={() => navigateAndCloseMenus('/orders')}>
                  <ListItemIcon>
                    <Receipt fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="My Orders" />
                </MenuItem>
                
                {isAdmin && adminMenuItems}
                
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
              <Box sx={{ display: 'flex' }}>
                <Button color="inherit" component={RouterLink} to="/login">
                  Login
                </Button>
                <Button color="inherit" component={RouterLink} to="/register" variant="outlined" sx={{ ml: 1 }}>
                  Register
                </Button>
              </Box>
            )
          )}
        </Box>
      </Toolbar>
      
      {/* Mobile drawer menu */}
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={toggleMobileMenu}
      >
        <Box
          sx={{ width: 250 }}
          role="presentation"
        >
          <List>
            <ListItem button onClick={() => navigateAndCloseMenus('/')}>
              <ListItemIcon><Home /></ListItemIcon>
              <ListItemText primary="Home" />
            </ListItem>
            
            <ListItem button onClick={() => navigateAndCloseMenus('/shop')}>
              <ListItemIcon><Store /></ListItemIcon>
              <ListItemText primary="Shop" />
            </ListItem>
            
            <ListItem button onClick={() => navigateAndCloseMenus('/cart')}>
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
                <ListItem button onClick={() => navigateAndCloseMenus('/profile')}>
                  <ListItemIcon><Person /></ListItemIcon>
                  <ListItemText primary="Profile" />
                </ListItem>
                
                <ListItem button onClick={() => navigateAndCloseMenus('/orders')}>
                  <ListItemIcon><Receipt /></ListItemIcon>
                  <ListItemText primary="My Orders" />
                </ListItem>
                
                {isAdmin && adminMobileItems}
                
                <Divider />
                
                <ListItem button onClick={handleLogout}>
                  <ListItemIcon><Logout /></ListItemIcon>
                  <ListItemText primary="Logout" />
                </ListItem>
              </>
            ) : (
              <>
                <ListItem button onClick={() => navigateAndCloseMenus('/login')}>
                  <ListItemIcon><AccountCircle /></ListItemIcon>
                  <ListItemText primary="Login" />
                </ListItem>
                
                <ListItem button onClick={() => navigateAndCloseMenus('/register')}>
                  <ListItemIcon><Person /></ListItemIcon>
                  <ListItemText primary="Register" />
                </ListItem>
              </>
            )}
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
};

export default Header;
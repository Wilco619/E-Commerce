import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../authentication/AuthContext';
import { useCart } from '../../authentication/CartContext';
import { useSession } from '../../authentication/SessionContext';
import { useSnackbar } from 'notistack';
import { API } from "../../services/api";
import { ACCESS_TOKEN } from '../../services/constants';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { useWishlist } from '../../authentication/WishlistContext';
import ReceiptIcon from '@mui/icons-material/Receipt';

// MUI Components
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Badge,
  Menu,
  MenuItem,
  Avatar,
  Button,
  InputBase,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useMediaQuery,
  CircularProgress,
  Tooltip,
  Fade,
  ListItemButton,
  Skeleton,
  Dialog,
  TextField,
  InputAdornment,
} from '@mui/material';

// MUI Icons
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  ShoppingCart as ShoppingCartIcon,
  AccountCircle,
  Close as CloseIcon,
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  Login as LoginIcon,
  Home as HomeIcon,
  Store as StoreIcon,
  Search as SearchOutlinedIcon,
} from '@mui/icons-material';

// Theme
import { useTheme } from '@mui/material/styles';

// Add this at the top of your file after imports
const pulseKeyframes = {
  '0%': {
    transform: 'scale(1)',
  },
  '50%': {
    transform: 'scale(1.2)',
  },
  '100%': {
    transform: 'scale(1)',
  },
};

const ModernHeader = ({ toggleTheme, isDarkMode }) => {
  const { isAuthenticated, isAdmin, user } = useAuth(); // Get auth state directly from context
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const { cart, loading: cartLoading } = useCart();
  const { sessionId } = useSession();
  const { enqueueSnackbar } = useSnackbar();

  // Add wishlist context
  const { wishlistItems } = useWishlist();

  // Add wishlist count calculation
  const wishlistCount = useMemo(() => {
    return wishlistItems?.length || 0;
  }, [wishlistItems]);

  // State
  const [skeletonLoading, setSkeletonLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const [profileAnchorEl, setProfileAnchorEl] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Handle logout
  const handleLogout = useCallback(async () => {
    try {
      setLoggingOut(true);
      handleProfileMenuClose();
      await logout();
      enqueueSnackbar('Successfully logged out', { 
        variant: 'success',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'center',
        },
      });
    } catch (error) {
      enqueueSnackbar('Logout failed', { 
        variant: 'error',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'center',
        },
      });
    } finally {
      setLoggingOut(false);
    }
  }, [logout, enqueueSnackbar]);

  useEffect(() => {
    setSkeletonLoading(loading || cartLoading);
  }, [loading, cartLoading]);

  // Listen for auth state changes
  useEffect(() => {
    const checkLoggedInUser = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem(ACCESS_TOKEN);
        if (!token) {
          return;
        }
        const response = await authAPI.getCurrentUser();
        if (response.data) {
          console.log('User data:', response.data); // Debug log
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkLoggedInUser();
  }, []);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setSearchOpen(false);
      toggleMobileMenu(); // Close mobile menu if open
    }
  };

  // Calculate cart items count
  const cartItemsCount = useMemo(() => {
    if (!cart || cartLoading) return 0;
    return cart.items?.reduce((total, item) => total + item.quantity, 0) || 0;
  }, [cart, cartLoading]);

  // Handle profile menu
  const handleProfileMenuOpen = (event) => {
    setProfileAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileAnchorEl(null);
  };

  // Handle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Navigation helper
  const navigateTo = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  // Toggle search bar
  const toggleSearch = () => {
    setSearchOpen(!searchOpen);
  };

  // Check if path is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  // Render the search bar
  const renderSearchBar = () => (
    <Box 
      component="form" 
      onSubmit={handleSearch}
      sx={{
        display: 'flex',
        alignItems: 'center',
        backgroundColor: theme.palette.background.paper,
        borderRadius: '20px',
        padding: '4px 8px',
        width: isMobile ? '100%' : '300px',
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
        transition: 'all 0.3s ease'
      }}
    >
      <InputBase
        placeholder="Search products..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{
          color: 'black',
          flex: 1,
          paddingLeft: 1
        }}
        autoFocus={isMobile}
      />
      <IconButton type="submit" sx={{ p: '8px' }} aria-label="search">
        <SearchIcon />
      </IconButton>
      {isMobile && (
        <IconButton sx={{ p: '8px' }} aria-label="close search" onClick={toggleSearch}>
          <CloseIcon />
        </IconButton>
      )}
    </Box>
  );

  // Render profile menu
  const renderProfileMenu = (
    <Menu
      anchorEl={profileAnchorEl}
      id="profile-menu"
      keepMounted
      open={Boolean(profileAnchorEl)}
      onClose={handleProfileMenuClose}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      PaperProps={{
        elevation: 3,
        sx: {
          borderRadius: 2,
          minWidth: 180,
          mt: 1
        }
      }}
    >
      <Box sx={{ p: 1, display: 'flex', alignItems: 'center', px: 2 }}>
        <Avatar 
          src={user?.profile_picture} 
          sx={{ width: 32, height: 32, mr: 1.5 }}
        />
        <Box>
          <Typography variant="subtitle2" noWrap>
            {user?.first_name} {user?.last_name}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {user?.email}
          </Typography>
        </Box>
      </Box>
      <Divider sx={{ my: 1 }} />
      <MenuItem onClick={() => { handleProfileMenuClose(); navigate('/profile'); }}>
        <ListItemIcon>
          <PersonIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Profile</ListItemText>
      </MenuItem>
      <MenuItem onClick={() => { handleProfileMenuClose(); navigate('/orders'); }}>
        <ListItemIcon><ReceiptIcon fontSize="small" /></ListItemIcon>
        <ListItemText>My Orders</ListItemText>
      </MenuItem>
      {isAdmin && (
        <MenuItem onClick={() => { handleProfileMenuClose(); navigate('/admin'); }}>
          <ListItemIcon><DashboardIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Admin Dashboard</ListItemText>
        </MenuItem>
      )}
      <Divider sx={{ my: 1 }} />
      <MenuItem onClick={handleLogout} disabled={loggingOut}>
        <ListItemIcon>
          {loggingOut ? (
            <CircularProgress size={20} />
          ) : (
            <LogoutIcon fontSize="small" />
          )}
        </ListItemIcon>
        <ListItemText>Logout</ListItemText>
      </MenuItem>
    </Menu>
  );

  // Render mobile drawer
  const renderMobileDrawer = (
    <Drawer
      anchor="left"
      open={mobileMenuOpen}
      onClose={toggleMobileMenu}
      PaperProps={{
        sx: {
          width: '75%',
          maxWidth: 280,
          borderTopRightRadius: 8,
          borderBottomRightRadius: 8
        }
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{ 
              textDecoration: 'none', 
              color: 'inherit', 
              fontWeight: 800, 
              mb: 3, 
              display: 'block',
              letterSpacing: '0.5px'
            }}
          >
            JEMSA<Box component="span" sx={{ color: theme.palette.secondary.main }}>TECHS</Box>
        </Typography>
        <IconButton onClick={toggleMobileMenu}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />
      
      {isAuthenticated && (
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          {skeletonLoading ? (
            <>
              <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
              <Box>
                <Skeleton variant="text" width={120} height={24} />
                <Skeleton variant="text" width={150} height={16} />
              </Box>
            </>
          ) : (
            <>
              <Avatar 
                src={user?.profile_picture} 
                sx={{ width: 40, height: 40, mr: 2 }}
              >
                {!user?.profile_picture && (user?.first_name?.[0] || <AccountCircle />)}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" noWrap>
                  {user?.first_name} {user?.last_name}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {user?.email}
                </Typography>
              </Box>
            </>
          )}
        </Box>
        {isAdmin && !skeletonLoading && (
          <Typography variant="caption" sx={{ 
            display: 'inline-block',
            bgcolor: 'primary.main', 
            color: 'primary.contrastText',
            px: 1,
            py: 0.25,
            borderRadius: 1,
            fontSize: '0.6rem'
          }}>
            ADMIN
          </Typography>
        )}
      </Box>
    )}
      
      <Divider />
      
      <List sx={{ pt: 0 }}>
        <ListItemButton 
          onClick={() => navigateTo('/')}
          selected={isActive('/')}
        >
          <ListItemIcon>
            <HomeIcon color={isActive('/') ? 'primary' : 'inherit'} />
          </ListItemIcon>
          <ListItemText primary="Home" />
        </ListItemButton>
        
        <ListItemButton 
          onClick={() => navigateTo('/shop')}
          selected={isActive('/shop')}
        >
          <ListItemIcon>
            <StoreIcon color={isActive('/shop') ? 'primary' : 'inherit'} />
          </ListItemIcon>
          <ListItemText primary="Shop" />
        </ListItemButton>
        
        <ListItemButton onClick={toggleSearch}>
          <ListItemIcon>
            <SearchOutlinedIcon />
          </ListItemIcon>
          <ListItemText primary="Search" />
        </ListItemButton>
        
        <ListItemButton 
          onClick={() => navigateTo('/cart')}
          selected={isActive('/cart')}
        >
          <ListItemIcon>
            <Badge badgeContent={cartItemsCount} color="error">
              <ShoppingCartIcon color={isActive('/cart') ? 'primary' : 'inherit'} />
            </Badge>
          </ListItemIcon>
          <ListItemText primary="Cart" />
        </ListItemButton>

        <ListItemButton 
          onClick={() => navigateTo('/wishlist')}
          selected={isActive('/wishlist')}
        >
          <ListItemIcon>
            <Badge badgeContent={wishlistCount} color="error">
              <FavoriteIcon 
                sx={{
                  color: isActive('/wishlist') ? 'primary.main' : 'inherit',
                  animation: wishlistCount > 0 ? `${pulseKeyframes} 1.5s infinite` : 'none',
                }}
              />
            </Badge>
          </ListItemIcon>
          <ListItemText primary="Wishlist" />
        </ListItemButton>
      </List>
      
      <Divider />
      
      <List>
        {isAuthenticated ? (
          <>
            <ListItemButton 
              onClick={() => navigateTo('/profile')}
              selected={isActive('/profile')}
            >
              <ListItemIcon>
                <PersonIcon color={isActive('/profile') ? 'primary' : 'inherit'} />
              </ListItemIcon>
              <ListItemText primary="Profile" />
            </ListItemButton>
            
            <ListItemButton 
              onClick={() => navigateTo('/orders')}
              selected={isActive('/orders')}
            >
              <ListItemIcon>
                <ReceiptIcon color={isActive('/orders') ? 'primary' : 'inherit'} />
              </ListItemIcon>
              <ListItemText primary="My Orders" />
            </ListItemButton>

            {isAdmin && (
              <ListItemButton 
                onClick={() => navigateTo('/admin')}
                selected={isActive('/admin')}
              >
                <ListItemIcon>
                  <DashboardIcon color={isActive('/admin') ? 'primary' : 'inherit'} />
                </ListItemIcon>
                <ListItemText primary="Admin Panel" />
              </ListItemButton>
            )}
            
            <ListItemButton onClick={handleLogout} disabled={loggingOut}>
              <ListItemIcon>
                {loggingOut ? <CircularProgress size={24} /> : <LogoutIcon />}
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItemButton>
          </>
        ) : (
          <ListItemButton onClick={() => navigateTo('/login')}>
            <ListItemIcon>
              <LoginIcon />
            </ListItemIcon>
            <ListItemText primary="Login" />
          </ListItemButton>
        )}
      </List>
      
      <Box sx={{ 
        mt: 'auto', 
        p: 2, 
        borderTop: `1px solid ${theme.palette.divider}`,
        opacity: 0.7
      }}>
        <Typography variant="caption" color="text.secondary">
          Session ID: {sessionId.substring(0, 8)}...
        </Typography>
      </Box>
    </Drawer>
  );

  // Render search dialog
  const renderSearchDialog = (
    <Dialog
      open={searchOpen}
      onClose={() => setSearchOpen(false)}
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          width: '100%',
          maxWidth: '600px',
          borderRadius: isMobile ? 0 : 2
        }
      }}
    >
      <Box component="form" onSubmit={handleSearch} sx={{ p: 2 }}>
        <TextField
          autoFocus
          fullWidth
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search products..."
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchQuery('')}>
                  <CloseIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>
    </Dialog>
  );

  return (
    <>
      <AppBar 
        position="sticky" 
        elevation={0}
        sx={{
          backdropFilter: 'blur(8px)',
          backgroundColor: theme.palette.mode === 'light' 
            ? 'rgba(255, 255, 255, 0.8)' 
            : 'rgba(18, 18, 18, 0.8)',
          borderBottom: `1px solid ${theme.palette.divider}`,
          color: theme.palette.text.primary
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          {/* Mobile menu button */}
          {isMobile && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={toggleMobileMenu}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          {/* Logo */}
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{ 
              textDecoration: 'none',
              color: 'inherit',
              fontWeight: 600,
              letterSpacing: 0.5,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            JEMSA<Box component="span" sx={{ color: theme.palette.secondary.main }}>TECHS</Box>
          </Typography>
          
          {/* Desktop Navigation */}
          {!isMobile && (
            <Box sx={{ display: 'flex', ml: 2 }}>
              <Button 
                component={RouterLink} 
                to="/"
                color={isActive('/') ? 'primary' : 'inherit'}
                sx={{ 
                  fontWeight: isActive('/') ? 600 : 400,
                  textTransform: 'none'
                }}
              >
                Home
              </Button>
              <Button 
                component={RouterLink} 
                to="/shop"
                color={isActive('/shop') ? 'primary' : 'inherit'}
                sx={{ 
                  fontWeight: isActive('/shop') ? 600 : 400,
                  textTransform: 'none'
                }}
              >
                Shop
              </Button>
              <Button
                color="inherit"
                onClick={() => navigate('/orders')}
                startIcon={<ReceiptIcon />}
                sx={{ display: { xs: 'none', md: 'flex' } }}
              >
                Orders
              </Button>
            </Box>
          )}
          
          {/* Search, Cart, and Profile */}
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>

            {/* Desktop Search */}
            {!isMobile ? (
              skeletonLoading ? (
                <Skeleton variant="rounded" width={300} height={40} sx={{ borderRadius: '20px' }} />
              ) : (
                renderSearchBar()
              )
            ) : (
              searchOpen && (
                <Fade in={searchOpen}>
                  <Box sx={{ 
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bgcolor: theme.palette.background.paper,
                    zIndex: 1101,
                    p: 1,
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                  }}>
                    {skeletonLoading ? (
                      <Skeleton variant="rounded" height={40} width="100%" />
                    ) : (
                      renderSearchBar()
                    )}
                  </Box>
                </Fade>
              )
            )}
            
            {/* Search Icon (Mobile) */}
            {isMobile && !searchOpen && (
              <IconButton color="inherit" onClick={toggleSearch}>
                <SearchIcon />
              </IconButton>
            )}
            
            {/* Cart */}
            <Tooltip title="Shopping Cart">
              <IconButton 
                color="inherit" 
                component={RouterLink} 
                to="/cart" 
                aria-label={`Cart with ${cartItemsCount} items`}
                sx={{ ml: 1 }}
              >
                <Badge badgeContent={skeletonLoading ? undefined : cartItemsCount} color="error">
                  {skeletonLoading ? (
                    <Box position="relative" display="inline-flex">
                      <ShoppingCartIcon />
                      <Box
                        position="absolute"
                        top={-5}
                        right={-5}
                        width={16}
                        height={16}
                      >
                        <Skeleton variant="circular" width={16} height={16} />
                      </Box>
                    </Box>
                  ) : (
                    <ShoppingCartIcon />
                  )}
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Wishlist */}
            <Tooltip title="Wishlist">
              <IconButton 
                color="inherit" 
                component={RouterLink} 
                to="/wishlist" 
                aria-label={`Wishlist with ${wishlistCount} items`}
                sx={{ 
                  ml: 1,
                  '& .MuiSvgIcon-root': wishlistCount > 0 ? {
                    animation: `${pulseKeyframes} 1.5s infinite`,
                    color: 'error.main'
                  } : {}
                }}
              >
                <Badge 
                  badgeContent={skeletonLoading ? undefined : wishlistCount} 
                  color="error"
                >
                  {skeletonLoading ? (
                    <Box position="relative" display="inline-flex">
                      <FavoriteIcon />
                      <Box
                        position="absolute"
                        top={-5}
                        right={-5}
                        width={16}
                        height={16}
                      >
                        <Skeleton variant="circular" width={16} height={16} />
                      </Box>
                    </Box>
                  ) : (
                    <FavoriteIcon />
                  )}
                </Badge>
              </IconButton>
            </Tooltip>
            
            {/* Profile/Account */}
            {isAuthenticated ? (
              <Tooltip title="Account">
                <IconButton
                  edge="end"
                  color="inherit"
                  onClick={handleProfileMenuOpen}
                  sx={{ ml: 1 }}
                >
                  {skeletonLoading ? (
                    <Skeleton variant="circular" width={32} height={32} />
                  ) : user?.profile_picture ? (
                    <Avatar 
                      src={user.profile_picture} 
                      alt={`${user.first_name} ${user.last_name}`}
                      sx={{ 
                        width: 32, 
                        height: 32,
                        border: `2px solid ${theme.palette.primary.main}` 
                      }}
                    />
                  ) : (
                    <AccountCircle />
                  )}
                </IconButton>
              </Tooltip>
            ) : (
              skeletonLoading ? (
                <Skeleton variant="rounded" width={80} height={36} sx={{ ml: 1 }} />
              ) : (
                <Button
                  color="primary"
                  variant="outlined"
                  component={RouterLink}
                  to="/login"
                  startIcon={<LoginIcon />}
                  sx={{ 
                    ml: 1,
                    borderRadius: '20px',
                    textTransform: 'none'
                  }}
                >
                  Login
                </Button>
              )
            )}
          </Box>
        </Toolbar>
      </AppBar>
      
      {/* Mobile Drawer */}
      {renderMobileDrawer}
      
      {/* Profile Menu */}
      {renderProfileMenu}

      {/* Search Dialog */}
      {renderSearchDialog}
    </>
  );
};

export default ModernHeader;
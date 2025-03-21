import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';

import {
  Container,
  Grid,
  Typography,
  Box,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  Breadcrumbs,
  Link,
  CircularProgress,
  Divider,
  Chip,
  useMediaQuery,
  useTheme,
  Paper,
  Skeleton,
  Tooltip, 
  IconButton,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import FilterListIcon from '@mui/icons-material/FilterList';
import { productsAPI, cartAPI } from '../services/api';
import { useSnackbar } from 'notistack';
import { useCart } from '../authentication/CartContext';
import { useAuth } from '../authentication/AuthContext';

// Update the filter section with simplified controls
const FilterSection = ({ searchTerm, setSearchTerm, sortBy, setSortBy, priceRange, setPriceRange }) => (
  <Paper elevation={1} sx={{ p: 2, mb: 4 }}>
    <Grid container spacing={2} alignItems="center">
      {/* Search Field */}
      <Grid item xs={12} sm={6} md={4}>
        <TextField
          size="small"
          fullWidth
          variant="outlined"
          placeholder="Search in this category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton onClick={() => setSearchTerm('')} edge="end" size="small">
                  <CloseIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Grid>

      {/* Sort Field */}
      <Grid item xs={12} sm={6} md={4}>
        <FormControl fullWidth variant="outlined" size="small">
          <InputLabel>Sort By</InputLabel>
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            label="Sort By"
          >
            <MenuItem value="">Default</MenuItem>
            <MenuItem value="price">Price: Low to High</MenuItem>
            <MenuItem value="-price">Price: High to Low</MenuItem>
            <MenuItem value="name">Name: A to Z</MenuItem>
            <MenuItem value="-name">Name: Z to A</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      {/* Price Range */}
      <Grid item xs={12} md={4}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Price Range: Ksh {priceRange[0].toLocaleString()} - Ksh {priceRange[1].toLocaleString()}
        </Typography>
        <Slider
          value={priceRange}
          onChange={(_, newValue) => setPriceRange(newValue)}
          valueLabelDisplay="auto"
          min={0}
          max={50000}
          step={1000}
          valueLabelFormat={(value) => `Ksh ${value.toLocaleString()}`}
        />
      </Grid>
    </Grid>
  </Paper>
);

const CategoryPage = () => {
  const { slug } = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const [categoryDetails, setCategoryDetails] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  // Use the cart context instead of managing cart state locally
  const { addToCart, loading: cartLoading, fetchCart, cart } = useCart();
  const { isAuthenticated } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const sortOptions = [
    { value: 'price', label: 'Price: Low to High' },
    { value: '-price', label: 'Price: High to Low' },
    { value: 'name', label: 'Name: A to Z' },
    { value: '-name', label: 'Name: Z to A' },
  ];

  const fetchCategoryProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        category: slug,
        ...(searchTerm && { search: searchTerm }),
        ...(sortBy && { ordering: sortBy }),
        ...(priceRange[0] > 0 && { price_min: priceRange[0] }),
        ...(priceRange[1] < 50000 && { price_max: priceRange[1] }),
        page
      };

      const response = await productsAPI.getProducts(params);
      setProducts(response.data.results || []);
      setTotalPages(Math.ceil((response.data.count || 0) / 12));
    } catch (error) {
      setError('Failed to load category products');
    } finally {
      setLoading(false);
    }
  }, [slug, searchTerm, sortBy, priceRange, page]);

  const fetchCategoryData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch category details
      const categoryResponse = await productsAPI.getCategory(slug);
      setCategoryDetails(categoryResponse.data);

      // Fetch category products with simplified filters
      const params = {
        ...(searchTerm && { search: searchTerm }),
        ...(sortBy && { ordering: sortBy }),
        ...(priceRange[0] > 0 && { price_min: priceRange[0] }),
        ...(priceRange[1] < 50000 && { price_max: priceRange[1] }),
        page
      };

      const productsResponse = await productsAPI.getCategoryProducts(slug, params);
      setProducts(productsResponse.data.results || []);
      setTotalPages(Math.ceil((productsResponse.data.count || 0) / 12));
    } catch (error) {
      console.error('Error fetching category data:', error);
      setError('Failed to load category data');
      enqueueSnackbar('Failed to load category data', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [slug, searchTerm, sortBy, priceRange, page, enqueueSnackbar]);

  useEffect(() => {
    fetchCategoryData();
  }, [slug, fetchCategoryData]);

  const handleAddToCart = async (product) => {
    if (!product.is_available || product.stock <= 0) {
        enqueueSnackbar('Product is out of stock', { variant: 'error' });
        return;
    }

    try {
        // Get cart to check existing items
        const cartResponse = await cartAPI.getCurrentCart();
        const existingItem = cartResponse.data.items?.find(
            item => item.product.id === product.id
        );
        const currentQuantity = existingItem ? existingItem.quantity : 0;

        if ((currentQuantity + 1) > product.stock) {
            enqueueSnackbar(
                `Cannot add more items. Current in cart: ${currentQuantity}, Stock: ${product.stock}`, 
                { variant: 'warning' }
            );
            return;
        }

        await addToCart(product.id, 1);
        enqueueSnackbar(`${product.name} added to cart`, { variant: 'success' });
        await fetchCart();
    } catch (err) {
        console.error('Error adding to cart:', err);
        enqueueSnackbar(
            err.response?.data?.error || 'Failed to add product to cart',
            { variant: 'error' }
        );
    }
  };

  // Render product card
  const renderProductCard = (product) => {
    const isOutOfStock = !product.is_available || product.stock <= 0;
    const isLowStock = product.stock <= 5 && product.stock > 0;
    const existingInCart = cart?.items?.find(item => item.product.id === product.id);
    const canAddToCart = !isOutOfStock && (!existingInCart || existingInCart.quantity < product.stock);
    
    return (
      <Card 
        elevation={2}
        sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 6,
          },
          borderRadius: 2,
          overflow: 'hidden'
        }}
      >
        <Box sx={{ position: 'relative' }}>
          {product.discount_price && (
            <Chip
              label={`${Math.round((1 - product.discount_price / product.price) * 100)}% OFF`}
              color="error"
              size="small"
              sx={{
                position: 'absolute',
                top: 12,
                right: 12,
                fontWeight: 'bold',
                zIndex: 2
              }}
            />
          )}
          
          {product.feature_image ? (
            <CardMedia
              component="img"
              height="220"
              image={product.feature_image}
              alt={product.name}
              sx={{ 
                objectFit: 'contain',
                p: 2,
                backgroundColor: 'grey.50',
                textAlign: isMobile ? 'center' : 'initial',
                display: 'flex',
                justifyContent: isMobile ? 'center' : 'initial'
              }}
            />
          ) : (
            <Box 
              sx={{ 
                height: 220, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                bgcolor: 'grey.50'
              }}
            >
              <ShoppingBagIcon sx={{ fontSize: 60, color: 'grey.300' }} />
            </Box>
          )}  
          <Typography 
            gutterBottom 
            variant="h6" 
            component="h2" 
            sx={{ 
              fontWeight: 500,
              fontSize: '1.1rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              lineHeight: 1.2,
              height: '2.4em'
            }}
          >
            {product.name}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1, mt: 2 }}>
            {product.discount_price ? (
              <>
                <Typography 
                  variant={isMobile ? "body1" : "h6"}
                  color="primary" 
                  sx={{ 
                    fontWeight: 'bold', 
                    mr: 1,
                    fontSize: isMobile ? '0.95rem' : 'inherit'
                  }}
                >
                  Ksh{product.discount_price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ 
                    textDecoration: 'line-through',
                    fontSize: isMobile ? '0.75rem' : '0.875rem'
                  }}
                >
                  Ksh{product.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                </Typography>
              </>
            ) : (
              <Typography 
                variant={isMobile ? "body1" : "h6"} 
                color="primary" 
                sx={{ 
                  fontWeight: 'bold',
                  fontSize: isMobile ? '0.95rem' : 'inherit'
                }}
              >
                Ksh{product.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              </Typography>
            )}
          </Box>
          
          <Box sx={{ mt: 1 }}>
            {isOutOfStock ? (
              <Chip 
                label="Out of Stock" 
                color="error" 
                size="small"
                sx={{ borderRadius: 1 }}
              />
            ) : isLowStock ? (
              <Typography variant="body2" color="warning.main" sx={{ fontWeight: 500 }}>
                Only {product.stock} left
              </Typography>
            ) : (
              <Typography variant="body2" color="success.main" sx={{ fontWeight: 500 }}>
                In Stock
              </Typography>
            )}
          </Box>
        </Box>
        
        <CardActions sx={{ px: 2, pb: 2, pt: 0, gap: 1 }}>
          {isMobile ? (
            // Mobile view - icon only buttons
            <>
              <Tooltip title="View Details">
                <IconButton
                  component={RouterLink}
                  to={`/product/${product.slug}`}
                  color="primary"
                  sx={{ 
                    flexGrow: 1,
                    border: `1px solid ${theme.palette.primary.main}`,
                    borderRadius: 1.5,
                  }}
                >
                  <VisibilityIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Add to Cart">
                <span>
                  <IconButton
                    color="primary"
                    onClick={() => handleAddToCart(product)}
                    disabled={!canAddToCart || cartLoading}
                    sx={{ 
                      flexGrow: 1,
                      backgroundColor: 'primary.main',
                      color: 'primary.contrastText',
                      borderRadius: 1.5,
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                      '&.Mui-disabled': {
                        backgroundColor: 'action.disabledBackground',
                        color: 'action.disabled',
                      }
                    }}
                  >
                    <AddShoppingCartIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </>
          ) : (
            // Desktop view - text + icon buttons
            <>
              <Button 
                variant="outlined"
                size="small" 
                startIcon={<VisibilityIcon />}
                component={RouterLink} 
                to={`/product/${product.slug}`}
                sx={{ 
                  flexGrow: 1,
                  borderRadius: 1.5,
                  textTransform: 'none',
                  fontWeight: 500
                }}
              >
                View Details
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddShoppingCartIcon />}
                onClick={() => handleAddToCart(product)}
                disabled={!canAddToCart || cartLoading}
                sx={{ 
                  flexGrow: 1,
                  borderRadius: 1.5,
                  textTransform: 'none',
                  fontWeight: 500
                }}
              >
                {cartLoading ? 'Adding...' : 'Add to Cart'}
              </Button>
            </>
          )}
        </CardActions>
      </Card>
    );
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Skeleton variant="text" width="60%" height={30} />
        </Box>
        <Box sx={{ mb: 4 }}>
          <Skeleton variant="text" width="40%" height={50} />
          <Skeleton variant="text" width="80%" height={25} />
          <Skeleton variant="text" width="80%" height={25} />
        </Box>
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
            <Grid item key={item} xs={6} sm={6} md={4} lg={3} xl={2}>
              <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
              <Skeleton variant="text" height={30} sx={{ mt: 1 }} />
              <Skeleton variant="text" width="60%" height={25} />
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Skeleton variant="rectangular" width="50%" height={36} />
                <Skeleton variant="rectangular" width="50%" height={36} />
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  if (error || !categoryDetails) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper 
          elevation={3}
          sx={{ 
            textAlign: 'center', 
            py: 5, 
            px: 3,
            borderRadius: 2,
            backgroundColor: 'error.light',
            color: 'error.contrastText'
          }}
        >
          <Typography variant="h5" gutterBottom>
            {error || 'Category not found'}
          </Typography>
          <Button 
            variant="contained" 
            component={RouterLink} 
            to="/shop"
            sx={{ 
              mt: 2,
              borderRadius: 1.5,
              textTransform: 'none',
              fontWeight: 500
            }}
          >
            Back to Shop
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs Navigation */}
      <Breadcrumbs 
        separator={<NavigateNextIcon fontSize="small" />} 
        sx={{ mb: 3 }}
        aria-label="breadcrumb"
      >
        <Link 
          component={RouterLink} 
          to="/" 
          color="inherit"
          sx={{ textDecoration: 'none' }}
        >
          Home
        </Link>
        <Link 
          component={RouterLink} 
          to="/shop" 
          color="inherit"
          sx={{ textDecoration: 'none' }}
        >
          Shop
        </Link>
        <Typography color="text.primary" fontWeight={500}>
          {categoryDetails?.name}
        </Typography>
      </Breadcrumbs>

      {/* Category Header */}
      <Paper 
        elevation={0} 
        sx={{ 
          mb: 4, 
          p: 3, 
          borderRadius: 2,
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`
        }}
      >
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom
          sx={{ 
            fontWeight: 600,
            color: 'primary.main'
          }}
        >
          {categoryDetails?.name}
        </Typography>
        {categoryDetails?.description && (
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            {categoryDetails.description}
          </Typography>
        )}
      </Paper>

      <FilterSection 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        sortBy={sortBy}
        setSortBy={setSortBy}
        priceRange={priceRange}
        setPriceRange={setPriceRange}
      />

      {/* Product Grid */}
      {products.length > 0 ? (
        <Grid container spacing={3}>
          {products.map((product) => (
            <Grid 
              item 
              key={product.id} 
              xs={6}       // 2 cards per row on extra small screens (mobile)
              sm={6}       // 2 cards per row on small screens (tablet portrait)
              md={4}       // 3 cards per row on medium screens
              lg={3}       // 4 cards per row on large screens
              xl={2}       // 6 cards per row on extra large screens
              sx={{ display: 'flex' }}
            >
              {renderProductCard(product)}
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper 
          elevation={3}
          sx={{ 
            textAlign: 'center', 
            py: 5, 
            px: 3,
            borderRadius: 2,
            backgroundColor: 'info.light',
            color: 'info.contrastText'
          }}
        >
          <Typography variant="h6" gutterBottom>
            No products found in this category
          </Typography>
          <Button 
            variant="contained" 
            component={RouterLink} 
            to="/shop"
            sx={{ 
              mt: 2,
              borderRadius: 1.5,
              textTransform: 'none',
              fontWeight: 500
            }}
          >
            Browse All Products
          </Button>
        </Paper>
      )}
    </Container>
  );
};

export default CategoryPage;
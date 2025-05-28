import React, { useState, useEffect, useCallback } from 'react';
import { 
  Container, Skeleton,  Box, Typography, Button, Paper, Grid, TextField, InputAdornment, IconButton, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Checkbox, Slider, Drawer, List, ListItem, Chip, CircularProgress, Pagination, Breadcrumbs, Link, Card, CardMedia, CardContent, CardActions 
} from '@mui/material';
import { useLocation, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../authentication/AuthContext';
import { useCart } from '../authentication/CartContext';
import { useSnackbar } from 'notistack';
import { productsAPI, cartAPI } from '../services/api';
import { Search as SearchIcon, Close as CloseIcon, FilterList as FilterListIcon, AddShoppingCart as AddShoppingCartIcon, Favorite as FavoriteIcon, FavoriteBorder as FavoriteBorderIcon, NavigateNext as NavigateNextIcon } from '@mui/icons-material';
import { Divider } from '@mui/material';
import { useWishlist } from '../authentication/WishlistContext';
import { GUEST_WISHLIST_ID } from '../services/constants';

const ProductSkeleton = () => {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Skeleton variant="rectangular" sx={{ pt: '70%' }} animation="wave" />
      <CardContent sx={{ flexGrow: 1, py: 1, px: 1.5 }}>
        <Skeleton animation="wave" height={18} width="80%" sx={{ mb: 1 }} />
        <Skeleton animation="wave" height={14} width="40%" sx={{ mb: 1 }} />
        <Skeleton animation="wave" height={16} width="50%" />
      </CardContent>
      <CardActions sx={{ p: 1 }}>
        <Skeleton animation="wave" height={36} width="100%" />
      </CardActions>
    </Card>
  );
};

const ShopPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);

  const auth = useAuth();
  const isAuthenticated = auth.isAuthenticated && typeof auth.isAuthenticated === 'function' ? auth.isAuthenticated() : false;

  const { addToCart, cart, loading: cartLoading, fetchCart } = useCart();
  const { enqueueSnackbar } = useSnackbar();
  const { isInWishlist, toggleWishlistItem } = useWishlist();
  
  // State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addingToCart, setAddingToCart] = useState({});
  
  // Filter State
  const [searchTerm, setSearchTerm] = useState(queryParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(queryParams.get('category') || '');
  const [sortBy, setSortBy] = useState('');  // Remove default 'created_at'
  const [inStockOnly, setInStockOnly] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 50000]);  // Increase max price range
  const [page, setPage] = useState(parseInt(queryParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    // Fetch categories once
    const fetchCategories = async () => {
      try {
        const response = await productsAPI.getCategories();
        setCategories(response.data.results || response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const query = searchParams.get('search');
    if (query) {
      setSearchTerm(query);
    }
  }, [location.search]);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        ...(searchTerm && { search: searchTerm }),
        ...(selectedCategory && { category: selectedCategory }),
        ...(sortBy && { ordering: sortBy }), // Update this to match API
        ...(inStockOnly && { in_stock: true }),
        ...(priceRange[0] > 0 && { price_min: priceRange[0] }),
        ...(priceRange[1] < 50000 && { price_max: priceRange[1] }),
        ...(page > 1 && { page: page }),
      };

      const response = await productsAPI.getProducts(params);
      
      if (response.data) {
        setProducts(response.data.results || []);
        setTotalPages(Math.ceil((response.data.count || 0) / 12));
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategory, sortBy, inStockOnly, priceRange, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts, searchTerm]);

  // Update your sort handler to match the API expectations
  const handleSortChange = (event) => {
    const value = event.target.value;
    setSortBy(value);
    setPage(1);
  };

  // Add a debug section to help troubleshoot
  useEffect(() => {
    console.log('Current state:', {
      products: products.length,
      loading,
      error,
      searchTerm,
      selectedCategory,
      sortBy,
      inStockOnly,
      priceRange,
      page,
      totalPages
    });
  }, [products, loading, error, searchTerm, selectedCategory, sortBy, 
      inStockOnly, priceRange, page, totalPages]);

  const handleSearch = (event) => {
    event.preventDefault();
    setPage(1); // Reset to first page on new search
  };

  const handleSearchInputChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
    setPage(1);
  };

  const handleInStockChange = (event) => {
    setInStockOnly(event.target.checked);
    setPage(1);
  };

  const handlePriceRangeChange = (event, newValue) => {
    setPriceRange(newValue);
  };

  const handlePriceRangeCommitted = () => {
    setPage(1);
    // This would typically filter products by price range
    // For now, we'll simulate this without making an API call
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    window.scrollTo(0, 0);
  };

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSortBy('created_at');
    setInStockOnly(false);
    setPriceRange([0, 1000]);
    setPage(1);
  };

  const handleAddToCart = async (product) => {
    if (!product.is_available || product.stock <= 0) {
        enqueueSnackbar('Product is out of stock', { variant: 'error' });
        return;
    }

    try {
        setAddingToCart((prev) => ({ ...prev, [product.id]: true }));
        
        // Get current cart state to check existing quantity
        const cartResponse = await cartAPI.getCurrentCart();
        const existingItem = cartResponse.data.items?.find(
            item => item.product.id === product.id
        );
        const currentQuantity = existingItem ? existingItem.quantity : 0;

        if ((currentQuantity + 1) > product.stock) {
            enqueueSnackbar(
                `Cannot add more. In cart: ${currentQuantity}, Stock: ${product.stock}`, 
                { variant: 'warning' }
            );
            return;
        }

        await addToCart(product.id, 1);
        enqueueSnackbar('Product added to cart', { variant: 'success' });
        
        // Use available refresh method
        if (fetchCart) {
            await fetchCart();
        } else {
            await refreshCart();
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        enqueueSnackbar(
            error.response?.data?.error || 'Failed to add product to cart',
            { variant: 'error' }
        );
    } finally {
        setAddingToCart((prev) => ({ ...prev, [product.id]: false }));
    }
};

  // Add this helper function to handle guest wishlist
  const handleGuestWishlist = (product) => {
    const guestWishlist = JSON.parse(localStorage.getItem(GUEST_WISHLIST_ID) || '[]');
    const isInList = guestWishlist.some(item => item.product.id === product.id);
    
    if (isInList) {
      const newWishlist = guestWishlist.filter(item => item.product.id !== product.id);
      localStorage.setItem(GUEST_WISHLIST_ID, JSON.stringify(newWishlist));
      enqueueSnackbar('Removed from wishlist', { variant: 'info' });
    } else {
      guestWishlist.push({
        product: product,
        created_at: new Date().toISOString()
      });
      localStorage.setItem(GUEST_WISHLIST_ID, JSON.stringify(guestWishlist));
      enqueueSnackbar('Added to wishlist', { variant: 'success' });
    }
  };

  const sortOptions = [
    { value: '', label: 'Default' },
    { value: '-created_at', label: 'Newest First' },
    { value: 'price', label: 'Price: Low to High' },
    { value: '-price', label: 'Price: High to Low' },
    { value: 'name', label: 'Name: A to Z' },
    { value: '-name', label: 'Name: Z to A' },
  ];

  return (
    <>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 3 }}>
          <Link component={RouterLink} to="/" color="inherit">
            Home
          </Link>
          <Typography color="text.primary">Shop</Typography>
        </Breadcrumbs>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            All Products
          </Typography>
          <Button 
            startIcon={<FilterListIcon />} 
            variant="outlined" 
            onClick={toggleDrawer(true)}
          >
            Filters
          </Button>
        </Box>

        <Paper elevation={1} sx={{ p: 2, mb: 4 }}>
          <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <form onSubmit={handleSearch}>
              <TextField
                size="small"
                fullWidth
                variant="outlined"
                placeholder="Search products..."
                value={searchTerm}
                onChange={handleSearchInputChange}
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
            </form>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel id="sort-select-label">Sort By</InputLabel>
              <Select
                labelId="sort-select-label"
                value={sortBy}
                onChange={handleSortChange}
                label="Sort By"
              >
                {sortOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          </Grid>
        </Paper>

        {(selectedCategory || inStockOnly || searchTerm) && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }} sm={2} md={1}> 
            <Typography variant="body2" sx={{ mr: 1 }}>
              Active Filters:
            </Typography>
            
            {searchTerm && (
              <Chip 
                label={`Search: ${searchTerm}`} 
                onDelete={() => setSearchTerm('')}
                size="small"
              />
            )}
            
            {selectedCategory && (
              <Chip 
                label={`Category: ${categories.find(c => c.id.toString() === selectedCategory)?.name || selectedCategory}`} 
                onDelete={() => setSelectedCategory('')}
                size="small"
              />
            )}
            
            {inStockOnly && (
              <Chip 
                label="In Stock Only" 
                onDelete={() => setInStockOnly(false)}
                size="small"
              />
            )}
            
            <Button 
              size="small" 
              variant="outlined" 
              onClick={resetFilters}
            >
              Clear All
            </Button>
          </Box>
        )}

        <Drawer
          anchor="right"
          open={drawerOpen}
          onClose={toggleDrawer(false)}
        >
          <Box
            sx={{ width: 300 }}
            role="presentation"
          >
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Filters</Typography>
              <IconButton onClick={toggleDrawer(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
            
            <Divider />
            
            <List>
              <ListItem>
                <Box sx={{ width: '100%' }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Categories
                  </Typography>
                  <FormControl fullWidth size="small">
                    <InputLabel id="category-label">Select Category</InputLabel>
                    <Select
                      labelId="category-label"
                      value={selectedCategory}
                      onChange={handleCategoryChange}
                      label="Select Category"
                    >
                      <MenuItem value="">All Categories</MenuItem>
                      {Array.isArray(categories) && categories.map((category) => (
                        <MenuItem key={category.id} value={category.id.toString()}>
                          {category.name} ({category.products_count})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </ListItem>
              
              <ListItem>
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={inStockOnly} 
                      onChange={handleInStockChange} 
                      color="primary"
                    />
                  }
                  label="In Stock Only"
                />
              </ListItem>
              
              <ListItem>
                <Box sx={{ width: '100%' }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Price Range
                  </Typography>
                  <Slider
                    value={priceRange}
                    onChange={handlePriceRangeChange}
                    onChangeCommitted={handlePriceRangeCommitted}
                    valueLabelDisplay="auto"
                    min={0}
                    max={50000}
                    step={1000}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="body2">Ksh {priceRange[0].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</Typography>
                    <Typography variant="body2">Ksh {priceRange[1].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</Typography>
                  </Box>
                </Box>
              </ListItem>
            </List>
            
            <Box sx={{ p: 2 }}>
              <Button
                variant="contained"
                fullWidth
                onClick={toggleDrawer(false)}
              >
                Apply Filters
              </Button>
              <Button
                variant="outlined"
                fullWidth
                onClick={resetFilters}
                sx={{ mt: 1 }}
              >
                Reset Filters
              </Button>
            </Box>
          </Box>
        </Drawer>

        {error && (
          <Box textAlign="center" py={4}>
            <Typography color="error" gutterBottom>
              {error}
            </Typography>
            <Button variant="contained" onClick={fetchProducts}>
              Try Again
            </Button>
          </Box>
        )}

        {!loading && !error && products.length === 0 && (
          <Box textAlign="center" py={4}>
            <Typography variant="h6" gutterBottom>
              No products found
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Try adjusting your filters or search criteria
            </Typography>
            <Button variant="contained" onClick={() => {
              setSearchTerm('');
              setSelectedCategory('');
              setSortBy('');
              setInStockOnly(false);
              setPriceRange([0, 50000]);
              setPage(1);
            }}>
              Clear All Filters
            </Button>
          </Box>
        )}

        {loading ? (
          <Grid container spacing={2}>
          {[...Array(12)].map((_, index) => (
            <Grid item key={`skeleton-${index}`} xs={6} sm={4} md={3} lg={2}>
              <ProductSkeleton />
            </Grid>
          ))}
        </Grid>
        ) : error ? (
          <Box sx={{ textAlign: 'center', py: 5 }}>
            <Typography variant="h6" color="error" gutterBottom>
              {error}
            </Typography>
            <Button variant="contained" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </Box>
        ) : products.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 5 }}>
            <Typography variant="h6" gutterBottom>
              No products found
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Try changing your search criteria or check back later.
            </Typography>
            <Button variant="contained" onClick={resetFilters}>
              Clear Filters
            </Button>
          </Box>
        ) : (
          <>
            <Grid container spacing={2}>
            {products.map((product) => (
              <Grid item key={product.id} xs={6} sm={4} md={3} lg={2}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    transition: 'transform 0.2s',
                    maxWidth: '100%',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                    }
                  }}
                >
                  {product.discount_price && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 5,
                        left: 5,
                        bgcolor: 'error.main',
                        color: 'white',
                        px: 0.5,
                        py: 0.2,
                        borderRadius: 0.5,
                        fontSize: '0.65rem',
                        fontWeight: 'bold',
                        zIndex: 1
                      }}
                    >
                      {Math.round(((product.price - product.discount_price) / product.price) * 100)}% OFF
                    </Box>
                  )}
                  
                  <IconButton
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 5,
                      right: 5,
                      bgcolor: 'background.paper',
                      '&:hover': { 
                        bgcolor: 'rgba(255, 255, 255, 0.9)',
                        transform: 'scale(1.1)'
                      },
                      zIndex: 1,
                      padding: 0.5,
                      transition: 'all 0.2s ease'
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleWishlistItem(product);
                    }}
                  >
                    {isInWishlist(product.id) ? (
                      <FavoriteIcon sx={{ color: 'error.main' }} fontSize="small" />
                    ) : (
                      <FavoriteBorderIcon sx={{ color: 'action.active' }} fontSize="small" />
                    )}
                  </IconButton>
                  
                  <CardMedia
                    component={RouterLink}
                    to={`/product/${product.slug}`}
                    sx={{
                      pt: '70%',
                      position: 'relative',
                      backgroundSize: 'contain',
                      backgroundPosition: 'center',
                      cursor: 'pointer'
                    }}
                    image={product.feature_image || '/placeholder-product.png'}
                    title={product.name}
                  />
                  
                  <CardContent sx={{ flexGrow: 1, py: 1, px: 1.5 }}>
                    <Typography
                      variant="body2"
                      component={RouterLink}
                      to={`/product/${product.slug}`}
                      sx={{
                        textDecoration: 'none',
                        color: 'text.primary',
                        fontWeight: 'medium',
                        '&:hover': { color: 'primary.main' },
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: 1.2,
                        height: '2.4em',
                        fontSize: '0.85rem'
                      }}
                    >
                      {product.name}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                      {product.discount_price ? (
                        <>
                          <Typography variant="subtitle2" color="primary">
                            Ksh{typeof product.discount_price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") === 'number' ? product.discount_price.toFixed(0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : product.discount_price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="error"
                            sx={{ ml: 0.5, textDecoration: 'line-through' }}
                          >
                            Ksh{typeof product.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") === 'number' ? product.price.toFixed(0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : product.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                          </Typography>
                        </>
                      ) : (
                        <Typography variant="subtitle2" color="primary" fontWeight="medium">
                          Ksh{typeof product.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") === 'number' ? product.price.toFixed(0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : product.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                  
                  <CardActions sx={{ p: 1 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      size="small"
                      startIcon={<AddShoppingCartIcon fontSize="small" />}
                      disabled={!product.is_in_stock || addingToCart[product.id]}
                      onClick={() => handleAddToCart(product)}
                      sx={{ 
                          fontSize: '0.7rem', 
                          py: 0.5,
                          color: product.is_in_stock ? 'primary' : 'error.main',
                          borderColor: product.is_in_stock ? 'primary.main' : 'error.main',
                      }}
                    >
                      {addingToCart[product.id] 
                          ? 'Adding...' 
                          : product.is_in_stock 
                              ? 'Add to Cart' 
                              : 'Out of Stock'}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
            
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                  siblingCount={1}
                  size="large"
                />
              </Box>
            )}
          </>
        )}
      </Container>
    </>
  );
};

export default ShopPage;
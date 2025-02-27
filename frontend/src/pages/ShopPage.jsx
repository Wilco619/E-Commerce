import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Box,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider,
  Checkbox,
  FormControlLabel,
  Slider,
  IconButton,
  CircularProgress,
  Breadcrumbs,
  Link,
  Paper,
  Chip
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { productsAPI, cartAPI } from '../services/api';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import { useAuth } from '../authentication/AuthContext';
import { useCart } from '../authentication/CartContext';
import { useSnackbar } from 'notistack';


const ShopPage = () => {
  
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);

  const auth = useAuth();
  const isAuthenticated = auth.isAuthenticated && typeof auth.isAuthenticated === 'function' ? auth.isAuthenticated() : false;

  const { cart = null, addToCart, refreshCart } = useCart();
  const { enqueueSnackbar } = useSnackbar();
  
  // State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [addingToCart, setAddingToCart] = useState({});
  
  // Filter State
  const [searchTerm, setSearchTerm] = useState(queryParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(queryParams.get('category') || '');
  const [sortBy, setSortBy] = useState(queryParams.get('sort') || 'created_at');
  const [inStockOnly, setInStockOnly] = useState(queryParams.get('inStock') === 'true');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [page, setPage] = useState(parseInt(queryParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    // Fetch categories once
    const fetchCategories = async () => {
      try {
        const response = await productsAPI.getCategories();
        // Make sure categories is always an array
        setCategories(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setCategories([]); // Set to empty array on error
      }
    };

    fetchCategories();
    
    // Load favorites from localStorage
  const savedFavorites = localStorage.getItem('favorites');
  if (savedFavorites) {
    try {
      setFavorites(JSON.parse(savedFavorites));
    } catch (e) {
      console.error('Error parsing favorites from localStorage:', e);
    }
  }
}, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        
        // Build query parameters
        const params = {
          page,
          ordering: sortBy === 'price_asc' ? 'price' : sortBy === 'price_desc' ? '-price' : `-${sortBy}`
        };
        
        if (selectedCategory) {
          params.category = selectedCategory;
        }
        
        if (inStockOnly) {
          params.is_available = true;
        }
        
        let response;
        if (searchTerm) {
          response = await productsAPI.searchProducts(searchTerm);
        } else {
          response = await productsAPI.getProducts(params);
        }
        
        setProducts(response.data.results || response.data);
        setTotalPages(Math.ceil((response.data.count || response.data.length) / 12));
        setLoading(false);
      } catch (err) {
        setError('Failed to load products. Please try again later.');
        setLoading(false);
        console.error('Error fetching products:', err);
      }
    };

    fetchProducts();

    // Update URL with current filters
    const params = new URLSearchParams();
    if (searchTerm) params.set('q', searchTerm);
    if (selectedCategory) params.set('category', selectedCategory);
    if (sortBy) params.set('sort', sortBy);
    if (inStockOnly) params.set('inStock', 'true');
    if (page > 1) params.set('page', page.toString());
    
    const newUrl = `${location.pathname}?${params.toString()}`;
    navigate(newUrl, { replace: true });
  }, [searchTerm, selectedCategory, sortBy, inStockOnly, page, location.pathname, navigate]);

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

  const handleSortChange = (event) => {
    setSortBy(event.target.value);
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
    try {
      setAddingToCart({ ...addingToCart, [product.id]: true });
      
      console.log('Adding product to cart:', product.id);
      
      // Check if cart exists
      if (!cart) {
        console.log('No cart exists, creating one first');
      }
      
      const result = await addToCart(product.id, 1);
      console.log('Add to cart result:', result);
      
      enqueueSnackbar(`${product.name} added to cart`, { variant: 'success' });
    } catch (error) {
      console.error('Error adding to cart:', error);
      console.error('Error details:', error.response?.data || error.message);
      enqueueSnackbar(`Failed to add to cart: ${error.message}`, { variant: 'error' });
    } finally {
      setAddingToCart({ ...addingToCart, [product.id]: false });
    }
  };

  const toggleFavorite = (productId) => {
    let newFavorites;
    if (favorites.includes(productId)) {
      newFavorites = favorites.filter(id => id !== productId);
    } else {
      newFavorites = [...favorites, productId];
    }
    setFavorites(newFavorites);
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
  };

  return (
    <>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Breadcrumbs Navigation */}
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 3 }}>
          <Link component={RouterLink} to="/" color="inherit">
            Home
          </Link>
          <Typography color="text.primary">Shop</Typography>
        </Breadcrumbs>

        {/* Page Title and Filter Button */}
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

        {/* Search and Sort Bar */}
        <Paper elevation={1} sx={{ p: 2, mb: 4 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <form onSubmit={handleSearch}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={handleSearchInputChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                    endAdornment: searchTerm && (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setSearchTerm('')} edge="end">
                          <CloseIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </form>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="sort-select-label">Sort By</InputLabel>
                <Select
                  labelId="sort-select-label"
                  value={sortBy}
                  onChange={handleSortChange}
                  label="Sort By"
                >
                  <MenuItem value="created_at">Newest</MenuItem>
                  <MenuItem value="price_asc">Price: Low to High</MenuItem>
                  <MenuItem value="price_desc">Price: High to Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* Active Filters Display */}
        {(selectedCategory || inStockOnly || searchTerm) && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
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

        {/* Filter Drawer */}
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
                    <Typography variant="body2">Ksh {priceRange[0].toLocaleString()}</Typography>
                    <Typography variant="body2">Ksh {priceRange[1].toLocaleString()}</Typography>
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

        {/* Product Grid */}
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
            <CircularProgress />
          </Box>
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
            <Grid container spacing={3}>
              {products.map((product) => (
                <Grid item key={product.id} xs={12} sm={6} md={4} lg={3}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                      }
                    }}
                  >
                    {/* Discount badge */}
                    {product.discount_price && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 10,
                          left: 10,
                          bgcolor: 'error.main',
                          color: 'white',
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          zIndex: 1
                        }}
                      >
                        {Math.round(((product.price - product.discount_price) / product.price) * 100)}% OFF
                      </Box>
                    )}
                    
                    {/* Favorite button */}
                    <IconButton
                      sx={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        bgcolor: 'background.paper',
                        '&:hover': { bgcolor: 'background.paper' },
                        zIndex: 1
                      }}
                      onClick={() => toggleFavorite(product.id)}
                    >
                      {favorites.includes(product.id) ? (
                        <FavoriteIcon color="error" />
                      ) : (
                        <FavoriteBorderIcon />
                      )}
                    </IconButton>
                    
                    {/* Product image */}
                    <CardMedia
                      component={RouterLink}
                      to={`/product/${product.slug}`}
                      sx={{
                        pt: '80%',
                        position: 'relative',
                        backgroundSize: 'contain',
                        backgroundPosition: 'center',
                        cursor: 'pointer'
                      }}
                      image={product.feature_image || '/placeholder-product.png'}
                      title={product.name}
                    />
                    
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography
                        variant="subtitle1"
                        component={RouterLink}
                        to={`/product/${product.slug}`}
                        sx={{
                          textDecoration: 'none',
                          color: 'text.primary',
                          fontWeight: 'bold',
                          '&:hover': { color: 'primary.main' },
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: 1.2,
                          height: '2.4em'
                        }}
                      >
                        {product.name}
                      </Typography>
                      
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 1, mb: 0.5 }}
                      >
                        {product.category_name}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      {product.discount_price ? (
                        <>
                          <Typography variant="h6" color="primary" fontWeight="bold">
                            Ksh{typeof product.discount_price === 'number' ? product.discount_price.toFixed(2) : product.discount_price}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ ml: 1, textDecoration: 'line-through' }}
                          >
                            Ksh{typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
                          </Typography>
                        </>
                      ) : (
                        <Typography variant="h6" color="primary" fontWeight="bold">
                          Ksh{typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
                        </Typography>
                      )}
                      </Box>
                    </CardContent>
                    
                    <CardActions>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<AddShoppingCartIcon />}
                        disabled={!product.is_available || addingToCart[product.id]}
                        onClick={() => handleAddToCart(product)}
                      >
                        {addingToCart[product.id] ? 'Adding...' : product.is_available ? 'Add to Cart' : 'Out of Stock'}
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
            
            {/* Pagination */}
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

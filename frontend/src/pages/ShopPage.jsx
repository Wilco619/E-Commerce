import React, { useState, useEffect } from 'react';
import { 
  Container, Box, Typography, Button, Paper, Grid, TextField, InputAdornment, IconButton, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Checkbox, Slider, Drawer, List, ListItem, Chip, CircularProgress, Pagination, Breadcrumbs, Link, Card, CardMedia, CardContent, CardActions 
} from '@mui/material';
import { useLocation, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../authentication/AuthContext';
import { useCart } from '../authentication/CartContext';
import { useSnackbar } from 'notistack';
import { productsAPI } from '../services/api';
import { Search as SearchIcon, Close as CloseIcon, FilterList as FilterListIcon, AddShoppingCart as AddShoppingCartIcon, Favorite as FavoriteIcon, FavoriteBorder as FavoriteBorderIcon, NavigateNext as NavigateNextIcon } from '@mui/icons-material';
import { Divider } from '@mui/material';

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
        setCategories(response.data.results || response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
    
    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await productsAPI.getProducts({
          search: searchTerm,
          category: selectedCategory,
          sort: sortBy,
          inStock: inStockOnly,
          price_min: priceRange[0],
          price_max: priceRange[1],
          page: page,
        });
        setProducts(response.data.results);
        setTotalPages(response.data.total_pages);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching products:', error);
        setError('Failed to load products. Please try again.');
        setLoading(false);
      }
    };

    fetchProducts();

    // Update URL with current filters
    const params = new URLSearchParams();
    if (searchTerm) params.set('q', searchTerm);
    if (selectedCategory) params.set('category', selectedCategory);
    if (sortBy) params.set('sort', sortBy);
    if (inStockOnly) params.set('inStock', inStockOnly);
    if (page > 1) params.set('page', page);
    
    const newUrl = `${location.pathname}?${params.toString()}`;
    navigate(newUrl, { replace: true });
  }, [searchTerm, selectedCategory, sortBy, inStockOnly, priceRange, page, location.pathname, navigate]);

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
      setAddingToCart((prev) => ({ ...prev, [product.id]: true }));
      await addToCart(product.id, 1);
      enqueueSnackbar('Product added to cart', { variant: 'success' });
      refreshCart(); // Refresh the cart to update the cart icon count
      setProducts((prevProducts) =>
        prevProducts.map((p) =>
          p.id === product.id ? { ...p, stock: p.stock - 1 } : p
        )
      );
    } catch (error) {
      console.error('Error adding to cart:', error);
      enqueueSnackbar('Failed to add product to cart', { variant: 'error' });
    } finally {
      setAddingToCart((prev) => ({ ...prev, [product.id]: false }));
    }
  };

  const toggleFavorite = (productId) => {
    let newFavorites;
    if (favorites.includes(productId)) {
      newFavorites = favorites.filter((id) => id !== productId);
    } else {
      newFavorites = [...favorites, productId];
    }
    setFavorites(newFavorites);
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
  };

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
                      '&:hover': { bgcolor: 'background.paper' },
                      zIndex: 1,
                      padding: 0.5
                    }}
                    onClick={() => toggleFavorite(product.id)}
                  >
                    {favorites.includes(product.id) ? (
                      <FavoriteIcon color="error" fontSize="small" />
                    ) : (
                      <FavoriteBorderIcon fontSize="small" />
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
                    
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', mt: 0.5 }}
                    >
                      {product.category_name}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                      {product.discount_price ? (
                        <>
                          <Typography variant="subtitle2" color="primary">
                            Ksh{typeof product.discount_price === 'number' ? product.discount_price.toFixed(0) : product.discount_price}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="error"
                            sx={{ ml: 0.5, textDecoration: 'line-through' }}
                          >
                            Ksh{typeof product.price === 'number' ? product.price.toFixed(0) : product.price}
                          </Typography>
                        </>
                      ) : (
                        <Typography variant="subtitle2" color="primary" fontWeight="medium">
                          Ksh{typeof product.price === 'number' ? product.price.toFixed(0) : product.price}
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
                      disabled={!product.is_available || addingToCart[product.id]}
                      onClick={() => handleAddToCart(product)}
                      sx={{ fontSize: '0.7rem', py: 0.5 }}
                    >
                      {addingToCart[product.id] ? 'Adding...' : product.is_available ? 'Add to Cart' : 'Out of Stock'}
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

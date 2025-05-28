import React, { useState, useEffect } from 'react';
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
  Pagination,
  Stack
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { productsAPI, cartAPI } from '../services/api';
import { useSnackbar } from 'notistack';
import { useCart } from '../authentication/CartContext';
import { useAuth } from '../authentication/AuthContext';

const CategoryPage = () => {
  const { slug } = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const [categoryDetails, setCategoryDetails] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  const productsPerPage = 20;
  
  // Use the cart context instead of managing cart state locally
  const { addToCart, loading: cartLoading, fetchCart, cart } = useCart();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        setLoading(true);
        const [categoryResponse, productsResponse] = await Promise.all([
          productsAPI.getCategory(slug),
          productsAPI.getCategoryProducts(slug, {
            page: currentPage,
            page_size: productsPerPage
          })
        ]);

        setCategoryDetails(categoryResponse.data);
        
        // Handle different response structures
        if (productsResponse.data.results) {
          // Paginated response
          setProducts(productsResponse.data.results);
          setTotalProducts(productsResponse.data.count);
          setTotalPages(Math.ceil(productsResponse.data.count / productsPerPage));
        } else {
          // Non-paginated response - implement client-side pagination
          const allProducts = productsResponse.data;
          setTotalProducts(allProducts.length);
          setTotalPages(Math.ceil(allProducts.length / productsPerPage));
          
          const startIndex = (currentPage - 1) * productsPerPage;
          const endIndex = startIndex + productsPerPage;
          setProducts(allProducts.slice(startIndex, endIndex));
        }
        
      } catch (err) {
        setError('Failed to load category. Please try again later.');
        console.error('Error fetching category:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, [slug, currentPage]);

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  // Render product card with image taking full height and overlay content
  const renderProductCard = (product) => {
    const isOutOfStock = !product.is_available || product.stock <= 0;
    const isLowStock = product.stock <= 5 && product.stock > 0;
    const existingInCart = cart?.items?.find(item => item.product.id === product.id);
    const canAddToCart = !isOutOfStock && (!existingInCart || existingInCart.quantity < product.stock);
    
    return (
      <Card 
        elevation={2}
        component={RouterLink}
        to={`/product/${product.slug}`}
        sx={{ 
          width: '100%',
          textDecoration: 'none',
          color: 'inherit',
          height: isMobile ? '200px' : isTablet ? '240px' : '280px', // Reduced heights
          position: 'relative',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 6,
          },
          borderRadius: 2,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Product Image Container */}
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: '100%',
            backgroundColor: 'grey.100'
          }}
        >
          {product.feature_image ? (
            <CardMedia
              component="img"
              image={product.feature_image}
              alt={product.name}
              sx={{ 
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.05)'
                }
              }}
            />
          ) : (
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ShoppingBagIcon sx={{ fontSize: isMobile ? 40 : 60, color: 'grey.400' }} />
            </Box>
          )}

          {/* Dark Overlay */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 30%, rgba(0, 0, 0, 0.44) 70%, rgba(0,0,0,0.85) 100%)',
              zIndex: 1,
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 30%, rgba(0,0,0,0.8) 70%, rgba(0,0,0,0.9) 100%)',
              }
            }}
          />

          {/* Content Overlays */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 2,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              p: isMobile ? 1 : 1.5 // Reduced padding
            }}
          >
            {/* Top Row - Status Chips */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              {/* Stock Status */}
              <Box>
                {isOutOfStock ? (
                  <Chip 
                    label="Out of Stock" 
                    color="error"
                    size="small"
                    sx={{ 
                      backgroundColor: 'rgba(244, 67, 54, 0.9)',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: isMobile ? '0.6rem' : '0.7rem',
                      height: isMobile ? '18px' : '24px'
                    }}
                  />
                ) : isLowStock ? (
                  <Chip 
                    label={`Only ${product.stock} left`}
                    color="warning"
                    size="small"
                    sx={{ 
                      backgroundColor: 'rgba(255, 152, 0, 0.9)',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: isMobile ? '0.6rem' : '0.7rem',
                      height: isMobile ? '18px' : '24px'
                    }}
                  />
                ) : null}
              </Box>

              {/* Discount Badge */}
              {product.discount_price && (
                <Chip
                  label={`${Math.round((1 - product.discount_price / product.price) * 100)}% OFF`}
                  color="error"
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(244, 67, 54, 0.95)',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: isMobile ? '0.6rem' : '0.7rem',
                    height: isMobile ? '18px' : '24px'
                  }}
                />
              )}
            </Box>

            {/* Bottom Content */}
            <Box>
              <Typography 
                variant="h6"
                sx={{ 
                  color: 'white',
                  fontSize: isMobile ? '0.75rem' : isTablet ? '0.85rem' : '0.95rem',
                  fontWeight: 600,
                  mb: isMobile ? 0.5 : 1,
                  textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  lineHeight: 1.2
                }}
              >
                {product.name}
              </Typography>

              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                flexWrap: isMobile ? 'wrap' : 'nowrap',
                gap: isMobile ? 0.5 : 1
              }}>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  {product.discount_price ? (
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, flexWrap: 'wrap' }}>
                          <Typography 
                            sx={{ 
                              color: 'orange',
                              textDecoration: 'line-through',
                              fontWeight: 700,
                              fontSize: isMobile ? '0.65rem' : '0.75rem',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            Ksh{product.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                          </Typography>
                          <Typography 
                            sx={{ 
                              color: '#4CAF50',
                              fontWeight: 700,
                              fontSize: isMobile ? '0.8rem' : '0.9rem',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            Ksh{product.discount_price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                          </Typography>
                      </Box>
                  ) : (
                    <Typography 
                      sx={{ 
                        color: '#4CAF50',
                        fontWeight: 700,
                        fontSize: isMobile ? '0.8rem' : '0.9rem',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Ksh{product.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                    </Typography>
                  )}
                </Box>

                <Button
                  variant="contained"
                  size="small"
                  startIcon={isMobile ? null : <AddShoppingCartIcon />}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAddToCart(product);
                  }}
                  disabled={!canAddToCart || cartLoading}
                  sx={{ 
                    borderRadius: 1.5,
                    textTransform: 'none',
                    backgroundColor: 'primary.main',
                    minWidth: isMobile ? '50px' : 'auto',
                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                    px: isMobile ? 1 : 1.5,
                    py: isMobile ? 0.5 : 0.75,
                    flexShrink: 0,
                    '&:hover': {
                      backgroundColor: 'primary.dark'
                    }
                  }}
                >
                  {isMobile ? (
                    <AddShoppingCartIcon sx={{ fontSize: '16px' }} />
                  ) : (
                    cartLoading ? 'Adding...' : 'Add'
                  )}
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
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
        </Box>
        <Grid container spacing={2}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
            <Grid item key={item} xs={6} sm={4} md={3} lg={3}>
              <Skeleton 
                variant="rectangular" 
                height={isMobile ? 200 : isTablet ? 240 : 280} 
                sx={{ borderRadius: 1.5 }} 
              />
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
        
        {/* Products count */}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {totalProducts} product{totalProducts !== 1 ? 's' : ''} found
        </Typography>
      </Paper>

      {/* Product Grid */}
      {products.length > 0 ? (
        <>
          <Grid container spacing={2}>
            {products.map((product) => (
              <Grid 
                item 
                key={product.id} 
                xs={6} 
                sm={4} 
                md={3} 
                lg={3}
                sx={{ display: 'flex' }}
              >
                {renderProductCard(product)}
              </Grid>
            ))}
          </Grid>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <Stack spacing={2} alignItems="center" sx={{ mt: 4 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                size={isMobile ? "small" : "medium"}
                showFirstButton
                showLastButton
                sx={{
                  '& .MuiPaginationItem-root': {
                    borderRadius: 1.5,
                  }
                }}
              />
              <Typography variant="body2" color="text.secondary">
                Showing {((currentPage - 1) * productsPerPage) + 1} - {Math.min(currentPage * productsPerPage, totalProducts)} of {totalProducts} products
              </Typography>
            </Stack>
          )}
        </>
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
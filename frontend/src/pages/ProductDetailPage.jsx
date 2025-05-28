import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Box,
  Button,
  Paper,
  Divider,
  TextField,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link,
  Tabs,
  Tab,
  Snackbar,
  Skeleton,
  Card,
  CardContent,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { productsAPI, cartAPI } from '../services/api';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import { useSnackbar } from 'notistack';
import { useCart } from '../authentication/CartContext';

const ProductDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { cart, addToCart, fetchCart } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await productsAPI.getProduct(slug);
        setProduct(response.data);
        if (response.data.images && response.data.images.length > 0) {
          const featureImage = response.data.images.find(img => img.is_feature);
          setSelectedImage(featureImage ? featureImage.image : response.data.images[0].image);
        }
        setLoading(false);
      } catch (err) {
        setError('Failed to load product. Please try again later.');
        setLoading(false);
        console.error('Error fetching product:', err);
      }
    };

    fetchProduct();
  }, [slug]);

  const handleAddToCart = async () => {
    if (!product.is_available || product.stock <= 0) {
        enqueueSnackbar('Product is out of stock', { variant: 'error' });
        return;
    }

    try {
        // Get current cart state to check existing quantity
        const cartResponse = await cartAPI.getCurrentCart();
        const existingItem = cartResponse.data.items?.find(
            item => item.product.id === product.id
        );
        
        const currentQuantity = existingItem ? existingItem.quantity : 0;
        const totalQuantity = currentQuantity + quantity;

        if (totalQuantity > product.stock) {
            enqueueSnackbar(
                `Cannot add ${quantity} more. Only ${product.stock - currentQuantity} available`,
                { variant: 'warning' }
            );
            return;
        }

        setAddingToCart(true);
        await addToCart(product.id, quantity);
        enqueueSnackbar(`Added ${quantity} item(s) to cart`, { variant: 'success' });
        await fetchCart();
    } catch (error) {
        console.error('Error adding to cart:', error);
        enqueueSnackbar(
            error.response?.data?.error || 'Failed to add product to cart',
            { variant: 'error' }
        );
    } finally {
        setAddingToCart(false);
    }
  };

  const handleQuantityChange = (event) => {
    const newQuantity = parseInt(event.target.value);
    if (!isNaN(newQuantity)) {
        // Get current quantity in cart
        const currentInCart = cart?.items?.find(
            item => item.product.id === product.id
        )?.quantity || 0;
        
        const remainingStock = product.stock - currentInCart;

        if (newQuantity <= 0) {
            setQuantity(1);
        } else if (newQuantity > remainingStock) {
            enqueueSnackbar(
                `Cannot add ${newQuantity} more. Only ${remainingStock} available`,
                { variant: 'warning' }
            );
            setQuantity(remainingStock > 0 ? remainingStock : 1);
        } else {
            setQuantity(newQuantity);
        }
    }
  };

  const handleBuyNow = async () => {
    if (!cart) {
        enqueueSnackbar('Cart not found. Please try again.', { variant: 'error' });
        return;
    }

    // Check if item already exists in cart
    const existingItem = cart.items?.find(item => item.product.id === product.id);
    
    if (existingItem) {
        // If item exists in cart, just navigate to cart
        navigate('/cart');
        return;
    }

    // If item doesn't exist in cart, add it first
    if (!product.is_available || product.stock <= 0) {
        enqueueSnackbar('Product is out of stock', { variant: 'error' });
        return;
    }

    try {
        // Get current cart state to check stock
        const cartResponse = await cartAPI.getCurrentCart();
        const currentItem = cartResponse.data.items?.find(
            item => item.product.id === product.id
        );
        
        // Double check in case cart was updated
        if (currentItem) {
            navigate('/cart');
            return;
        }

        if (quantity > product.stock) {
            enqueueSnackbar(
                `Cannot add ${quantity} items. Only ${product.stock} available`,
                { variant: 'warning' }
            );
            return;
        }

        setAddingToCart(true);
        await addToCart(product.id, quantity);
        await fetchCart();
        navigate('/cart');
    } catch (error) {
        console.error('Error with buy now:', error);
        enqueueSnackbar('Failed to process buy now. Please try again.', { variant: 'error' });
    } finally {
        setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
        <Box sx={{ mb: 3 }}>
          <Skeleton variant="text" width="70%" height={30} />
        </Box>
        
        <Grid container spacing={{ xs: 2, md: 4 }}>
          {/* Product Images Skeleton */}
          <Grid item xs={12} md={6}>
            <Card elevation={3} sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Skeleton variant="rectangular" width="100%" height={400} sx={{ borderRadius: 2 }} />
                <Box sx={{ mt: 2 }}>
                  <Grid container spacing={1}>
                    {[1, 2, 3, 4].map((item) => (
                      <Grid item key={item} xs={3}>
                        <Skeleton variant="rectangular" width="100%" height={70} sx={{ borderRadius: 1 }} />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Product Information Skeleton */}
          <Grid item xs={12} md={6}>
            <Card elevation={3} sx={{ borderRadius: 3, height: 'fit-content' }}>
              <CardContent sx={{ p: 3 }}>
                <Skeleton variant="text" width="80%" height={50} />
                <Skeleton variant="text" width="40%" height={40} sx={{ mb: 2 }} />
                
                <Box sx={{ mb: 3 }}>
                  <Skeleton variant="text" width="60%" height={30} />
                  <Skeleton variant="text" width="50%" height={30} />
                  <Skeleton variant="text" width="40%" height={30} />
                </Box>
                
                <Divider sx={{ mb: 3 }} />
                
                <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                  <Skeleton variant="rectangular" width="48%" height={40} sx={{ borderRadius: 2 }} />
                  <Skeleton variant="rectangular" width="48%" height={40} sx={{ borderRadius: 2 }} />
                </Box>
                
                <Skeleton variant="rectangular" width="60%" height={35} sx={{ borderRadius: 2 }} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Description Skeleton */}
        <Card elevation={3} sx={{ mt: 4, borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Skeleton variant="text" width="100%" height={30} />
            <Skeleton variant="text" width="100%" height={30} />
            <Skeleton variant="text" width="80%" height={30} />
            <Skeleton variant="text" width="90%" height={30} />
          </CardContent>
        </Card>
      </Container>
    );
  }

  if (error || !product) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error || 'Product not found'}
        </Alert>
        <Button 
          component={RouterLink} 
          to="/shop" 
          variant="contained"
          sx={{ borderRadius: 2, textTransform: 'none' }}
        >
          Back to Shop
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      <Breadcrumbs 
        separator={<NavigateNextIcon fontSize="small" />} 
        sx={{ 
          mb: { xs: 2, md: 4 }, 
          px: 1,
          display: { xs: 'none', sm: 'flex' } // Hide on extra small screens
        }}
      >
        <Link 
          component={RouterLink} 
          to="/" 
          color="inherit"
          sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
        >
          Home
        </Link>
        <Link 
          component={RouterLink} 
          to="/shop" 
          color="inherit"
          sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
        >
          Shop
        </Link>
        {product.category_slug && (
          <Link
            component={RouterLink}
            to={`/category/${product.category_slug}`}
            color="inherit"
            sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            {product.category}
          </Link>
        )}
        <Typography color="text.primary" fontWeight={500}>
          {product.name}
        </Typography>
      </Breadcrumbs>

      <Grid container spacing={{ xs: 2, md: 4 }}>
        {/* Product Images */}
        <Grid item xs={12} md={6}>
          <Card elevation={3} sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box
                component="img"
                src={selectedImage || '/placeholder-product.jpg'}
                alt={product.name}
                sx={{
                  width: '100%',
                  height: { xs: 280, sm: 350, md: 400 },
                  objectFit: 'contain',
                  borderRadius: 2,
                  backgroundColor: 'grey.50',
                  mb: { xs: 1, md: 2 }
                }}
              />
              
              {product.images && product.images.length > 1 && (
                <Grid container spacing={0.5}>
                  {product.images.map((image) => (
                    <Grid item key={image.id} xs={3}>
                      <Box
                        component="img"
                        src={image.image}
                        alt={`${product.name} thumbnail`}
                        onClick={() => setSelectedImage(image.image)}
                        sx={{
                          width: '100%',
                          height: { xs: 60, sm: 70 },
                          objectFit: 'cover',
                          cursor: 'pointer',
                          border: selectedImage === image.image ? '2px solid' : '1px solid',
                          borderColor: selectedImage === image.image ? 'primary.main' : 'grey.300',
                          borderRadius: 1,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            borderColor: 'primary.main',
                            transform: 'scale(1.05)'
                          }
                        }}
                      />
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Product Information */}
        <Grid item xs={12} md={6}>
          <Card elevation={3} sx={{ borderRadius: 3, height: 'fit-content' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography 
                variant="h4" 
                component="h1" 
                gutterBottom
                sx={{ 
                  fontWeight: 600, 
                  lineHeight: 1.2,
                  fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }
                }}
              >
                {product.name}
              </Typography>
              
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 3,
                flexWrap: { xs: 'wrap', sm: 'nowrap' },
                gap: { xs: 1, sm: 0 }
              }}>
                {product.discount_price ? (
                  <>
                    <Typography 
                      variant="h4" 
                      color="primary" 
                      sx={{ 
                        mr: 2, 
                        fontWeight: 700,
                        fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }
                      }}
                    >
                      Ksh{product.discount_price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                    </Typography>
                    <Typography 
                      variant="h6" 
                      color="orange" 
                      fontWeight="700"
                      sx={{ 
                        textDecoration: 'line-through', 
                        mr: 1,
                        fontSize: { xs: '1rem', sm: '1.25rem' }
                      }}
                    >
                      Ksh{product.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                    </Typography>
                  </>
                ) : (
                  <Typography 
                    variant="h4" 
                    color="primary" 
                    sx={{ 
                      fontWeight: 700,
                      fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }
                    }}
                  >
                    Ksh{product.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  </Typography>
                )}
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" sx={{ mb: 1.5, color: 'text.secondary' }}>
                  Category: <Box component="span" sx={{ color: 'text.primary', fontWeight: 500 }}>{product.category}</Box>
                </Typography>
                
                <Typography variant="body1" sx={{ mb: 1.5, color: 'text.secondary' }}>
                  Availability: 
                  <Box component="span" sx={{ 
                    color: product.is_available && product.stock > 0 ? 'success.main' : 'error.main',
                    fontWeight: 600,
                    ml: 1
                  }}>
                    {!product.is_available ? 'Not Available' :
                      product.stock > 0 ? 
                        product.stock <= 5 ? 
                          `Low Stock (${product.stock} left)` : 
                          'In Stock' 
                        : 'Out of Stock'
                    }
                  </Box>
                </Typography>

                {product.is_available && (
                  <Typography variant="body1" sx={{ 
                    color: product.stock <= 5 ? 'warning.main' : 'text.secondary',
                    fontWeight: product.stock <= 5 ? 600 : 400
                  }}>
                    Stock: <Box component="span" sx={{ color: 'text.primary', fontWeight: 500 }}>
                      {product.stock}
                    </Box> {product.stock === 1 ? 'item' : 'items'} available
                  </Typography>
                )}

                {/* Show cart quantity if item exists in cart */}
                {cart?.items?.find(item => item.product.id === product.id)?.quantity > 0 && (
                  <Box
                    sx={{
                      mt: 1.5,
                      p: 1.5,
                      backgroundColor: 'info.light',
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'info.main'
                    }}
                  >
                    <Typography variant="body2" sx={{ color: 'info.dark', fontWeight: 500 }}>
                      Currently in cart: {cart.items.find(item => item.product.id === product.id).quantity} item(s)
                    </Typography>
                  </Box>
                )}
              </Box>

              <Divider sx={{ mb: 3 }} />

              {/* Action Buttons */}
              {product.is_available && product.stock > 0 ? (
                <>
                  <Box sx={{ 
                    display: 'flex', 
                    gap: { xs: 1, sm: 1.5 }, 
                    mb: 2,
                    flexDirection: { xs: 'column', sm: 'row' }
                  }}>
                    <Button
                      variant="contained"
                      startIcon={<ShoppingCartIcon />}
                      onClick={handleAddToCart}
                      disabled={addingToCart}
                      sx={{ 
                        flex: { xs: '1 1 auto', sm: 1 },
                        py: { xs: 1.5, sm: 1 },
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 500,
                        fontSize: { xs: '1rem', sm: '0.9rem' }
                      }}
                    >
                      {addingToCart ? 'Adding...' : 'Add to Cart'}
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<FlashOnIcon />}
                      onClick={handleBuyNow}
                      disabled={addingToCart}
                      sx={{ 
                        flex: { xs: '1 1 auto', sm: 1 },
                        py: { xs: 1.5, sm: 1 },
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 500,
                        fontSize: { xs: '1rem', sm: '0.9rem' }
                      }}
                    >
                      {addingToCart ? 'Processing...' : 'Buy Now'}
                    </Button>
                  </Box>

                  <Button 
                    variant="text" 
                    onClick={() => navigate('/shop')}
                    sx={{ 
                      py: 0.75,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 400,
                      fontSize: '0.85rem',
                      color: 'text.secondary',
                      '&:hover': {
                        backgroundColor: 'action.hover'
                      }
                    }}
                  >
                    Continue Shopping
                  </Button>
                </>
              ) : (
                <Alert 
                  severity="warning" 
                  sx={{ 
                    borderRadius: 2,
                    '& .MuiAlert-message': {
                      fontSize: '0.9rem'
                    }
                  }}
                >
                  This product is currently out of stock.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Product Description */}
      {product.description && (
        <Card elevation={3} sx={{ 
          mt: { xs: 2, md: 4 }, 
          borderRadius: 3 
        }}>
          <CardContent sx={{ 
            p: { xs: 2, md: 3 }
          }}>
            <Typography 
              variant="h6" 
              gutterBottom 
              sx={{ fontWeight: 600, mb: 2 }}
            >
              Product Description
            </Typography>
            <Typography 
              variant="body1" 
              component="div" 
              sx={{ 
                whiteSpace: 'pre-line',
                lineHeight: 1.7,
                color: 'text.secondary',
                fontSize: { xs: '0.9rem', sm: '1rem' }
              }}
            >
              {product.description}
            </Typography>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default ProductDetailPage;
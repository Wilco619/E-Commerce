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
  Snackbar
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { productsAPI, cartAPI } from '../services/api';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

const ProductDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [cart, setCart] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

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

    const fetchCart = async () => {
      try {
        const response = await cartAPI.getCart();
        if (response.data && response.data.length > 0) {
          setCart(response.data[0]);
        } else {
          const newCartResponse = await cartAPI.createCart();
          setCart(newCartResponse.data);
        }
      } catch (err) {
        console.error('Error fetching cart:', err);
      }
    };

    fetchProduct();
    fetchCart();
  }, [slug]);

  const handleQuantityChange = (event) => {
    const value = parseInt(event.target.value);
    if (value > 0 && value <= (product?.stock || 1)) {
      setQuantity(value);
    }
  };

  const handleAddToCart = async () => {
    if (!cart) return;
    
    try {
      await cartAPI.addToCart(cart.id, {
        product_id: product.id,
        quantity: quantity
      });
      
      setSnackbar({
        open: true,
        message: 'Product added to cart!',
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to add product to cart. Please try again.',
        severity: 'error'
      });
      console.error('Error adding to cart:', err);
    }
  };

  const handleBuyNow = async () => {
    try {
      if (!cart) return;
      
      await cartAPI.addToCart(cart.id, {
        product_id: product.id,
        quantity: quantity
      });
      
      navigate('/cart');
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to process buy now. Please try again.',
        severity: 'error'
      });
      console.error('Error with buy now:', err);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !product) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Product not found'}
        </Alert>
        <Button component={RouterLink} to="/shop" variant="contained">
          Back to Shop
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 3 }}>
        <Link component={RouterLink} to="/" color="inherit">
          Home
        </Link>
        <Link component={RouterLink} to="/shop" color="inherit">
          Shop
        </Link>
        {product.category_slug && (
          <Link
            component={RouterLink}
            to={`/category/${product.category_slug}`}
            color="inherit"
          >
            {product.category}
          </Link>
        )}
        <Typography color="text.primary">{product.name}</Typography>
      </Breadcrumbs>

      <Grid container spacing={4}>
        {/* Product Images */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
            <Box
              component="img"
              src={selectedImage || '/placeholder-product.jpg'}
              alt={product.name}
              sx={{
                width: '100%',
                height: 400,
                objectFit: 'contain',
                mb: 2
              }}
            />
            
            {product.images && product.images.length > 1 && (
              <Grid container spacing={1}>
                {product.images.map((image) => (
                  <Grid item key={image.id} xs={3}>
                    <Box
                      component="img"
                      src={image.image}
                      alt={`${product.name} thumbnail`}
                      onClick={() => setSelectedImage(image.image)}
                      sx={{
                        width: '100%',
                        height: 80,
                        objectFit: 'cover',
                        cursor: 'pointer',
                        border: selectedImage === image.image ? '2px solid #1976d2' : '1px solid #ddd',
                        borderRadius: 1
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </Grid>

        {/* Product Information */}
        <Grid item xs={12} md={6}>
          <Typography variant="h4" component="h1" gutterBottom>
            {product.name}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            {product.discount_price ? (
              <>
                <Typography variant="h4" color="error" sx={{ mr: 2 }}>
                  Ksh{product.discount_price}
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                  Ksh{product.price}
                </Typography>
                <Typography variant="body1" color="error" sx={{ ml: 2 }}>
                  {Math.round(((product.price - product.discount_price) / product.price) * 100)}% OFF
                </Typography>
              </>
            ) : (
              <Typography variant="h4">
                Ksh{product.price}
              </Typography>
            )}
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              Category: <strong>{product.category}</strong>
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              Availability: 
              <strong style={{ color: product.is_available && product.stock > 0 ? 'green' : 'red' }}>
                {product.is_available && product.stock > 0 ? ' In Stock' : ' Out of Stock'}
              </strong>
            </Typography>
            {product.stock > 0 && (
              <Typography variant="body1">
                Stock: <strong>{product.stock} items</strong>
              </Typography>
            )}
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Quantity and Add to Cart */}
          {product.is_available && product.stock > 0 ? (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Typography variant="body1" sx={{ mr: 2 }}>
                  Quantity:
                </Typography>
                <TextField
                  type="number"
                  variant="outlined"
                  size="small"
                  value={quantity}
                  onChange={handleQuantityChange}
                  inputProps={{ min: 1, max: product.stock }}
                  sx={{ width: 80 }}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
                <Button
                  variant="contained"
                  startIcon={<ShoppingCartIcon />}
                  onClick={handleAddToCart}
                  size="large"
                  fullWidth
                >
                  Add to Cart
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleBuyNow}
                  size="large"
                  fullWidth
                >
                  Buy Now
                </Button>
              </Box>
            </>
          ) : (
            <Alert severity="warning" sx={{ mb: 3 }}>
              This product is currently out of stock.
            </Alert>
          )}
        </Grid>
      </Grid>

      {/* Product Description and Details Tabs */}
      <Box sx={{ mt: 6 }}>
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="Description" />
          <Tab label="Additional Information" />
        </Tabs>

        <Paper elevation={1} sx={{ p: 3 }}>
          {activeTab === 0 && (
            <Typography variant="body1" component="div" sx={{ whiteSpace: 'pre-line' }}>
              {product.description}
            </Typography>
          )}
          
          {activeTab === 1 && (
            <Box>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>SKU:</strong> {product.id}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Added:</strong> {new Date(product.created_at).toLocaleDateString()}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Last Updated:</strong> {new Date(product.updated_at).toLocaleDateString()}
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ProductDetailPage;

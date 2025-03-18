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
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { productsAPI, cartAPI } from '../services/api';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { useSnackbar } from 'notistack';
import { useCart } from '../authentication/CartContext';

const ProductDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState(0);
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

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Skeleton variant="text" width="70%" height={30} />
        </Box>
        
        <Grid container spacing={4}>
          {/* Product Images Skeleton */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
              <Skeleton variant="rectangular" width="100%" height={400} />
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={1}>
                  {[1, 2, 3, 4].map((item) => (
                    <Grid item key={item} xs={3}>
                      <Skeleton variant="rectangular" width="100%" height={80} />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Paper>
          </Grid>

          {/* Product Information Skeleton */}
          <Grid item xs={12} md={6}>
            <Skeleton variant="text" width="80%" height={60} />
            <Skeleton variant="text" width="40%" height={50} sx={{ mb: 2 }} />
            
            <Box sx={{ mb: 3 }}>
              <Skeleton variant="text" width="60%" height={30} />
              <Skeleton variant="text" width="50%" height={30} />
              <Skeleton variant="text" width="40%" height={30} />
            </Box>
            
            <Divider sx={{ mb: 3 }} />
            
            <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
              <Skeleton variant="rectangular" width="100%" height={50} />
              <Skeleton variant="rectangular" width="100%" height={50} />
            </Box>
            
            <Skeleton variant="rectangular" width="50%" height={50} />
          </Grid>
        </Grid>

        {/* Tabs Skeleton */}
        <Box sx={{ mt: 6 }}>
          <Skeleton variant="rectangular" width="30%" height={40} sx={{ mb: 2 }} />
          <Paper elevation={1} sx={{ p: 3 }}>
            <Skeleton variant="text" width="100%" height={30} />
            <Skeleton variant="text" width="100%" height={30} />
            <Skeleton variant="text" width="80%" height={30} />
            <Skeleton variant="text" width="90%" height={30} />
          </Paper>
        </Box>
      </Container>
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
                <Typography variant="h4" color="primary" sx={{ mr: 2 , fontSize: "1.7rem" }}>
                  Ksh{product.discount_price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                </Typography>
                <Typography variant="h6" color="error" sx={{ textDecoration: 'line-through' }}>
                  Ksh{product.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                </Typography>
                <Typography variant="body1" color="error" sx={{ ml: 2 }}>
                  {Math.round(((product.price - product.discount_price) / product.price) * 100)}% OFF
                </Typography>
              </>
            ) : (
              <Typography variant="h4">
                Ksh{product.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              </Typography>
            )}
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              Category: <strong>{product.category}</strong>
            </Typography>
            
            <Typography variant="body1" sx={{ mb: 1 }}>
                Availability: 
                <Box component="span" sx={{ 
                    color: product.is_available && product.stock > 0 ? 'success.main' : 'error.main',
                    fontWeight: 'bold',
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
                    color: product.stock <= 5 ? 'warning.main' : 'text.primary',
                    fontWeight: product.stock <= 5 ? 'medium' : 'regular'
                }}>
                    Stock: <strong>{product.stock}</strong> {product.stock === 1 ? 'item' : 'items'} available
                </Typography>
            )}

            {/* Show cart quantity if item exists in cart */}
            {cart?.items?.find(item => item.product.id === product.id)?.quantity > 0 && (
                <Typography variant="body1" sx={{ mt: 1, color: 'info.main' }}>
                    Currently in cart: <strong>
                        {cart.items.find(item => item.product.id === product.id).quantity}
                    </strong>
                </Typography>
            )}
        </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Quantity and Add to Cart */}
          {product.is_available && product.stock > 0 ? (
          <>
            <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
              <Button
                variant="contained"
                startIcon={<ShoppingCartIcon />}
                onClick={handleAddToCart}
                size="large"
                sx={{ py: 1.5, flex: 1 }}
                disabled={addingToCart}
              >
                {addingToCart ? 'Adding...' : 'Add to Cart'}
              </Button>
              <Button
                variant="outlined"
                onClick={handleBuyNow}
                size="large"
                sx={{ py: 1.5, flex: 1 }}
                disabled={addingToCart}
              >
                {addingToCart ? 'Processing...' : 'Buy Now'}
              </Button>
            </Box>

            <Button 
              variant="contained" 
              color="primary"
              size="large"
              onClick={() => navigate('/')}
              sx={{ mt: 2, py: 1.5, width: '100%', maxWidth: 300 }}
            >
              Continue Shopping
            </Button>
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
    </Container>
  );
};

export default ProductDetailPage;

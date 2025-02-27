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
  Chip
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import { productsAPI } from '../services/api';
import { useSnackbar } from 'notistack';
import { useCart } from '../authentication/CartContext';
import { useAuth } from '../authentication/AuthContext';

const CategoryPage = () => {
  const { slug } = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Use the cart context instead of managing cart state locally
  const { addToCart, loading: cartLoading } = useCart();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        setLoading(true);
        const response = await productsAPI.getCategoryProducts(slug);
        setCategory(response.data);
      } catch (err) {
        setError('Failed to load category. Please try again later.');
        console.error('Error fetching category:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategory();
  }, [slug]);

  const handleAddToCart = async (product) => {
    try {
      if (!product.is_available) {
        enqueueSnackbar('This product is not available', { variant: 'warning' });
        return;
      }

      await addToCart(product.id, 1);
      enqueueSnackbar(`${product.name} added to cart`, { variant: 'success' });
    } catch (err) {
      enqueueSnackbar('Failed to add product to cart', { variant: 'error' });
      console.error('Error adding to cart:', err);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !category) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center', py: 5 }}>
          <Typography variant="h6" color="error" gutterBottom>
            {error || 'Category not found'}
          </Typography>
          <Button 
            variant="contained" 
            component={RouterLink} 
            to="/shop"
          >
            Back to Shop
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs Navigation */}
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 3 }}>
        <Link component={RouterLink} to="/" color="inherit">
          Home
        </Link>
        <Link component={RouterLink} to="/shop" color="inherit">
          Shop
        </Link>
        <Typography color="text.primary">{category.name}</Typography>
      </Breadcrumbs>

      {/* Category Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {category.name}
        </Typography>
        {category.description && (
          <Typography variant="body1" color="text.secondary">
            {category.description}
          </Typography>
        )}
        <Divider sx={{ my: 2 }} />
      </Box>

      {/* Product Grid */}
      {category.products && category.products.length > 0 ? (
        <Grid container spacing={3}>
          {category.products.map((product) => (
            <Grid item key={product.id} xs={12} sm={6} md={4}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {product.feature_image ? (
                  <CardMedia
                    component="img"
                    height="200"
                    image={product.feature_image}
                    alt={product.name}
                    sx={{ objectFit: 'contain', p: 2 }}
                  />
                ) : (
                  <Box 
                    sx={{ 
                      height: 200, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      bgcolor: 'grey.100' 
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      No image available
                    </Typography>
                  </Box>
                )}
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h6" component="h2" noWrap>
                    {product.name}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    {product.discount_price ? (
                      <>
                        <Typography 
                          variant="h6" 
                          color="primary" 
                          sx={{ fontWeight: 'bold', mr: 1 }}
                        >
                          ${product.discount_price}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ textDecoration: 'line-through' }}
                        >
                          ${product.price}
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                        ${product.price}
                      </Typography>
                    )}
                  </Box>
                  
                  {!product.is_available && (
                    <Chip 
                      label="Out of Stock" 
                      color="error" 
                      size="small" 
                      sx={{ mt: 1 }} 
                    />
                  )}
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    component={RouterLink} 
                    to={`/product/${product.slug}`}
                  >
                    View Details
                  </Button>
                  <Button
                    size="small"
                    startIcon={<AddShoppingCartIcon />}
                    onClick={() => handleAddToCart(product)}
                    disabled={!product.is_available || cartLoading}
                    sx={{ ml: 'auto' }}
                  >
                    Add to Cart
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box sx={{ textAlign: 'center', py: 5 }}>
          <Typography variant="h6" gutterBottom>
            No products found in this category
          </Typography>
          <Button 
            variant="contained" 
            component={RouterLink} 
            to="/shop"
          >
            Browse All Products
          </Button>
        </Box>
      )}
    </Container>
  );
};

export default CategoryPage;
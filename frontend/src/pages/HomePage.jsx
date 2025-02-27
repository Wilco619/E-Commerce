import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardMedia, 
  CardContent, 
  CardActions, 
  Button, 
  Box, 
  CircularProgress,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { productsAPI } from '../services/api';

const HomePage = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        let productsResponse, categoriesResponse;
        
        try {
          productsResponse = await productsAPI.getFeaturedProducts();
          console.log("Products response:", productsResponse);
        } catch (productErr) {
          console.error("Error fetching featured products:", productErr);
          throw productErr;
        }
        
        try {
          categoriesResponse = await productsAPI.getCategories();
          console.log("Categories response:", categoriesResponse);
        } catch (categoryErr) {
          console.error("Error fetching categories:", categoryErr);
          throw categoryErr;
        }
        
        if (productsResponse && productsResponse.data) {
          setFeaturedProducts(productsResponse.data);
        } else {
          console.error("Invalid products response format:", productsResponse);
          setFeaturedProducts([]);
        }
        
        if (categoriesResponse && categoriesResponse.data) {
          // Check if it's an array directly or inside a 'results' property (common in Django REST Framework)
          const categoryData = Array.isArray(categoriesResponse.data) 
            ? categoriesResponse.data 
            : categoriesResponse.data.results || [];
            
          console.log("Processed category data:", categoryData);
          setCategories(categoryData);
        } else {
          console.error("Invalid categories response format:", categoriesResponse);
          setCategories([]);
        }
        
        setLoading(false);
      } catch (err) {
        setError('Failed to load data. Please try again later.');
        setLoading(false);
        console.error('Error fetching homepage data:', err);
      }
    };

    fetchData();
  }, []);

  const renderLoader = () => (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
      <CircularProgress />
    </Box>
  );

  const renderError = () => (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
      <Typography color="error" variant="h5">
        {error}
      </Typography>
    </Box>
  );



  return (
    <>      
      <Container maxWidth="lg" sx={{ mt: { xs: 2, md: 4 }, mb: { xs: 4, md: 6 } }}>
        {loading ? renderLoader() : error ? renderError() : (
          <>
            {/* Hero Section */}
            <Box 
              sx={{ 
                py: { xs: 4, md: 8 }, 
                px: { xs: 2, md: 4 },
                textAlign: 'center',
                backgroundColor: 'primary.light',
                borderRadius: 2,
                mb: { xs: 4, md: 6 }
              }}
            >
              <Typography 
                variant={isSmallScreen ? "h3" : "h2"} 
                component="h1" 
                gutterBottom
              >
                Welcome to E-Shop
              </Typography>
              <Typography 
                variant={isSmallScreen ? "body1" : "h5"} 
                color="textSecondary" 
                paragraph
              >
                Discover amazing products at great prices
              </Typography>
              <Button 
                variant="contained" 
                size={isSmallScreen ? "medium" : "large"} 
                component={RouterLink} 
                to="/shop"
                sx={{ mt: 2 }}
              >
                Shop Now
              </Button>
            </Box>

            {/* Featured Products Section */}
            <Typography 
              variant={isSmallScreen ? "h5" : "h4"} 
              component="h2" 
              gutterBottom 
              sx={{ mb: 3 }}
            >
              Featured Products
            </Typography>
            <Grid container spacing={2} sx={{ mb: { xs: 4, md: 6 } }}>
              {featuredProducts.length > 0 ? (
                featuredProducts.map((product) => (
                  <Grid item key={product.id} xs={12} sm={6} md={4}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      {product.images && product.images.length > 1 ? (
                        <Grid container spacing={1} sx={{ p: 1 }}>
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
                      ) : null}
                      <CardMedia
                        component="img"
                        height="200"
                        image={selectedImage || product.feature_image || '/placeholder-product.jpg'}
                        alt={product.name}
                      />
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography gutterBottom variant="h5" component="h3">
                          {product.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {product.category_name || product.category?.name || "Uncategorized"}
                        </Typography>
                        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                          {product.discount_price ? (
                            <>
                              <Typography variant="h6" color="error" sx={{ mr: 1 }}>
                                Ksh {product.discount_price}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                                Ksh {product.price}
                              </Typography>
                            </>
                          ) : (
                            <Typography variant="h6">
                              Ksh {product.price}
                            </Typography>
                          )}
                        </Box>
                      </CardContent>
                      <CardActions>
                        <Button size="small" component={RouterLink} to={`/product/${product.slug}`}>
                          View Details
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))
              ) : (
                <Grid item xs={12}>
                  <Typography variant="body1" align="center">
                    No featured products available at the moment.
                  </Typography>
                </Grid>
              )}
            </Grid>
  


            {/* Categories Section */}
            <Typography 
              variant={isSmallScreen ? "h5" : "h4"} 
              component="h2" 
              gutterBottom 
              sx={{ mb: 3 }}
            >
              Shop by Category
            </Typography>
            <Grid container spacing={2} sx={{ mb: 8 }}>
              {categories && categories.length > 0 ? (
                categories.map((category) => (
                  <Grid item key={category.id || category.slug} xs={6} sm={4} md={3}>
                    <Card 
                      component={RouterLink} 
                      to={`/category/${category.slug}`}
                      sx={{ 
                        height: { xs: 100, sm: 120, md: 140 }, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        backgroundColor: 'secondary.light',
                        textDecoration: 'none',
                        '&:hover': {
                          backgroundColor: 'secondary.main',
                          transform: 'scale(1.03)',
                          transition: 'all 0.3s'
                        }
                      }}
                    >
                      <Typography 
                        variant={isSmallScreen ? "subtitle1" : "h5"} 
                        component="h3" 
                        color="white" 
                        sx={{ textAlign: 'center', p: 2 }}
                      >
                        {category.name}
                        <Typography variant="body2" component="p" color="white">
                          ({category.products_count || category.product_count || 0} products)
                        </Typography>
                      </Typography>
                    </Card>
                  </Grid>
                ))
              ) : (
                <Grid item xs={12}>
                  <Typography variant="body1" align="center">
                    No categories available at the moment.
                  </Typography>
                </Grid>
              )}
            </Grid>
          </>
        )}
      </Container>
    </>
  );
};

export default HomePage;

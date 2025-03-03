import React, { useState, useEffect, useRef } from 'react';
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
  useTheme,
  IconButton,
  Paper,
  Rating,
  Divider
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import { productsAPI } from '../services/api';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import CategoryIcon from '@mui/icons-material/Category';
import StarsIcon from '@mui/icons-material/Stars';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import FavoriteIcon from '@mui/icons-material/Favorite';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

const HomePage = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const isMediumScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Refs for Swiper navigation - Featured Products
  const prevFeaturedRef = useRef(null);
  const nextFeaturedRef = useRef(null);
  
  // Refs for Swiper navigation - Categories
  const prevCategoryRef = useRef(null);
  const nextCategoryRef = useRef(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        let productsResponse, categoriesResponse, popularResponse;
        
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
        
        try {
          // Assuming there's an API endpoint for popular products
          popularResponse = await productsAPI.getPopularProducts();
          console.log("Popular products response:", popularResponse);
        } catch (popularErr) {
          console.error("Error fetching popular products:", popularErr);
          // Not throwing error here as this is a new feature
          popularResponse = { data: [] };
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
        
        if (popularResponse && popularResponse.data) {
          setPopularProducts(popularResponse.data);
        } else {
          console.error("Invalid popular products response format:", popularResponse);
          setPopularProducts([]);
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

  const renderProductCard = (product) => (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'transform 0.3s, box-shadow 0.3s',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: '0 12px 20px rgba(0, 0, 0, 0.1)'
        }
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <CardMedia
          component="img"
          height="200"
          image={selectedImage || product.feature_image || '/placeholder-product.jpg'}
          alt={product.name}
        />
        {product.discount_price && (
          <Box 
          sx={{ 
            position: 'absolute',
            top: 10,
            right: 10,
            bgcolor: 'error.main',
            color: 'white',
            borderRadius: '50%',
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '0.7rem',
            textAlign: 'center',
            lineHeight: 1
          }}
        >
          {Math.round((1 - (product.discount_price / product.price)) * 100)}% OFF
        </Box>
        
        )}
      </Box>
      
      {product.images && product.images.length > 1 && (
        <Box sx={{ display: 'flex', overflowX: 'auto', p: 1, gap: 1 }}>
          {product.images.slice(0, 4).map((image) => (
            <Box
              key={image.id}
              component="img"
              src={image.image}
              alt={`${product.name} thumbnail`}
              onClick={() => setSelectedImage(image.image)}
              sx={{
                width: 60,
                height: 60,
                objectFit: 'cover',
                cursor: 'pointer',
                border: selectedImage === image.image ? '2px solid #1976d2' : '1px solid #ddd',
                borderRadius: 1
              }}
            />
          ))}
        </Box>
      )}
      
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography gutterBottom variant="h6" component="h3" noWrap>
          {product.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {product.category_name || product.category?.name || "Uncategorized"}
        </Typography>
        <Rating 
          value={product.rating || 4.5} 
          precision={0.5} 
          size="small" 
          readOnly 
          sx={{ mb: 1 }}
        />
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {product.discount_price ? (
            <>
              <Typography variant="h6" color="primary" sx={{ mr: 1, fontSize: '0.85rem' }}>
                Ksh {product.discount_price}
              </Typography>
              <Typography variant="body2" color="error" sx={{ textDecoration: 'line-through', fontSize: '0.80rem' }}>
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
      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Button 
          variant="outlined" 
          size="small" 
          component={RouterLink} 
          to={`/product/${product.slug}`}
          startIcon={<ShoppingBagIcon />}
        >
          View
        </Button>
        <Box>
          <IconButton size="small" color="primary" sx={{ mr: 1 }}>
            <FavoriteIcon />
          </IconButton>
          <IconButton size="small" color="secondary">
            <AddShoppingCartIcon />
          </IconButton>
        </Box>
      </CardActions>
    </Card>
  );

  const renderCategoryCard = (category) => {
    // Map category names to different icons (you can expand this)
    let CategorySpecificIcon = CategoryIcon;
    if (category.name.toLowerCase().includes('electronics')) {
      CategorySpecificIcon = () => <span className="material-icons">devices</span>;
    } else if (category.name.toLowerCase().includes('clothing')) {
      CategorySpecificIcon = () => <span className="material-icons">checkroom</span>;
    } else if (category.name.toLowerCase().includes('food')) {
      CategorySpecificIcon = () => <span className="material-icons">restaurant</span>;
    }

    return (
      <Card 
        component={RouterLink} 
        to={`/category/${category.slug}`}
        sx={{ 
          height: { xs: 160, sm: 180, md: 200 }, 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          textDecoration: 'none',
          transition: 'all 0.3s',
          m: 1,
          '&:hover': {
            transform: 'translateY(-8px)',
            boxShadow: '0 12px 20px rgba(0, 0, 0, 0.1)'
          }
        }}
      >
        <Box 
          sx={{ 
            bgcolor: 'primary.light', 
            borderRadius: '50%', 
            p: 2,
            mb: 2,
            color: 'white'
          }}
        >
          <CategorySpecificIcon fontSize="large" />
        </Box>
        <Typography 
          variant={isSmallScreen ? "subtitle1" : "h6"} 
          component="h3" 
          color="textPrimary" 
          sx={{ textAlign: 'center', px: 2 }}
        >
          {category.name}
        </Typography>
        <Typography 
          variant="body2" 
          component="p" 
          color="textSecondary"
          sx={{ mt: 1 }}
        >
          {category.products_count || category.product_count || 0} products
        </Typography>
      </Card>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ mt: { xs: 2, md: 4 }, mb: { xs: 4, md: 6 } }}>
      {loading ? renderLoader() : error ? renderError() : (
        <>
         {/* Hero Section */}
          <Paper 
            elevation={3}
            sx={{ 
              py: { xs: 4, md: 8 }, 
              px: { xs: 2, md: 4 },
              textAlign: 'center',
              borderRadius: 2,
              mb: { xs: 4, md: 6 },
              backgroundImage: 'url(/api/placeholder/1200/600)', // Background image placeholder
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              color: 'white',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Backdrop filter overlay */}
            <Box sx={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              width: '100%', 
              height: '100%', 
              backdropFilter: 'blur(2px)',
              backgroundColor: 'rgba(25, 118, 210, 0.6)', // Semi-transparent blue overlay
              zIndex: 0
            }} />
            
            {/* Decorative elements */}
            <Box sx={{ 
              position: 'absolute', 
              top: '-10%', 
              left: '-5%', 
              width: '120%', 
              height: '120%', 
              background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)',
              zIndex: 1
            }} />
            
            <Box sx={{ position: 'relative', zIndex: 2 }}>
              <Typography 
                variant={isSmallScreen ? "h3" : "h2"} 
                component="h1" 
                gutterBottom
                sx={{ fontWeight: 'bold' }}
              >
                Welcome to E-Shop
              </Typography>
              <Typography 
                variant={isSmallScreen ? "body1" : "h5"} 
                paragraph
                sx={{ mb: 4, maxWidth: '800px', mx: 'auto' }}
              >
                Discover amazing products at great prices. Shop our latest collections and enjoy exclusive deals.
              </Typography>
              <Button 
                variant="contained" 
                size={isSmallScreen ? "medium" : "large"} 
                component={RouterLink} 
                to="/shop"
                sx={{ 
                  mt: 2, 
                  bgcolor: 'white', 
                  color: 'primary.main',
                  px: 4,
                  py: 1,
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.9)'
                  }
                }}
              >
                Shop Now
              </Button>
            </Box>
          </Paper>

          {/* Featured Products Section */}
          <Box sx={{ mb: { xs: 4, md: 6 } }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 3,
              borderBottom: '2px solid',
              borderColor: 'primary.light',
              pb: 1
            }}>
              <StarsIcon color="primary" sx={{ mr: 1 }} />
              <Typography 
                variant={isSmallScreen ? "h5" : "h4"} 
                component="h2" 
                sx={{ fontWeight: 'bold' }}
              >
                Featured Products
              </Typography>
            </Box>
            
            {featuredProducts.length > 0 ? (
              <Box sx={{ position: 'relative' }}>
                <Box 
                  ref={prevFeaturedRef}
                  sx={{
                    position: 'absolute',
                    left: -20,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 10,
                    cursor: 'pointer'
                  }}
                >
                  <IconButton
                    sx={{
                      bgcolor: 'background.paper',
                      boxShadow: 2,
                      '&:hover': {
                        bgcolor: 'grey.100'
                      }
                    }}
                  >
                    <KeyboardArrowLeft />
                  </IconButton>
                </Box>
                
                <Swiper
                  modules={[Autoplay, Pagination, Navigation]}
                  spaceBetween={5}
                  slidesPerView={isSmallScreen ? 1 : isMediumScreen ? 2 : 5}
                  autoplay={{
                    delay: 5000,
                    disableOnInteraction: false,
                  }}
                  pagination={{
                    clickable: true,
                  }}
                  navigation={{
                    prevEl: prevFeaturedRef.current,
                    nextEl: nextFeaturedRef.current,
                  }}
                  onInit={(swiper) => {
                    // Override navigation with custom elements
                    setTimeout(() => {
                      if (swiper.params.navigation && prevFeaturedRef.current && nextFeaturedRef.current) {
                        swiper.params.navigation.prevEl = prevFeaturedRef.current;
                        swiper.params.navigation.nextEl = nextFeaturedRef.current;
                        swiper.navigation.init();
                        swiper.navigation.update();
                      }
                    });
                  }}
                  style={{ padding: '20px 10px 40px' }}
                >
                  {featuredProducts.map((product) => (
                    <SwiperSlide key={product.id}>
                      {renderProductCard(product)}
                    </SwiperSlide>
                  ))}
                </Swiper>
                
                <Box 
                  ref={nextFeaturedRef}
                  sx={{
                    position: 'absolute',
                    right: -20,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 10,
                    cursor: 'pointer'
                  }}
                >
                  <IconButton
                    sx={{
                      bgcolor: 'background.paper',
                      boxShadow: 2,
                      '&:hover': {
                        bgcolor: 'grey.100'
                      }
                    }}
                  >
                    <KeyboardArrowRight />
                  </IconButton>
                </Box>
              </Box>
            ) : (
              <Typography variant="body1" align="center">
                No featured products available at the moment.
              </Typography>
            )}
          </Box>

          {/* Categories Section with Swiper */}
          <Box sx={{ mb: { xs: 4, md: 6 } }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 3,
              borderBottom: '2px solid',
              borderColor: 'primary.light',
              pb: 1
            }}>
              <CategoryIcon color="primary" sx={{ mr: 1 }} />
              <Typography 
                variant={isSmallScreen ? "h5" : "h4"} 
                component="h2" 
                sx={{ fontWeight: 'bold' }}
              >
                Shop by Category
              </Typography>
            </Box>
            
            {categories && categories.length > 0 ? (
              <Box sx={{ position: 'relative' }}>
                <Box 
                  ref={prevCategoryRef}
                  sx={{
                    position: 'absolute',
                    left: -20,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 10,
                    cursor: 'pointer'
                  }}
                >
                  <IconButton
                    sx={{
                      bgcolor: 'background.paper',
                      boxShadow: 2,
                      '&:hover': {
                        bgcolor: 'grey.100'
                      }
                    }}
                  >
                    <KeyboardArrowLeft />
                  </IconButton>
                </Box>
                
                <Swiper
                  modules={[Autoplay, Pagination, Navigation]}
                  spaceBetween={5}
                  slidesPerView={isSmallScreen ? 1 : isMediumScreen ? 2 : 5}
                  autoplay={{
                    delay: 6000,
                    disableOnInteraction: false,
                  }}
                  pagination={{
                    clickable: true,
                  }}
                  navigation={{
                    prevEl: prevCategoryRef.current,
                    nextEl: nextCategoryRef.current,
                  }}
                  onInit={(swiper) => {
                    // Override navigation with custom elements
                    setTimeout(() => {
                      if (swiper.params.navigation && prevCategoryRef.current && nextCategoryRef.current) {
                        swiper.params.navigation.prevEl = prevCategoryRef.current;
                        swiper.params.navigation.nextEl = nextCategoryRef.current;
                        swiper.navigation.init();
                        swiper.navigation.update();
                      }
                    });
                  }}
                  style={{ padding: '20px 10px 40px' }}
                >
                  {categories.map((category) => (
                    <SwiperSlide key={category.id || category.slug}>
                      {renderCategoryCard(category)}
                    </SwiperSlide>
                  ))}
                </Swiper>
                
                <Box 
                  ref={nextCategoryRef}
                  sx={{
                    position: 'absolute',
                    right: -20,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 10,
                    cursor: 'pointer'
                  }}
                >
                  <IconButton
                    sx={{
                      bgcolor: 'background.paper',
                      boxShadow: 2,
                      '&:hover': {
                        bgcolor: 'grey.100'
                      }
                    }}
                  >
                    <KeyboardArrowRight />
                  </IconButton>
                </Box>
              </Box>
            ) : (
              <Typography variant="body1" align="center">
                No categories available at the moment.
              </Typography>
            )}
          </Box>
          
          {/* Most Ordered Products Section */}
          <Box sx={{ mb: { xs: 4, md: 6 } }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 3,
              borderBottom: '2px solid',
              borderColor: 'primary.light',
              pb: 1
            }}>
              <LocalFireDepartmentIcon color="error" sx={{ mr: 1 }} />
              <Typography 
                variant={isSmallScreen ? "h5" : "h4"} 
                component="h2" 
                sx={{ fontWeight: 'bold' }}
              >
                Most Popular Products
              </Typography>
            </Box>
            
            <Grid container spacing={2}>
              {popularProducts && popularProducts.length > 0 ? (
                popularProducts.map((product, index) => (
                  <Grid item key={product.id} xs={12} sm={6} md={3}>
                    <Card 
                      sx={{ 
                        display: 'flex', 
                        flexDirection: isMediumScreen ? 'column' : 'row',
                        height: '100%',
                        transition: 'transform 0.3s, box-shadow 0.3s',
                        position: 'relative',
                        overflow: 'hidden',
                        '&:hover': {
                          transform: 'translateY(-5px)',
                          boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)'
                        }
                      }}
                    >
                      {/* Popularity Badge */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 10,
                          left: 10,
                          bgcolor: 'error.main',
                          color: 'white',
                          borderRadius: 10,
                          px: 1,
                          py: 0.5,
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          zIndex: 1
                        }}
                      >
                        #{index + 1} Best Seller
                      </Box>
                      
                      <CardMedia
                        component="img"
                        image={product.feature_image || '/placeholder-product.jpg'}
                        alt={product.name}
                        sx={{ 
                          width: isMediumScreen ? '100%' : 100,
                          height: isMediumScreen ? 100 : '100%',
                          objectFit: 'cover'
                        }}
                      />
                      <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                        <CardContent>
                          <Typography variant="subtitle1" component="h3" noWrap>
                            {product.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {product.category_name || product.category?.name || "Uncategorized"}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Rating value={product.rating || 4.5} precision={0.5} size="small" readOnly />
                            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                              ({product.rating_count || Math.floor(Math.random() * 100) + 50})
                            </Typography>
                          </Box>
                          <Typography variant="h6" color={product.discount_price ? "error.main" : "inherit"}>
                            Ksh {product.discount_price || product.price}
                          </Typography>
                          {product.discount_price && (
                            <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                              Ksh {product.price}
                            </Typography>
                          )}
                        </CardContent>
                        <CardActions sx={{ justifyContent: 'space-between', p: 1, mt: 'auto' }}>
                          <Button 
                            variant="outlined" 
                            size="small" 
                            component={RouterLink} 
                            to={`/product/${product.slug}`}
                          >
                            View
                          </Button>
                          <IconButton size="small" color="secondary">
                            <AddShoppingCartIcon />
                          </IconButton>
                        </CardActions>
                      </Box>
                    </Card>
                  </Grid>
                ))
              ) : (
                <Grid item xs={12}>
                  <Typography variant="body1" align="center">
                    No popular products available at the moment.
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>
          
          {/* Newsletter or Promotional Section */}
          <Paper
            elevation={2}
            sx={{
              p: 4,
              textAlign: 'center',
              borderRadius: 2,
              mb: 4,
              backgroundImage: 'linear-gradient(to right, #f6f6f6, #ffffff)',
            }}
          >
            <Typography variant="h5" component="h2" gutterBottom>
              Subscribe to Our Newsletter
            </Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
              Get updates on our latest products, exclusive deals, and special offers straight to your inbox.
            </Typography>
            {/* Newsletter form would go here */}
            <Button variant="contained" color="primary">
              Subscribe Now
            </Button>
          </Paper>
        </>
      )}
    </Container>
  );
};

export default HomePage;
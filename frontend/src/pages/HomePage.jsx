import React, { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Box, Container, Skeleton, Card, CardContent } from '@mui/material';
import { productsAPI } from '../services/api';
import { useCart } from '../authentication/CartContext';
import { useAuth } from '../authentication/AuthContext';
import Error from '../components/Error';
import { useInView } from 'react-intersection-observer';

// Import components directly instead of using lazy loading
import HeroSection from '../components/HeroSection';
import FeaturedProducts from '../components/FeaturedProducts';
import PopularProducts from '../components/PopularProducts';
import Newsletter from '../components/Newsletter';
import CategorySection from '../components/CategorySection';

// Skeleton loader for fallback
const LazyLoader = ({ height = 300 }) => (
  <Skeleton variant="rectangular" width="100%" height={height} animation="wave" />
);

// Create skeleton components for each section
const HeroSectionSkeleton = () => (
  <Box sx={{ width: '100%', height: { xs: 300, md: 500 }, position: 'relative', mb: 4 }}>
    <Skeleton variant="rectangular" width="100%" height="100%" animation="wave" />
    <Box sx={{ position: 'absolute', top: '20%', left: '10%', width: '40%' }}>
      <Skeleton variant="text" height={60} width="80%" animation="wave" />
      <Skeleton variant="text" height={30} width="60%" animation="wave" sx={{ my: 2 }} />
      <Skeleton variant="text" height={30} width="70%" animation="wave" sx={{ mb: 2 }} />
      <Skeleton variant="rectangular" height={50} width={120} animation="wave" />
    </Box>
  </Box>
);

const ProductCardSkeleton = () => (
  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <Skeleton variant="rectangular" sx={{ pt: '100%' }} animation="wave" />
    <CardContent>
      <Skeleton animation="wave" height={24} width="80%" sx={{ mb: 1 }} />
      <Skeleton animation="wave" height={16} width="50%" sx={{ mb: 1 }} />
      <Skeleton animation="wave" height={20} width="40%" />
    </CardContent>
  </Card>
);

const FeaturedProductsSkeleton = ({ isSmallScreen }) => (
  <Box sx={{ width: '100%', py: 4 }}>
    <Container>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Skeleton variant="text" width={200} height={40} animation="wave" />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Skeleton variant="circular" width={40} height={40} animation="wave" />
          <Skeleton variant="circular" width={40} height={40} animation="wave" />
        </Box>
      </Box>
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: {
          xs: 'repeat(2, 1fr)',
          sm: 'repeat(3, 1fr)',
          md: 'repeat(4, 1fr)',
          lg: 'repeat(5, 1fr)'
        },
        gap: 2
      }}>
        {[...Array(isSmallScreen ? 4 : 5)].map((_, index) => (
          <ProductCardSkeleton key={`featured-skeleton-${index}`} />
        ))}
      </Box>
    </Container>
  </Box>
);

const CategorySkeleton = () => (
  <Box sx={{ width: '100%', py: 3 }}>
    <Container>
      <Skeleton variant="text" width={200} height={40} animation="wave" sx={{ mb: 2 }} />
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: {
          xs: 'repeat(2, 1fr)',
          sm: 'repeat(3, 1fr)',
          md: 'repeat(4, 1fr)',
          lg: 'repeat(6, 1fr)'
        },
        gap: 2
      }}>
        {[...Array(6)].map((_, index) => (
          <Box key={`category-skeleton-${index}`} sx={{ textAlign: 'center' }}>
            <Skeleton variant="circular" width={80} height={80} animation="wave" sx={{ mx: 'auto', mb: 1 }} />
            <Skeleton variant="text" width="70%" height={20} animation="wave" sx={{ mx: 'auto' }} />
          </Box>
        ))}
      </Box>
    </Container>
  </Box>
);

const PopularProductsSkeleton = ({ isSmallScreen }) => (
  <Box sx={{ width: '100%', py: 4, bgcolor: 'background.paper' }}>
    <Container>
      <Skeleton variant="text" width={200} height={40} animation="wave" sx={{ mb: 2 }} />
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: {
          xs: 'repeat(2, 1fr)',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
          lg: 'repeat(4, 1fr)'
        },
        gap: 2
      }}>
        {[...Array(isSmallScreen ? 4 : 8)].map((_, index) => (
          <ProductCardSkeleton key={`popular-skeleton-${index}`} />
        ))}
      </Box>
    </Container>
  </Box>
);

const NewsletterSkeleton = () => (
  <Box sx={{ width: '100%', py: 5, bgcolor: 'primary.light' }}>
    <Container sx={{ textAlign: 'center' }}>
      <Skeleton variant="text" width={300} height={40} animation="wave" sx={{ mx: 'auto', mb: 2 }} />
      <Skeleton variant="text" width={400} height={24} animation="wave" sx={{ mx: 'auto', mb: 3 }} />
      <Box sx={{ display: 'flex', maxWidth: 500, mx: 'auto' }}>
        <Skeleton variant="rectangular" width="70%" height={50} animation="wave" />
        <Skeleton variant="rectangular" width="30%" height={50} animation="wave" />
      </Box>
    </Container>
  </Box>
);

/**
 * LazyLoadComponent: A wrapper for lazy loading components using Intersection Observer
 */
const LazyLoadComponent = ({ children, height = 400, skeleton }) => {
  const { ref, inView } = useInView({
    triggerOnce: true, // Load the component only once when it comes into view
    threshold: 0.1, // Trigger when 10% of the component is visible
  });
  
  return (
    <div ref={ref}>
      {inView ? children : skeleton || <LazyLoader height={height} />}
    </div>
  );
};

// Main component with intersection observer-based lazy loading
const HomePage = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  
  const auth = useAuth();
  const cart = useCart();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Safely destructure values
  const authLoading = auth?.loading || false;
  const verifyingOTP = auth?.verifyingOTP || false;
  const cartLoading = cart?.loading || false;

  // State management
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // Add specific state for categories loading
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState(null);











  useEffect(() => {
    if (location.pathname === '/home' && !sessionStorage.getItem('reloaded')) {
      sessionStorage.setItem('reloaded', 'true');
      window.location.reload();
    }
  }, []);
  


  useEffect(() => {
    const fetchHomePageData = async () => {
      try {
        setLoading(true);
        
        // Fetch all data in parallel
        try {
          const [featuredResponse, popularResponse, categoriesResponse] = await Promise.all([
            productsAPI.getFeaturedProducts(),
            productsAPI.getPopularProducts(),
            productsAPI.getCategories()
          ]);
          
          setFeaturedProducts(featuredResponse.data);
          setPopularProducts(popularResponse.data);
          
          // Ensure we're setting an array for categories
          const categoriesData = Array.isArray(categoriesResponse.data) ? categoriesResponse.data : 
                               categoriesResponse.data?.results || [];
          
          setCategories(categoriesData);
        } catch (error) {
          console.error('Error fetching data:', error);
          setError('Failed to load content');
        }
      } catch (err) {
        console.error('Error fetching homepage data:', err);
        setError('Failed to load content');
      } finally {
        setLoading(false);
        setCategoriesLoading(false);
      }
    };

    fetchHomePageData();
  }, [auth.user, cart.cartId]);





  if (error) return <Error message={error} />;

  return (
    <Box sx={{ width: '100%', overflow: 'hidden' }}>
      <Container maxWidth={false} disableGutters>
        <Box 
          sx={{ 
            width: '100%',
            '& > *': {
              mb: { xs: 3, md: 4 }
            },
            '& > *:last-child': {
              mb: 0
            }
          }}
        >
          {/* Hero Section */}
          <LazyLoadComponent 
            height={500} 
            skeleton={<HeroSectionSkeleton />}
          >
            <HeroSection isSmallScreen={isSmallScreen} categories={categories} />
          </LazyLoadComponent>

          {/* Featured Products */}
          <LazyLoadComponent 
            height={400} 
            skeleton={<FeaturedProductsSkeleton isSmallScreen={isSmallScreen} />}
          >
            <FeaturedProducts products={featuredProducts} />
          </LazyLoadComponent>

          {/* Categories */}
          <LazyLoadComponent 
            height={200} 
            skeleton={<CategorySkeleton />}
          >
            <CategorySection categories={categories} />
          </LazyLoadComponent>

          {/* Popular Products */}
          <LazyLoadComponent 
            height={400} 
            skeleton={<PopularProductsSkeleton isSmallScreen={isSmallScreen} />}
          >
            <PopularProducts products={popularProducts} />
          </LazyLoadComponent>
        </Box>
      </Container>
    </Box>
  );
};

export default HomePage;
import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Box, Container, Typography, Card, CardContent, Skeleton } from '@mui/material';
import { productsAPI } from '../services/api';
import { useCart } from '../authentication/CartContext';
import { useAuth } from '../authentication/AuthContext';

// Import components
import HeroSection from '../components/HeroSection';
import FeaturedProducts from '../components/FeaturedProducts';
import PopularProducts from '../components/PopularProducts';
import Newsletter from '../components/Newsletter';
import Error from '../components/Error';
import CategorySection from '../components/CategorySection';

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

// Main component with skeleton loading
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

  // Combine loading states
  const isLoading = loading || authLoading || cartLoading || verifyingOTP;

  // State management
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  
  // Add specific state for categories loading
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState(null);
  
  // Refs for Swiper navigation
  const prevFeaturedRef = useRef(null);
  const nextFeaturedRef = useRef(null);

  useEffect(() => {
    const fetchHomePageData = async () => {
      try {
        setLoading(true);
        
        // Separate categories fetch for better error handling
        try {
          setCategoriesLoading(true);
          const response = await productsAPI.getCategories();
          console.log('Raw categories response:', response);
          
          // Ensure we're setting an array
          const categoriesData = Array.isArray(response.data) ? response.data : 
                               response.data?.results || [];
          console.log('Processed categories data:', categoriesData);
          
          setCategories(categoriesData);
        } catch (error) {
          console.error('Error fetching categories:', error);
          setCategoriesError('Failed to load categories');
        } finally {
          setCategoriesLoading(false);
        }

        // Fetch other data
        const [featuredResponse, popularResponse] = await Promise.all([
          productsAPI.getFeaturedProducts(),
          productsAPI.getPopularProducts()
        ]);

        setFeaturedProducts(featuredResponse.data);
        setPopularProducts(popularResponse.data);
      } catch (err) {
        console.error('Error fetching homepage data:', err);
        setError('Failed to load content');
      } finally {
        setLoading(false);
      }
    };

    fetchHomePageData();
  }, [auth.user, cart.cartId]);

  // Remove the session storage reload effect
  // This was causing unnecessary page refreshes
  
  if (error) return <Error message={error} />;

  return (
    <Box sx={{ width: '100%', overflow: '' }}>
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
          {isLoading ? (
            <>
              <HeroSectionSkeleton />
              <FeaturedProductsSkeleton isSmallScreen={isSmallScreen} />
              <CategorySkeleton />
              <PopularProductsSkeleton isSmallScreen={isSmallScreen} />
              <NewsletterSkeleton />
            </>
          ) : (
            <>
              <HeroSection isSmallScreen={isSmallScreen} />
              
              <FeaturedProducts 
                featuredProducts={featuredProducts}
                isSmallScreen={isSmallScreen}
                prevRef={prevFeaturedRef}
                nextRef={nextFeaturedRef}
                setSelectedImage={setSelectedImage}
              />
              
              {categoriesLoading ? (
                <CategorySkeleton />
              ) : categoriesError ? (
                <Error message={categoriesError} />
              ) : (
                <CategorySection 
                  categories={categories} 
                  isSmallScreen={isSmallScreen}
                />
              )}
              
              <PopularProducts 
                popularProducts={popularProducts} 
                isSmallScreen={isSmallScreen} 
              />
              
              <Newsletter />
            </>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default HomePage;
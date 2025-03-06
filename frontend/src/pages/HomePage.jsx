import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Box, Container } from '@mui/material';
import { productsAPI } from '../services/api';

// Import components
import HeroSection from '../components/HeroSection';
import FeaturedProducts from '../components/FeaturedProducts';
import PopularProducts from '../components/PopularProducts';
import Newsletter from '../components/Newsletter';
import Loader from '../components/Loader';
import Error from '../components/Error';
import CategorySection from '../components/CategorySection';  // Update import

const HomePage = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  
  // State management
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
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
  }, []);

  if (loading) return <Loader />;
  if (error) return <Error message={error} />;

  return (
    <Container maxWidth="xl">
      <Box 
        sx={{ 
          maxWidth: 'xl', 
          mx: 'auto', 
          px: { xs: 2, sm: 3, md: 4 },
          '& > *': {
            mb: { xs: 4, md: 6 }
          },
          '& > *:last-child': {
            mb: 0
          }
        }}
      >
        <HeroSection isSmallScreen={isSmallScreen} />
        
        <FeaturedProducts 
          featuredProducts={featuredProducts}
          isSmallScreen={isSmallScreen}
          prevRef={prevFeaturedRef}
          nextRef={nextFeaturedRef}
          setSelectedImage={setSelectedImage}
        />
        
        {categoriesLoading ? (
          <Loader />
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
      </Box>
    </Container>
  );
};

export default HomePage;

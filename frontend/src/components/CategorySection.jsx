import React from 'react';
import { Box, Typography, Grid, Paper, useTheme } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import CategoryIcon from '@mui/icons-material/Category';
import DevicesIcon from '@mui/icons-material/Devices';
import CheckroomIcon from '@mui/icons-material/Checkroom';
import HomeIcon from '@mui/icons-material/Home';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import SportsIcon from '@mui/icons-material/Sports';

const CategorySection = ({ categories = [], isSmallScreen }) => {
  console.log('CategorySection received categories:', categories);

  // Ensure categories is an array
  const validCategories = Array.isArray(categories) ? categories : [];
  console.log('Valid categories array:', validCategories);

  const getCategoryIcon = (categoryName = '') => {
    const name = categoryName.toLowerCase();
    if (name.includes('electronic')) return DevicesIcon;
    if (name.includes('clothing')) return CheckroomIcon;
    if (name.includes('home')) return HomeIcon;
    if (name.includes('food')) return RestaurantIcon;
    if (name.includes('sport')) return SportsIcon;
    return CategoryIcon;
  };

  const theme = useTheme();

  return (
    <Box sx={{ mb: { xs: 4, md: 6 }, mt: { xs: 5, md: 7 } }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: 3,
        borderBottom: '2px solid',
        borderColor: 'primary.light',
        pb: 1
      }}>
        <Typography
          variant="h3"
          sx={{
            textDecoration: 'none',
            color: 'inherit',
            fontWeight: 600,
            letterSpacing: 0.5,
            display: 'flex',
            alignItems: 'center',
            fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.8rem', lg: '3rem' } // Adjust sizes
          }}
        >
          Shop By
          <Box component="span" sx={{ color: theme.palette.secondary.main }}>
            Category
          </Box>
        </Typography>
      </Box>

      {validCategories.length > 0 ? (
        <Grid container spacing={2}>
          {validCategories.map((category) => {
            if (!category) return null;
            const IconComponent = getCategoryIcon(category.name);
            
            return (
              <Grid item xs={6} sm={4} md={3} key={category.id || Math.random()}>
                <Paper
                  component={RouterLink}
                  to={`/category/${category.slug}`}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: { xs: 140, sm: 160, md: 180 },
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: (theme) => theme.shadows[8],
                      '& .category-icon': {
                        color: 'primary.main',
                        transform: 'scale(1.1)',
                      }
                    },
                    padding: 2,
                  }}
                >
                  <Box
                    className="category-icon"
                    sx={{
                      backgroundColor: 'primary.light',
                      borderRadius: '50%',
                      p: 2,
                      mb: 2,
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <IconComponent 
                      sx={{ 
                        fontSize: { xs: 32, sm: 40 },
                        color: 'white'
                      }} 
                    />
                  </Box>
                  
                  <Typography 
                    variant="h6" 
                    component="h3"
                    align="center"
                    sx={{ 
                      fontSize: { xs: '1rem', sm: '1.25rem' },
                      fontWeight: 500
                    }}
                  >
                    {category.name}
                  </Typography>
                  
                  {category.product_count !== undefined && (
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      align="center"
                      sx={{ mt: 0.5 }}
                    >
                      {category.product_count} Products
                    </Typography>
                  )}
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <Typography variant="body1" align="center" sx={{ py: 4 }}>
          No categories available
        </Typography>
      )}
    </Box>
  );
};

export default CategorySection;
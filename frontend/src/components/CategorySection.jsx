import React from 'react';
import { Box, Typography, Grid, Paper, useTheme, Chip } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import CategoryIcon from '@mui/icons-material/Category';
import DevicesIcon from '@mui/icons-material/Devices';
import CheckroomIcon from '@mui/icons-material/Checkroom';
import HomeIcon from '@mui/icons-material/Home';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import SportsIcon from '@mui/icons-material/Sports';

const CategorySection = ({ categories = [], isSmallScreen }) => {
  console.log('CategorySection received categories:', categories);

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
    <Box sx={{ mb: { xs: 3, md: 4 }, mt: { xs: 4, md: 5 } }}>
      {/* Updated Elegant Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: 3,
        px: { xs: 2, sm: 2 }
      }}>
        <Typography
          variant="h4"
          sx={{
            textDecoration: 'none',
            color: 'inherit',
            fontWeight: 600,
            letterSpacing: 0.5,
            display: 'flex',
            alignItems: 'center',
            fontSize: { xs: '1.5rem', sm: '1.8rem', md: '2.2rem' },
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -12,
              left: 0,
              width: '100%',
              height: '2px',
              backgroundColor: theme.palette.primary.light,
              borderRadius: '1px'
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              bottom: -12,
              left: 0,
              width: '60px',
              height: '2px',
              backgroundColor: theme.palette.secondary.main,
              borderRadius: '1px',
              zIndex: 1
            }
          }}
        >
          Shop By
          <Box 
            component="span" 
            sx={{ 
              color: theme.palette.secondary.main, 
              ml: 1,
              fontWeight: 700
            }}
          >
            Category
          </Box>
        </Typography>
      </Box>

      {validCategories.length > 0 ? (
        <Box sx={{ px: { xs: 2, sm: 2 } }}>
          <Grid container spacing={1.5}>
            {validCategories.map((category) => {
              if (!category) return null;
              const IconComponent = getCategoryIcon(category.name);
              
              return (
                <Grid item xs={6} sm={4} md={3} lg={2} key={category.id || Math.random()}>
                  <Paper
                    component={RouterLink}
                    to={`/category/${category.slug}`}
                    elevation={2}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: { xs: 80, sm: 90 },
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      borderRadius: 2,
                      position: 'relative',
                      overflow: 'hidden',
                      background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[50]} 100%)`,
                      border: `1px solid ${theme.palette.divider}`,
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[6],
                        borderColor: theme.palette.primary.light,
                        '& .category-icon': {
                          color: theme.palette.primary.main,
                          transform: 'scale(1.15)',
                        },
                        '& .category-name': {
                          color: theme.palette.primary.main,
                        }
                      },
                      '&:active': {
                        transform: 'translateY(-2px)',
                      },
                      padding: 1.5,
                    }}
                  >
                    <Box
                      className="category-icon"
                      sx={{
                        backgroundColor: theme.palette.primary.main,
                        borderRadius: '50%',
                        p: 1,
                        mb: 1,
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: theme.shadows[2],
                      }}
                    >
                      <IconComponent 
                        sx={{ 
                          fontSize: { xs: 18, sm: 20 },
                          color: 'white'
                        }} 
                      />
                    </Box>
                    
                    <Typography 
                      className="category-name"
                      variant="body2" 
                      component="h3"
                      align="center"
                      sx={{ 
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        fontWeight: 600,
                        lineHeight: 1.2,
                        transition: 'color 0.2s ease',
                        mb: 0.5
                      }}
                    >
                      {category.name}
                    </Typography>
                    
                    {category.product_count !== undefined && (
                      <Chip
                        label={`${category.product_count}`}
                        size="small"
                        sx={{ 
                          height: 16,
                          fontSize: '0.65rem',
                          fontWeight: 500,
                          backgroundColor: theme.palette.grey[100],
                          color: theme.palette.text.secondary,
                          '& .MuiChip-label': {
                            px: 1
                          }
                        }}
                      />
                    )}
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            py: 4,
            backgroundColor: theme.palette.grey[50],
            borderRadius: 2,
            border: `1px dashed ${theme.palette.grey[300]}`,
            mx: 2
          }}
        >
          <Typography variant="body1" color="text.secondary">
            No categories available
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default CategorySection;
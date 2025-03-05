import React from 'react';
import { Card, CardMedia, CardContent, Typography, Box, CardActions, Button, IconButton } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import FavoriteIcon from '@mui/icons-material/Favorite';
import Rating from '@mui/material/Rating';

const ProductCard = ({ product, selectedImage, setSelectedImage, compact }) => (
  <Card 
    sx={{ 
      height: '100%',
      width: compact ? 150 : 280, // Adjust width based on compact prop
      flex: '0 0 auto',
      display: 'flex', 
      flexDirection: 'column',
      margin: '0 2px', // Reduced margin from 4px to 2px
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
        height={compact ? "120" : "200"} // Reduce image height for compact mode
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
    
    <CardContent sx={{ flexGrow: 1, p: compact ? 1 : 2 }}> {/* Reduce padding for compact mode */}
      <Typography 
        gutterBottom 
        variant={compact ? "subtitle1" : "h6"} 
        component="h3" 
        noWrap
        sx={{ fontSize: compact ? '0.9rem' : undefined }}
      >
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
      {product.weekly_orders > 0 && (
        <Typography 
          variant="caption" 
          color="text.secondary"
          sx={{ 
            display: 'block',
            mt: 1
          }}
        >
          {product.weekly_orders} orders this week
        </Typography>
      )}
    </CardContent>
    <CardActions sx={{ justifyContent: 'space-between', px: compact ? 1 : 2, pb: compact ? 1 : 2 }}>
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
        
      </Box>
    </CardActions>
  </Card>
);

export default ProductCard;

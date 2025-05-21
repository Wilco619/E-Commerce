import React from 'react';
import { 
  Box, 
  Typography, 
  Divider, 
  List,
  ListItem,
  ListItemText,
  Paper,
  Grid,
  Chip,
  useTheme,
  alpha,
  Card,
  CardContent
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PaymentIcon from '@mui/icons-material/Payment';
import NoteIcon from '@mui/icons-material/Note';  // Changed from StickyNote to Note
import CommentIcon from '@mui/icons-material/Comment';  // Added as another alternative
import PersonIcon from '@mui/icons-material/Person';
import { deliveryAreas } from '../../services/constants';

const SectionHeader = ({ children, icon, sx = {} }) => {
  const theme = useTheme();
  return (
    <Box sx={{ mb: 2, ...sx }}>
      <Typography
        variant="subtitle1"
        sx={{
          display: 'flex',
          alignItems: 'center',
          color: theme.palette.primary.main,
          fontWeight: 500,
        }}
      >
        {icon && React.cloneElement(icon, { sx: { mr: 1, fontSize: '1.25rem' } })}
        {children}
      </Typography>
      <Divider sx={{ mt: 1 }} />
    </Box>
  );
};

const findDeliveryArea = (locationValue) => {
  for (const [_, areas] of Object.entries(deliveryAreas)) {
    const area = areas.find(area => area.value === locationValue);
    if (area) return area;
  }
  return null;
};

// Formats currency with thousands separator
const formatCurrency = (amount) => {
  return amount.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const OrderSummary = ({ cart, formData }) => {
  const theme = useTheme();

  // Calculate totals with proper number handling
  const calculateTotals = () => {
    if (!cart?.items?.length) return { totalItems: 0, subtotal: 0 };
    
    return cart.items.reduce((totals, item) => {
      const price = parseFloat(item.product?.discount_price || item.product?.price || 0);
      const quantity = parseInt(item.quantity || 0);
      const itemTotal = price * quantity;

      return {
        totalItems: totals.totalItems + quantity,
        subtotal: totals.subtotal + itemTotal
      };
    }, { totalItems: 0, subtotal: 0 });
  };

  const cartTotals = calculateTotals();
  const selectedArea = formData.delivery_location ? findDeliveryArea(formData.delivery_location) : null;
  const deliveryFee = parseFloat(selectedArea?.fee || 0);
  const subtotal = parseFloat(cartTotals.subtotal);
  const totalAmount = subtotal + deliveryFee;

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          textAlign: 'center',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          borderRadius: 2
        }}
      >
        <ShoppingCartIcon sx={{ fontSize: 40, color: alpha(theme.palette.text.secondary, 0.5), mb: 2 }} />
        <Typography variant="h6" color="text.secondary">Your cart is empty</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Add some items to your cart to proceed with checkout
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 3, 
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        borderRadius: 2,
        background: alpha(theme.palette.background.paper, 0.8)
      }}
    >
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h6"
          sx={{
            display: 'flex',
            alignItems: 'center',
            color: theme.palette.primary.main,
            fontWeight: 500,
          }}
        >
          <ShoppingCartIcon sx={{ mr: 1, fontSize: '1.25rem' }} />
          Order Summary
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {cartTotals.totalItems} {cartTotals.totalItems === 1 ? 'item' : 'items'} in your cart
        </Typography>
        <Divider sx={{ mt: 1 }} />
      </Box>

      {/* Cart Items */}
      <List disablePadding>
        {cart.items.map((item) => {
          const price = parseFloat(item.product?.discount_price || item.product?.price || 0);
          const quantity = parseInt(item.quantity || 0);
          const itemTotal = price * quantity;
          
          return (
            <Card 
              key={item.id} 
              variant="outlined" 
              sx={{ 
                mb: 2, 
                borderRadius: 1.5,
                boxShadow: 'none',
                '&:last-child': { mb: 0 } 
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Grid container spacing={1}>
                  <Grid item xs={7}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                      {item.product.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Qty: {item.quantity} × Ksh {formatCurrency(price)}
                    </Typography>
                  </Grid>
                  <Grid item xs={5} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                      Ksh {formatCurrency(itemTotal)}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          );
        })}
      </List>
      
      {/* Pricing Summary */}
      <Box sx={{ mt: 3, pt: 2, pb: 1, px: 2, bgcolor: alpha(theme.palette.background.default, 0.5), borderRadius: 1.5 }}>
        {/* Subtotal */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant="body2">Subtotal:</Typography>
          <Typography variant="body2">Ksh {formatCurrency(subtotal)}</Typography>
        </Box>
        
        {/* Delivery Fee */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2">
              Delivery:
            </Typography>
            {formData.is_pickup ? (
              <Chip 
                size="small" 
                label="Pickup" 
                variant="outlined" 
                sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} 
              />
            ) : (
              <Chip 
                size="small" 
                label={selectedArea?.label || 'Not selected'} 
                color="primary" 
                variant="outlined" 
                sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} 
              />
            )}
          </Box>
          <Typography variant="body2">Ksh {formatCurrency(deliveryFee)}</Typography>
        </Box>
        
        <Divider sx={{ my: 1.5 }} />
        
        {/* Total */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>Total:</Typography>
          <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 600 }}>
            Ksh {formatCurrency(totalAmount)}
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Delivery Information Column */}
        <Grid item xs={12} md={6}>
          <SectionHeader icon={<PersonIcon />}>Customer Details</SectionHeader>
          <Box sx={{ px: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>{formData.full_name}</Typography>
            <Typography variant="body2" color="text.secondary">{formData.phone_number}</Typography>
            <Typography variant="body2" color="text.secondary">{formData.email}</Typography>
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {formData.address}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {[formData.city, formData.postal_code, formData.country]
                  .filter(Boolean)
                  .join(', ')}
              </Typography>
            </Box>
          </Box>
          
          <SectionHeader icon={<LocalShippingIcon />} sx={{ mt: 3 }}>Delivery Method</SectionHeader>
          <Box sx={{ px: 1 }}>
            {formData.is_pickup ? (
              <Typography variant="body2">Pickup at Office/Shop</Typography>
            ) : selectedArea ? (
              <>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Delivery to {selectedArea.label}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Delivery Fee: Ksh {formatCurrency(selectedArea.fee)}
                </Typography>
              </>
            ) : (
              <Typography variant="body2" color="error">No delivery option selected</Typography>
            )}
          </Box>
        </Grid>

        {/* Payment & Instructions Column */}
        <Grid item xs={12} md={6}>
          <SectionHeader icon={<PaymentIcon />}>Payment Method</SectionHeader>
          <Box sx={{ px: 1 }}>
            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
              {formData.payment_method ? (
                <>
                  <Chip 
                    size="small" 
                    label={formData.payment_method} 
                    color="primary" 
                    sx={{ mr: 1, fontWeight: 500 }} 
                  />
                  {formData.payment_method === 'M-Pesa' && formData.phone_number && (
                    <Typography variant="body2" color="text.secondary">
                      via {formData.phone_number}
                    </Typography>
                  )}
                </>
              ) : (
                <Typography variant="body2" color="error">Not selected</Typography>
              )}
            </Typography>
          </Box>

          {/* Special Instructions */}
          {formData.special_instructions && (
            <>
              <SectionHeader icon={<NoteIcon />} sx={{ mt: 3 }}>
                Special Instructions
              </SectionHeader>
              <Box 
                sx={{ 
                  px: 1, 
                  py: 1.5, 
                  borderRadius: 1,
                  bgcolor: alpha(theme.palette.background.default, 0.5),
                  borderLeft: `3px solid ${alpha(theme.palette.primary.main, 0.5)}`
                }}
              >
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  "{formData.special_instructions}"
                </Typography>
              </Box>
            </>
          )}
          
          {/* Order Notes */}
          {formData.order_notes && (
            <>
              <SectionHeader icon={<CommentIcon />} sx={{ mt: 3 }}>
                Order Notes
              </SectionHeader>
              <Box 
                sx={{ 
                  px: 1, 
                  py: 1.5, 
                  borderRadius: 1,
                  bgcolor: alpha(theme.palette.background.default, 0.5),
                  borderLeft: `3px solid ${alpha(theme.palette.primary.main, 0.5)}`
                }}
              >
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  "{formData.order_notes}"
                </Typography>
              </Box>
            </>
          )}
        </Grid>
      </Grid>
    </Paper>
  );
};

export default OrderSummary;
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  TextField, 
  MenuItem, 
  FormControl,
  FormControlLabel,
  Switch,
  Grid,
  Paper,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  Container
} from '@mui/material';
import { 
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { productsAPI, adminAPI } from '../../services/api';

const AdminProductForm = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(slug);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    price: '',
    discount_price: '',
    stock: '',
    is_available: true,
    is_feature: false  // New field for featured products
  });

  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        // Fetch categories
        const categoriesResponse = await productsAPI.getCategories();
        setCategories(categoriesResponse.data.results || categoriesResponse.data); // Handle paginated and non-paginated responses
        
        // If edit mode, fetch product data
        if (isEditMode) {
          const productResponse = await productsAPI.getProduct(slug);
          const product = productResponse.data;
          
          setFormData({
            name: product.name,
            category: product.category,
            description: product.description,
            price: product.price,
            discount_price: product.discount_price || '',
            stock: product.stock,
            is_available: product.is_available
          });
          
          setImages(product.images || []);
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching initial data:", err);
        setServerError("Failed to load data. Please try again.");
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, [isEditMode, slug]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Use the checked value for checkboxes, otherwise use the field value
    const fieldValue = type === 'checkbox' ? checked : value;
    
    setFormData({
      ...formData,
      [name]: fieldValue
    });
    
    // Clear error for this field when user types
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null
      });
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles([...selectedFiles, ...filesArray]);
    }
  };

  const handleRemoveSelectedFile = (index) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);
  };

  const handleRemoveExistingImage = async (imageId) => {
    try {
      // Implement API call to remove the image
      // await adminAPI.deleteProductImage(imageId);
      
      // Update the images list
      setImages(images.filter(img => img.id !== imageId));
      setSuccessMessage("Image removed successfully");
      
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error("Error removing image:", err);
      setServerError("Failed to remove image. Please try again.");
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) errors.name = "Name is required";
    if (!formData.category) errors.category = "Category is required";
    if (!formData.description.trim()) errors.description = "Description is required";
    
    if (!formData.price) {
      errors.price = "Price is required";
    } else if (isNaN(formData.price) || parseFloat(formData.price) <= 0) {
      errors.price = "Price must be a positive number";
    }
    
    if (formData.discount_price && (isNaN(formData.discount_price) || parseFloat(formData.discount_price) <= 0)) {
      errors.discount_price = "Discount price must be a positive number";
    }
    
    if (!formData.stock) {
      errors.stock = "Stock is required";
    } else if (isNaN(formData.stock) || parseInt(formData.stock) < 0) {
      errors.stock = "Stock must be a non-negative number";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setServerError(null);

      // Prepare form data for API
      const productData = {
        name: formData.name,
        category: formData.category,
        description: formData.description,
        price: parseFloat(formData.price),
        discount_price: formData.discount_price ? parseFloat(formData.discount_price) : null,
        stock: parseInt(formData.stock),
        is_available: Boolean(formData.is_available),
        is_feature: Boolean(formData.is_feature), // Explicitly convert to boolean
        slug: generateSlug(formData.name)
      };

      // Create FormData object
      const formDataObj = new FormData();
      
      // Append product data with proper boolean conversion
      Object.keys(productData).forEach(key => {
        if (typeof productData[key] === 'boolean') {
          formDataObj.append(key, productData[key].toString()); // Convert boolean to string
        } else if (productData[key] !== null && productData[key] !== undefined) {
          formDataObj.append(key, productData[key]);
        }
      });

      // Append images to FormData
      selectedFiles.forEach(file => {
        formDataObj.append('images', file);
      });

      let response;
      if (isEditMode) {
        response = await adminAPI.updateProduct(slug, formDataObj);
      } else {
        response = await adminAPI.createProduct(formDataObj);
      }

      setSuccessMessage(`Product ${isEditMode ? 'updated' : 'created'} successfully!`);

      // Redirect after a short delay
      setTimeout(() => {
        navigate('/admin/products');
      }, 2000);
    } catch (err) {
      console.error("Error submitting product form:", err);
      setServerError(err.response?.data?.error || "Failed to save product. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/products');
  };

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  if (loading && !formData.name) {
    return <Box display="flex" justifyContent="center" my={4}><CircularProgress /></Box>;
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={handleCancel} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            {isEditMode ? 'Edit Product' : 'Add New Product'}
          </Typography>
        </Box>

        {serverError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {serverError}
          </Alert>
        )}

        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {successMessage}
          </Alert>
        )}

        <Paper sx={{ p: 3 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Product Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  error={Boolean(formErrors.name)}
                  helperText={formErrors.name}
                  margin="normal"
                  required
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth margin="normal">
                  <TextField
                    select
                    label="Category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    error={Boolean(formErrors.category)}
                    helperText={formErrors.category}
                    required
                  >
                    <MenuItem value="">Select a category</MenuItem>
                    {Array.isArray(categories) && categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  error={Boolean(formErrors.description)}
                  helperText={formErrors.description}
                  margin="normal"
                  multiline
                  rows={4}
                  required
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Price"
                  name="price"
                  type="number"
                  inputProps={{ min: 0, step: 0.01 }}
                  value={formData.price}
                  onChange={handleInputChange}
                  error={Boolean(formErrors.price)}
                  helperText={formErrors.price}
                  margin="normal"
                  required
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Discount Price (optional)"
                  name="discount_price"
                  type="number"
                  inputProps={{ min: 0, step: 0.01 }}
                  value={formData.discount_price}
                  onChange={handleInputChange}
                  error={Boolean(formErrors.discount_price)}
                  helperText={formErrors.discount_price}
                  margin="normal"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Stock"
                  name="stock"
                  type="number"
                  inputProps={{ min: 0 }}
                  value={formData.stock}
                  onChange={handleInputChange}
                  error={Boolean(formErrors.stock)}
                  helperText={formErrors.stock}
                  margin="normal"
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_available}
                      onChange={handleInputChange}
                      name="is_available"
                      color="primary"
                    />
                  }
                  label="Available for Purchase"
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_feature}
                      onChange={handleInputChange}
                      name="is_feature"
                      color="primary"
                    />
                  }
                  label="Feature this Product"
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Product Images
                </Typography>

                {/* Existing Images */}
                {images.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Current Images
                    </Typography>
                    <Grid container spacing={2}>
                      {images.map((image) => (
                        <Grid item key={image.id} xs={6} sm={4} md={3}>
                          <Box 
                            sx={{ 
                              position: 'relative',
                              height: 150,
                              backgroundImage: `url(${image.image})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              borderRadius: 1
                            }}
                          >
                            <IconButton
                              sx={{ 
                                position: 'absolute',
                                top: 5,
                                right: 5,
                                backgroundColor: 'rgba(255,255,255,0.7)'
                              }}
                              onClick={() => handleRemoveExistingImage(image.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}

                {/* New Images */}
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Upload New Images
                  </Typography>
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<CloudUploadIcon />}
                    sx={{ mb: 2 }}
                  >
                    Select Files
                    <input
                      type="file"
                      hidden
                      multiple
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </Button>
                  
                  {selectedFiles.length > 0 && (
                    <Grid container spacing={2}>
                      {selectedFiles.map((file, index) => (
                        <Grid item key={index} xs={6} sm={4} md={3}>
                          <Box 
                            sx={{ 
                              position: 'relative',
                              height: 150,
                              backgroundImage: `url(${URL.createObjectURL(file)})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              borderRadius: 1
                            }}
                          >
                            <IconButton
                              sx={{ 
                                position: 'absolute',
                                top: 5,
                                right: 5,
                                backgroundColor: 'rgba(255,255,255,0.7)'
                              }}
                              onClick={() => handleRemoveSelectedFile(index)}
                            >
                              <DeleteIcon />
                            </IconButton>
                            <Typography
                              variant="caption"
                              sx={{
                                position: 'absolute',
                                bottom: 5,
                                left: 5,
                                backgroundColor: 'rgba(255,255,255,0.7)',
                                padding: '2px 5px',
                                borderRadius: 1
                              }}
                            >
                              {file.name}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Button 
                    variant="outlined" 
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    variant="contained" 
                    color="primary" 
                    startIcon={<SaveIcon />}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Save Product'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default AdminProductForm;

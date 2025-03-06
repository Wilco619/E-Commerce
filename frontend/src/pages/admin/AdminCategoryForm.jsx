import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Paper, TextField, Button, Box, 
  FormControlLabel, Switch, CircularProgress, Snackbar, Alert
} from '@mui/material';
import { Save, ArrowBack } from '@mui/icons-material';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { adminAPI, productsAPI } from '../../services/api';

const AdminCategoryForm = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(slug);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
    slug: '', // Add slug field
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (isEditMode) {
      fetchCategoryData();
    }
  }, [isEditMode, slug]);

  const fetchCategoryData = async () => {
    setLoading(true);
    try {
        const response = await productsAPI.getCategory(slug);
        const { name, description, is_active } = response.data;
        setFormData({
            name,
            description: description || '',
            is_active: Boolean(is_active)
        });
    } catch (error) {
        console.error('Error fetching category:', error);
        showAlert('Failed to load category data', 'error');
    } finally {
        setLoading(false);
    }
};

  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    const inputValue = e.target.type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: inputValue
    }));
    
    // Clear error when field is modified
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    try {
      const categoryData = {
        ...formData,
        slug: generateSlug(formData.name),
        is_active: Boolean(formData.is_active) // Ensure boolean value
      };
      
      if (isEditMode) {
        await adminAPI.updateCategory(slug, categoryData);
        showAlert('Category updated successfully', 'success');
      } else {
        await adminAPI.createCategory(categoryData);
        showAlert('Category created successfully', 'success');
      }
      
      // Refresh categories list after update
      if (isEditMode) {
        await fetchCategoryData();
      } else {
        setTimeout(() => navigate('/admin/categories'), 1500);
      }
    } catch (error) {
      console.error('Error saving category:', error);
      if (error.response?.data) {
        setErrors(error.response.data);
      }
      showAlert('Failed to save category', 'error');
    } finally {
      setSaving(false);
    }
  };

  const showAlert = (message, severity) => {
    setAlert({ open: true, message, severity });
  };

  const handleAlertClose = () => {
    setAlert({ ...alert, open: false });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" my={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box mb={3} display="flex" alignItems="center">
        <Button 
          component={Link} 
          to="/admin/categories" 
          startIcon={<ArrowBack />}
          sx={{ mr: 2 }}
        >
          Back to Categories
        </Button>
        <Typography variant="h4" component="h1">
          {isEditMode ? 'Edit Category' : 'Create New Category'}
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ p: 4 }}>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Category Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            margin="normal"
            error={Boolean(errors.name)}
            helperText={errors.name}
            required
          />
          
          <TextField
            fullWidth
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            margin="normal"
            multiline
            rows={4}
            error={Boolean(errors.description)}
            helperText={errors.description}
          />
          
          <Box mt={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(formData.is_active)}
                  onChange={(e) => {
                    handleInputChange({
                      target: {
                        name: 'is_active',
                        type: 'checkbox',
                        checked: e.target.checked
                      }
                    });
                  }}
                  name="is_active"
                  color="primary"
                />
              }
              label="Active"
            />
          </Box>
          
          <Box mt={3} display="flex" justifyContent="flex-end">
            <Button
              variant="contained"
              color="primary"
              type="submit"
              disabled={saving}
              startIcon={saving ? <CircularProgress size={20} /> : <Save />}
              size="large"
            >
              {saving ? 'Saving...' : 'Save Category'}
            </Button>
          </Box>
        </form>
      </Paper>

      {/* Alert Snackbar */}
      <Snackbar 
        open={alert.open} 
        autoHideDuration={6000} 
        onClose={handleAlertClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleAlertClose} severity={alert.severity}>
          {alert.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminCategoryForm;

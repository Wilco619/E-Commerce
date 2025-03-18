import React from 'react';
import {
  Typography,
  Container,
  Box,
  Button,
  Paper,
  useTheme,
  useMediaQuery,
  Divider
} from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const NotFoundPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '90vh',
          py: 5
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ width: '100%', maxWidth: 900 }}
        >
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 5 },
              borderRadius: 4,
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: 'center',
              overflow: 'hidden',
              boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
              position: 'relative',
              backgroundImage: 'linear-gradient(135deg, #f5f7fa 0%, #f8f9ff 100%)',
            }}
          >
            {/* Decorative elements */}
            <Box
              sx={{
                position: 'absolute',
                height: '400%',
                width: '200%',
                top: '-150%',
                left: '-50%',
                background: `radial-gradient(circle, ${theme.palette.primary.light}15 0%, transparent 70%)`,
                zIndex: 0
              }}
            />
            
            {/* Left section with 404 */}
            <Box
              sx={{
                flex: { xs: '1 1 auto', md: '0 0 40%' },
                position: 'relative',
                zIndex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: { xs: 'center', md: 'flex-start' },
                p: { xs: 3, md: 5 },
                textAlign: { xs: 'center', md: 'left' },
                mb: { xs: 4, md: 0 }
              }}
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
              >
                <ErrorOutlineIcon
                  sx={{
                    fontSize: { xs: 80, md: 120 },
                    color: theme.palette.primary.main,
                    mb: 2
                  }}
                />
              </motion.div>
              
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <Typography
                  variant="h1"
                  component="h1"
                  sx={{
                    fontWeight: 900,
                    fontSize: { xs: '4rem', sm: '6rem', md: '7rem' },
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 20%, ${theme.palette.secondary.main} 80%)`,
                    backgroundClip: 'text',
                    textFillColor: 'transparent',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 0,
                    lineHeight: 1
                  }}
                >
                  404
                </Typography>
              </motion.div>
            </Box>

            {isMobile ? null : <Divider orientation="vertical" flexItem sx={{ zIndex: 1 }} />}
            
            {/* Right section with message and buttons */}
            <Box
              sx={{
                flex: { xs: '1 1 auto', md: '0 0 60%' },
                zIndex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: { xs: 'center', md: 'flex-start' },
                p: { xs: 2, md: 5 },
                textAlign: { xs: 'center', md: 'left' }
              }}
            >
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <Typography
                  variant="h4"
                  component="h2"
                  sx={{
                    fontWeight: 700,
                    mb: 2,
                    color: theme.palette.text.primary
                  }}
                >
                  Page Not Found
                </Typography>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    color: theme.palette.text.secondary,
                    mb: 4,
                    maxWidth: 500,
                    lineHeight: 1.8
                  }}
                >
                  The page you are looking for might have been removed, had its name changed,
                  or is temporarily unavailable. Please check the URL or navigate to another page.
                </Typography>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}
              >
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate('/')}
                  size="large"
                  startIcon={<HomeOutlinedIcon />}
                  sx={{
                    borderRadius: 6,
                    px: 3,
                    py: 1.5,
                    boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
                    '&:hover': {
                      boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                      transform: 'translateY(-2px)'
                    },
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  Go to Homepage
                </Button>

                <Button
                  variant="outlined"
                  onClick={() => navigate(-1)}
                  size="large"
                  startIcon={<ArrowBackOutlinedIcon />}
                  sx={{
                    borderRadius: 6,
                    px: 3,
                    py: 1.5,
                    borderWidth: 2,
                    '&:hover': {
                      borderWidth: 2,
                      transform: 'translateY(-2px)'
                    },
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  Go Back
                </Button>
              </motion.div>
            </Box>
          </Paper>
        </motion.div>
      </Box>
    </Container>
  );
};

export default NotFoundPage;
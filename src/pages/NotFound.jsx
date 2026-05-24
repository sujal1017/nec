import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Button,
  Typography,
  Container,
} from '@mui/material';
import {
  Home,
  ArrowBack,
  SearchOff,
} from '@mui/icons-material';

import { name } from '../config';

import { createTheme, ThemeProvider } from '@mui/material/styles';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#8b5cf6',
    },
    secondary: {
      main: '#6366f1',
    },
    background: {
      default: '#2a2438',
      paper: '#2d2640',
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 3,
        },
      },
    },
  },
});

export default function NotFoundPage() {
  const navigate = useNavigate();
  const [floatingNumbers, setFloatingNumbers] = useState([]);

  // Generate random floating 404 numbers for animation
  useEffect(() => {
    const numbers = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      animationDelay: Math.random() * 5,
      duration: 10 + Math.random() * 10,
    }));
    setFloatingNumbers(numbers);
  }, []);

  return (
    <ThemeProvider theme={darkTheme}>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'transparent',
          p: { xs: 2, md: 4 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Animated floating 404 numbers in background */}
        {floatingNumbers.map((num) => (
          <Box
            key={num.id}
            sx={{
              position: 'absolute',
              left: `${num.left}%`,
              fontSize: { xs: '2rem', md: '4rem' },
              color: 'rgba(139, 92, 246, 0.1)',
              fontWeight: 700,
              animation: `float ${num.duration}s ease-in-out infinite`,
              animationDelay: `${num.animationDelay}s`,
              '@keyframes float': {
                '0%': {
                  transform: 'translateY(100vh) rotate(0deg)',
                  opacity: 0,
                },
                '10%': {
                  opacity: 0.3,
                },
                '90%': {
                  opacity: 0.3,
                },
                '100%': {
                  transform: 'translateY(-100vh) rotate(360deg)',
                  opacity: 0,
                },
              },
            }}
          >
            404
          </Box>
        ))}

        <Paper
          elevation={24}
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            width: '100%',
            maxWidth: 1400,
            borderRadius: 1,
            overflow: 'hidden',
            bgcolor: '#1a1625',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Left Side - Gradient Section */}
          <Box
            sx={{
              flex: 1,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              p: { xs: 4, md: 10 },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: { xs: 300, md: 'auto' },
              position: 'relative',
            }}
          >
            {/* Decorative circles */}
            <Box
              sx={{
                position: 'absolute',
                top: '20%',
                left: '10%',
                width: { xs: 100, md: 150 },
                height: { xs: 100, md: 150 },
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
                animation: 'pulse 3s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%, 100%': {
                    transform: 'scale(1)',
                    opacity: 0.5,
                  },
                  '50%': {
                    transform: 'scale(1.1)',
                    opacity: 0.3,
                  },
                },
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: '20%',
                right: '10%',
                width: { xs: 80, md: 120 },
                height: { xs: 80, md: 120 },
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
                animation: 'pulse 4s ease-in-out infinite',
                animationDelay: '1s',
              }}
            />

            {/* Large 404 Text */}
            <Typography
              variant="h1"
              sx={{
                color: 'white',
                fontWeight: 900,
                fontSize: { xs: '6rem', md: '12rem' },
                lineHeight: 1,
                textShadow: '0 10px 30px rgba(0,0,0,0.3)',
                mb: 2,
              }}
            >
              404
            </Typography>

            <SearchOff
              sx={{
                fontSize: { xs: 60, md: 80 },
                color: 'white',
                opacity: 0.9,
              }}
            />
          </Box>

          {/* Right Side - Content Section */}
          <Box
            sx={{
              flex: 1,
              p: { xs: 3, md: 6 },
              display: 'flex',
              alignItems: 'center',
              bgcolor: 'background.paper',
            }}
          >
            <Container maxWidth="sm">
              <Typography
                variant="h3"
                sx={{
                  color: 'white',
                  fontWeight: 700,
                  mb: 2,
                  fontSize: { xs: '2rem', md: '2.5rem' },
                }}
              >
                Oops! Page Not Found
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  color: 'text.secondary',
                  mb: 1,
                  lineHeight: 1.8,
                }}
              >
                The page you're looking for doesn't exist or has been moved.
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  mb: 4,
                  lineHeight: 1.8,
                }}
              >
                Don't worry, it happens to the best of us. Let's get you back on track.
              </Typography>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={<Home />}
                  onClick={() => navigate('/')}
                  sx={{
                    py: 1.5,
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                    },
                  }}
                >
                  Go to Homepage
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  startIcon={<ArrowBack />}
                  onClick={() => navigate(-1)}
                  sx={{
                    py: 1.5,
                    color: 'text.primary',
                    borderColor: 'divider',
                    '&:hover': {
                      bgcolor: 'rgba(139, 92, 246, 0.1)',
                      borderColor: 'primary.main',
                    },
                  }}
                >
                  Go Back
                </Button>
              </Box>

              {/* Helpful Links */}
              <Box sx={{ mt: 6 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    mb: 2,
                    fontWeight: 600,
                  }}
                >
                  Popular Pages
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {[
                    { label: 'Home', path: '/' },
                    { label: 'Sign In', path: '/signin' },
                    { label: 'Register', path: '/register' },
                    { label: 'Contact Us', path: '/contact' },
                  ].map((link) => (
                    <Button
                      key={link.path}
                      onClick={() => navigate(link.path)}
                      sx={{
                        justifyContent: 'flex-start',
                        color: 'primary.main',
                        textTransform: 'none',
                        py: 0.5,
                        px: 0,
                        '&:hover': {
                          bgcolor: 'transparent',
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      {link.label}
                    </Button>
                  ))}
                </Box>
              </Box>

              {/* Brand Footer */}
              <Box
                sx={{
                  mt: 6,
                  pt: 3,
                  borderTop: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    textAlign: 'center',
                  }}
                >
                  © 2024 {name}. All rights reserved.
                </Typography>
              </Box>
            </Container>
          </Box>
        </Paper>
      </Box>
    </ThemeProvider>
  );
}
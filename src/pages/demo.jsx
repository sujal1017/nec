import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  Typography,
  IconButton,
  InputAdornment,
  Link,
  Alert,
  Container,
  Stack,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Google as GoogleIcon,
  Apple as AppleIcon,
  ArrowForward,
} from '@mui/icons-material';
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
    MuiTextField: {
      defaultProps: {
        size: "small",
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#3a3350',
            '& fieldset': {
              borderColor: 'transparent',
            },
            '&:hover fieldset': {
              borderColor: '#8b5cf6',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#8b5cf6',
            },
          },
        },
      },
    },
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

export default function SignInPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [signInSuccess, setSignInSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [currentSlide, setCurrentSlide] = useState(1);

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const handleChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [field]: value });

    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setLoading(true);
      setApiError('');

      try {
        const response = await fetch("https://your-backend-api.com/auth/signin", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            rememberMe: formData.rememberMe,
          }),
        });

        if (response.status === 401) {
          setApiError("Invalid email or password.");
        } else if (!response.ok) {
          setApiError("Server is down. Please try again later.");
        } else {
          setSignInSuccess(true);
        }

      } catch (error) {
        setApiError("No internet connection. Please check your network.");
      } finally {
        setLoading(false);
      }
    }
  };

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
        }}
      >
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
          }}
        >
          {/* Left Side - Image Section */}
          <Box
            sx={{
              flex: 1,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              p: { xs: 4, md: 10 },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: { xs: 300, md: 'auto' },
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: 'url("https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: 0.3,
              },
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 700, letterSpacing: 2 }}>
                  Ecom
                </Typography>
                <Button
                  endIcon={<ArrowForward />}
                  sx={{
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                  }}
                >
                  Back to website
                </Button>
              </Box>
            </Box>

            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Typography
                variant="h3"
                sx={{
                  color: 'white',
                  fontWeight: 600,
                  mb: 2,
                  fontSize: { xs: '2rem', md: '2.5rem' },
                }}
              >
                Welcome Back,
                <br />
                Let's Get Started
              </Typography>

              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 4 }}>
                {[0, 1, 2].map((index) => (
                  <Box
                    key={index}
                    sx={{
                      width: index === currentSlide ? 40 : 8,
                      height: 8,
                      borderRadius: 4,
                      bgcolor: index === currentSlide ? 'white' : 'rgba(255,255,255,0.3)',
                      transition: 'all 0.3s',
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>

          {/* Right Side - Form Section */}
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
              <Typography variant="h3" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
                Sign in
              </Typography>

              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
                Don't have an account?{' '}
                <Link
                  href="#"
                  sx={{
                    color: 'primary.main',
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  Create one
                </Link>
              </Typography>

              {!signInSuccess ? (
                <Box component="form" onSubmit={handleSubmit} noValidate>

                  <TextField
                    size='small'
                    fullWidth
                    placeholder="Email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange('email')}
                    error={!!errors.email}
                    helperText={errors.email}
                    sx={{
                      mb: 3,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 0.5,
                      },
                    }}
                  />

                  <TextField
                    size="small"
                    fullWidth
                    placeholder="Enter your password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange('password')}
                    error={!!errors.password}
                    helperText={errors.password}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            sx={{ color: 'text.secondary' }}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      mb: 2,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 0.5,
                      },
                    }}
                  />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.rememberMe}
                          onChange={handleChange('rememberMe')}
                          sx={{
                            color: 'primary.main',
                            '&.Mui-checked': { color: 'primary.main' },
                          }}
                        />
                      }
                      label={
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          Remember me
                        </Typography>
                      }
                    />
                    <Link
                      href="#"
                      sx={{
                        color: 'primary.main',
                        textDecoration: 'none',
                        fontSize: '0.875rem',
                        '&:hover': { textDecoration: 'underline' }
                      }}
                    >
                      Forgot password?
                    </Link>
                  </Box>

                  {apiError && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                      {apiError}
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{
                      py: 1.5,
                      mb: 3,
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                      },
                    }}
                  >
                    {loading ? 'Signing in...' : 'Sign in'}
                  </Button>

                  <Box sx={{ position: 'relative', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Or
                      </Typography>
                      <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<GoogleIcon />}
                      sx={{
                        color: 'text.primary',
                        borderColor: 'divider',
                        '&:hover': { bgcolor: 'rgba(139, 92, 246, 0.1)' },
                      }}
                    >
                      Google
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<AppleIcon />}
                      sx={{
                        color: 'text.primary',
                        borderColor: 'divider',
                        '&:hover': { bgcolor: 'rgba(139, 92, 246, 0.1)' },
                      }}
                    >
                      Apple
                    </Button>
                  </Box>

                </Box>
              ) : (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <Typography variant="h4" sx={{ color: "white", mb: 2 }}>
                    ✅ Signed In Successfully!
                  </Typography>

                  <Typography variant="body1" sx={{ color: "text.secondary", mb: 3 }}>
                    Welcome back! You're now logged in.
                  </Typography>

                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    sx={{
                      py: 1.5,
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                    }}
                    onClick={() => window.location.href = "/dashboard"}
                  >
                    Go to Dashboard
                  </Button>
                </Box>
              )}

            </Container>
          </Box>
        </Paper>
      </Box>
    </ThemeProvider>
  );
}
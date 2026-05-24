import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Container,
  Alert,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Visibility, VisibilityOff, CheckCircle } from '@mui/icons-material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#8b5cf6',
    },
    background: {
      default: '#2a2438',
      paper: '#2d2640',
    },
  },
  shape: {
    borderRadius: 16,
  },
});

export default function ResetPassword() {
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState(false);

  const isStrongPassword = (value) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!password) {
      newErrors.password = 'New password is required';
    } else if (!isStrongPassword(password)) {
      newErrors.password =
        'Password must be at least 8 characters and include uppercase, lowercase, number, and symbol';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length !== 0) return;

    setLoading(true);
    setApiError('');

    try {
      const response = await fetch(
        `${BaseUrl}/reset-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        }
      );

      if (!response.ok) {
        setApiError('Failed to reset password. Please try again.');
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setApiError('No internet connection. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      {/* ===== FULL SCREEN BACKGROUND ===== */}
      <Box
        sx={{
          minHeight: '100vh',
          width: '100vw',
          bgcolor: 'background.default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
        }}
      >
        {/* ===== CENTERED POPUP ===== */}
        <Paper
          elevation={24}
          sx={{
            width: '100%',
            maxWidth: 480,
            p: { xs: 4, md: 6 },
            textAlign: 'center',
            bgcolor: 'background.paper',
          }}
        >
          <Container disableGutters>
            {!success ? (
              <>
                <Typography
                  variant="h4"
                  sx={{ color: 'white', fontWeight: 700, mb: 1 }}
                >
                  Reset Password
                </Typography>

                <Typography
                  variant="body2"
                  sx={{ color: 'text.secondary', mb: 4 }}
                >
                  Choose a strong password to secure your account.
                </Typography>

                <Box component="form" onSubmit={handleSubmit} noValidate>
                  <TextField
                    fullWidth
                    type={showPassword ? 'text' : 'password'}
                    placeholder="New Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={!!errors.password}
                    helperText={errors.password}
                    sx={{ mb: 3 }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    fullWidth
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    error={!!errors.confirmPassword}
                    helperText={errors.confirmPassword}
                    sx={{ mb: 3 }}
                  />

                  {apiError && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                      {apiError}
                    </Alert>
                  )}

                  <Button
                    fullWidth
                    size="large"
                    type="submit"
                    disabled={loading}
                    variant="contained"
                    sx={{
                      py: 1.5,
                      background:
                        'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                      '&:hover': {
                        background:
                          'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                      },
                    }}
                  >
                    {loading ? 'Resetting...' : 'Reset Password'}
                  </Button>
                </Box>
              </>
            ) : (
              <>
                <CheckCircle
                  sx={{
                    fontSize: 90,
                    color: 'primary.main',
                    mb: 2,
                  }}
                />

                <Typography
                  variant="h4"
                  sx={{ color: 'white', fontWeight: 700, mb: 1 }}
                >
                  Password Reset Successful
                </Typography>

                <Typography
                  variant="body1"
                  sx={{ color: 'text.secondary', mb: 4 }}
                >
                  Your password has been updated successfully.
                  You can now sign in with your new password.
                </Typography>

                <Button
                  fullWidth
                  size="large"
                  variant="contained"
                  sx={{
                    py: 1.5,
                    background:
                      'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                  }}
                  onClick={() => navigate('/signin')}
                >
                  Go to Sign In
                </Button>
              </>
            )}
          </Container>
        </Paper>
      </Box>
    </ThemeProvider>
  );
}

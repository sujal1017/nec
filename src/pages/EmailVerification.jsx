import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Container,
} from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { ThemeProvider, createTheme } from '@mui/material/styles';

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

export default function EmailVerification() {
  const navigate = useNavigate();

  return (
    <ThemeProvider theme={darkTheme}>
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
            <CheckCircle
              sx={{
                fontSize: 90,
                color: 'primary.main',
                mb: 2,
              }}
            />

            <Typography
              variant="h4"
              sx={{
                color: 'white',
                fontWeight: 700,
                mb: 1,
              }}
            >
              Email Verified Successfully
            </Typography>

            <Typography
              variant="body1"
              sx={{
                color: 'text.secondary',
                mb: 4,
              }}
            >
              Your email address has been verified.
              You can now sign in to your account.
            </Typography>

            <Button
              fullWidth
              size="large"
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
              onClick={() => navigate('/signin')}
            >
              Go to Sign In
            </Button>
          </Container>
        </Paper>
      </Box>
    </ThemeProvider>
  );
}

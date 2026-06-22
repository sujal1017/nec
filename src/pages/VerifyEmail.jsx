import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Box, CircularProgress, Container, Typography } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#8b5cf6" },
    background: { default: "#2a2438", paper: "#2d2640" },
  },
  shape: { borderRadius: 8 },
});

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const email = params.get("email");
    const state = email ? { email } : {};
    setTimeout(() => navigate("/verify-account", { state, replace: true }), 500);
  }, [location, navigate]);

  return (
    <ThemeProvider theme={darkTheme}>
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", bgcolor: "background.default" }}>
        <Container maxWidth="xs">
          <Box sx={{ width: "100%", maxWidth: 440, mx: "auto", p: { xs: 3, md: 5 }, borderRadius: 2, bgcolor: "background.paper", textAlign: "center" }}>
            <CircularProgress color="primary" size={60} sx={{ mb: 3, display: "block", mx: "auto" }} />
            <Typography variant="h6" sx={{ color: "white", mb: 2 }}>Email Verification</Typography>
            <Typography variant="body1" sx={{ color: "text.secondary" }}>
              Email verification is now handled by Keycloak. Redirecting...
            </Typography>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default VerifyEmail;

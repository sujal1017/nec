import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Typography,
} from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import api from "../services/api";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#8b5cf6" },
    background: { default: "#2a2438", paper: "#2d2640" },
  },
  shape: { borderRadius: 8 },
});

const styleSx = {
  root: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    bgcolor: "background.default",
  },
  paper: {
    width: "100%",
    maxWidth: 440,
    mx: "auto",
    p: { xs: 3, md: 5 },
    borderRadius: 2,
    bgcolor: "background.paper",
    textAlign: "center",
  },
};

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Verifying your email...");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Invalid or missing verification token.");
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await api.get("/customer/verify-email/", {
          params: { token },
        });
        if (response.status === 200) {
          const data = response.data;
          if (data.email) setEmail(data.email);
          setStatus("success");
          setMessage("Email verified successfully! OTP sent to your email.");
          sessionStorage.setItem("otp_verification_email", data.email || email);
          localStorage.setItem("otp_verification_email", data.email || email);
          setTimeout(() => navigate("/verify-otp"), 2000);
        }
      } catch (error) {
        const detail = error?.response?.data?.detail || "";
        const msg = detail.toString().toLowerCase();
        if (msg.includes("expired") || msg.includes("invalid")) {
          setStatus("expired");
          setMessage("Verification link has expired or is invalid. Please request a new one.");
        } else {
          setStatus("error");
          setMessage("Email verification failed. Please try again.");
        }
      }
    };

    verifyEmail();
  }, [location, navigate, email]);

  return (
    <ThemeProvider theme={darkTheme}>
      <Box sx={styleSx.root}>
        <Container maxWidth="xs">
          <Box sx={styleSx.paper}>
            {status === "loading" && (
              <>
                <CircularProgress
                  color="primary"
                  size={60}
                  sx={{ mb: 3, display: "block", mx: "auto" }}
                />
                <Typography variant="h6" sx={{ color: "white", mb: 2 }}>
                  Verifying Email
                </Typography>
                <Typography variant="body1" sx={{ color: "text.secondary" }}>
                  {message}
                </Typography>
              </>
            )}

            {status === "success" && (
              <>
                <Typography
                  variant="h6"
                  sx={{ color: "success.main", mb: 2, fontWeight: 700 }}
                >
                  Email Verified!
                </Typography>
                <Typography variant="body1" sx={{ color: "white", mb: 3 }}>
                  {message}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Redirecting to OTP verification page...
                </Typography>
              </>
            )}

            {(status === "error" || status === "expired") && (
              <>
                <Typography
                  variant="h6"
                  sx={{ color: "error.main", mb: 2, fontWeight: 700 }}
                >
                  {status === "expired" ? "Link Expired" : "Verification Failed"}
                </Typography>
                <Typography variant="body1" sx={{ color: "white", mb: 3 }}>
                  {message}
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={() => navigate("/signin")}
                  >
                    Back to Sign In
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="large"
                    onClick={() => navigate("/register")}
                  >
                    Create New Account
                  </Button>
                </Box>
              </>
            )}
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default VerifyEmail;
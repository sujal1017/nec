import React, { useState, useEffect } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Link,
  TextField,
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
  },
};

const VerifyOTP = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const stored =
      sessionStorage.getItem("otp_verification_email") ||
      localStorage.getItem("otp_verification_email");
    if (stored) setEmail(stored);
  }, []);

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(value);
    setErrors((prev) => ({ ...prev, otp: "" }));
    setApiError("");
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setErrors((prev) => ({ ...prev, email: "" }));
    setApiError("");
  };

  const validate = () => {
    const nextErrors = {};
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Enter a valid email address";
    }
    if (!otp || otp.length !== 6) {
      nextErrors.otp = "Enter the 6-digit OTP";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError("");
    setSuccess("");
    try {
      const response = await api.post("/customer/otp/verify/", {
        email: email.toLowerCase().trim(),
        otp,
      });
      if (response.status === 200) {
        sessionStorage.removeItem("otp_verification_email");
        localStorage.removeItem("otp_verification_email");
        setSuccess("OTP verified! Your account is now active.");
        setTimeout(() => navigate("/signin", { replace: true }), 2000);
      }
    } catch (error) {
      const detail = error?.response?.data?.detail;
      const msg = typeof detail === "string" ? detail : "OTP verification failed.";
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setErrors((prev) => ({
        ...prev,
        email: "Enter your email to resend OTP",
      }));
      return;
    }
    setResending(true);
    setApiError("");
    try {
      await api.post("/customer/otp/resend/", {
        email: email.toLowerCase().trim(),
      });
      setSuccess("OTP resent. Check your email.");
    } catch (error) {
      const detail = error?.response?.data?.detail;
      const msg = typeof detail === "string" ? detail : "Failed to resend OTP.";
      setApiError(msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <Box sx={styleSx.root}>
        <Container maxWidth="xs">
          <Box sx={styleSx.paper}>
            <Typography
              variant="h4"
              fontWeight={700}
              textAlign="center"
              sx={{ color: "white", mb: 1 }}
            >
              Verify OTP
            </Typography>
            <Typography
              variant="body2"
              textAlign="center"
              sx={{ color: "text.secondary", mb: 3 }}
            >
              Enter the 6-digit code sent to your email
            </Typography>

            {apiError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {apiError}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}

            <Box component="form" onSubmit={handleVerify} noValidate>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                error={Boolean(errors.email)}
                helperText={errors.email}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Enter OTP"
                value={otp}
                onChange={handleOtpChange}
                error={Boolean(errors.otp)}
                helperText={errors.otp}
                inputProps={{
                  maxLength: 6,
                  inputMode: "numeric",
                  sx: { letterSpacing: 4, textAlign: "center", fontSize: 24 },
                }}
                sx={{ mb: 3 }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mb: 2 }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Verify OTP"
                )}
              </Button>
              <Button
                fullWidth
                variant="text"
                onClick={handleResend}
                disabled={resending || loading}
              >
                {resending ? "Sending..." : "Resend OTP"}
              </Button>
            </Box>

            <Typography textAlign="center" sx={{ mt: 3 }}>
              <Link
                component={RouterLink}
                to="/signin"
                underline="hover"
                sx={{ color: "primary.main" }}
              >
                Back to Sign In
              </Link>
            </Typography>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default VerifyOTP;

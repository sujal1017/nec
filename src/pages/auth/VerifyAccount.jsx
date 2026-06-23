import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import api from "../../services/api";
import { name } from "../../config";
import { useAuth } from "../../context/AuthContext";

const theme = createTheme({
  palette: { mode: "dark", primary: { main: "#8b5cf6" }, background: { paper: "#2d2640" } },
  shape: { borderRadius: 8 },
});

const verificationRedirect = (user) => (
  String(user?.account_type || user?.accountType || "").toLowerCase() === "business"
    ? "/seller/dashboard"
    : "/"
);

const VerifyAccount = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshProfile } = useAuth();
  const pollingRef = useRef(null);

  const resolvedEmail =
    location.state?.email ||
    new URLSearchParams(location.search).get("email") ||
    localStorage.getItem("verification_email") ||
    user?.email ||
    "";

  const [email, setEmail] = useState(resolvedEmail);
  const [apiError, setApiError] = useState("");
  const [apiSuccess, setApiSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  const handleVerified = useCallback(async () => {
    localStorage.removeItem("verification_email");
    setApiSuccess("Email verified. Redirecting...");
    await refreshProfile();
    setTimeout(() => navigate(verificationRedirect(user), { replace: true }), 900);
  }, [navigate, user, refreshProfile]);

  const checkStatus = useCallback(async (mail) => {
    if (!mail) return false;
    setChecking(true);
    try {
      const resp = await api.get("/customer/verification-status/", { params: { email: mail } });
      if (resp.data?.verified || resp.data?.emailVerified || resp.data?.status === "active") {
        handleVerified();
        return true;
      }
      return false;
    } catch (err) {
      setApiError(err?.response?.data?.email?.[0] || "Could not check verification status.");
      return false;
    } finally {
      setChecking(false);
    }
  }, [handleVerified]);

  const startPolling = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    let attempts = 0;
    pollingRef.current = setInterval(async () => {
      attempts += 1;
      const verified = await checkStatus(email);
      if (verified || attempts >= 60) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
        if (!verified && attempts >= 60) {
          setApiError("Verification timed out. Click refresh after using the email link.");
        }
      }
    }, 5000);
  }, [checkStatus, email]);

  useEffect(() => {
    if (resolvedEmail) {
      localStorage.setItem("verification_email", resolvedEmail);
      checkStatus(resolvedEmail);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [checkStatus, resolvedEmail]);

  const handleSendVerification = async () => {
    if (!email) {
      setApiError("Enter your email address.");
      return;
    }
    setLoading(true);
    setApiError("");
    setApiSuccess("");
    try {
      await api.get("/customer/send-email-verification-link/", { params: { email } });
      localStorage.setItem("verification_email", email);
      setApiSuccess("Verification email sent. Check your inbox and click the link.");
      startPolling();
    } catch (err) {
      setApiError(err?.response?.data?.msg || "Failed to send verification email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", p: { xs: 2, md: 4 } }}>
        <Container maxWidth="sm">
          <Paper sx={{ p: { xs: 3, md: 5 }, mx: "auto", width: "100%", borderRadius: 1 }}>
            <Typography variant="h4" fontWeight={800} sx={{ mb: 0.5 }}>{name}</Typography>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>Verify Your Email</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Keycloak will send the verification link. After you click it, this page will refresh your account status.
            </Typography>

            {apiError && <Alert severity="error" sx={{ mb: 2 }}>{apiError}</Alert>}
            {apiSuccess && <Alert severity="success" sx={{ mb: 2 }}>{apiSuccess}</Alert>}

            <TextField
              fullWidth
              size="small"
              label="Email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              sx={{ mb: 2 }}
            />

            <Button fullWidth variant="contained" onClick={handleSendVerification} disabled={loading || checking || !email}>
              {loading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
              Send Verification Email
            </Button>

            <Button fullWidth variant="text" sx={{ mt: 1 }} onClick={() => checkStatus(email)} disabled={checking || !email}>
              {checking ? "Checking..." : "Refresh Status"}
            </Button>

            <Box sx={{ display: "flex", gap: 2, justifyContent: "space-between", mt: 2 }}>
              <Button variant="text" onClick={() => navigate("/")}>Home</Button>
              <Button variant="text" size="small" onClick={() => navigate("/signin")}>Sign In</Button>
            </Box>
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default VerifyAccount;

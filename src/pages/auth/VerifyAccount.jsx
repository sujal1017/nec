import { useState, useEffect, useRef, useCallback } from "react";
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
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import api from "../../services/api";
import { name } from "../../config";
import { useAuth } from "../../context/AuthContext";

const theme = createTheme({
  palette: { mode: "dark", primary: { main: "#8b5cf6" }, background: { paper: "#2d2640" } },
  shape: { borderRadius: 8 },
});

const STEPS = ["Verify Email", "Enter OTP", "Done"];

const VerifyAccount = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  const resolvedEmail =
    location.state?.email ||
    localStorage.getItem("otp_verification_email") ||
    user?.email ||
    "";

  const [email, setEmail] = useState(resolvedEmail);
  const [step, setStep] = useState(0);
  const [apiError, setApiError] = useState("");
  const [apiSuccess, setApiSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const pollingRef = useRef(null);

  useEffect(() => {
    if (resolvedEmail) {
      localStorage.setItem("otp_verification_email", resolvedEmail);
      checkStatus(resolvedEmail);
    }
  }, []);

  const checkStatus = async (mail) => {
    try {
      const resp = await api.get("/customer/verification-status/", { params: { email: mail } });
      const { emailVerified, status } = resp.data;
      if (status === "verified") {
        setStep(2);
        setApiSuccess("Account fully verified!");
      } else if (emailVerified) {
        setStep(1);
        setApiSuccess("Email verified! Enter the OTP sent to your email.");
      } else {
        setStep(0);
      }
    } catch {
      // user might not exist yet or email not registered
    }
  };

  const startPolling = useCallback(() => {
    let attempts = 0;
    pollingRef.current = setInterval(async () => {
      attempts++;
      try {
        const resp = await api.get("/customer/verification-status/", { params: { email } });
        const { emailVerified } = resp.data;
        if (emailVerified) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
          setStep(1);
          setApiSuccess("Email verified! Enter the OTP sent to your email.");
        }
      } catch {
        // ignore polling errors
      }
      if (attempts >= 60) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
        setApiError("Verification timed out. Please try sending the email again.");
      }
    }, 5000);
  }, [email]);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const handleSendVerification = async () => {
    if (!email) { setApiError("Enter your email address."); return; }
    setLoading(true);
    setApiError("");
    setApiSuccess("");
    try {
      await api.get("/customer/send-email-verification-link/", { params: { email } });
      setApiSuccess("Verification email sent! Check your inbox and click the link.");
      localStorage.setItem("otp_verification_email", email);
      startPolling();
    } catch (err) {
      setApiError(err?.response?.data?.msg || "Failed to send verification email.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!/^\d{6}$/.test(otp)) { setApiError("Enter a valid 6-digit OTP."); return; }
    setLoading(true);
    setApiError("");
    setApiSuccess("");
    try {
      const resp = await api.post("/customer/otp/verify/", { email, otp });
      if (resp.status === 200) {
        setStep(2);
        setApiSuccess("Account verified! Redirecting to login...");
        setTimeout(() => navigate("/signin", { state: { verified: true } }), 2000);
      }
    } catch (err) {
      setApiError(err?.response?.data?.detail || err?.response?.data?.otp?.[0] || "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setApiError("");
    try {
      await api.post("/customer/otp/resend/", { email });
      setApiSuccess("OTP resent! Check your email.");
    } catch (err) {
      setApiError(err?.response?.data?.detail || "Could not resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return (
      <ThemeProvider theme={theme}>
        <Container maxWidth="sm" sx={{ py: 8 }}>
          <Paper sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>{name}</Typography>
            <Typography variant="h6" sx={{ mb: 1 }}>Verify Your Account</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Enter the email address you used to sign up.
            </Typography>
            {apiError && <Alert severity="error" sx={{ mb: 2 }}>{apiError}</Alert>}
            <TextField
              fullWidth
              size="small"
              label="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Button
              fullWidth
              variant="contained"
              disabled={!email}
              onClick={() => {
                localStorage.setItem("otp_verification_email", email);
                checkStatus(email);
              }}
            >
              Continue
            </Button>
            <Box sx={{ mt: 2 }}>
              <Button variant="text" size="small" onClick={() => navigate("/register")}>
                Create an account
              </Button>
            </Box>
          </Paper>
        </Container>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", p: { xs: 2, md: 4 } }}>
        <Paper sx={{ p: { xs: 3, md: 5 }, maxWidth: 520, mx: "auto", width: "100%" }}>
          <Typography variant="h4" fontWeight={800} sx={{ mb: 0.5 }}>{name}</Typography>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>Verify Your Account</Typography>

          <Stepper activeStep={step} sx={{ mb: 3 }}>
            {STEPS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Account: <strong>{email}</strong>
            {isAuthenticated && step < 2 && (
              <Button variant="text" size="small" sx={{ ml: 1 }} onClick={() => checkStatus(email)}>
                Refresh status
              </Button>
            )}
          </Typography>

          {apiError && <Alert severity="error" sx={{ mb: 2 }}>{apiError}</Alert>}
          {apiSuccess && <Alert severity="success" sx={{ mb: 2 }}>{apiSuccess}</Alert>}

          {/* Step 0: Email Verification */}
          {step === 0 && (
            <Paper variant="outlined" sx={{ p: 3, bgcolor: "background.paper" }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                Step 1: Verify Your Email
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Click the button below, then check your email and click the verification link.
              </Typography>
              <Button
                fullWidth
                variant="contained"
                onClick={handleSendVerification}
                disabled={loading}
              >
                {loading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
                Send Verification Email
              </Button>
            </Paper>
          )}

          {/* Step 1: OTP Verification */}
          {step === 1 && (
            <Paper variant="outlined" sx={{ p: 3, bgcolor: "background.paper" }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                Step 2: Enter OTP
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                An OTP was sent to <strong>{email}</strong>. Enter it below.
              </Typography>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 2 }}>
                <TextField
                  size="small"
                  label="6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputProps={{ maxLength: 6 }}
                  sx={{ width: 160 }}
                />
                <Button variant="contained" onClick={handleVerifyOtp} disabled={loading || otp.length !== 6}>
                  {loading ? <CircularProgress size={20} /> : "Verify"}
                </Button>
              </Box>
              <Button variant="text" size="small" onClick={handleResendOtp} disabled={loading}>
                Resend OTP
              </Button>
            </Paper>
          )}

          {/* Step 2: Done */}
          {step === 2 && (
            <Paper variant="outlined" sx={{ p: 3, bgcolor: "background.paper" }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1, color: "success.main" }}>
                Account Verified!
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Your account is fully verified. You can now log in and access all features.
              </Typography>
              <Button fullWidth variant="contained" onClick={() => navigate("/signin", { state: { verified: true } })}>
                Go to Login
              </Button>
            </Paper>
          )}

          <Box sx={{ display: "flex", gap: 2, justifyContent: "space-between", mt: 2 }}>
            <Button variant="text" onClick={() => navigate("/")}>Home</Button>
            <Button variant="text" size="small" onClick={() => navigate("/signin")}>Sign In</Button>
          </Box>
        </Paper>
      </Box>
    </ThemeProvider>
  );
};

export default VerifyAccount;

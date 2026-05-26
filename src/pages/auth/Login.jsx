import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Container,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Link,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { Apple, Facebook, Google, Visibility, VisibilityOff } from "@mui/icons-material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { name } from "../../config";
import { useAuth } from "../../context/AuthContext";
import { useGoogleOAuth } from "../../hooks/useGoogleOAuth";
import { googleLogin } from "../../services/authService";
import { getApiErrorMessage, getApiFieldErrors } from "../../utils/apiErrors";

const authTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#8b5cf6" },
    background: { paper: "#2d2640" },
  },
  shape: { borderRadius: 8 },
});

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Login = () => {
  const navigate = useNavigate();
  const { login, setAuth } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "", rememberMe: true });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateField = (field, value) => {
    if (field === "email") {
      return emailRegex.test(value) ? "" : "Enter a valid email address";
    }

    if (field === "password") {
      return value ? "" : "Password is required";
    }

    return "";
  };

  const handleGoogle = useGoogleOAuth({
    onSuccess: async (response) => {
      setLoading(true);
      setApiError("");
      try {
        const authData = await googleLogin({ accessToken: response.access_token });
        setAuth(authData);
        navigate("/", { replace: true });
      } catch {
        setApiError("Google login is not available from the backend yet.");
      } finally {
        setLoading(false);
      }
    },
    onError: (message) => setApiError(message),
  });

  const handleChange = (field) => (event) => {
    const rawValue = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    const value =
      typeof rawValue === "string"
        ? rawValue.slice(0, { email: 254, password: 64 }[field] || rawValue.length)
        : rawValue;
    setFormData((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: validateField(field, value) }));
    setApiError("");
  };

  const validate = () => {
    const nextErrors = {};
    if (!emailRegex.test(formData.email)) nextErrors.email = "Enter a valid email address";
    if (!formData.password) nextErrors.password = "Password is required";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setApiError("");
    try {
      await login(formData);
      navigate("/", { replace: true });
    } catch (error) {
      const fieldErrors = getApiFieldErrors(error, {
        username: "email",
        non_field_errors: "form",
      });

      setErrors((current) => ({ ...current, ...fieldErrors }));
      setApiError(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={authTheme}>
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", p: { xs: 2, md: 4 } }}>
        <Paper sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, width: "100%", maxWidth: 1200, mx: "auto", overflow: "hidden", borderRadius: 1 }}>
          <Box
            sx={{
              flex: 1,
              minHeight: { xs: 260, md: 680 },
              p: { xs: 3, md: 6 },
              color: "white",
              backgroundImage: "linear-gradient(rgba(0,0,0,.35), rgba(0,0,0,.45)), url('/images/slide1.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <Typography variant="h4" fontWeight={800}>{name}</Typography>
            <Typography variant="h3" sx={{ fontWeight: 800, fontSize: { xs: 34, md: 48 } }}>
              Welcome back
            </Typography>
          </Box>

          <Box sx={{ flex: 1, p: { xs: 3, md: 6 }, display: "flex", alignItems: "center" }}>
            <Container maxWidth="sm">
              <Typography variant="h3" fontWeight={800} sx={{ mb: 1 }}>Sign in</Typography>
              <Typography color="text.secondary" sx={{ mb: 4 }}>
                New here? <Link component={RouterLink} to="/register" underline="hover">Create an account</Link>
              </Typography>

              <Box component="form" onSubmit={handleSubmit} noValidate>
                <TextField fullWidth label="Email" type="email" value={formData.email} onChange={handleChange("email")} error={Boolean(errors.email)} helperText={errors.email} inputProps={{ maxLength: 254 }} sx={{ mb: 2 }} />
                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange("password")}
                  error={Boolean(errors.password)}
                  helperText={errors.password}
                  inputProps={{ maxLength: 64 }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword((value) => !value)}>
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 1 }}
                />

                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <FormControlLabel control={<Checkbox checked={formData.rememberMe} onChange={handleChange("rememberMe")} />} label="Remember me" />
                  <Link component={RouterLink} to="/reset-password" underline="hover">Forgot password?</Link>
                </Box>

                {apiError && <Alert severity="error" sx={{ mb: 2 }}>{apiError}</Alert>}

                <Button type="submit" fullWidth variant="contained" size="large" disabled={loading} sx={{ mb: 3 }}>
                  {loading ? "Signing in..." : "Sign in"}
                </Button>

                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 1 }}>
                  <Button variant="outlined" startIcon={<Google />} onClick={handleGoogle}>Google</Button>
                  <Button variant="outlined" startIcon={<Apple />}>Apple</Button>
                  <Button variant="outlined" startIcon={<Facebook />}>Facebook</Button>
                </Box>
              </Box>
            </Container>
          </Box>
        </Paper>
      </Box>
    </ThemeProvider>
  );
};

export default Login;

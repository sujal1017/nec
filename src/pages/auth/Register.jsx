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
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { Apple, Facebook, Google, Visibility, VisibilityOff } from "@mui/icons-material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { name } from "../../config";
import { useGoogleOAuth } from "../../hooks/useGoogleOAuth";
import { register } from "../../services/authService";
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
const phoneRegex = /^[0-9]{10}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  businessName: "",
  businessRegistrationNumber: "",
  taxId: "",
  businessAddress: "",
  password: "",
  confirmPassword: "",
  agreeTerms: false,
};

const Register = () => {
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState("personal");
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateField = (field, value, nextForm = formData, nextAccountType = accountType) => {
    switch (field) {
      case "firstName":
        return value.trim() ? "" : "First name is required";
      case "lastName":
        return value.trim() ? "" : "Last name is required";
      case "businessName":
        return nextAccountType === "business" && !value.trim() ? "Business name is required" : "";
      case "businessRegistrationNumber":
        return nextAccountType === "business" && !value.trim() ? "Business registration number is required" : "";
      case "businessAddress":
        return nextAccountType === "business" && !value.trim() ? "Business address is required" : "";
      case "email":
        return emailRegex.test(value) ? "" : "Enter a valid email address";
      case "phone":
        return phoneRegex.test(value) ? "" : "Phone number must be exactly 10 digits";
      case "password":
        return passwordRegex.test(value)
          ? ""
          : "Use 8+ chars with upper, lower, number, and symbol";
      case "confirmPassword":
        return value === nextForm.password ? "" : "Passwords do not match";
      case "agreeTerms":
        return value ? "" : "You must accept the terms";
      default:
        return "";
    }
  };

  const handleGoogle = useGoogleOAuth({
    onSuccess: async (response) => {
      try {
        const userInfo = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${response.access_token}` },
        }).then((res) => res.json());
        setFormData((current) => ({
          ...current,
          firstName: userInfo.given_name || current.firstName,
          lastName: userInfo.family_name || current.lastName,
          email: userInfo.email || current.email,
        }));
      } catch {
        setApiError("Google profile lookup failed. Please continue manually.");
      }
    },
    onError: (message) => setApiError(message),
  });

  const handleChange = (field) => (event) => {
    const rawValue = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    const value =
      field === "phone"
        ? rawValue.replace(/\D/g, "").slice(0, 10)
        : typeof rawValue === "string"
          ? rawValue.slice(0, {
              firstName: 50,
              lastName: 50,
              businessName: 80,
              businessRegistrationNumber: 80,
              taxId: 80,
              businessAddress: 300,
              email: 254,
              password: 64,
              confirmPassword: 64,
            }[field] || rawValue.length)
          : rawValue;

    const nextForm = { ...formData, [field]: value };
    setFormData(nextForm);
    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: validateField(field, value, nextForm),
      ...(field === "password"
        ? { confirmPassword: validateField("confirmPassword", nextForm.confirmPassword, nextForm) }
        : {}),
    }));
    setApiError("");
  };

  const validate = () => {
    const nextErrors = {};
    if (!formData.firstName.trim()) nextErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) nextErrors.lastName = "Last name is required";
    if (!emailRegex.test(formData.email)) nextErrors.email = "Enter a valid email address";
    if (!phoneRegex.test(formData.phone)) nextErrors.phone = "Phone number must be exactly 10 digits";
    if (!passwordRegex.test(formData.password)) {
      nextErrors.password = "Use 8+ chars with upper, lower, number, and symbol";
    }
    if (formData.password !== formData.confirmPassword) nextErrors.confirmPassword = "Passwords do not match";
    if (accountType === "business" && !formData.businessName.trim()) nextErrors.businessName = "Business name is required";
    if (accountType === "business" && !formData.businessRegistrationNumber.trim()) {
      nextErrors.businessRegistrationNumber = "Business registration number is required";
    }
    if (accountType === "business" && !formData.businessAddress.trim()) nextErrors.businessAddress = "Business address is required";
    if (!formData.agreeTerms) nextErrors.agreeTerms = "You must accept the terms";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setApiError("");
    try {
      await register({
        accountType,
        account_type: accountType,
        userType: accountType,
        businessName: accountType === "business" ? formData.businessName : "",
        business_name: accountType === "business" ? formData.businessName : "",
        businessRegistrationNumber: accountType === "business" ? formData.businessRegistrationNumber : "",
        business_registration_number: accountType === "business" ? formData.businessRegistrationNumber : "",
        taxId: accountType === "business" ? formData.taxId : "",
        tax_id: accountType === "business" ? formData.taxId : "",
        businessAddress: accountType === "business" ? formData.businessAddress : "",
        business_address: accountType === "business" ? formData.businessAddress : "",
        full_name: `${formData.firstName} ${formData.lastName}`,
        mobile: formData.phone,
        name: `${formData.firstName} ${formData.lastName}`,
        username: formData.email,
        email: formData.email,
        first_name: formData.firstName,
        last_name: formData.lastName,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneno: formData.phone,
        password: formData.password,
      });
      setSuccess(true);
      navigate("/signin", { replace: true, state: { registered: true } });
    } catch (error) {
      const fieldErrors = getApiFieldErrors(error, {
                    full_name: "firstName",
                    mobile: "phone",
                    account_type: "accountType",
                    business_name: "businessName",
                    business_registration_number: "businessRegistrationNumber",
                    tax_id: "taxId",
                    business_address: "businessAddress",
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
              minHeight: { xs: 260, md: 760 },
              p: { xs: 3, md: 6 },
              color: "white",
              backgroundImage: "linear-gradient(rgba(0,0,0,.35), rgba(0,0,0,.45)), url('/images/slide2.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <Typography variant="h4" fontWeight={800}>{name}</Typography>
            <Typography variant="h3" sx={{ fontWeight: 800, fontSize: { xs: 34, md: 48 } }}>
              Start your journey
            </Typography>
          </Box>

          <Box sx={{ flex: 1, p: { xs: 3, md: 6 }, display: "flex", alignItems: "center" }}>
            <Container maxWidth="sm">
              <Typography variant="h3" fontWeight={800} sx={{ mb: 1 }}>Create account</Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                Already registered? <Link component={RouterLink} to="/signin" underline="hover">Sign in</Link>
              </Typography>

              <Tabs
                value={accountType}
                onChange={(_, value) => {
                  setAccountType(value);
                  setErrors((current) => ({
                    ...current,
                    businessName: validateField("businessName", formData.businessName, formData, value),
                    businessRegistrationNumber: validateField("businessRegistrationNumber", formData.businessRegistrationNumber, formData, value),
                    taxId: validateField("taxId", formData.taxId, formData, value),
                    businessAddress: validateField("businessAddress", formData.businessAddress, formData, value),
                  }));
                }}
                sx={{ mb: 3 }}
              >
                <Tab value="personal" label="Personal" />
                <Tab value="business" label="Business" />
              </Tabs>

              {success ? (
                <Box sx={{ py: 4 }}>
                  <Alert severity="success" sx={{ mb: 3 }}>Account created successfully.</Alert>
                  <Button fullWidth variant="contained" onClick={() => navigate("/signin")}>Go to login</Button>
                </Box>
              ) : (
                <Box component="form" onSubmit={handleSubmit} noValidate>
                  {accountType === "business" && (
                    <Stack spacing={2} sx={{ mb: 2 }}>
                      <TextField fullWidth label="Business name" value={formData.businessName} onChange={handleChange("businessName")} error={Boolean(errors.businessName)} helperText={errors.businessName} inputProps={{ maxLength: 80 }} />
                      <TextField fullWidth label="Business registration number" value={formData.businessRegistrationNumber} onChange={handleChange("businessRegistrationNumber")} error={Boolean(errors.businessRegistrationNumber)} helperText={errors.businessRegistrationNumber} inputProps={{ maxLength: 80 }} />
                      <TextField fullWidth label="Tax ID / VAT number" value={formData.taxId} onChange={handleChange("taxId")} error={Boolean(errors.taxId)} helperText={errors.taxId} inputProps={{ maxLength: 80 }} />
                      <TextField fullWidth multiline minRows={3} label="Business address" value={formData.businessAddress} onChange={handleChange("businessAddress")} error={Boolean(errors.businessAddress)} helperText={errors.businessAddress} inputProps={{ maxLength: 300 }} />
                    </Stack>
                  )}

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
                    <TextField fullWidth label="First name" value={formData.firstName} onChange={handleChange("firstName")} error={Boolean(errors.firstName)} helperText={errors.firstName} inputProps={{ maxLength: 50 }} />
                    <TextField fullWidth label="Last name" value={formData.lastName} onChange={handleChange("lastName")} error={Boolean(errors.lastName)} helperText={errors.lastName} inputProps={{ maxLength: 50 }} />
                  </Stack>

                  <TextField fullWidth label="Email" type="email" value={formData.email} onChange={handleChange("email")} error={Boolean(errors.email)} helperText={errors.email} inputProps={{ maxLength: 254 }} sx={{ mb: 2 }} />
                  <TextField fullWidth label="Phone" value={formData.phone} onChange={handleChange("phone")} error={Boolean(errors.phone)} helperText={errors.phone || "10 digits only"} inputProps={{ maxLength: 10, inputMode: "numeric" }} sx={{ mb: 2 }} />
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
                          <IconButton onClick={() => setShowPassword((value) => !value)}>{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Confirm password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleChange("confirmPassword")}
                    error={Boolean(errors.confirmPassword)}
                    helperText={errors.confirmPassword}
                    inputProps={{ maxLength: 64 }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowConfirmPassword((value) => !value)}>{showConfirmPassword ? <VisibilityOff /> : <Visibility />}</IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{ mb: 1 }}
                  />

                  <FormControlLabel control={<Checkbox checked={formData.agreeTerms} onChange={handleChange("agreeTerms")} />} label="I agree to the terms and conditions" />
                  {errors.agreeTerms && <Alert severity="error" sx={{ my: 2 }}>{errors.agreeTerms}</Alert>}
                  {apiError && !errors.form && <Alert severity="error" sx={{ mb: 2 }}>{apiError}</Alert>}
                  {errors.form && <Alert severity="error" sx={{ mb: 2 }}>{errors.form}</Alert>}

                  <Button type="submit" fullWidth variant="contained" size="large" disabled={loading} sx={{ my: 2 }}>
                    {loading ? "Creating account..." : "Create account"}
                  </Button>

                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 1 }}>
                    <Button variant="outlined" startIcon={<Google />} onClick={handleGoogle}>Google</Button>
                    <Button variant="outlined" startIcon={<Apple />}>Apple</Button>
                    <Button variant="outlined" startIcon={<Facebook />}>Facebook</Button>
                  </Box>
                </Box>
              )}
            </Container>
          </Box>
        </Paper>
      </Box>
    </ThemeProvider>
  );
};

export default Register;

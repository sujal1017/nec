import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  FormControlLabel,
  Paper,
  Radio,
  RadioGroup,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { createOrder, fetchCheckoutProfile } from "../services/commerceService";
import { handleImageFallback } from "../utils/images";
import { useAuth } from "../context/AuthContext";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const DELIVERY_CHARGE = 49;

const splitName = (name = "") => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  };
};

const formatApiError = (error) => {
  const data = error?.response?.data;
  if (!data) return "Order could not be placed.";
  if (typeof data === "string") return data;
  if (data.error || data.detail || data.message) return data.error || data.detail || data.message;
  return Object.entries(data)
    .map(([field, value]) => `${field}: ${Array.isArray(value) ? value.join(", ") : String(value)}`)
    .join(" | ");
};

const Checkout = ({ darkMode, setDarkMode }) => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const selectedCarts = state?.selectedCarts || [];
  const [placing, setPlacing] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "error" });
  const [address, setAddress] = useState({
    firstName: "",
    lastName: "",
    email: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pinCode: "",
    country: "India",
  });

  useEffect(() => {
    const profileName = splitName(user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(" "));
    setAddress((current) => ({
      ...current,
      firstName: current.firstName || profileName.firstName,
      lastName: current.lastName || profileName.lastName,
      email: current.email || user?.email || "",
    }));

    let alive = true;
    fetchCheckoutProfile()
      .then((data) => {
        if (!alive) return;
        const profile = data?.profileData?.profile || {};
        const apiName = splitName(profile.name || "");
        const addresses = data?.profileData?.savedAddresses || [];
        const mappedAddresses = addresses.map((item) => ({
          id: item.id,
          label: item.label || "Saved address",
          firstName: profileName.firstName || apiName.firstName,
          lastName: profileName.lastName || apiName.lastName,
          email: profile.email || user?.email || "",
          addressLine1: item.address1 || "",
          addressLine2: item.address2 || "",
          city: item.city || "",
          state: item.state || "",
          country: item.country || "India",
          pinCode: item.zipCode || "",
        }));
        setSavedAddresses(mappedAddresses);
        setAddress((current) => ({
          ...current,
          firstName: current.firstName || apiName.firstName,
          lastName: current.lastName || apiName.lastName,
          email: current.email || profile.email || "",
        }));
        if (mappedAddresses.length) {
          setSelectedAddressId(String(mappedAddresses[0].id));
          setAddress((current) => ({ ...current, ...mappedAddresses[0] }));
        }
      })
      .catch((error) => {
        if (error?.response?.status === 401) navigate("/signin", { replace: true, state: { from: "/checkout" } });
      })
      .finally(() => alive && setProfileLoading(false));

    return () => {
      alive = false;
    };
  }, [navigate, user]);

  const items = useMemo(() => selectedCarts.flatMap((cart) => cart.items || []), [selectedCarts]);
  const subtotal = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0);
  const delivery = subtotal > 0 && subtotal < 999 ? DELIVERY_CHARGE : 0;
  const total = subtotal + delivery;

  const updateAddress = (field) => (event) => setAddress((current) => ({ ...current, [field]: event.target.value }));
  const selectSavedAddress = (event) => {
    const id = event.target.value;
    setSelectedAddressId(id);
    const selected = savedAddresses.find((item) => String(item.id) === String(id));
    if (selected) setAddress((current) => ({ ...current, ...selected }));
  };

  const isValid = ["firstName", "lastName", "email", "addressLine1", "city", "state", "pinCode", "country"].every((field) => String(address[field] || "").trim());

  const placeOrder = async () => {
    if (!items.length) {
      navigate("/cart");
      return;
    }
    setPlacing(true);
    try {
      const data = await createOrder({
        cartIds: selectedCarts.map((cart) => cart.id),
        shippingAddress: {
          firstName: address.firstName,
          lastName: address.lastName,
          email: address.email,
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2,
          city: address.city,
          state: address.state,
          pinCode: address.pinCode,
          country: address.country,
        },
        payment_method: paymentMethod,
      });
      navigate("/order-success", { replace: true, state: { order: data.order } });
    } catch (error) {
      setSnackbar({ open: true, message: formatApiError(error), severity: "error" });
    } finally {
      setPlacing(false);
    }
  };

  return (
    <>
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
        <Typography variant="h4" fontWeight={900} sx={{ mb: 3 }}>Checkout</Typography>
        {!items.length ? (
          <Alert severity="warning" action={<Button onClick={() => navigate("/cart")}>Go to cart</Button>}>No cart items selected for checkout.</Alert>
        ) : (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Stack spacing={3}>
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 1 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="h6" fontWeight={900}>Shipping Address</Typography>
                    {profileLoading ? <CircularProgress size={22} /> : null}
                  </Stack>
                  {savedAddresses.length ? (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>Quick order with saved address</Typography>
                      <RadioGroup value={selectedAddressId} onChange={selectSavedAddress}>
                        <Grid container spacing={1.5}>
                          {savedAddresses.map((item) => (
                            <Grid size={{ xs: 12, sm: 6 }} key={item.id}>
                              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1, height: "100%" }}>
                                <FormControlLabel
                                  value={String(item.id)}
                                  control={<Radio />}
                                  label={
                                    <Box>
                                      <Typography fontWeight={900}>{item.label}</Typography>
                                      <Typography variant="body2" color="text.secondary">
                                        {[item.addressLine1, item.addressLine2, item.city, item.state, item.country, item.pinCode].filter(Boolean).join(", ")}
                                      </Typography>
                                    </Box>
                                  }
                                  sx={{ alignItems: "flex-start", m: 0 }}
                                />
                              </Paper>
                            </Grid>
                          ))}
                        </Grid>
                      </RadioGroup>
                    </Box>
                  ) : null}
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}><TextField required fullWidth label="First name" value={address.firstName} onChange={updateAddress("firstName")} /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><TextField required fullWidth label="Last name" value={address.lastName} onChange={updateAddress("lastName")} /></Grid>
                    <Grid size={12}><TextField required fullWidth label="Email" type="email" value={address.email} onChange={updateAddress("email")} /></Grid>
                    <Grid size={12}><TextField required fullWidth label="Address line 1" value={address.addressLine1} onChange={updateAddress("addressLine1")} /></Grid>
                    <Grid size={12}><TextField fullWidth label="Address line 2" value={address.addressLine2} onChange={updateAddress("addressLine2")} /></Grid>
                    <Grid size={{ xs: 12, sm: 4 }}><TextField required fullWidth label="City" value={address.city} onChange={updateAddress("city")} /></Grid>
                    <Grid size={{ xs: 12, sm: 4 }}><TextField required fullWidth label="State" value={address.state} onChange={updateAddress("state")} /></Grid>
                    <Grid size={{ xs: 12, sm: 4 }}><TextField required fullWidth label="PIN code" value={address.pinCode} onChange={updateAddress("pinCode")} /></Grid>
                    <Grid size={{ xs: 12, sm: 4 }}><TextField required fullWidth label="Country" value={address.country} onChange={updateAddress("country")} /></Grid>
                  </Grid>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
                    This address is saved to your account after placing the order.
                  </Typography>
                </Paper>

                <Paper variant="outlined" sx={{ p: 3, borderRadius: 1 }}>
                  <Typography variant="h6" fontWeight={900}>Payment Method</Typography>
                  <RadioGroup value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
                    <FormControlLabel value="COD" control={<Radio />} label="Cash on Delivery" />
                    <FormControlLabel value="UPI" control={<Radio />} label="UPI placeholder" />
                    <FormControlLabel value="Credit/Debit Card" control={<Radio />} label="Card placeholder" />
                  </RadioGroup>
                </Paper>
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper variant="outlined" sx={{ p: 3, borderRadius: 1, position: { md: "sticky" }, top: 96 }}>
                <Typography variant="h6" fontWeight={900}>Order Summary</Typography>
                <Divider sx={{ my: 2 }} />
                <Stack spacing={2} sx={{ maxHeight: 340, overflow: "auto" }}>
                  {items.map((item) => (
                    <Stack direction="row" spacing={1.5} key={`${item.id}-${item.product_id}`}>
                      <Box component="img" src={item.image} alt={item.name} onError={handleImageFallback} sx={{ width: 64, height: 64, objectFit: "cover", borderRadius: 1 }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography fontWeight={800} noWrap>{item.name}</Typography>
                        <Typography variant="body2" color="text.secondary">Qty {item.quantity}</Typography>
                      </Box>
                      <Typography fontWeight={800}>{currency.format(item.price * item.quantity)}</Typography>
                    </Stack>
                  ))}
                </Stack>
                <Divider sx={{ my: 2 }} />
                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between"><Typography>Subtotal</Typography><Typography>{currency.format(subtotal)}</Typography></Stack>
                  <Stack direction="row" justifyContent="space-between"><Typography>Delivery</Typography><Typography>{delivery ? currency.format(delivery) : "Free"}</Typography></Stack>
                  <Stack direction="row" justifyContent="space-between"><Typography fontWeight={900}>Total</Typography><Typography fontWeight={900}>{currency.format(total)}</Typography></Stack>
                </Stack>
                <Button fullWidth size="large" variant="contained" sx={{ mt: 3 }} disabled={!isValid || placing} onClick={placeOrder}>
                  {placing ? "Placing order..." : "Place Order"}
                </Button>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Container>
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar((current) => ({ ...current, open: false }))}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
      <Footer />
    </>
  );
};

export default Checkout;

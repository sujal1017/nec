import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Container,
  Divider,
  IconButton,
  Paper,
  Skeleton,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import DeleteIcon from "@mui/icons-material/Delete";
import ShoppingCartCheckoutIcon from "@mui/icons-material/ShoppingCartCheckout";
import RemoveIcon from "@mui/icons-material/Remove";
import AddIcon from "@mui/icons-material/Add";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { fetchCart, removeCartItem, updateCartItem } from "../services/commerceService";
import { handleImageFallback } from "../utils/images";
import { useAuth } from "../context/AuthContext";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const DELIVERY_CHARGE = 49;

const Cart = ({ darkMode, setDarkMode }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [carts, setCarts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyItem, setBusyItem] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const loadCart = async () => {
    setLoading(true);
    try {
      setCarts(await fetchCart());
    } catch {
      setSnackbar({ open: true, message: "Cart could not be loaded.", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const items = useMemo(() => carts.flatMap((cart) => (cart.items || []).map((item) => ({ ...item, cartId: cart.id, cartName: cart.name }))), [carts]);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const delivery = subtotal > 0 && subtotal < 999 ? DELIVERY_CHARGE : 0;
  const total = subtotal + delivery;

  const updateQty = async (item, quantity) => {
    if (quantity < 1) return;
    setBusyItem(item.id);
    try {
      await updateCartItem({ itemId: item.id, productId: item.product_id, quantity });
      setCarts(await fetchCart());
    } catch {
      setSnackbar({ open: true, message: "Quantity could not be updated.", severity: "error" });
    } finally {
      setBusyItem(null);
    }
  };

  const removeItem = async (item) => {
    setBusyItem(item.id);
    try {
      await removeCartItem({ itemId: item.id, productId: item.product_id, cartId: item.cartId });
      setCarts(await fetchCart());
      setSnackbar({ open: true, message: "Item removed from cart.", severity: "success" });
    } catch {
      setSnackbar({ open: true, message: "Item could not be removed.", severity: "error" });
    } finally {
      setBusyItem(null);
    }
  };

  const checkout = () => {
    if (!isAuthenticated) {
      navigate("/signin", { state: { from: "/cart" } });
      return;
    }
    navigate("/checkout", {
      state: {
        selectedCarts: carts.filter((cart) => (cart.items || []).length),
      },
    });
  };

  return (
    <>
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
        <Typography variant="h4" fontWeight={900} sx={{ mb: 3 }}>Shopping Cart</Typography>
        {loading ? (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 8 }}><Skeleton variant="rounded" height={360} /></Grid>
            <Grid size={{ xs: 12, md: 4 }}><Skeleton variant="rounded" height={260} /></Grid>
          </Grid>
        ) : !items.length ? (
          <Paper sx={{ minHeight: 360, display: "grid", placeItems: "center", p: 4, borderRadius: 1 }} variant="outlined">
            <Stack spacing={2} alignItems="center">
              <Box component="img" src="/images/noCart.png" alt="Empty cart" sx={{ width: 150, height: 150 }} />
              <Typography variant="h6">Your cart is empty.</Typography>
              <Button variant="contained" component={Link} to="/products">Continue Shopping</Button>
            </Stack>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Stack spacing={2}>
                {items.map((item) => (
                  <Paper key={item.id} variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <Box component="img" src={item.image} alt={item.name} loading="lazy" onError={handleImageFallback} sx={{ width: 120, height: 120, objectFit: "cover", borderRadius: 1 }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography component={Link} to={`/product/${item.product_id}`} variant="h6" fontWeight={900} sx={{ color: "inherit", textDecoration: "none" }}>{item.name}</Typography>
                        <Typography color="text.secondary">{item.cartName}</Typography>
                        <Typography color="primary" fontWeight={900}>{currency.format(item.price)}</Typography>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2 }}>
                          <IconButton disabled={busyItem === item.id} onClick={() => updateQty(item, item.quantity - 1)}><RemoveIcon /></IconButton>
                          <Typography fontWeight={800}>{item.quantity}</Typography>
                          <IconButton disabled={busyItem === item.id} onClick={() => updateQty(item, item.quantity + 1)}><AddIcon /></IconButton>
                          <IconButton color="error" disabled={busyItem === item.id} onClick={() => removeItem(item)}><DeleteIcon /></IconButton>
                        </Stack>
                      </Box>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper variant="outlined" sx={{ p: 3, borderRadius: 1, position: { md: "sticky" }, top: 96 }}>
                <Typography variant="h6" fontWeight={900}>Price Details</Typography>
                <Divider sx={{ my: 2 }} />
                <Stack spacing={1.5}>
                  <Stack direction="row" justifyContent="space-between"><Typography>Subtotal</Typography><Typography>{currency.format(subtotal)}</Typography></Stack>
                  <Stack direction="row" justifyContent="space-between"><Typography>Delivery</Typography><Typography>{delivery ? currency.format(delivery) : "Free"}</Typography></Stack>
                  <Divider />
                  <Stack direction="row" justifyContent="space-between"><Typography fontWeight={900}>Total</Typography><Typography fontWeight={900}>{currency.format(total)}</Typography></Stack>
                </Stack>
                <Button fullWidth size="large" variant="contained" startIcon={<ShoppingCartCheckoutIcon />} sx={{ mt: 3 }} onClick={checkout}>
                  Proceed to Checkout
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

export default Cart;

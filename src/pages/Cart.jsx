import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Select,
  MenuItem,
  IconButton,
  Divider,
  Button,
  TextField,
  Checkbox,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  Snackbar,
  Alert,
  CircularProgress
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import axios from "axios";
import { BaseUrl } from '../config'



const Cart = ({ darkMode, setDarkMode }) => {
  const [loading, setLoading] = useState(true);
  const [carts, setCarts] = useState([]);
  const [newCartName, setNewCartName] = useState("");
  const [selectedCarts, setSelectedCarts] = useState([]);
  const [snackbar, setSnackbar] = useState({});
  const [createLoading, setCreateLoading] = useState(false);
  const [loadingCartId, setLoadingCartId] = useState(null); // track which cart is being deleted
  const [loadingItem, setLoadingItem] = useState(null); // track loading per item

  const navigate = useNavigate();
  const theme = useTheme();

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${BaseUrl}/cart/getCartPage/`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (res.status === 200) {
        setCarts(res.data.carts);
      } else {
        console.log("⚠️ Unexpected response:", res);
      }
    } catch (error) {
      console.error("❌ Error fetching carts:", error);
      alert("❌ Failed to fetch carts. Please try again.");
    }
    finally {
      setTimeout(() => {
        setLoading(false);
      }, 2000);
    }
  };


  useEffect(() => {
    fetchData();
  }, []);

  const saveCarts = (updatedCarts) => {
    setCarts(updatedCarts);
    localStorage.setItem("carts", JSON.stringify(updatedCarts));
  };


  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const addNewCart = async () => {
    if (!newCartName.trim() || carts.find(cart => cart.name === newCartName.trim())) {
      setSnackbar({ open: true, message: "A cart with this name already exists!", severity: "warning" });
      return;
    }

    try {
      const res = await axios.post(
        `${BaseUrl}/cart/addNewCart/`,
        { name: newCartName.trim() },
        { headers: { Authorization: ` Bearer ${localStorage.getItem('token')}` } }
      );

      if (res.status === 201) {
        const newCart = res.data.cart;
        setCarts(prev => [...prev, newCart]); // Add the new cart to the existing carts
        setSnackbar({ open: true, message: "New cart created successfully ✅", severity: "success" });
      } else if (res.status === 401) {
        setSnackbar({ open: true, message: "❌ Unauthorized. Please login again.", severity: "error" });
      } else {
        console.log("Unexpected response:", res);
        setSnackbar({ open: true, message: "❌ Something went wrong.", severity: "error" });
      }
    } catch (error) {
      console.error("Error creating new cart:", error);
      if (error.response && error.response.status === 401) {
        setSnackbar({ open: true, message: "❌ Unauthorized. Please login again.", severity: "error" });
      } else {
        setSnackbar({ open: true, message: "❌ Failed to create cart. Please try again.", severity: "error" });
      }
    }

    setNewCartName("");
  };



  // inside your component


  const removeCart = async (cartId) => {
    setLoadingCartId(cartId); // start loader
    try {
      const res = await axios.delete(
        `${BaseUrl}/cart/removeCart/${cartId}`,
        {
          headers: {
            Authorization: `Bearer  ${localStorage.getItem('token')}`,
          },
        }
      );

      if (res.status === 401) {
        setSnackbar({ open: true, message: "❌ Unauthorized. Redirecting to login...", severity: "error" });
        setTimeout(() => navigate("/signin"), 1500);
        return;
      }

      if (res.status === 204) {
        setCarts(prev => prev.filter(cart => cart.id !== cartId));
        setSelectedCarts(prev => prev.filter(id => id !== cartId));
        setSnackbar({ open: true, message: "🗑️ Cart removed successfully!", severity: "success" });
      } else {
        console.log("⚠️ Unexpected response:", res);
        setSnackbar({ open: true, message: "❌ Something went wrong.", severity: "error" });
      }

    } catch (error) {
      console.error("❌ Error removing cart:", error);
      setSnackbar({ open: true, message: "❌ Failed to remove cart. Please try again.", severity: "error" });
    } finally {
      setLoadingCartId(null); // stop loader
    }
  };


  const updateQuantity = async (cartId, productId, newQuantity) => {
    const reqData = {
      cartId: cartId,
      productId: productId,
      quantity: newQuantity
    };

    try {
      const res = await axios.patch(`${BaseUrl}/cart/updateCartQuantity/${cartId}/${productId}`, reqData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.status == 200) {
        setCarts((prevCarts) =>
          prevCarts.map((cart) =>
            cart.id === cartId
              ? {
                ...cart,
                items: cart.items.map((item) =>
                  item.id === productId
                    ? { ...item, quantity: newQuantity }
                    : item
                ),
              }
              : cart
          )
        );
      }
       // Handle 401 Unauthorized inside try
      if (res.status === 401) {
        setSnackbar({ open: true, message: "❌ Unauthorized. Redirecting to login...", severity: "error" });
        setTimeout(() => navigate("/signin"), 1500);
        return;
      }
      else {
        console.log("⚠️ Unexpected response:", res);
        setSnackbar({ open: true, message: "❌ Something went wrong.", severity: "error" });
      }
    } catch (error) {
      console.error("❌ Error fail to update  item:", error);
      setSnackbar({ open: true, message: "❌ Failed to update quantity of  item. Please try again.", severity: "error" });
    }
  };


  const removeItem = async (cartId, productId) => {
    setLoadingItem(productId); // start loader for this item
    try {
      const res = await axios.delete(
        `${BaseUrl}/cart/removeFromCart/${cartId}/${productId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      // Handle 401 Unauthorized inside try
      if (res.status === 401) {
        setSnackbar({ open: true, message: "❌ Unauthorized. Redirecting to login...", severity: "error" });
        setTimeout(() => navigate("/signin"), 1500);
        return;
      }

      if (res.status === 200 || res.status === 204) {
        setCarts(prev =>
          prev.map(cart =>
            cart.id === cartId
              ? { ...cart, items: cart.items.filter(item => item.id !== productId) }
              : cart
          )
        );
        setSnackbar({ open: true, message: "🗑️ Item removed successfully!", severity: "success" });
      } else {
        console.log("⚠️ Unexpected response:", res);
        setSnackbar({ open: true, message: "❌ Something went wrong.", severity: "error" });
      }
    } catch (error) {
      console.error("❌ Error removing item:", error);
      
        setSnackbar({ open: true, message: "❌ Failed to remove item. Please try again.", severity: "error" });

    } finally {
      setLoadingItem(null); // stop loader
    }
  };


  const calculateSummary = (items) => {
    let totalItems = 0;
    let totalPrice = 0;

    items.forEach((item) => {
      totalItems += item.quantity;
      totalPrice += item.price * item.quantity;
    });

    return { totalItems, totalPrice };
  };


  const handleCartSelection = (cartName) => {
    setSelectedCarts((prev) =>
      prev.includes(cartName)
        ? prev.filter((name) => name !== cartName)
        : [...prev, cartName]
    );
  };

  const handleMultiCartCheckout = () => {
    // Step 1: Collect selected cart details
    const selectedData = carts
      .filter((cart) => selectedCarts.includes(cart.id)) // pick only selected carts
      .map((cart) => {
        const { totalItems, totalPrice } = calculateSummary(cart.items);
        return {
          id: cart.id,
          name: cart.name,
          items: cart.items,
          summary: { totalItems, totalPrice },
        };
      });

    // Step 2: Remove selected carts from the main list
    const updatedCarts = carts.filter((cart) => !selectedCarts.includes(cart.id));
    saveCarts(updatedCarts);
    setCarts(updatedCarts);

    // Step 3: Clear selection
    setSelectedCarts([]);

    // Step 4: Navigate with selected data
    navigate("/checkout", {
      state: {
        selectedCarts: selectedData,
      },
    });
  };



  const handleSingleCartCheckout = (cartId) => {
    // 1. Find the cart
    const cart = carts.find((c) => c.id === cartId);
    if (!cart || cart.items.length === 0) return;

    // 2. Calculate totals
    const { totalItems, totalPrice } = calculateSummary(cart.items);

    // 3. Remove this cart from state
    const updatedCarts = carts.filter((c) => c.id !== cartId);
    saveCarts(updatedCarts);

    // 4. Navigate with selected cart data
    navigate("/checkout", {
      state: {
        selectedCarts: [
          {
            id: cart.id,
            name: cart.name,
            items: cart.items,
            summary: { totalItems, totalPrice },
          },
        ],
      },
    });
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 2,
        }}
      >
        <img
          src="/images/cartLoader.gif"
          alt="Loading..."
          style={{ width: "230px", height: "150px" }}
        />

        {/* Dynamic text with fade + dots */}
        <Typography
          variant="h6"
          sx={{
            fontWeight: "bold",
            color: "gray",
            animation: "fade 2s ease-in-out infinite",
          }}
        >
          Your carts are loading
          <span className="dots">...</span>
        </Typography>

        <style>
          {`
              /* Dots animation */
              .dots {
                display: inline-block;
                width: 1.5em;
                text-align: left;
                animation: dots 1.5s steps(3, end) infinite;
              }
              @keyframes dots {
                0%, 20% { content: ""; }
                40% { content: "."; }
                60% { content: ".."; }
                80%, 100% { content: "..."; }
              }
    
              /* Fade animation */
              @keyframes fade {
                0% { opacity: 0.2; }
                50% { opacity: 1; }
                100% { opacity: 0.2; }
              }
            `}
        </style>
      </Box>
    );
  }


  return (
    <>
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} sx={{ mb: '10px' }} />
      <Box sx={{ padding: { xs: 2, md: 4 }, width: "100vw", minHeight: "100vh", mt: '100px' }}>
        <Typography variant="h5" fontWeight="bold">
          Your Shopping Carts
        </Typography>
        <Divider sx={{ mt: 1, mb: 2 }} />
        <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
          <TextField
            label="New Cart Name"
            value={newCartName}
            onChange={(e) => setNewCartName(e.target.value)}
            fullWidth
            sx={{ input: { color: theme.palette.text.primary } }}
          />
          <Button
            variant="contained"
            onClick={addNewCart}
            disabled={newCartName === "" || createLoading}
          >
            {createLoading ? " Creating..." : "Create"}
          </Button>

        </Box>
        {carts.length > 0 && (
          <Button
            variant="contained"
            color="success"
            sx={{ mb: 3 }}
            disabled={selectedCarts.length === 0}
            onClick={handleMultiCartCheckout}
          >
            Checkout Selected ({selectedCarts.length})
          </Button>
        )}


        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, width: "100%" }}>
          {carts.length === 0 ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                height: "60vh",
                width: "100%",
              }}
            >
              <img
                src="/images/noCart.png"
                alt="Loading..."
                style={{ width: "150px", height: "150px" }}
              />
              <Typography variant="h6" sx={{ color: "gray", mt: 2 }}>
                No carts created yet.
              </Typography>
            </Box>
          ) : (
            carts.map((cart) => {
              const { totalItems, totalPrice } = calculateSummary(cart.items);

              return (
                <Paper
                  key={cart.id}
                  sx={{
                    p: { xs: 2, md: 3 },
                    width: "100%",
                    minHeight: "300px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: cart.items.length > 0 ? "flex-start" : "center",
                    alignItems: cart.items.length > 0 ? "stretch" : "center",
                    boxShadow: 4,
                    borderRadius: 3,
                    borderLeft: `6px solid ${theme.palette.primary.main}`,
                    mb: 4,
                    transition: "box-shadow 0.2s, border-color 0.2s",
                    bgcolor: theme.palette.background.paper,
                    "&:hover": {
                      boxShadow: 8,
                      borderLeft: `6px solid ${theme.palette.primary.dark}`,
                    },
                  }}
                >
                  {/* Header */}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      width: "100%",
                      mb: 1,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {!(cart.items.length === 0) ? (
                  // 🟢 Show this when cart is empty
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedCarts.includes(cart.id)}
                            onChange={() => handleCartSelection(cart.id)}
                          />
                        }
                        label={
                          <Typography variant="h6" fontWeight="bold" color="primary">
                            {cart.name} Cart
                          </Typography>
                        }
                      />):(<Typography variant="h6" fontWeight="bold" color="secondary">
                            {cart.name} can't select because it's empty
                          </Typography>)}
                    </Box>
                    <Button
                      size="small"
                      color="secondary"
                      startIcon={
                        loadingCartId === cart.id ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />
                      }
                      onClick={() => removeCart(cart.id)}
                      disabled={loadingCartId === cart.id} // disable while loading
                    >
                      {loadingCartId === cart.id ? "Removing..." : "Remove Cart"}
                    </Button>

                  </Box>

                  <Divider sx={{ my: 2, width: "100%" }} />

                  {/* Cart Content */}
                  <Grid container spacing={3} sx={{ flexGrow: 1, width: "100%" }}>
                    <Grid item xs={12} md={8}>
                      {cart.items.length === 0 ? (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            height: "100%",
                          }}
                        >
                          <Typography color="gray">This cart is empty.</Typography>
                        </Box>
                      ) : (
                        cart.items.map((item, idx) => (
                          <Paper
                            key={item.id}
                            sx={{

                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: 2,
                              boxShadow: 1,
                              borderRadius: 2,
                              mb: 2,
                              border: `1.5px solid ${theme.palette.divider}`,
                              bgcolor:
                                idx % 2 === 0
                                  ? theme.palette.background.default
                                  : theme.palette.action.hover,
                              transition: "background 0.2s",
                              "&:hover": { bgcolor: theme.palette.action.selected },
                            }}
                          >
                            {/* Item Info */}
                            <Box sx={{ display: "flex", alignItems: "center", flex: 1 }}>
                              <img
                                src={item.image || "/fallback-image.jpg"}
                                alt={item.name}
                                onError={(e) =>
                                  (e.target.src = "/fallback-image.jpg")
                                }
                                style={{
                                  width: 70,
                                  height: 70,
                                  objectFit: "contain",
                                  borderRadius: 8,
                                  marginRight: 16,
                                  border: `1.5px solid ${theme.palette.divider}`,
                                  background: "#fff",
                                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                                }}
                              />
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body1" fontWeight="bold" component="a"
                                  href={`/product/${item.id}`}
                                  sx={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}>
                                  {item.name}
                                </Typography>
                                {item.selectedOptions &&
                                  Object.keys(item.selectedOptions).length > 0 && (
                                    <Box
                                      sx={{
                                        display: "flex",
                                        gap: 1,
                                        flexWrap: "wrap",
                                        mt: 0.5,
                                      }}
                                    >
                                      {Object.entries(item.selectedOptions).map(
                                        ([key, val]) => (
                                          <Box
                                            key={key}
                                            sx={{
                                              px: 1.5,
                                              py: 0.5,
                                              borderRadius: 2,
                                              fontSize: 13,
                                              fontWeight: 500,
                                              bgcolor:
                                                theme.palette.mode === "dark"
                                                  ? theme.palette.action.selected
                                                  : "#e3e8ef",
                                              color: theme.palette.text.secondary,
                                              border: `1px solid ${theme.palette.divider}`,
                                            }}
                                          >
                                            {key.charAt(0).toUpperCase() +
                                              key.slice(1)}
                                            : {val}
                                          </Box>
                                        )
                                      )}
                                    </Box>
                                  )}
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ mt: 0.5 }}
                                >
                                  ₹{item.price}
                                </Typography>
                              </Box>
                            </Box>

                            {/* Item Actions */}
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Select
                                value={item.quantity}
                                onChange={(e) =>
                                  updateQuantity(
                                    cart.id,
                                    item.id,
                                    parseInt(e.target.value)
                                  )
                                }
                                sx={{ minWidth: 55, height: 36 }}
                              >
                                {[...Array(10).keys()].map((num) => (
                                  <MenuItem key={num + 1} value={num + 1}>
                                    {num + 1}
                                  </MenuItem>
                                ))}
                              </Select>
                              <IconButton
                                key={item.id}
                                color="error"
                                onClick={() => removeItem(cart.id, item.id)}
                                disabled={loadingItem === item.id}
                              >
                                {loadingItem === item.id ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
                              </IconButton>
                            </Box>
                          </Paper>
                        ))
                      )}
                    </Grid>

                    {/* Summary */}
                    {cart.items.length > 0 && (
                    <Grid item xs={12} md={4}>
                      <Paper
                        sx={{
                          padding: 3,
                          boxShadow: 2,
                          borderRadius: 2,
                          bgcolor: theme.palette.background.default,
                          border: `1.5px solid ${theme.palette.divider}`,
                        }}
                      >
                        <Box
                          sx={{
                            mb: 2,
                            pb: 1,
                            borderBottom: `1px solid ${theme.palette.divider}`,
                          }}
                        >
                          <Typography variant="h6" fontWeight="bold" color="primary">
                            {cart.name} Summary
                          </Typography>
                        </Box>
                        <Typography variant="body1" sx={{ mt: 1 }}>
                          Total Items: {totalItems}
                        </Typography>
                        <Typography variant="body1" sx={{ mt: 1 }}>
                          Total Price: ₹{totalPrice.toFixed(2)}
                        </Typography>
                        <Divider sx={{ my: 2 }} />
                        <Button
                          variant="contained"
                          color="primary"
                          fullWidth
                          sx={{
                            mt: 2,
                            py: 1.5,
                            fontWeight: 700,
                            fontSize: "1rem",
                            borderRadius: 2,
                            boxShadow: 2,
                          }}
                          disabled={cart.items.length === 0}
                          onClick={() => handleSingleCartCheckout(cart.id)}
                        >
                          Checkout {cart.name}
                        </Button>
                      </Paper>
                    </Grid> )}
                  </Grid>
                </Paper>
              );
            })
          )}
        </Box>


        {selectedCarts.length > 1 && (
          (() => {
            let totalItems = 0;
            let totalPrice = 0;
            let allItems = [];

            selectedCarts.forEach((cartId) => {
              const cart = carts.find((c) => c.id === cartId); // ✅ find cart by id
              if (cart && cart.items) {
                cart.items.forEach((item) => {
                  totalItems += item.quantity;
                  totalPrice += item.price * item.quantity;
                  allItems.push({ ...item, cartName: cart.name });
                });
              }
            });

            return (
              <Paper
                sx={{
                  mt: 5,
                  mb: 3,
                  p: 0,
                  maxWidth: 800,
                  mx: "auto",
                  boxShadow: 6,
                  borderRadius: 4,
                  overflow: "hidden",
                  bgcolor: theme.palette.background.paper,
                  border: `1.5px solid ${theme.palette.divider}`,
                }}
              >
                <Box sx={{ p: 3, pb: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    sx={{ mb: 1, color: theme.palette.primary.main }}
                  >
                    Checkout Summary
                  </Typography>
                </Box>
                <TableContainer sx={{ maxHeight: 340, bgcolor: theme.palette.background.default }}>
                  <Table stickyHeader size="small" aria-label="checkout summary table">
                    <TableHead>
                      <TableRow sx={{ bgcolor: theme.palette.action.hover }}>
                        <TableCell sx={{ fontWeight: 700, fontSize: 15 }}>Item</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: 15 }}>Options</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: 15 }}>
                          Qty
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: 15 }}>
                          Price
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: 15 }}>
                          Subtotal
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {allItems.map((item, idx) => (
                        <TableRow
                          key={item.id + "-" + idx}
                          sx={{
                            bgcolor:
                              idx % 2 === 0
                                ? theme.palette.background.default
                                : theme.palette.action.hover,
                            transition: "background 0.2s",
                            "&:hover": { bgcolor: theme.palette.action.selected },
                          }}
                        >
                          <TableCell sx={{ fontWeight: 500 }}>{item.name} <br /><small>({item.cartName})</small></TableCell>
                          <TableCell sx={{ fontSize: 13, color: theme.palette.text.secondary }}>
                            {item.selectedOptions && Object.keys(item.selectedOptions).length > 0
                              ? Object.entries(item.selectedOptions)
                                .map(
                                  ([key, val]) =>
                                    `${key.charAt(0).toUpperCase() + key.slice(1)}: ${val}`
                                )
                                .join(", ")
                              : "-"}
                          </TableCell>
                          <TableCell align="center">{item.quantity}</TableCell>
                          <TableCell align="center">₹{item.price.toLocaleString("en-IN")}</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700 }}>
                            ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Box
                  sx={{
                    p: 3,
                    borderTop: `1px solid ${theme.palette.divider}`,
                    bgcolor: theme.palette.background.paper,
                    position: "sticky",
                    bottom: 0,
                    zIndex: 1,
                  }}
                >
                  <Typography
                    variant="body1"
                    fontWeight="bold"
                    sx={{ mb: 1, fontSize: 18 }}
                  >
                    Grand Total: ₹{totalPrice.toLocaleString("en-IN")}
                  </Typography>
                  <Button
                    variant="contained"
                    color="success"
                    size="large"
                    sx={{
                      mt: 1,
                      px: 6,
                      fontWeight: 700,
                      fontSize: "1.1rem",
                      borderRadius: 2,
                      boxShadow: 2,
                    }}
                    onClick={handleMultiCartCheckout}
                  >
                    Checkout Selected ({selectedCarts.length})
                  </Button>
                </Box>
              </Paper>
            );
          })()
        )}


        {/* Snackbar for feedback messages */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={2000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          TransitionProps={{
            appear: true,
            onEnter: (node) => {
              node.style.opacity = 0;
              node.style.transform = 'translateY(40px)';
              setTimeout(() => {
                node.style.transition = 'opacity 400ms cubic-bezier(0.4,0,0.2,1), transform 400ms cubic-bezier(0.4,0,0.2,1)';
                node.style.opacity = 1;
                node.style.transform = 'translateY(0)';
              }, 10);
            },
            onExit: (node) => {
              node.style.transition = 'opacity 300ms cubic-bezier(0.4,0,0.2,1), transform 300ms cubic-bezier(0.4,0,0.2,1)';
              node.style.opacity = 0;
              node.style.transform = 'translateY(40px)';
            },
          }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{
              width: '100%',
              bgcolor:
                snackbar.severity === "error"
                  ? "#f44336" // 🔴 red for error
                  : snackbar.severity === "success"
                    ? "#4caf50" // 🟢 green for success
                    : snackbar.severity === "warning"
                      ? "#ff9800" // 🟠 orange for warning
                      : "#fff",   // default white
              color: '#222',
              border: '1px solid #eee',
              fontWeight: 600,
              fontSize: '1.1rem',
              boxShadow: 6,
              borderRadius: 3,
              px: 3,
              py: 2,
              transition: 'box-shadow 0.3s cubic-bezier(0.4,0,0.2,1), background 0.3s cubic-bezier(0.4,0,0.2,1)',
              letterSpacing: 0.2,
            }}
            icon={false}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
      <Footer />
    </>
  );
};

export default Cart;

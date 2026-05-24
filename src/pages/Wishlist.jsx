import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  ListItemText,
  IconButton,
  Button,
  TextField,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  Grid,
  Paper,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import { useTheme } from "@mui/material/styles";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import axios from "axios";
import { BaseUrl } from "../config";

const Wishlist = ({ darkMode, setDarkMode }) => {
  const theme = useTheme();
  const [loadingDeleteWishlist, setLoadingDeleteWishlist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDelete, setLoadingDelete] = useState({ wishlistId: null, productId: null });
  const [loadingNewCart, setLoadingNewCart] = useState(null);
  const [loadingCart, setLoadingCart] = useState(false);
  const [wishlists, setWishlists] = useState([]);
  const [newWishlistName, setNewWishlistName] = useState("");
  const [cartDialogOpen, setCartDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedWishlist, setSelectedWishlist] = useState("");
  const [selectedCart, setSelectedCart] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({});

  const [carts, setCarts] = useState([]);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BaseUrl}/wishlist/getWishListPage`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (res.status === 200) {
        

        setWishlists(res.data.wishlists);
        setCarts(res.data.carts);
      }
      else {
    
      }
    } catch (error) {
      console.log("server is Down", error);
    }
    finally {
      setLoading(false);
    }
  }




  useEffect(() => {
    fetchData();
  }, []);



  const addWishlist = async () => {
    if (newWishlistName.trim() === "") return;

    // ✅ Check duplicate wishlist
    const alreadyExists = wishlists.some(
      (w) => w.name.toLowerCase() === newWishlistName.trim().toLowerCase()
    );

    if (alreadyExists) {
      setSnackbar({
        open: true,
        message: "⚠️ A wishlist with this name already exists!",
        severity: "warning",
      });
      return;
    }

    try {
      setCreateLoading(true);
      const res = await axios.post(
        `${BaseUrl}/wishlist/createNewWishlist`,
        { name: newWishlistName.trim() },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (res.status === 201) {
        console.log("✅ Wishlist created successfully");
        setWishlists((prev) => [...prev, res.data.wishlist]);

        setSnackbar({
          open: true,
          message: "✅ Wishlist created successfully!",
          severity: "success",
        });
      }
      else if (response.status === 401) {
        // 🔑 Unauthorized → show snackbar + redirect
        setSnackbar({
          open: true,
          message: "⚠️ Please sign in to continue.",
          severity: "warning",
        });

        setTimeout(() => {
          navigate("/signin"); // redirect after short delay
        }, 2000);
      }
      else {
        setSnackbar({
          open: true,
          message: "⚠️ Internal server error.",
          severity: "error",
        });
      }
    } catch (error) {
      console.error("❌ Error creating wishlist:", error);


      setSnackbar({
        open: true,
        message: "❌ Failed to create wishlist. Please try again.",
        severity: "error",
      });

    }
    finally {
      setCreateLoading(false);
      setNewWishlistName(""); // reset input
    }
  };



  const removeWishlist = async (wishlistId) => {
    try {
      setLoadingDeleteWishlist(wishlistId);
      const res = await axios.delete(`${BaseUrl}/wishlist/deleteWishlist/${wishlistId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (res.status === 204) {
        setWishlists((prevWishlists) =>
          prevWishlists.filter((w) => w.id !== wishlistId)
        );

        setSnackbar({
          open: true,
          message: "Wishlist deleted successfully ✅",
          severity: "success",
        });
      }
      else if (res.status === 401) {
        setSnack({
          open: true,
          message: "Session expired ⚠️ Redirecting to login...",
          severity: "warning",
        });
        setTimeout(() => {
          navigate('/sigin')
        }, 2000);
      }
      else {
        setSnackbar({
          open: true,
          message: `Error deleting wishlist ❌ (status: ${res.status})`,
          severity: "error",
        });
        console.log("respond status code", res.status);
        console.log("respond data", res.data);
      }
    } catch (error) {
      console.error("server is Down", error);
      setSnackbar({
        open: true,
        message: "Server is down. Please try again later ⚠️",
        severity: "error",
      });
    }
    finally {
      setLoadingDeleteWishlist(null);
    }
  };

  const removeFromWishlist = async (wishlistId, productId) => {
    try {
      console.log("Removing product", productId, "from wishlist", wishlistId);
      setLoadingDelete({ wishlistId, productId }); // start loader
      console.log("Loading state:", { wishlistId, productId });
      const res = await axios.delete(
        `${BaseUrl}/wishlist/removeFromWishlist/${wishlistId}/${productId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (res.status === 204) {
        setSnackbar({
          open: true,
          message: "Product removed from wishlist successfully ✅",
          severity: "success",
        });

        console.log("Product removed successfully from wishlist");
        console.log("wishlist:",wishlists)
        // update local state
        // ✅ Update local state correctly
  const updated = wishlists.map((w) =>
    w.id === wishlistId
      ? { ...w, items: w.items.filter((p) => p.id !== productId) } // <-- fixed 'product' → 'items'
      : w
  );
        console.log("Updated wishlists:", updated);
        setWishlists(updated);
      } else {
        setSnackbar({
          open: true,
          message: `Error removing product (Status: ${res.status})`,
          severity: "error",
        });
        console.log("respond status code", res.status);
        console.log("respond data", res.data);
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        setSnackbar({
          open: true,
          message: "Session expired. Please sign in again.",
          severity: "error",
        });

        setTimeout(() => {
          navigate("/signin");
        }, 2000);
      } else {
        setSnackbar({
          open: true,
          message: "Server is down. Try again later.",
          severity: "error",
        });
        console.log("server is Down", error);
      }
    }
    finally {
      setLoadingDelete({ wishlistId: null, productId: null }); // stop loader
    }

  };


  const openCartDialog = (wishlist, product) => {
    setSelectedProduct(product);
    setSelectedWishlist(wishlist);
    setCartDialogOpen(true);
  };

  const CloseCartDialog = (wishlist, product) => {
    setSelectedProduct("");
    setSelectedWishlist("");
    setCartDialogOpen(false);


  };


  const moveToCart = async (cartId) => {
    if (!selectedProduct || !cartId) return;
       console.log("selected cart =",selectedProduct,"select cart id =",cartId);
    try {
      // Start loading & disable dialog buttons
      setLoadingCart(true);
     const reqpayload =selectedProduct;
     console.log("req payload",reqpayload);
     const payload ={...reqpayload,quantity:1};
     console.log("payload",payload);
     
      const res = await axios.post(
        `${BaseUrl}/cart/addToCart/${cartId}/`,
        {
          
          product:[ payload]
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (res.status === 200) {
        // ✅ Success snackbar
        setSnackbar({
          open: true,
          message: "Product added to cart successfully ✅",
          severity: "success",
        });

        // ✅ Remove product from wishlist state instead of refetch
        const updated = wishlists.map((w) =>
          w.id === selectedWishlist.id
            ? { ...w, product: w.product.filter((p) => p.id !== selectedProduct.id) }
            : w
        );
        setWishlists(updated);
      } else if (res.status === 401) {
        // 🚨 Unauthorized
        setSnackbar({
          open: true,
          message: "🔑 Unauthorized! Redirecting to signin...",
          severity: "warning",
        });

        // Disable snackbar for 2 sec then navigate
        setTimeout(() => {
          localStorage.removeItem("token"); // optional clear token
          navigate("/signin");
        }, 2000);
      } else {
        // ❌ Other errors
        setSnackbar({
          open: true,
          message: `Failed to add product to cart ❌ (status: ${res.status})`,
          severity: "error",
        });
        console.log("Error response:", res.status, res.data);
      }
    } catch (error) {
      console.error("Server is down:", error);
      setSnackbar({
        open: true,
        message: "Server is down. Please try again later ⚠️",
        severity: "error",
      });
    } finally {
      // Reset loader and close dialog
      setLoadingCart(false);
      CloseCartDialog();

    }
  };





  const moveAllToCart = async (wishlistId) => {
    try {
      // Start loader
      setLoadingNewCart(wishlistId); // start loader

      const res = await axios.post(
        `${BaseUrl}/wishlist/${wishlistId}/moveToNewCart`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (res.status === 201) {
        // ✅ Success snackbar
        setSnackbar({
          open: true,
          message: "All products moved to cart successfully ✅",
          severity: "success",
        });

        // Optional: ask if user wants to go to cart page
        const goToCart = window.confirm(
          "All products moved to cart successfully! Do you want to go to the cart page?"
        );
        if (goToCart) navigate("/cart");

        // ✅ Remove all products from wishlist state instead of refetching
        setWishlists((prev) => prev.filter((w) => w.id !== wishlistId));

      } else if (res.status === 401) {
        setSnackbar({
          open: true,
          message: "🔑 Unauthorized! Redirecting to signin...",
          severity: "warning",
        });

        setTimeout(() => {
          localStorage.removeItem("token"); // optional clear token
          navigate("/signin");
        }, 2000);
      } else {
        // ❌ Other errors
        setSnackbar({
          open: true,
          message: `Failed to move products to cart ❌ (status: ${res.status})`,
          severity: "error",
        });
        console.log("Error response:", res.status, res.data);
      }
    } catch (error) {
      console.error("Server is down:", error);
      setSnackbar({
        open: true,
        message: "Server is down. Please try again later ⚠️",
        severity: "error",
      });
    } finally {
      // Reset loader
      setLoadingNewCart(null); // start loader
    }
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
        {/* Loader GIF */}
        <img
          src="/images/wishlistLoader.gif"
          alt="Loading..."
          style={{ width: "150px", height: "150px" }}
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
          Your wishlist is loading
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


      <Box sx={{ width: "100vw", minHeight: "100vh", bgcolor: theme.palette.background.default, p: 4, mt: '100px' }}>
        <Typography variant="h4" fontWeight="bold" sx={{ mb: 2, color: theme.palette.text.primary }}>
          Wishlists
        </Typography>
        <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
          <TextField
            label="New Wishlist Name"
            value={newWishlistName}
            onChange={(e) => setNewWishlistName(e.target.value)}
            fullWidth
            sx={{ input: { color: theme.palette.text.primary } }}
          />
          <Button
            variant="contained"
            onClick={addWishlist}
            disabled={newWishlistName === "" || createLoading}
          >
            {createLoading ? " Creating..." : "Create"}
          </Button>

        </Box>
        <Divider sx={{ mb: 3, bgcolor: theme.palette.divider }} />
        {wishlists.length === 0 ? (

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
              src="/images/noWishlist.png"
              alt="Loading..."
              style={{ width: "250px", height: "150px" }}
            />
            <Typography variant="h6" sx={{ color: "gray", mt: 2 }}>
              No wishlist created yet.
            </Typography>
          </Box>) : (
          wishlists.map((wishlist) => (
            <Paper key={wishlist.id} sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" fontWeight="bold">
                {wishlist.name}
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" }, // column on mobile, row on larger screens
                  gap: 2,
                  mt: 2,
                }}
              >
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => removeWishlist(wishlist.id)}
                  fullWidth
                  disabled={loadingDeleteWishlist === wishlist.id} // disable while loading
                  sx={{ position: "relative" }}
                >
                  {loadingDeleteWishlist === wishlist.id ? (
                    <CircularProgress size={22} color="error" />
                  ) : (
                    "Delete Wishlist"
                  )}
                </Button>

                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => moveAllToCart(wishlist.id)}
                  fullWidth
                  disabled={loadingNewCart === wishlist.id} // disable while loading
                >
                  {loadingNewCart === wishlist.id ? (
                    <CircularProgress size={24} sx={{ color: "white" }} />
                  ) : (
                    "Move All to Cart"
                  )}
                </Button>
              </Box>
              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                {wishlist.items && wishlist.items.length > 0 ? (
                  wishlist.items.map((product) => (
                    <Grid item xs={12} sm={6} md={4} key={product.id}>
                      <Paper sx={{ p: 2, width: "100%", display: "flex", alignItems: "center", gap: 2 }}>
                        <img
                          src={product.image || "/fallback-image.jpg"}
                          alt={product.name}
                          style={{ width: 70, height: 70, objectFit: "contain" }}
                        />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body1"
                            fontWeight="bold"
                            sx={{ cursor: "pointer", color: "primary.main" }}
                            onClick={() => navigate(`/product/${product.id}`)}>
                            {product.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            ₹{product.price}
                          </Typography>
                          {product.selectedOptions && Object.keys(product.selectedOptions).length > 0 && (
                            <Box
                              sx={{
                                display: "flex",
                                gap: 1,
                                flexWrap: "wrap",
                                mt: 0.5
                              }}
                            >
                              {Object.entries(product.selectedOptions).map(([key, val]) => (
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
                                    border: `1px solid ${theme.palette.divider}`
                                  }}
                                >
                                  {key.charAt(0).toUpperCase() + key.slice(1)}: {val}
                                </Box>
                              ))}
                            </Box>
                          )}

                        </Box>

                        <IconButton
                          sx={{
                            color: "skyblue",
                            "&:hover": { color: "blue" }
                          }}
                          onClick={() => openCartDialog(wishlist, product)}
                        >
                          <ShoppingCartIcon />
                        </IconButton>


                        {loadingDelete.wishlistId === wishlist.id && loadingDelete.productId === product.id ? (
                          <CircularProgress size={24} sx={{ color: "red" }} />
                        ) : (
                          <IconButton
                            sx={{
                              color: "red",
                              "&:hover": { color: "red" }
                            }}
                            onClick={() => removeFromWishlist(wishlist.id, product.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </Paper>
                    </Grid>
                  ))
                ) : (
                  <Typography color="text.secondary" sx={{ mt: 2 }}>
                    No products in this wishlist.
                  </Typography>
                )}
              </Grid>
            </Paper>
          ))
        )}




        <Dialog open={cartDialogOpen} onClose={!loadingCart ? () => setCartDialogOpen(false) : undefined}>
          <DialogTitle>Select a Cart</DialogTitle>
          <DialogContent>
            <Select
              fullWidth
              value={selectedCart}
              onChange={(e) => moveToCart(e.target.value)}
              disabled={loadingCart} // disable select while loading
            >
              {carts.length > 0 ? (
                carts.map((cart) => (
                  <MenuItem key={cart.id} value={cart.id}>
                    {cart.name}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>No carts available</MenuItem>
              )}
            </Select>
          </DialogContent>
          <DialogActions>
            {loadingCart ? (
              <CircularProgress size={28} sx={{ margin: "auto" }} />
            ) : (
              <Button onClick={() => CloseCartDialog()}>Cancel</Button>
            )}
          </DialogActions>
        </Dialog>


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

export default Wishlist;
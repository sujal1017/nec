import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Grid,
  IconButton,
  Paper,
  Rating,
  Skeleton,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import BoltIcon from "@mui/icons-material/Bolt";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import RemoveIcon from "@mui/icons-material/Remove";
import AddIcon from "@mui/icons-material/Add";
import StorefrontIcon from "@mui/icons-material/Storefront";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { addToCart, fetchProduct } from "../services/commerceService";
import { handleImageFallback, resolveImageUrl } from "../utils/images";
import { useAuth } from "../context/AuthContext";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

const flattenImages = (product) => {
  const images = [];
  if (product?.image) images.push(product.image);
  if (product?.images && typeof product.images === "object") {
    Object.values(product.images).flat().forEach((image) => images.push(resolveImageUrl(image)));
  }
  return Array.from(new Set(images.filter(Boolean)));
};

const ProductDetails = ({ darkMode, setDarkMode }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchProduct(id)
      .then((data) => {
        if (!alive) return;
        setProduct(data);
        setSelectedImage(flattenImages(data)[0] || data.image);
      })
      .catch(() => setSnackbar({ open: true, message: "Product could not be loaded.", severity: "error" }))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id]);

  const images = useMemo(() => flattenImages(product), [product]);
  const related = product?.related_products || [];
  const effectivePrice = Number(product?.discount_price || product?.price || 0);
  const inStock = product?.in_stock !== false;

  const handleAddToCart = async (goToCart = false) => {
    if (!isAuthenticated) {
      navigate("/signin", { state: { from: `/product/${id}` } });
      return;
    }
    setAdding(true);
    try {
      await addToCart({ productId: product.id, quantity });
      window.dispatchEvent(new Event("storage"));
      if (goToCart) navigate("/cart");
      else setSnackbar({ open: true, message: "Added to cart.", severity: "success" });
    } catch (error) {
      setSnackbar({ open: true, message: error?.response?.data?.detail || "Could not add to cart.", severity: "error" });
    } finally {
      setAdding(false);
    }
  };

  return (
    <>
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
        {loading ? (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}><Skeleton variant="rounded" height={520} /></Grid>
            <Grid item xs={12} md={6}><Skeleton variant="rounded" height={520} /></Grid>
          </Grid>
        ) : !product ? (
          <Alert severity="error">Product not found.</Alert>
        ) : (
          <>
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
                  <Box
                    component="img"
                    src={selectedImage || product.image}
                    alt={product.name}
                    onError={handleImageFallback}
                    sx={{ width: "100%", height: { xs: 320, md: 520 }, objectFit: "contain", bgcolor: "grey.50" }}
                  />
                  <Stack direction="row" spacing={1} sx={{ mt: 2, overflowX: "auto" }}>
                    {images.map((image) => (
                      <Box
                        key={image}
                        component="img"
                        src={image}
                        alt={product.name}
                        loading="lazy"
                        onClick={() => setSelectedImage(image)}
                        onError={handleImageFallback}
                        sx={{
                          width: 72,
                          height: 72,
                          objectFit: "cover",
                          borderRadius: 1,
                          cursor: "pointer",
                          border: image === selectedImage ? "2px solid" : "1px solid",
                          borderColor: image === selectedImage ? "primary.main" : "divider",
                        }}
                      />
                    ))}
                  </Stack>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Stack spacing={2}>
                  <Typography variant="h4" fontWeight={900}>{product.name}</Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Rating value={Number(product.rating || 0)} precision={0.5} readOnly />
                    <Typography color="text.secondary">{product.rating || "New"}</Typography>
                    <Chip size="small" color={inStock ? "success" : "error"} label={inStock ? "In stock" : "Out of stock"} />
                  </Stack>
                  <Divider />
                  <Box>
                    <Typography variant="h3" fontWeight={900}>{currency.format(effectivePrice)}</Typography>
                    {product.discount_price ? (
                      <Typography color="text.secondary" sx={{ textDecoration: "line-through" }}>
                        {currency.format(product.price)}
                      </Typography>
                    ) : null}
                  </Box>
                  <Typography color="text.secondary">{product.description}</Typography>

                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <StorefrontIcon color="primary" />
                      <Box>
                        <Typography fontWeight={800}>{product.seller?.name || "Verified marketplace seller"}</Typography>
                        <Typography variant="body2" color="text.secondary">{product.seller?.return_policy || "Easy returns and secure marketplace checkout."}</Typography>
                      </Box>
                    </Stack>
                  </Paper>

                  <Stack direction="row" spacing={1} alignItems="center">
                    <IconButton onClick={() => setQuantity((value) => Math.max(1, value - 1))}><RemoveIcon /></IconButton>
                    <TextField size="small" value={quantity} type="number" onChange={(e) => setQuantity(Math.max(1, Number(e.target.value || 1)))} sx={{ width: 90 }} />
                    <IconButton onClick={() => setQuantity((value) => value + 1)}><AddIcon /></IconButton>
                  </Stack>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <Button size="large" variant="contained" startIcon={<AddShoppingCartIcon />} disabled={!inStock || adding} onClick={() => handleAddToCart(false)}>
                      Add to Cart
                    </Button>
                    <Button size="large" variant="outlined" startIcon={<BoltIcon />} disabled={!inStock || adding} onClick={() => handleAddToCart(true)}>
                      Buy Now
                    </Button>
                  </Stack>

                  <Stack direction="row" spacing={1} alignItems="center" color="text.secondary">
                    <LocalShippingIcon />
                    <Typography>Fast delivery, secure payments, and order tracking included.</Typography>
                  </Stack>
                </Stack>
              </Grid>
            </Grid>

            {related.length ? (
              <Box sx={{ mt: 6 }}>
                <Typography variant="h5" fontWeight={900} sx={{ mb: 2 }}>Related Products</Typography>
                <Grid container spacing={2}>
                  {related.slice(0, 6).map((item) => (
                    <Grid item xs={6} sm={4} md={2} key={item.id}>
                      <Paper component={Link} to={`/product/${item.id}`} sx={{ display: "block", p: 1.5, textDecoration: "none", color: "inherit", borderRadius: 1 }} variant="outlined">
                        <Box component="img" src={resolveImageUrl(item.image)} alt={item.name} loading="lazy" onError={handleImageFallback} sx={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 1 }} />
                        <Typography noWrap fontWeight={800} sx={{ mt: 1 }}>{item.name}</Typography>
                        <Typography color="primary" fontWeight={900}>{currency.format(Number(item.price || 0))}</Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            ) : null}
          </>
        )}
      </Container>
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar((current) => ({ ...current, open: false }))}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
      <Footer />
    </>
  );
};

export default ProductDetails;

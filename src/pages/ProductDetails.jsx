import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  IconButton,
  Paper,
  Rating,
  Skeleton,
  Snackbar,
  Stack,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from "@mui/material";
import Grid from "@mui/material/Grid";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import BoltIcon from "@mui/icons-material/Bolt";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import RemoveIcon from "@mui/icons-material/Remove";
import AddIcon from "@mui/icons-material/Add";
import StorefrontIcon from "@mui/icons-material/Storefront";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useTheme } from "@mui/material/styles";
import axios from "axios";
import { BaseUrl } from "../config";
import CompareButton from "../components/product/CompareButton";
import ProductMiniRail from "../components/product/ProductMiniRail";
import RecentlyViewedSection from "../components/product/RecentlyViewedSection";
import { fetchRecommendations, recordProductView } from "../services/searchService";
import { addToCart } from "../services/commerceService";
import { useAuth } from "../context/AuthContext";
import { handleImageFallback, resolveImageUrl } from "../utils/images";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

const ProductDetails = ({ darkMode, setDarkMode }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const { isAuthenticated } = useAuth();

  // Unified Product States
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // Gallery States
  const [selectedImage, setSelectedImage] = useState("");
  const [displayedImages, setDisplayedImages] = useState([]);

  // Bidding and Auction States
  const [auctionActive, setAuctionActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [bidDialogOpen, setBidDialogOpen] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [bidPlacedLoading, setBidPlacedLoading] = useState(false);
  const [bidBtnLoading, setBidBtnLoading] = useState(false);
  const [prevBid, setPrevBid] = useState(null);

  // Recommendations and Additional Sections
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [boughtTogether, setBoughtTogether] = useState([]);

  // Wishlist States
  const [wishlistDialogOpen, setWishlistDialogOpen] = useState(false);
  const [wishlists, setWishlists] = useState([]);
  const [selectedWishlists, setSelectedWishlists] = useState([]);
  const [newWishlistName, setNewWishlistName] = useState("");
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [createWishlistLoading, setCreateWishlistLoading] = useState(false);

  // Cart dialog for named carts (database feature)
  const [cartDialogOpen, setCartDialogOpen] = useState(false);
  const [carts, setCarts] = useState([]);
  const [selectedCart, setSelectedCart] = useState("");
  const [newCartName, setNewCartName] = useState("");
  const [cartBtnLoading, setCartBtnLoading] = useState(false);

  // Quantity and options
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [reviews, setReviews] = useState([]);
  const [sellerDetails, setSellerDetails] = useState(null);

  // Check if it is a live product
  const isLive = useMemo(() => {
    return Number(id) >= 100000000;
  }, [id]);

  // Fetch product data
  const fetchData = async () => {
    setLoading(true);
    try {
      if (isLive) {
        const dummyId = Number(id) - 100000000;
        const res = await axios.get(`https://dummyjson.com/products/${dummyId}`);
        if (res.status === 200) {
          const data = res.data;
          
          // Normalize DummyJSON product schema
          const normalized = {
            id: Number(id),
            name: data.title,
            price: data.price * 80, // convert USD to INR
            discount_price: data.discountPercentage ? Math.round(data.price * 80 * (1 - data.discountPercentage / 100)) : null,
            description: data.description,
            category: data.category,
            brand: data.brand || "Global Marketplace",
            rating: data.rating,
            features: [
              `Availability: ${data.availabilityStatus || 'In Stock'}`,
              `Shipping: ${data.shippingInformation || 'Fast Delivery'}`,
              `Warranty: ${data.warrantyInformation || '1 Year Brand Warranty'}`,
              `Weight: ${data.weight || 0}g`,
              `Return Policy: ${data.returnPolicy || '30 days return'}`
            ],
            image: data.thumbnail,
            images: { main: [data.thumbnail, ...(data.images || [])] },
            in_stock: data.stock > 0,
            stock: data.stock,
            is_auction: false,
            reviews: (data.reviews || []).map((r, index) => ({
              id: index,
              rating: r.rating,
              comment: r.comment,
              reviewerName: r.reviewerName,
              reviewerEmail: r.reviewerEmail,
              date: r.date
            })),
            seller: {
              name: data.brand || "Global Marketplace",
              rating: 4.8,
              verificationStatus: "verified",
              shippingTime: data.shippingInformation || "Ships in 2-3 business days",
              badges: ["Top Rated", "Fast Shipping"]
            }
          };

          setProduct(normalized);
          setReviews(normalized.reviews);
          setSellerDetails(normalized.seller);
          
          const uniqueImgs = Array.from(new Set([data.thumbnail, ...(data.images || [])].filter(Boolean)));
          setDisplayedImages(uniqueImgs);
          setSelectedImage(uniqueImgs[0] || data.thumbnail);
        }
      } else {
        // Database product
        const res = await axios.get(`${BaseUrl}/products/${id}/`);
        if (res.status === 200) {
          const data = res.data;
          setProduct(data);
          setReviews(data.reviews || []);
          setSellerDetails(data.seller || {
            name: "Verified Marketplace Seller",
            rating: 4.5,
            verificationStatus: "verified",
            shippingTime: "2-4 days",
            badges: ["Top Rated"]
          });

          const imgs = [];
          if (data.image) imgs.push(data.image);
          if (data.images && typeof data.images === "object") {
            Object.values(data.images).flat().forEach((img) => imgs.push(img));
          }
          const uniqueImgs = Array.from(new Set(imgs.filter(Boolean)));
          setDisplayedImages(uniqueImgs.map(resolveImageUrl));
          setSelectedImage(uniqueImgs.map(resolveImageUrl)[0] || resolveImageUrl(data.image));
        }
      }
    } catch (err) {
      console.error("Error loading product details:", err);
      setSnackbar({ open: true, message: "Failed to load product details.", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (!isLive) {
      recordProductView(id).catch(() => {});
      fetchRecommendations(id)
        .then((data) => {
          setRelatedProducts(data.relatedProducts || []);
          setSimilarProducts(data.similarProducts || []);
          setBoughtTogether((data.frequentlyBoughtTogether || []).slice(0, 3));
        })
        .catch(() => {});
    }
  }, [id, isLive]);

  // Auction Timer Effect
  useEffect(() => {
    if (!product?.is_auction || !product?.auction?.end_time || !product?.auction?.start_time) {
      return;
    }

    const startTime = new Date(product.auction.start_time).getTime();
    const endTime = new Date(product.auction.end_time).getTime();

    const updateTimer = () => {
      const now = Date.now();
      if (now < startTime) {
        const diff = startTime - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`Starts in ${hours}h ${minutes}m`);
        setAuctionActive(false);
      } else if (now >= endTime) {
        setTimeLeft("Auction Ended");
        setAuctionActive(false);
      } else {
        const diff = endTime - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`);
        setAuctionActive(true);
      }
    };

    updateTimer();
    const timerId = setInterval(updateTimer, 1000);
    return () => clearInterval(timerId);
  }, [product]);

  // Option Selections
  const handleOptionSelect = (key, value) => {
    setSelectedOptions((prev) => ({ ...prev, [key]: value }));
  };

  const allOptionsSelected = useMemo(() => {
    if (!product?.options) return true;
    return Object.keys(product.options).every((key) => selectedOptions[key]);
  }, [product, selectedOptions]);

  // Cart Add Logic
  const handleAddToCart = async (goToCart = false) => {
    setAdding(true);
    try {
      await addToCart({
        productId: product.id,
        quantity,
        selectedOptions,
        name: product.name,
        price: product.discount_price || product.price,
        image: selectedImage || product.image,
        is_live: isLive
      });
      window.dispatchEvent(new Event("storage"));
      if (goToCart) {
        navigate("/cart");
      } else {
        setSnackbar({ open: true, message: "Added to cart successfully!", severity: "success" });
      }
    } catch (err) {
      setSnackbar({ open: true, message: err?.response?.data?.detail || "Could not add to cart.", severity: "error" });
    } finally {
      setAdding(false);
    }
  };

  // Open Bidding Dialog
  const handleOpenBidDialog = async () => {
    if (!isAuthenticated) {
      navigate("/signin", { state: { from: `/product/${id}` } });
      return;
    }
    setBidBtnLoading(true);
    try {
      const res = await axios.get(`${BaseUrl}/auctions/${product.auction.id}/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.status === 200) {
        setPrevBid(res.data.myBids || null);
      }
      setBidDialogOpen(true);
    } catch (err) {
      setSnackbar({ open: true, message: "Failed to load bid details.", severity: "error" });
    } finally {
      setBidBtnLoading(false);
    }
  };

  // Submit Bid
  const handlePlaceBid = async () => {
    const amount = Number(bidAmount);
    if (!amount || amount <= (product.auction.current_highest_bid || product.price)) {
      setSnackbar({ open: true, message: "Bid must be higher than the current highest bid.", severity: "warning" });
      return;
    }
    setBidPlacedLoading(true);
    try {
      const res = await axios.post(
        `${BaseUrl}/auctions/${product.auction.id}/place_bid/`,
        { amount },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      if (res.status === 200) {
        setSnackbar({ open: true, message: "Bid placed successfully!", severity: "success" });
        setProduct((prev) => ({
          ...prev,
          auction: {
            ...prev.auction,
            current_highest_bid: amount,
            total_bids: (prev.auction.total_bids || 0) + 1
          }
        }));
        setBidDialogOpen(false);
        setBidAmount("");
      }
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.error || "Failed to place bid.", severity: "error" });
    } finally {
      setBidPlacedLoading(false);
    }
  };

  // Named Cart Dialog for Database Carts
  const handleOpenCartDialog = async () => {
    if (!isAuthenticated) {
      handleAddToCart(false);
      return;
    }
    setCartBtnLoading(true);
    try {
      const res = await axios.get(`${BaseUrl}/cart/getCartPage/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.status === 200) {
        setCarts(res.data.carts || []);
        if (res.data.carts && res.data.carts.length > 0) {
          setSelectedCart(res.data.carts[0].id);
        }
        setCartDialogOpen(true);
      }
    } catch (err) {
      // Fallback directly to default cart add
      handleAddToCart(false);
    } finally {
      setCartBtnLoading(false);
    }
  };

  const handleAddCartToSelected = async () => {
    setAdding(true);
    try {
      await addToCart({
        productId: product.id,
        quantity,
        selectedOptions,
        cartId: selectedCart,
        name: product.name,
        price: product.discount_price || product.price,
        image: selectedImage || product.image,
        is_live: isLive
      });
      window.dispatchEvent(new Event("storage"));
      setSnackbar({ open: true, message: "Added to selected cart!", severity: "success" });
      setCartDialogOpen(false);
    } catch (err) {
      setSnackbar({ open: true, message: "Could not add to cart.", severity: "error" });
    } finally {
      setAdding(false);
    }
  };

  const handleCreateNewCart = async () => {
    if (!newCartName.trim()) return;
    setAdding(true);
    try {
      const res = await axios.post(
        `${BaseUrl}/cart/`,
        { name: newCartName },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      if (res.status === 201) {
        const newCart = res.data.cart;
        setCarts((prev) => [...prev, newCart]);
        setSelectedCart(newCart.id);
        setNewCartName("");
        setSnackbar({ open: true, message: "New cart created!", severity: "success" });
      }
    } catch (err) {
      setSnackbar({ open: true, message: "Failed to create cart.", severity: "error" });
    } finally {
      setAdding(false);
    }
  };

  // Wishlist Handling
  const handleOpenWishlistDialog = async () => {
    if (!isAuthenticated) {
      navigate("/signin", { state: { from: `/product/${id}` } });
      return;
    }
    setWishlistLoading(true);
    try {
      const res = await axios.get(`${BaseUrl}/wishlist/getWishListPage/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.status === 200) {
        setWishlists(res.data.wishlists || []);
        setWishlistDialogOpen(true);
      }
    } catch (err) {
      setSnackbar({ open: true, message: "Failed to load wishlists.", severity: "error" });
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleAddWishlistToSelected = async () => {
    if (selectedWishlists.length === 0) return;
    setWishlistLoading(true);
    try {
      for (const wishlistId of selectedWishlists) {
        await axios.post(
          `${BaseUrl}/wishlist/${wishlistId}/add/`,
          { product: [{ id: product.id, name: product.name, price: product.price, image: selectedImage }] },
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
      }
      setSnackbar({ open: true, message: "Added to selected wishlists!", severity: "success" });
      setWishlistDialogOpen(false);
      setSelectedWishlists([]);
    } catch (err) {
      setSnackbar({ open: true, message: "Failed to add to wishlists.", severity: "error" });
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleCreateNewWishlist = async () => {
    if (!newWishlistName.trim()) return;
    setCreateWishlistLoading(true);
    try {
      const res = await axios.post(
        `${BaseUrl}/wishlist/`,
        { name: newWishlistName },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      if (res.status === 201) {
        setWishlists((prev) => [...prev, res.data.wishlist]);
        setNewWishlistName("");
        setSnackbar({ open: true, message: "New wishlist created!", severity: "success" });
      }
    } catch (err) {
      setSnackbar({ open: true, message: "Failed to create wishlist.", severity: "error" });
    } finally {
      setCreateWishlistLoading(false);
    }
  };

  const toggleWishlistSelection = (id) => {
    setSelectedWishlists((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <>
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
        
        {/* Back Button */}
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mb: 3, textTransform: "none", color: "text.secondary" }}
        >
          Back to Listings
        </Button>

        {loading ? (
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Skeleton variant="rectangular" width="100%" height={450} borderRadius={8} />
              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                {Array.from({ length: 4 }).map((_, idx) => (
                  <Skeleton key={idx} variant="rectangular" width={80} height={80} borderRadius={4} />
                ))}
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Skeleton variant="text" width="60%" height={40} />
              <Skeleton variant="text" width="40%" height={24} sx={{ my: 1 }} />
              <Skeleton variant="rectangular" width="100%" height={100} sx={{ my: 2 }} />
              <Skeleton variant="rectangular" width="50%" height={50} />
            </Grid>
          </Grid>
        ) : !product ? (
          <Alert severity="error">Product not found.</Alert>
        ) : (
          <Grid container spacing={4}>
            {/* Gallery Section */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  bgcolor: theme.palette.background.paper
                }}
              >
                <Box
                  component="img"
                  src={selectedImage || product.image}
                  alt={product.name}
                  loading="lazy"
                  onError={handleImageFallback}
                  sx={{
                    width: "100%",
                    height: { xs: 300, sm: 400, md: 480 },
                    objectFit: "contain",
                    borderRadius: 1
                  }}
                />
                
                {displayedImages.length > 1 && (
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                      mt: 2,
                      width: "100%",
                      overflowX: "auto",
                      py: 1,
                      scrollbarWidth: "thin"
                    }}
                  >
                    {displayedImages.map((img, idx) => (
                      <Box
                        key={idx}
                        component="img"
                        src={img}
                        alt={`thumbnail-${idx}`}
                        loading="lazy"
                        onClick={() => setSelectedImage(img)}
                        onError={handleImageFallback}
                        sx={{
                          width: 80,
                          height: 80,
                          objectFit: "contain",
                          borderRadius: 1,
                          cursor: "pointer",
                          border: img === selectedImage ? `2px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`,
                          bgcolor: "#fff"
                        }}
                      />
                    ))}
                  </Stack>
                )}
              </Paper>
            </Grid>

            {/* Product info details */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {product.name}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1 }}>
                    {product.category} • {product.brand}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                    <Rating value={Number(product.rating || 0)} precision={0.1} readOnly />
                    <Typography variant="body2" color="text.secondary">
                      ({product.rating} / 5)
                    </Typography>
                  </Box>
                </Box>

                <Divider />

                {/* Price Display */}
                <Box>
                  {product.is_auction ? (
                    <>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Typography variant="h4" color="primary" fontWeight="bold">
                          Current Bid: {currency.format(product.auction.current_highest_bid || product.price)}
                        </Typography>
                        <Chip label={`${product.auction.total_bids || 0} bids`} color="primary" variant="outlined" />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Auction Ends In: <span style={{ fontWeight: "bold", color: theme.palette.error.main }}>{timeLeft}</span>
                      </Typography>
                    </>
                  ) : (
                    <Box sx={{ display: "flex", alignItems: "baseline", gap: 2 }}>
                      <Typography variant="h3" color="primary" fontWeight="bold">
                        {currency.format(product.discount_price || product.price)}
                      </Typography>
                      {product.discount_price && (
                        <Typography variant="h6" color="text.secondary" sx={{ textDecoration: "line-through" }}>
                          {currency.format(product.price)}
                        </Typography>
                      )}
                    </Box>
                  )}
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Inclusive of all taxes
                  </Typography>
                </Box>

                {/* Product Options */}
                {product.options && Object.keys(product.options).length > 0 && (
                  <Stack spacing={2} sx={{ p: 2, bgcolor: theme.palette.background.default, borderRadius: 2 }}>
                    {Object.entries(product.options).map(([key, vals]) => (
                      <Box key={key} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Typography variant="subtitle2" sx={{ minWidth: 80, textTransform: "capitalize" }}>
                          {key}:
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                          {vals.map((v) => (
                            <Chip
                              key={v}
                              label={v}
                              clickable
                              color={selectedOptions[key] === v ? "primary" : "default"}
                              onClick={() => handleOptionSelect(key, v)}
                            />
                          ))}
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                )}

                {/* Stock and Shipping status */}
                <Stack direction="row" spacing={2}>
                  <Chip
                    label={product.stock > 0 ? `In Stock (${product.stock})` : "Out of Stock"}
                    color={product.stock > 0 ? "success" : "error"}
                    variant="outlined"
                  />
                  {sellerDetails?.shippingTime && (
                    <Chip
                      icon={<LocalShippingIcon />}
                      label={`Delivered: ${sellerDetails.shippingTime}`}
                      variant="outlined"
                    />
                  )}
                </Stack>

                {/* Action Buttons */}
                <Box>
                  {product.is_auction ? (
                    <Stack direction="row" spacing={2}>
                      <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        onClick={handleOpenBidDialog}
                        disabled={!auctionActive || !allOptionsSelected}
                        sx={{ flex: 1, py: 1.5, textTransform: "none", fontSize: "1.1rem" }}
                      >
                        Place Bid
                      </Button>
                      <Button
                        variant="outlined"
                        color="secondary"
                        size="large"
                        onClick={handleOpenWishlistDialog}
                        sx={{ flex: 1, py: 1.5, textTransform: "none", fontSize: "1.1rem" }}
                      >
                        Add to Wishlist
                      </Button>
                    </Stack>
                  ) : (
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      
                      {/* Quantity Selector */}
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 1, px: 1 }}>
                        <IconButton size="small" onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1}>
                          <RemoveIcon />
                        </IconButton>
                        <Typography sx={{ minWidth: 30, textAlign: "center", fontWeight: "bold" }}>{quantity}</Typography>
                        <IconButton size="small" onClick={() => setQuantity((q) => q + 1)}>
                          <AddIcon />
                        </IconButton>
                      </Stack>

                      <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        startIcon={<AddShoppingCartIcon />}
                        onClick={handleOpenCartDialog}
                        disabled={adding || product.stock === 0 || !allOptionsSelected}
                        sx={{ flex: 2, py: 1.5, textTransform: "none", fontSize: "1.1rem" }}
                      >
                        Add to Cart
                      </Button>
                      
                      <Button
                        variant="outlined"
                        color="secondary"
                        size="large"
                        onClick={handleOpenWishlistDialog}
                        sx={{ flex: 1, py: 1.5, textTransform: "none", fontSize: "1.1rem" }}
                      >
                        Wishlist
                      </Button>
                    </Stack>
                  )}
                </Box>

                <CompareButton productId={product.id} size="medium" />

                <Divider />

                {/* Key Features */}
                {product.features && product.features.length > 0 && (
                  <Box>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      Key Features
                    </Typography>
                    <Grid container spacing={1}>
                      {product.features.map((feat, idx) => (
                        <Grid size={{ xs: 12, sm: 6 }} key={idx}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <CheckCircleOutlineIcon color="success" sx={{ fontSize: 18 }} />
                            <Typography variant="body2">{feat}</Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}

                {/* Seller details */}
                {sellerDetails && (
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <StorefrontIcon color="primary" sx={{ fontSize: 32 }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography fontWeight="bold">
                          Sold by {sellerDetails.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Shipping: {sellerDetails.shippingTime || "Ships next day"}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: "right" }}>
                        <Rating value={sellerDetails.rating || 4} size="small" precision={0.1} readOnly />
                        <Typography variant="caption" display="block" color="text.secondary">
                          Seller Rating
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                )}

                {/* Description */}
                <Box>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Product Description
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-line", lineHeight: 1.6 }}>
                    {product.description}
                  </Typography>
                </Box>

              </Stack>
            </Grid>
          </Grid>
        )}

        {/* Customer Reviews Section */}
        {product && reviews.length > 0 && (
          <Box sx={{ mt: 6 }}>
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
              Customer Reviews ({reviews.length})
            </Typography>
            <Stack spacing={2.5}>
              {reviews.map((rev) => (
                <Paper key={rev.id} variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography fontWeight="bold">{rev.reviewerName || "Anonymous Customer"}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {rev.date ? new Date(rev.date).toLocaleDateString() : ""}
                      </Typography>
                    </Stack>
                    <Rating value={rev.rating} size="small" readOnly />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {rev.comment}
                    </Typography>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Box>
        )}

        {/* Mini rails for database products */}
        {!isLive && product && (
          <Box sx={{ mt: 6 }}>
            <ProductMiniRail title="Similar Products" products={similarProducts} limit={6} />
            <Box sx={{ mt: 4 }}>
              <RecentlyViewedSection excludeId={product.id} />
            </Box>
          </Box>
        )}

      </Container>

      {/* Named Cart Dialog */}
      <Dialog open={cartDialogOpen} onClose={() => setCartDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle fontWeight="bold">Add to Cart</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Choose a cart to add this product to, or create a new one.
          </Typography>
          <TextField
            select
            fullWidth
            label="Select Cart"
            value={selectedCart}
            onChange={(e) => setSelectedCart(e.target.value)}
            SelectProps={{ native: true }}
            sx={{ mb: 3 }}
          >
            {carts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.items?.length || 0} items)
              </option>
            ))}
          </TextField>

          <Divider sx={{ my: 2 }}>OR</Divider>

          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              size="small"
              label="New Cart Name"
              value={newCartName}
              onChange={(e) => setNewCartName(e.target.value)}
            />
            <Button variant="outlined" onClick={handleCreateNewCart} disabled={adding}>
              Create
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCartDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddCartToSelected} disabled={adding}>
            {adding ? <CircularProgress size={24} /> : "Add to Cart"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Wishlist Dialog */}
      <Dialog open={wishlistDialogOpen} onClose={() => setWishlistDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle fontWeight="bold">Add to Wishlist</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select one or more wishlists to add this product to.
          </Typography>
          <Stack spacing={1} sx={{ maxHeight: 200, overflowY: "auto", mb: 2 }}>
            {wishlists.map((w) => (
              <Box
                key={w.id}
                onClick={() => toggleWishlistSelection(w.id)}
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  border: selectedWishlists.includes(w.id) ? `2px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`,
                  cursor: "pointer",
                  bgcolor: selectedWishlists.includes(w.id) ? `${theme.palette.primary.main}10` : "transparent"
                }}
              >
                <Typography fontWeight="medium">{w.name}</Typography>
              </Box>
            ))}
          </Stack>

          <Divider sx={{ my: 2 }}>OR</Divider>

          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              size="small"
              label="New Wishlist Name"
              value={newWishlistName}
              onChange={(e) => setNewWishlistName(e.target.value)}
            />
            <Button variant="outlined" onClick={handleCreateNewWishlist} disabled={createWishlistLoading}>
              Create
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setWishlistDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddWishlistToSelected}
            disabled={wishlistLoading || selectedWishlists.length === 0}
          >
            {wishlistLoading ? <CircularProgress size={24} /> : "Add to Wishlist"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bidding Dialog */}
      <Dialog open={bidDialogOpen} onClose={() => setBidDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle fontWeight="bold">Place a Bid</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Submit your bid. It must be higher than the current highest bid.
          </Typography>
          <Stack spacing={2}>
            <Box sx={{ p: 2, bgcolor: theme.palette.background.default, borderRadius: 2 }}>
              <Typography variant="subtitle2">Current Highest Bid:</Typography>
              <Typography variant="h5" color="primary" fontWeight="bold">
                {currency.format(product?.auction?.current_highest_bid || product?.price || 0)}
              </Typography>
            </Box>
            {prevBid && (
              <Typography variant="body2" color="success.main">
                Your previous bid: {currency.format(prevBid)}
              </Typography>
            )}
            <TextField
              fullWidth
              type="number"
              label="Your Bid Amount (INR)"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setBidDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handlePlaceBid} disabled={bidPlacedLoading || !bidAmount}>
            {bidPlacedLoading ? <CircularProgress size={24} /> : "Place Bid"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((current) => ({ ...current, open: false }))}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
      <Footer />
    </>
  );
};

export default ProductDetails;

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
<<<<<<< HEAD
import { useTheme } from "@mui/material/styles";
import { use } from "react";
import axios from "axios";
import { BaseUrl } from "../config";
import { width } from "@mui/system";
import CompareButton from "../components/product/CompareButton";
import ProductMiniRail from "../components/product/ProductMiniRail";
import RecentlyViewedSection from "../components/product/RecentlyViewedSection";
import { fetchRecommendations, recordProductView } from "../services/searchService";

const ProductDetails = ({ darkMode, setDarkMode }) => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [visibleRelatedCount, setVisibleRelatedCount] = useState(8);
  const [loading, setLoading] = useState(true);
  const [cartUpdated, setCartUpdated] = useState(false);
  const [wishlistDialogOpen, setWishlistDialogOpen] = useState(false);
  const [cartDialogOpen, setCartDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [sellerDetails, setSellerDetails] = useState(null);
  // State for page number
  const [RP_PageNo, setRP_PageNo] = useState(2);
  const [showmoreRPLoading, setShowmoreRPLoading] = useState(false);
  const [showmoreReviewLoading, setShowmoreReviewLoading] = useState(false);


  const [wishlists, setWishlists] = useState([]);
  const [selectedWishlists, setSelectedWishlists] = useState([]);
  const [newWishlistName, setNewWishlistName] = useState("");
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [addToWishlistLoading, setAddToWishlistLoading] = useState(false);

  const [carts, setCarts] = useState([]);
  const [selectedCart, setSelectedCart] = useState("");
  const [newCartName, setNewCartName] = useState("");
  const [cartBtnLoading, setCartBtnLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);

  const [quantity, setQuantity] = useState(1);
  const [newRating, setNewRating] = useState(0);
  const [loadingNewCart, setLoadingNewCart] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [reviewPageNo, setReviewPageNo] = useState(0);
  const [newTitle, setNewTitle] = useState("");
  const [newComment, setNewComment] = useState("");

  const [bidDialogOpen, setBidDialogOpen] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [bidPlacedLoading, setBidPlacedLoading] = useState(false);
  const [bidPlaced, setBidPlaced] = useState(false);
  const [bidBtnLoading, setBidBtnLoading] = useState(false);

  const [prevBid, setprevBid] = useState("");

  const [boughtTogether, setBoughtTogether] = useState([]);
  const [addBothToCart, setAddBothToCart] = useState(false);
  const [BTLoading, setBTLoading] = useState("false")

  const [displayedImages, setDisplayedImages] = useState([]);
  const [open, setOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
   
    const [timeLeft, setTimeLeft] = useState("");

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [createwishlistLoading, setCreatewishlistLoading] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [auctionActive, setAuctionActive] = useState(false);

  const navigate = useNavigate();
  const theme = useTheme();

  
useEffect(() => {
  if (!product?.is_auction || !product?.auction?.end_time || !product?.auction?.start_time)
    return;

  const startTime = new Date(product.auction.start_time).getTime();
  const endTime = new Date(product.auction.end_time).getTime();

  let timerId = null;

  const updateTimer = () => {
    try {
      const now = Date.now();

      if (isNaN(startTime) || isNaN(endTime)) {
        setTimeLeft("Invalid Time");
        setAuctionActive(false);
        clearInterval(timerId);
        return;
      }

      // Auction not started yet
      if (now < startTime) {
        const diff = startTime - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setTimeLeft(
          `Starts in ${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
        );
        setAuctionActive(false); // auction not active yet
        return;
      }

      // Auction ended
      if (now >= endTime) {
        setTimeLeft("Auction Ended");
        setAuctionActive(false); // auction over
        clearInterval(timerId);
        return;
      }

      // Auction running
      const diff = endTime - now;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
      setAuctionActive(true); // auction is active
    } catch (error) {
      console.error("Error updating auction timer:", error);
      setTimeLeft("Timer Error");
      setAuctionActive(false);
      clearInterval(timerId);
    }
  };

  updateTimer(); // run immediately
  timerId = setInterval(updateTimer, 1000);

  return () => clearInterval(timerId);
}, [product]);


  // useEffect(() => {
  //   if (!product?.is_auction) return;

  //   const endTime = new Date(product.auction.end_time).getTime();

  //   const updateTimer = () => {
  //     const now = new Date().getTime();
  //     const diff = endTime - now;

  //     if (diff <= 0) {
  //       setTimeLeft("Auction Ended");
  //       clearInterval(timer);
  //       return;
  //     }

  //     const hours = Math.floor(diff / (1000 * 60 * 60));
  //     const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  //     const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  //     setTimeLeft(
  //       `${hours.toString().padStart(2, "0")}:${minutes
  //         .toString()
  //         .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  //     );
  //   };

  //   updateTimer(); // run immediately once
  //   const timer = setInterval(updateTimer, 1000); // update every second

  //   return () => clearInterval(timer); // cleanup on unmount
  // }, [product]);

  const fetchMyBids = async () => {
    try {

      const res = await axios.get(`${BaseUrl}/myBids/${auction.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        validateStatus: () => true,
      });

      if (res.status === 200) {
        setprevBid(res.data.myBids || null);

      }
      else {
        setSnackbar({
          open: true,
          message: `❌ Failed to fetch bids. Status: ${res.status}`,
          severity: "error",
        });
      }
    } catch (error) {
      console.error("Error fetching bids:", error);

    }
  };
  const fetchCartsData = async () => {
    try {


      const res = await axios.get(`${BaseUrl}/cart/getCartPage/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        }, validateStatus: () => true,
      }
      );
      if (res.status === 200) {

        const newC = res.data.carts;
        setCarts(newC);

      }
      else {
        console.log(" status code:", res.status, " message :", res.message);
      }
      setLoading(false);
    } catch (error) {
      console.log("server is Down ", error);
      setLoading(false);
    }
    finally {
      setCartBtnLoading(false);
    }
  }

  const handleOpenBidDialog = async () => {
    setBidBtnLoading(true); // start loading

    
    try {

      const res = await axios.get(`${BaseUrl}/auctions/${product.auction.id}/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        validateStatus: () => true,
      });

      if (res.status === 200) {
        setprevBid(res.data.myBids || null);

      }
      else {
        setSnackbar({
          open: true,
          message: `❌ Failed to fetch bids. Status: ${res.status}`,
          severity: "error",
        });
      }
    } catch (error) {
      console.error("Error fetching bids:", error);

    }
    setBidBtnLoading(false); // stop loading
    setBidDialogOpen(true);
  }

  const fetchWishlistData = async () => {
    try {
      const res = await axios.get(`${BaseUrl}/wishlist/getWishListPage`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        }, validateStatus: () => true,
      }
      );
      if (res.status === 200) {
        console.log("wish:", res.data.wishlists);

        setWishlists(res.data.wishlists || []);
      }
      else {
        console.log(" status code:", res.status, " message :", res.message);
      }
      setLoading(false);
    } catch (error) {
      console.log("server is Down ", error);
      setLoading(false);
    }
    finally {
      setWishlistLoading(false);
      setWishlistDialogOpen(true);
    }
  }

  const fetchData = async () => {
    try {
      const res = await axios.get(`${BaseUrl}/products/${id}/`);
      if (res.status === 200) {
        setProduct(res.data || null);

        setRelatedProducts(res.data.related_products || []);
        setSimilarProducts(res.data.similar_products || []);

        const bought = (res.data.frequently_bought_together || res.data.related_products || []).slice(0, 3);
        setBoughtTogether(bought);


        setSellerDetails(res.data.seller);
        setReviews(res.data.reviews);


      }
      else {
        console.log(" status code:", res.status, " message :", res.message);
      }
      setLoading(false);
    } catch (error) {
      console.log("server is Down ", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. product fetch करना
    fetchData();
    recordProductView(id);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetchRecommendations(id)
      .then((data) => {
        setRelatedProducts(data.relatedProducts || []);
        setSimilarProducts(data.similarProducts || []);
        setBoughtTogether((data.frequentlyBoughtTogether || []).slice(0, 3));
      })
      .catch(() => {});
=======
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
>>>>>>> 0e91b93c18a15c809815810e835e7568b67aa556
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
<<<<<<< HEAD
                    sx={{
                      width: "100%",
                      maxWidth: 500,
                      aspectRatio: "1/1",
                      minHeight: { xs: 220, sm: 320 },
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      bgcolor: "#f9f9f9",
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="body1" color="text.secondary">
                      No images available
                    </Typography>
                  </Box>
                )}
              </Box>

              <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", md: "block" } }} />

              {/* Product Details and Quick Info */}
              <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                {/* Product Title and Basic Info */}
                <Box>
                  <Typography variant="h4" fontWeight="bold" sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>
                    {product.name}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mt: 0 }}>
                    {product.category} • {product.brand}
                  </Typography>
                  {/* Product Options */}
                  {product.options && (
                    <Box sx={{ mb: 2, mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {Object.entries(product.options).map(([optionKey, optionVals]) => (
                        <Box key={optionKey} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="subtitle2" sx={{ minWidth: 70 }}>{optionKey.charAt(0).toUpperCase() + optionKey.slice(1)}:</Typography>
                          {optionKey === 'color' ? (
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              {optionVals.map((color) => (
                                <Box
                                  key={color}
                                  onClick={() => handleOptionSelect(optionKey, color)}
                                  sx={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: '50%',
                                    border: selectedOptions[optionKey] === color ? '3px solid #1976d2' : '1.5px solid #ccc',
                                    background: color.toLowerCase(),
                                    cursor: 'pointer',
                                    boxShadow: selectedOptions[optionKey] === color ? '0 0 0 2px #90caf9' : 'none',
                                    transition: 'border 0.2s, box-shadow 0.2s',
                                    mr: 0.5
                                  }}
                                  title={color}
                                />
                              ))}
                            </Box>
                          ) : (
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              {optionVals.map((val) => (
                                <Chip
                                  key={val}
                                  label={val}
                                  clickable
                                  color={selectedOptions[optionKey] === val ? 'primary' : 'default'}
                                  onClick={() => handleOptionSelect(optionKey, val)}
                                  sx={{ fontWeight: 500 }}
                                />
                              ))}
                            </Box>
                          )}
                        </Box>
                      ))}
                    </Box>
                  )}
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mt: 0,
                  }}>
                    <Rating value={product.rating} precision={0.5} readOnly />
                    <Typography variant="body2" color="text.secondary">
                      ({product.rating} / 5)
                    </Typography>
                  </Box>
                </Box>

                {/* Price Box */}
                <Box sx={{
                  p: 0,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  mt: -2,
                  mb: -3
                }}>
                  {product.is_auction ? (
                    <>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <Typography variant="h5" color="primary" fontWeight="bold">
                          Current Bid: ₹{product.auction.current_highest_bid.toLocaleString('en-IN')}
                        </Typography>
                        <Chip
                          label={`${
                            // product.auction_details.bids
                            product.auction.total_bids || 0
                          } bids`}
                          color="primary"
                          variant="outlined"
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Min Bid: ₹{product.price.toLocaleString('en-IN')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Time Left: {timeLeft}
                      </Typography>
                    </>
                  ) : (
                    <>
                      <Typography variant="h5" color="primary" fontWeight="bold">
                        ₹{product.price.toLocaleString('en-IN')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Inclusive of all taxes
                      </Typography>
                    </>
                  )}
                </Box>

                {/* Condensed Seller Info */}
                {sellerDetails && (
                  <Box sx={{
                    p: 1,
                    borderBottom: '1px solid',
                    borderColor: 'divider'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight="medium">
                          Sold by {sellerDetails.name}
                        </Typography>
                        {sellerDetails.verificationStatus === "verified" && (
                          <VerifiedIcon color="primary" sx={{ fontSize: 16 }} />
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Rating value={sellerDetails.rating} precision={0.1} readOnly size="small" />
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                          ({sellerDetails.rating})
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocalShippingIcon color="action" sx={{ fontSize: 16 }} />
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        Ships in {sellerDetails.shippingTime}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* Quick Info Box */}
                <Box sx={{
                  p: 2,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  mt: -2,
                  mb: 1
                }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Quick Info
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">Brand:</Typography>
                      <Typography variant="body2" fontWeight="medium">{product.brand}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">Category:</Typography>
                      <Typography variant="body2" fontWeight="medium">{product.category}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">Seller:</Typography>
                      <Typography variant="body2" fontWeight="medium">{sellerDetails.name}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">Return Policy:</Typography>
                      <Typography variant="body2" fontWeight="medium">{product.returnPolicy}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">Warranty:</Typography>
                      <Typography variant="body2" fontWeight="medium">{product.warranty}</Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Action Buttons */}
                <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                  {product.is_auction ? (
                    <>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleOpenBidDialog}
                        disabled={bidBtnLoading || !allOptionsSelected || !auctionActive}
                        sx={{
                          flex: 1,
                          py: 1.5,
                          textTransform: "none",
                          fontSize: "1rem",
                        }}
                      >
                        {bidBtnLoading ? (
                          <CircularProgress size={24} color="inherit" />
                        ) : (
                          "Bid for Auction"
                        )}
                      </Button>
                      <Button
                        variant="outlined"
                        color="secondary"
                        onClick={() => handleOpenWishlistDialog(true)}
                        sx={{
                          flex: 1,
                          py: 1.5,
                          textTransform: 'none',
                          fontSize: '1rem',
                        }}
                        disabled={!allOptionsSelected || wishlistLoading} // disable while loading
                      >
                        {wishlistLoading ? (
                          <CircularProgress size={20} color="secondary" />
                        ) : (
                          "Add to Wishlist"
                        )}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleOpenCartDialog}
                        disabled={cartBtnLoading || !allOptionsSelected}
                        sx={{
                          flex: 1,
                          py: 1.5,
                          textTransform: "none",
                          fontSize: "1rem",
                        }}
                      >
                        {cartBtnLoading ? (
                          <CircularProgress size={24} color="inherit" />
                        ) : (
                          "Add to Cart"
                        )}
                      </Button>
                      <Button
                        variant="outlined"
                        color="secondary"
                        onClick={() => handleOpenWishlistDialog(true)}
                        sx={{
                          flex: 1,
                          py: 1.5,
                          textTransform: 'none',
                          fontSize: '1rem',
                        }}
                        disabled={!allOptionsSelected || wishlistLoading} // disable while loading
                      >
                        {wishlistLoading ? (
                          <CircularProgress size={20} color="secondary" />
                        ) : (
                          "Add to Wishlist"
                        )}
                      </Button>
                    </>
                  )}
                </Box>
                <Box sx={{ mt: 2 }}>
                  <CompareButton productId={product.id} size="medium" />
                </Box>
              </Box>
            </Box>

            {/* Detailed Information Accordions */}
            <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: { xs: 4, md: 7 } }}>
              {/* Product Details (Key Features) */}
              <Box>
                <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
                  Key Features
                </Typography>
                <Grid container spacing={2}>
                  {product.features.map((feature, index) => (
                    <Grid item xs={12} sm={6} key={index}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, pl: 1 }}>
                        <CheckCircleOutlineIcon color="success" fontSize="small" sx={{ mr: 1 }} />
                        <Typography variant="body1" sx={{ fontSize: '1.1rem' }}>{feature}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
              <Divider sx={{ my: 3, bgcolor: 'divider', opacity: 0.5 }} />

              {/* Description */}
              <Box>
                <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
                  Description
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-line', fontSize: '1.1rem' }}>
                  {product.description}
                </Typography>
              </Box>
              <Divider sx={{ my: 3, bgcolor: 'divider', opacity: 0.5 }} />

              {/* Seller Information */}
              {sellerDetails && (
                <Box>
                  <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
                    Seller Information
                  </Typography>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h6" fontWeight="medium">
                          {sellerDetails.name}
                        </Typography>
                        {sellerDetails.verificationStatus === "verified" && (
                          <VerifiedIcon color="primary" sx={{ fontSize: 20 }} />
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Rating value={sellerDetails.rating} precision={0.1} readOnly size="small" />
                        <Typography variant="body2" color="text.secondary">
                          ({sellerDetails.rating})
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {sellerDetails.badges.map((badge, index) => (
                        <Chip
                          key={index}
                          label={badge}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{
                            transition: 'background 0.2s',
                            cursor: 'pointer',
                            '&:hover': {
                              bgcolor: 'primary.light',
                              color: 'white',
                            },
                          }}
                        />
                      ))}
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AccessTimeIcon color="action" sx={{ fontSize: 20 }} />
                          <Typography variant="body2" color="text.secondary">
                            {sellerDetails.businessHours}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LocalShippingIcon color="action" sx={{ fontSize: 20 }} />
                          <Typography variant="body2" color="text.secondary">
                            Ships in {sellerDetails.shippingTime}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LocationOnIcon color="action" sx={{ fontSize: 20 }} />
                          <Typography variant="body2" color="text.secondary">
                            {sellerDetails.location}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {sellerDetails.description}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Response Time: {sellerDetails.customer_support.responseTime}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Contact Details
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Email: {sellerDetails.customer_support.email}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Phone: {sellerDetails.customer_support.phone}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              )}
              {sellerDetails && <Divider sx={{ my: 3, bgcolor: 'divider', opacity: 0.5 }} />}

              {/* FAQ Section */}
              {product.faqs && product.faqs.length > 0 && (
                <Box>
                  <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
                    Frequently Asked Questions
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {product.faqs.map((faq, idx) => (
                      <Box key={idx} sx={{ mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 0.5 }}>
                          Q{idx + 1}. {faq.question}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {faq.answer}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
              {product.faqs && product.faqs.length > 0 && <Divider sx={{ my: 3, bgcolor: 'divider', opacity: 0.5 }} />}

              {/* Reviews Section */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                  <Typography variant="h5" fontWeight="bold">Customer Reviews</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Rating value={product.rating} precision={0.1} readOnly size="small" />
                    <Typography variant="body2" color="text.secondary">
                      ({product.reviewsCount || 0} reviews)
                    </Typography>
                  </Box>
                  {/* Review summary */}
                  <Typography variant="subtitle1" color="text.secondary" sx={{ ml: 2 }}>
                    {product.rating} out of 5, {product.reviews?.length || 0} reviews
                  </Typography>
                  <Button variant="outlined" color="primary" onClick={setReviewDialogOpen} sx={{ ml: 'auto', textTransform: 'none', fontWeight: 500 }}>
                    Write a Review
                  </Button>
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {reviews.map((review, idx) => (
                    <Box
                      key={review.id}
                      sx={{
                        position: "relative",
                        pb: 3,
                        bgcolor: "background.default",
                        borderRadius: 2,
                        px: 2,
                        pt: 2,
                        boxShadow: 3, // MUI shadow level (try 1–6 for subtle, 10+ for stronger)
                      }}
                    >
=======
                    component="img"
                    src={selectedImage || product.image}
                    alt={product.name}
                    onError={handleImageFallback}
                    sx={{ width: "100%", height: { xs: 320, md: 520 }, objectFit: "contain", bgcolor: "grey.50" }}
                  />
                  <Stack direction="row" spacing={1} sx={{ mt: 2, overflowX: "auto" }}>
                    {images.map((image) => (
>>>>>>> 0e91b93c18a15c809815810e835e7568b67aa556
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
<<<<<<< HEAD
                      <Typography
                        variant="subtitle2"
                        fontWeight="bold"
                        sx={{
                          textAlign: 'center',
                          mb: 0.5,
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          minHeight: '2.8em',
                          maxHeight: '2.8em',
                          lineHeight: 1.4,
                          fontSize: '1rem',
                          color: theme.palette.text.primary,
                        }}
                      >
                        {boughtTogether[0].name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ₹{boughtTogether[0].price.toLocaleString('en-IN')}
                      </Typography>
                    </Box>
                  </Link>
                </Box>
                {/* Total and Button below */}
                <Paper elevation={0} sx={{ mt: 3, p: 2, bgcolor: theme.palette.background.default, borderRadius: 3, textAlign: 'center', boxShadow: 'none' }}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, color: theme.palette.primary.dark, fontSize: '1.2rem' }}>
                    Total: ₹{[product, ...boughtTogether].reduce((sum, item) => sum + Number(item.price || 0), 0).toLocaleString('en-IN')}
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => { setAddBothToCart(true); handleOpenCartDialog(); }}
                    sx={{ px: 4, py: 1.5, fontWeight: 700, fontSize: '1.1rem', borderRadius: 2, boxShadow: 2, mt: 1, letterSpacing: 0.5 }}
                  >
                    Add All To Cart
                  </Button>
=======
                    ))}
                  </Stack>
>>>>>>> 0e91b93c18a15c809815810e835e7568b67aa556
                </Paper>
              </Grid>

<<<<<<< HEAD
            <ProductMiniRail title="Similar Products" products={similarProducts} limit={6} />
            <RecentlyViewedSection excludeId={product.id} />

            {/* Related Products */}
            {relatedProducts.length > 0 && (
=======
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
>>>>>>> 0e91b93c18a15c809815810e835e7568b67aa556
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

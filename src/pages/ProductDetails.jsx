import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Typography,
  CircularProgress,
  Button,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  TextField,
  MenuItem,
  Select,
  Snackbar,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Rating,
  Avatar,
  Chip,
  Stack,
  Alert,
  Paper,
  IconButton,

} from "@mui/material";
import { alpha } from "@mui/material/styles";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import GavelIcon from '@mui/icons-material/Gavel';
import FavoriteIcon from "@mui/icons-material/Favorite";
import VerifiedIcon from "@mui/icons-material/Verified";
import StorefrontIcon from "@mui/icons-material/Storefront";
import RateReviewIcon from "@mui/icons-material/RateReview";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useTheme } from "@mui/material/styles";
import { use } from "react";
import axios from "axios";
import { BaseUrl } from "../config";
import { width } from "@mui/system";

const ProductDetails = ({ darkMode, setDarkMode }) => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
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

        setRelatedProducts(res.data.related_products);

        const bought = (res.data.related_products || []).slice(0, 1);
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
  }, [id]);

  useEffect(() => {
    if (!product) return;

    if (product.options) {
      const initial = {};

      // 2. हर option का पहला value select करना
      Object.keys(product.options).forEach(key => {
        if (product.options[key]?.length > 0) {
          initial[key] = product.options[key][0];
        }
      });

      setSelectedOptions(initial);

      // 3. अगर color है तो उसकी images set करना
      if (initial.color) {
        const filtered = product.images?.[initial.color] || product.images?.default || [];
        console.log('Filtered images for color:', initial.color, filtered);
        // Remove duplicate images
        const uniqueImages = [...new Set(filtered)];
        setDisplayedImages(uniqueImages);
      } else {
        console.log('Product images (no color option):', product.images);
        // Remove duplicate images
        const uniqueImages = [...new Set(product.images || [])];
        setDisplayedImages(uniqueImages);
      }
    } else {
      console.log('Product images (no options):', product.images);
      // Remove duplicate images
      const uniqueImages = [...new Set(product.images || [])];
      setDisplayedImages(uniqueImages);
    }
  }, [product]);

  // Reset current index when displayed images change
  useEffect(() => {
    setCurrentIndex(0);
  }, [displayedImages]);


  const handleOpen = (index) => {
    setCurrentIndex(index);
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleNext = () => {
    setCurrentIndex((prev) =>
      prev === displayedImages.length - 1 ? 0 : prev + 1
    );
  };

  const handlePrev = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? displayedImages.length - 1 : prev - 1
    );
  };

  const postReview = async () => {
    if (!newTitle?.trim() || !newComment?.trim()) return;

    const newReview = {
      productId: product?.id,
      title: newTitle.trim(),
      comment: newComment.trim(),
      rating: newRating
    };

    try {

      const res = await axios.post(`${BaseUrl}/postReview`, newReview,
        {
          headers: {
            Authorization: `bearer ${localStorage.getItem('token')}`
          }
        }
      ); // API call to post review

      if (res.status === 201) {
        setSnackbar({
          open: true,
          message: '📝 Review submitted! Thank you for your feedback.',
          severity: 'success',
        });
        setReviewDialogOpen(false);
        setNewTitle('');
        setNewComment('');
        setReviews(prev => {
          const exists = prev.some(r => r.id === res.data.newReview.id);
          let updated;

          if (exists) {
            // Replace old review
            updated = prev.map(r =>
              r.id === res.data.newReview.id ? res.data.newReview : r
            );
          } else {
            // Add new review
            updated = [...prev, res.data.newReview];
          }

          // Sort by date (newest first)
          return updated.sort((a, b) => new Date(b.date) - new Date(a.date));
        });



        // ✅ Optionally refresh reviews list here
        // fetchReviews(); or update local state
      } else {
        throw new Error('Unexpected response status');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      setSnackbar({
        open: true,
        message: '❌ Failed to submit review. Please try again later.',
        severity: 'error',
      });
    }
  };

  // get more review from server using API Call
  const AddMoreReviews = async () => {
    try {
      setShowmoreReviewLoading(true);
      const res = await axios.get(`${BaseUrl}/moreReviews?productId=${id}&page=${reviewPageNo}&limit=5`);
      if (res.status === 200) {
        const newReviews = res.data.reviewsData || [];
        setReviews(prev => {
          const combined = [...prev, ...newReviews];
          const unique = Array.from(new Map(combined.map(r => [r.id, r])).values());
          return unique;
        });

      }
    } catch (error) {
      console.log("error", error)
    }
    finally {
      setShowmoreReviewLoading(false);
    }
  }

  const addMoreRelatedProduct = async () => {
    try {
      setShowmoreRPLoading(true);
      const res = await axios.get(`${BaseUrl}/moreRelatedProducts?prdouctId=${id}&offset=${RP_PageNo}&limit=10`);
      if (res.status === 200) {
        setRelatedProducts(prev => [...prev, ...res.data.relatedProductsData]);
        setRP_PageNo(prev => prev + 1); // Increment offset for next fetch
        setSnackbar({ open: true, message: "Products loaded successfully!", severity: "success" });
      } else {
        setSnackbar({ open: true, message: "Failed to load products", severity: "error" });
      }
    } catch (error) {
      setSnackbar({ open: true, message: "Error fetching products", severity: "error" });
      console.error("Error:", error);
    }
    finally {
      setShowmoreRPLoading(false);
    }
  };

  // Handle option selection
  const handleOptionSelect = (key, value) => {
    setSelectedOptions(prev => {
      const newOptions = { ...prev, [key]: value };

      // अगर color बदला है तो images filter करो
      if (key === "color") {
        const filtered = product.images?.[value] || product.images?.default || [];
        // Remove duplicate images
        const uniqueImages = [...new Set(filtered)];
        setDisplayedImages(uniqueImages);
      }

      return newOptions;
    });
  };

  const allOptionsSelected = product && product.options
    ? Object.entries(product.options).every(([key, vals]) => selectedOptions[key])
    : true;

  // When opening cart dialog, pre-fill new cart name
  const handleOpenCartDialog = async () => {
    console.log("in handleOpenCartDialog");
    setCartBtnLoading(true);
    await fetchCartsData();
    setCartDialogOpen(true);
    setTimeout(() => {
      console.log("carts :", carts);
    }, 3000);
    console.log("out handleOpenCartDialog");

  };

  const handleAddBothToCart = () => {
    setAddBothToCart(true);
    handleOpenCartDialog();
  };

  const createNewCart = async () => {
    let name = newCartName.trim();
    if (!name) return;

    // Check for duplicate names (case-insensitive)
    const nameExists = carts.some(
      (cart) => cart.name.toLowerCase() === name.toLowerCase()
    );
    if (nameExists) {
      setSnackbar({
        open: true,
        message: '⚠️ A cart with this name already exists!',
        severity: 'warning',
      });
      return;
    }

    const newCart = { name };

    try {
      setLoadingNewCart(true);
      const res = await axios.post(
        `${BaseUrl}/cart/addNewCart/`,
        newCart,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          }
        }
      );

      // 401 Unauthorized
      if (res.status === 401) {
        setSnackbar({
          open: true,
          message: "❌ Unauthorized! Please login again.",
          severity: "error",
        });
        navigate('/signin');
        return;
      }

      // 201 Created
      if (res.status === 201) {
        const savedCart = res.data.cart;
        setCarts([...carts, savedCart]);
        setSelectedCart(savedCart.id);
        setNewCartName("");
        setSnackbar({
          open: true,
          message: "✅ Cart created successfully!",
          severity: "success",
        });
      } else {
        setSnackbar({
          open: true,
          message: `❌ Failed to create cart. Status: ${res.status}`,
          severity: "error",
        });
      }
    } catch (error) {
      console.error(error);
      setSnackbar({
        open: true,
        message: "❌ Failed to create cart. Please try again.",
        severity: "error",
      });
    }
    finally {
      setLoadingNewCart(false);
    }
  };

  const addToSelectedCart = async () => {
    if (!selectedCart || !product) return;

    const items = [
      {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity,
        selectedOptions: { ...selectedOptions },
      },
    ];

    // Add "bought together" items if applicable
    if (addBothToCart && boughtTogether.length > 0) {
      boughtTogether.forEach(bt => {
        items.push({
          id: bt.id,
          name: bt.name,
          price: bt.price,
          image: bt.image,
          quantity: 1
        });
      });
    }

    const postCart = {
      Cartid: selectedCart,
      product:items, // only need id and items when adding to existing cart
    };

    try {
      console.log("📦 Payload =>", postCart);

      setCartLoading(true);
      const res = await axios.post(
        `${BaseUrl}/cart/addToCart/${selectedCart}/`,
        postCart,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`, // example if using token
          },
          validateStatus: () => true, // prevent axios from throwing
        }
      );


      if (res.status === 200) {
        setCartDialogOpen(false);
        setSnackbar({
          open: true,
          message: '🎉 Added to cart! Ready to checkout or keep shopping?',
          severity: 'success',
        });
      } else {
        setSnackbar({
          open: true,
          message: `❌ Failed to add to cart. Status: ${res.status}`,
          severity: 'error',
        });
        setCartDialogOpen(false);
      }
    } catch (error) {
      console.error('Server is down', error);
      setSnackbar({
        open: true,
        message: '🚨 Server is down! Please try again later.',
        severity: 'error',
      });
      setCartDialogOpen(false);
    }
    finally {

      setCartLoading(false);
    }
  };


  const handlePlaceBid = async () => {
    if (parseInt(bidAmount) < product.auction.current_highest_bid) {
      setSnackbar({
        open: true,
        message: "⚠️ Your bid is below the minimum amount.",
        severity: "warning",
      });
      return;
    }

    try {
      setBidPlacedLoading(true);

      const res = await axios.post(
        `${BaseUrl}/orders/auctions/${product.auction.id}/bid/`,
        {
          productId: product.id,
          amount: parseInt(bidAmount),
          selectedOptions: selectedOptions
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          validateStatus: () => true,
        }
      );

      // 401 Unauthorized
      if (res.status === 401) {
        setSnackbar({
          open: true,
          message: "❌ Unauthorized! Please login again.",
          severity: "error",
        });
        setTimeout(() => {
          navigate("/signin");
        }, 2000);
        return;
      }

      // 200 OK
      if (res.status === 200) {
        setBidPlaced(true);
        setBidDialogOpen(false);
        setSnackbar({
          open: true,
          message: "✅ Bid placed successfully!",
          severity: "success",
        });
      } else {
        setSnackbar({
          open: true,
          message: `❌ Failed to place bid. Status: ${res.status}`,
          severity: "error",
        });
      }
    } catch (error) {
      console.error("Error while placing bid:", error);
      setSnackbar({
        open: true,
        message: "❌ Failed to place bid. Please try again.",
        severity: "error",
      });
    } finally {
      setBidPlacedLoading(false);
    }
  };




  // Add a scrollToTop handler
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

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
          src="/images/productDetailsLoader.gif"
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
          Product details are loading
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

  // if (!product) {
  //   return (
  //     <Typography sx={{ minHeight: "80vh", textAlign: "center", mt: 5, fontSize: "1.5rem", color: "gray", height: "100h" }}>
  //       Product not found.
  //     </Typography>
  //   );
  // }


  // Dynamic slider settings that update when displayedImages changes
  const getSliderSettings = () => ({
    dots: displayedImages.length > 1,
    infinite: displayedImages.length > 1, // Only infinite if more than 1 image
    speed: 500,
    slidesToShow: 1, // Show only ONE image at a time
    slidesToScroll: 1,
    arrows: displayedImages.length > 1, // Only show arrows if more than 1 image
    autoplay: false,
  });

  const handleOpenWishlistDialog = () => {
    setWishlistLoading(true);
    fetchWishlistData();

    // If no cart exists, generate a default cart name
    if (!selectedCart && carts.length === 0) {
      setNewCartName("my wishlist 1");
    }
  };

  const addToSelectedWishlists = async () => {
    try {
      console.log("Selected Wishlists:", selectedWishlists);
      setAddToWishlistLoading(true);
      const addToWishlist = {
        wishlistId: selectedWishlists,   // array or single id
        id: id,  
        name:product.name,
        price:product.price,
        image:product.image,                 // product id
        selected_options: selectedOptions // object of options
      };

      console.log("📦 Payload =>", addToWishlist);

      const res = await axios.post(
        `${BaseUrl}/wishlist/addToWishlist/${selectedWishlists}`,
        {product : addToWishlist},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}` // replace with your token
          }
        }
      );

      if (res.status === 200 || res.status === 201) {
        console.log("✅ Product added to wishlist:", res.data);
      } else if (res.status === 401) {
        navigate("/signin");  // fixed spelling
      } else {
        console.error("❌ Unexpected response:", res);
      }
    } catch (err) {
      console.error("🚨 Error while adding to wishlist:", err);
    } finally {
      setAddToWishlistLoading(false);
      setWishlistDialogOpen(false);
      setSelectedWishlists([]);
    }
  };

  const createNewWishlist = async () => {
    const trimmedName = newWishlistName.trim();
    if (!trimmedName) return;

    // Check for duplicates
    const alreadyExists = wishlists.some((w) => w.name === trimmedName);
    if (alreadyExists) {
      setTimeout(() => {
        setSnackbar({
          open: true,
          message: '⚠️ A wishlist with this name already exists! Please choose a different name.',
          severity: 'failed',
        });
      }, 200);
      return;
    }

    try {
      setCreatewishlistLoading(true);

      const res = await axios.post(
        `${BaseUrl}/wishlist/createNewWishlist`,
        { name: trimmedName },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      // Check for 401 inside try
      if (res.status === 401) {

        setSnackbar({
          open: true,
          message: '⚠️ Session expired. Please sign in again.',
          severity: 'warning',
        });
        setTimeout(() => {
          navigate("/signin");
        }, 2000);
        return;
      }

      if (res.status === 201) {
        setWishlists((prev) => [...prev, res.data.wishlist]);
        setSelectedWishlists((prev) => [...prev, res.data.wishlist.id]);
        setNewWishlistName("");
        setSnackbar({
          open: true,
          message: '✅ Wishlist created successfully!',
          severity: 'success',
        });
      }
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: '⚠️ Something went wrong while creating wishlist.',
        severity: 'failed',
      });
    } finally {
      setCreatewishlistLoading(false);
    }
  };


  return (
    <>
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
      <Box component={Paper} elevation={0} sx={{ width: '100vw', padding: { xs: 1, sm: 4, md: 8, lg: 12 }, bgcolor: theme.palette.background.paper, borderRadius: { xs: 0, md: 3 } }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <CircularProgress />
          </Box>
        ) : !product ? (
          <Box sx={{ textAlign: 'center', mt: 4, height: "80vh" }}>
            <Typography variant="h5" color="error">Product not found</Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 4 }}>
              {/* Product Images */}
              <Box sx={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
                {displayedImages && displayedImages.length > 0 ? (
                  displayedImages.length === 1 ? (
                    // Show single image without slider
                    <Box sx={{ display: "flex", justifyContent: "center", width: "90%", maxWidth: 500 }}>
                      <img
                        src={displayedImages[0]}
                        alt="Product"
                        onClick={() => handleOpen(0)}
                        style={{
                          width: "100%",
                          maxWidth: 500,
                          height: "auto",
                          objectFit: "contain",
                          backgroundColor: "inherit",
                          borderRadius: 10,
                          padding: 10,
                          cursor: "pointer",
                        }}
                      />
                    </Box>
                  ) : (
                    // Show slider for multiple images
                    <Slider 
                      {...getSliderSettings()} 
                      key={`slider-${displayedImages.length}-${displayedImages[0]}`} // Force re-render when images change
                      style={{ width: "90%", maxWidth: 500 }}
                    >
                      {displayedImages.map((image, index) => (
                        <Box key={index} sx={{ display: "flex", justifyContent: "center" }} onClick={() => handleOpen(index)}>
                          <img
                            src={image}
                            alt={`Product ${index}`}
                            style={{
                              width: "100%",
                              maxWidth: 500,
                              height: "auto",
                              objectFit: "contain",
                              backgroundColor: "inherit",
                              borderRadius: 10,
                              padding: 10,
                            }}
                          />
                        </Box>
                      ))}
                    </Slider>
                  )
                ) : (
                  <Box
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
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          mb: 2,
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <Avatar sx={{ bgcolor: "primary.main" }}>
                            {review.username.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {review.userame}
                              {review.verified && (
                                <Chip
                                  icon={<VerifiedIcon />}
                                  label="Verified Purchase"
                                  size="small"
                                  color="primary"
                                  sx={{ ml: 1 }}
                                />
                              )}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {new Date(review.date).toLocaleDateString("en-IN", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </Typography>
                          </Box>
                        </Box>
                        <Rating value={review.rating} readOnly size="small" />
                      </Box>
                      <Typography variant="h6" gutterBottom>
                        {review.title}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        {review.comment}
                      </Typography>
                    </Box>
                  ))}
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>

                  {reviews.length < product.reviewsCount && (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={AddMoreReviews}
                      disabled={showmoreReviewLoading}
                    >
                      {showmoreReviewLoading ? "Loading..." : "Show More"}
                    </Button>
                  )}
                </Box>
              </Box>
            </Box>

            {/* Usually Bought Together */}
            {boughtTogether.length > 0 && (
              <Paper elevation={4} sx={{ mt: 6, p: { xs: 2, md: 4 }, borderRadius: 4, bgcolor: theme.palette.background.paper, boxShadow: 3, maxWidth: 700, mx: 'auto' }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 3, color: theme.palette.primary.main, textAlign: 'center' }}>
                  Frequently Bought Together
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                    width: '100%',
                    flexWrap: { xs: 'wrap', sm: 'nowrap' },
                  }}
                >
                  {/* Product 1 */}
                  <Link to={`/product/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }} onClick={scrollToTop}>
                    <Box sx={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 160, maxWidth: 200, bgcolor: theme.palette.background.default, borderRadius: 3, boxShadow: 1, p: 2, border: `1px solid ${theme.palette.divider}`, transition: 'box-shadow 0.2s', cursor: 'pointer',
                      '&:hover': { boxShadow: 4, borderColor: theme.palette.primary.light },
                    }}>
                      <CardMedia
                        component="img"
                        image={product.image}
                        alt={product.name}
                        sx={{ width: 80, height: 80, objectFit: 'contain', mb: 1 }}
                      />
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
                        {product.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ₹{product.price.toLocaleString('en-IN')}
                      </Typography>
                    </Box>
                  </Link>
                  {/* Plus Icon */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', px: { xs: 30, sm: 3 } }}>
                    <Typography variant="h3" color="primary" fontWeight="bold">+</Typography>
                  </Box>
                  {/* Product 2 */}
                  <Link to={`/product/${boughtTogether[0].id}`} style={{ textDecoration: 'none', color: 'inherit' }} onClick={scrollToTop}>
                    <Box sx={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 160, maxWidth: 200, bgcolor: theme.palette.background.default, borderRadius: 3, boxShadow: 1, p: 2, border: `1px solid ${theme.palette.divider}`, transition: 'box-shadow 0.2s', cursor: 'pointer',
                      '&:hover': { boxShadow: 4, borderColor: theme.palette.primary.light },
                    }}>
                      <CardMedia
                        component="img"
                        image={boughtTogether[0].image}
                        alt={boughtTogether[0].name}
                        sx={{ width: 80, height: 80, objectFit: 'contain', mb: 1 }}
                      />
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
                    Total: ₹{(product.price + boughtTogether[0].price).toLocaleString('en-IN')}
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => { setAddBothToCart(true); handleOpenCartDialog(); }}
                    sx={{ px: 4, py: 1.5, fontWeight: 700, fontSize: '1.1rem', borderRadius: 2, boxShadow: 2, mt: 1, letterSpacing: 0.5 }}
                  >
                    Add Both to Cart
                  </Button>
                </Paper>
              </Paper>
            )}

            {/* Related Products */}
            {relatedProducts.length > 0 && (
              <Box sx={{ mt: 6 }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ color: theme.palette.text.primary }}>
                  Related Products
                </Typography>
                <Grid container spacing={3}>
                  {relatedProducts.slice(0, relatedProducts.length).map((relatedProduct) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={relatedProduct.id}>
                      <Card
                        component={Link}
                        to={`/product/${relatedProduct.id}`}
                        onClick={scrollToTop}
                        sx={{
                          textDecoration: 'none',
                          height: 380,
                          width: {
                            xs: "40vw",  // extra-small screen (mobile)
                            sm: "27vw",  // small screen (tablet)
                            md: "25vw",  // medium screen (laptop)
                            lg: "23vw",  // large screen (desktop)
                            xl: "20vw",  // extra-large screen
                          },
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'flex-start',
                          alignItems: 'center',
                          transition: 'transform 0.2s',
                          bgcolor: theme.palette.background.paper,
                          color: theme.palette.text.primary,
                          '&:hover': { transform: 'translateY(-4px)' },
                        }}
                      >
                        <CardMedia
                          component="img"
                          image={relatedProduct.image}
                          alt={relatedProduct.name}
                          sx={{
                            width: '100%',
                            height: 180,
                            objectFit: 'contain',
                            p: 2,
                            mb: 1,
                            bgcolor: theme.palette.background.default,
                          }}
                        />
                        <CardContent sx={{ flexGrow: 1, width: '100%', p: 2 }}>
                          <Typography variant="subtitle1" fontWeight="bold" noWrap sx={{ color: theme.palette.text.primary }}>
                            {relatedProduct.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {relatedProduct.brand}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Rating value={relatedProduct.rating} precision={0.5} readOnly size="small" />
                            <Typography variant="body2">({relatedProduct.rating})</Typography>
                          </Box>
                          <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                            ₹{relatedProduct.price.toLocaleString('en-IN')}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  {relatedProducts.length < product.RelatedCount && (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={addMoreRelatedProduct}
                      disabled={showmoreRPLoading}
                    >
                      {showmoreRPLoading ? "Loading..." : "Show More"}
                    </Button>
                  )}

                </Box>

              </Box>
            )}
          </>
        )}

        {/* Cart Dialog */}
        <Dialog
          open={cartDialogOpen}
          onClose={() => setCartDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{
            py: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <ShoppingCartIcon />
            Add to Cart
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Box sx={{
              mb: 3,
              borderBottom: '1px solid',
              borderColor: 'divider',
              pb: 2
            }}>
              <Typography variant="h6" gutterBottom sx={{ mt: 1 }}>
                {product?.name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Rating value={product?.rating} precision={0.1} readOnly size="small" />
                <Typography variant="body2" color="text.secondary">({product?.rating})</Typography>
              </Box>
              <Typography variant="h6" color="primary.main">
                ₹{product?.price.toLocaleString('en-IN')}
              </Typography>
            </Box>

            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Select Cart
            </Typography>
            <Box
              sx={{
                maxHeight: 200,
                overflow: 'auto',
                borderBottom: '1px solid',
                borderColor: 'divider',
                pb: 2,
                mb: 2
              }}
            >
              {carts.length > 0 ? (
                carts.map((cart) => (
                  <FormControlLabel
                    key={cart.id}
                    control={
                      <Checkbox
                        checked={selectedCart === cart.id}
                        onChange={() => setSelectedCart(cart.id)}
                        color="primary"
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <Typography color="text.primary">{cart?.name || ""}</Typography>
                       
                      </Box>
                    }
                    sx={{
                      width: '100%',
                      m: 0.5,
                      p: 1,
                      borderRadius: 1,
                      '&:hover': {
                        bgcolor: 'action.hover'
                      }
                    }}
                  />
                ))
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                  No carts available. Create a new one below.
                </Typography>
              )}
            </Box>


            <Box sx={{
              mb: 3,
              p: 2,
              bgcolor: 'background.default',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider'
            }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="text.primary">
                Create New Cart
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  label="Cart Name"
                  fullWidth
                  variant="outlined"
                  value={newCartName}
                  onChange={(e) => setNewCartName(e.target.value)}
                  size="small"
                  placeholder={"create New Cart"}
                />
                <Button
                  onClick={createNewCart}
                  variant="contained"
                  color="primary"
                  disabled={loadingNewCart || !newCartName.trim()}
                >
                  {loadingNewCart ? "Creating..." : "Create"}
                </Button>
              </Box>
            </Box>

            <Box sx={{
              mb: 2,
              p: 2,
              bgcolor: 'background.default',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider'
            }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="text.primary">
                Quantity
              </Typography>
              <Select
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                fullWidth
                size="small"
              >
                {[...Array(10)].map((_, i) => (
                  <MenuItem key={i + 1} value={i + 1}>{i + 1}</MenuItem>
                ))}
              </Select>
            </Box>
          </DialogContent>
          <DialogActions sx={{
            p: 2,
            pt: 0,
            bgcolor: 'background.paper',
            borderTop: '1px solid',
            borderColor: 'divider',
            gap: 1
          }}>
            <Button
              onClick={() => setCartDialogOpen(false)}
              color="inherit"
              variant="outlined"
              sx={{ mt: 1 }}
            >
              Cancel
            </Button>
            <Button
              onClick={addToSelectedCart}
              variant="contained"
              color="primary"
              disabled={!selectedCart || cartLoading}
              sx={{ mt: 1 }}
            >
              {cartLoading ? <ShoppingCartIcon /> : "Add to Cart"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* review Dialog */}
        <Dialog
          open={reviewDialogOpen}
          onClose={() => setReviewDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{
            py: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <RateReviewIcon />
            Post
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Box sx={{
              mb: 3,
              borderBottom: '1px solid',
              borderColor: 'divider',
              pb: 2
            }}>
              <Typography variant="h6" gutterBottom sx={{ mt: 1 }}>
                {product?.name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Rating value={product?.rating} precision={0.1} readOnly size="small" />
                <Typography variant="body2" color="text.secondary">({product?.rating})</Typography>
              </Box>
              <Typography variant="h6" color="primary.main">
                ₹{product?.price.toLocaleString('en-IN')}
              </Typography>
            </Box>

            {/* ⭐ Add User Rating Here */}
            <Box sx={{
              mb: 3,
              p: 2,
              bgcolor: 'background.default',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider'
            }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="text.primary">
                Your Rating
              </Typography>
              <Rating
                name="user-rating"
                value={newRating}
                onChange={(event, newValue) => {
                  setNewRating(newValue);
                }}
                precision={1}
                size="large"
              />

              <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="text.primary" sx={{ mt: 2 }}>
                Subject
              </Typography>
              <TextField
                label="Enter"
                fullWidth
                variant="outlined"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                size="small"
                placeholder="Great product, highly recommend!"
              />

              <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="text.primary" sx={{ mt: 2 }}>
                Comment
              </Typography>
              <TextField
                fullWidth
                variant="outlined"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                size="medium"
                multiline
                rows={3}
                placeholder="Write your experience here..."
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{
            p: 2,
            pt: 0,
            bgcolor: 'background.paper',
            borderTop: '1px solid',
            borderColor: 'divider',
            gap: 1
          }}>
            <Button
              onClick={() => setReviewDialogOpen(false)}
              color="inherit"
              variant="outlined"
              sx={{ mt: 1 }}
            >
              Cancel
            </Button>
            <Button
              onClick={postReview}
              variant="contained"
              color="primary"
              disabled={(newComment.length > 0 && newTitle.length > 0 && newRating > 0) ? false : true}
              sx={{ mt: 1 }}
            >
              Post
            </Button>
          </DialogActions>
        </Dialog>


        {/* Wishlist Dialog */}
        <Dialog
          open={wishlistDialogOpen}
          onClose={() => setWishlistDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{
            py: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <FavoriteIcon />
            Add to Wishlist
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Box sx={{
              mb: 3,
              borderBottom: '1px solid',
              borderColor: 'divider',
              pb: 2
            }}>
              <Typography variant="h6" gutterBottom sx={{ mt: 1 }}>
                {product?.name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Rating value={product?.rating} precision={0.1} readOnly size="small" />
                <Typography variant="body2" color="text.secondary">({product?.rating})</Typography>
              </Box>
              <Typography variant="h6" color="primary.main">
                ₹{product?.price.toLocaleString('en-IN')}
              </Typography>
            </Box>

            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Select Wishlists
            </Typography>
            <Box
              sx={{
                maxHeight: 200,
                overflow: "auto",
                borderBottom: "1px solid",
                borderColor: "divider",
                pb: 2,
                mb: 2
              }}
            >
              {wishlists.length > 0 ? (
                wishlists.map((wishlist) => (
                  <FormControlLabel
                    key={wishlist.id}
                    control={
                      <Checkbox
                        checked={selectedWishlists.includes(wishlist.id)}
                        onChange={() =>
                          setSelectedWishlists((prev) =>
                            prev.includes(wishlist.id)
                              ? prev.filter((id) => id !== wishlist.id)
                              : [...prev, wishlist.id]
                          )
                        }
                        color="secondary"
                      />
                    }
                    label={
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          width: "100%"
                        }}
                      >
                        <Typography color="text.primary">{wishlist.name}</Typography>
                        <Typography color="text.secondary">
                          {wishlist.product?.some((p) => p.id === id)
                            ? "Already present"
                            : ""}
                        </Typography>
                      </Box>
                    }
                    sx={{
                      width: "100%",
                      m: 0.5,
                      p: 1,
                      borderRadius: 1,
                      "&:hover": {
                        bgcolor: "action.hover"
                      }
                    }}
                  />
                ))
              ) : (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ p: 2, textAlign: "center" }}
                >
                  No wishlists available. Create a new one below.
                </Typography>
              )}
            </Box>

            <Box sx={{
              mb: 2,
              p: 2,
              bgcolor: 'background.default',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider'
            }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="text.primary">
                Create New Wishlist
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  label="Wishlist Name"
                  fullWidth
                  variant="outlined"
                  value={newWishlistName}
                  onChange={(e) => setNewWishlistName(e.target.value)}
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: 'divider' },
                      '&:hover fieldset': { borderColor: 'secondary.main' },
                      '&.Mui-focused fieldset': { borderColor: 'secondary.main' }
                    }
                  }}
                />
                <Button
                  onClick={createNewWishlist}
                  variant="contained"
                  color="secondary"
                  disabled={!newWishlistName.trim() || createwishlistLoading}
                  sx={{
                    bgcolor: 'secondary.main',
                    '&:hover': {
                      bgcolor: 'secondary.dark'
                    },
                    minWidth: "90px" // keeps size consistent when loader replaces text
                  }}
                >
                  {createwishlistLoading ? (
                    <CircularProgress size={20} color="secondary" />
                  ) : (
                    "Create"
                  )}
                </Button>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{
            p: 2,
            pt: 1,
            bgcolor: 'background.paper',
            borderTop: '1px solid',
            borderColor: 'divider',
            gap: 1,
          }}>
            <Button
              onClick={() => setWishlistDialogOpen(false)}
              color="inherit"
              variant="outlined"
              sx={{
                borderColor: 'divider',
                color: 'text.primary',
                '&:hover': {
                  borderColor: 'secondary.main',
                  bgcolor: 'action.hover',
                }
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={addToSelectedWishlists}
              variant="contained"
              color="secondary"
              disabled={selectedWishlists.length === 0 || addToWishlistLoading}
              sx={{
                bgcolor: 'secondary.main',
                '&:hover': {
                  bgcolor: 'secondary.dark',
                },
                minWidth: '130px', // to keep button size stable
              }}
            >
              {addToWishlistLoading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                "Add to Wishlist"
              )}
            </Button>

          </DialogActions>
        </Dialog>

        {/* Biding Dialog */}
        {product?.is_auction && (
        <Dialog
          open={bidDialogOpen}
          onClose={() => setBidDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{
            py: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <GavelIcon />
            Bid  
             <Typography variant="h6" gutterBottom sx={{ mt: 1 }}>
                Time : {timeLeft}
              </Typography>
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Box sx={{
              mb: 3,
              borderBottom: '1px solid',
              borderColor: 'divider',
              pb: 2
            }}>
              <Typography variant="h6" gutterBottom sx={{ mt: 1 }}>
                {product?.name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Rating value={product?.rating} precision={0.1} readOnly size="small" />
                <Typography variant="body2" color="text.secondary">({product?.rating})</Typography>
              </Box>
              <Typography variant="h6" color="primary">
                Current Bid: ₹{product.auction.current_highest_bid.toLocaleString('en-IN')}
              </Typography>
              <Chip
                label={`${ product.auction.total_bids || 0} bids`}
                color="primary"
                variant="outlined"
                size="small"
              />
            </Box>

            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Last Biding
            </Typography>
            {/* <Box
              sx={{
                maxHeight: 200,
                overflow: "auto",
                borderBottom: "1px solid",
                borderColor: "divider",
                pb: 2,
                mb: 2
              }}
            >
              {bidPlaced ? (
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  {prevBid}
                </Typography>
              ) : (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ p: 2, textAlign: "center" }}
                >
                  No bids have been submitted at this time.
                </Typography>
              )}
            </Box> */}

            <Box sx={{
              mb: 2,
              p: 2,
              bgcolor: 'background.default',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider'
            }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="text.primary">
                Place Bid Amount (₹)
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  label="Bid amount"
                  fullWidth
                  variant="outlined"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: 'divider' },
                      '&:hover fieldset': { borderColor: 'secondary.main' },
                      '&.Mui-focused fieldset': { borderColor: 'secondary.main' }
                    }
                  }}
                />

              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{
            p: 2,
            pt: 1,
            bgcolor: 'background.paper',
            borderTop: '1px solid',
            borderColor: 'divider',
            gap: 1,
          }}>
            <Button
              onClick={() => setBidDialogOpen(false)}
              color="inherit"
              variant="outlined"
              sx={{
                borderColor: 'divider',
                color: 'text.primary',
                '&:hover': {
                  borderColor: 'secondary.main',
                  bgcolor: 'action.hover',
                }
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePlaceBid}
              variant="contained"
              color="primary"
              disabled={!bidAmount.trim() || bidPlacedLoading}
              sx={{
                bgcolor: 'secondary.main',
                '&:hover': {
                  bgcolor: 'secondary.dark'
                },
                minWidth: "90px" // keeps size consistent when loader replaces text
              }}
            >
              {createwishlistLoading ? (
                <CircularProgress size={20} color="secondary" />
              ) : (
                "Place Bid "
              )}
            </Button>

          </DialogActions>
        </Dialog>)}

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
              bgcolor: '#fff',
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

        {/* Fullscreen Dialog */}
        <Dialog
          open={open}
          onClose={handleClose}
          fullWidth
          maxWidth="lg"
          PaperProps={{
            sx: {
              width: "80vw",
              height: "80vh",
              borderRadius: 2,
              position: "relative",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            },
          }}
        >
          {/* Close Button */}
          <IconButton
            onClick={handleClose}
            sx={{ position: "absolute", top: 10, right: 10, bgcolor: "red" }}
          >
            <CloseIcon />
          </IconButton>

          {/* Prev Button */}
          <IconButton
            onClick={handlePrev}
            sx={{
              position: "absolute",
              left: 20,
              top: "50%",
              transform: "translateY(-50%)",
              bgcolor: "grey",
            }}
          >
            <ArrowBackIosNewIcon />
          </IconButton>

          {/* Next Button */}
          <IconButton
            onClick={handleNext}
            sx={{
              position: "absolute",
              right: 20,
              top: "50%",
              transform: "translateY(-50%)",
              bgcolor: "grey",
            }}
          >
            <ArrowForwardIosIcon />
          </IconButton>

          <DialogContent sx={{ p: 0, display: "flex", justifyContent: "center" }}>
            <img
              src={displayedImages[currentIndex]}
              alt={`Large Product ${currentIndex}`}
              style={{
                maxWidth: "100%",
                maxHeight: "75vh",
                objectFit: "contain",
                borderRadius: 10,
              }}
            />
          </DialogContent>
        </Dialog>

      </Box>
      <Footer />
    </>
  );
};

export default ProductDetails;
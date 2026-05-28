import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Container,
  Rating,
  Skeleton,
  Slider,
  Stack,
  TextField,
  Typography,
  Paper,
  InputAdornment,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  CircularProgress
} from "@mui/material";
import Grid from "@mui/material/Grid";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useTheme } from "@mui/material/styles";
import {
  fetchLiveProducts,
  fetchLiveCategories,
  fetchLiveSuggestions
} from "../../services/liveProductService";
import { addToCart } from "../../services/commerceService";
import { handleImageFallback } from "../../utils/images";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

const LiveMarketplace = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  // Product Listings State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [priceRange, setPriceRange] = useState([0, 150000]);
  const [page, setPage] = useState(1);
  const [addingCartId, setAddingCartId] = useState(null);

  // Search Suggestions state
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  const limit = 8;
  const suggestionRef = useRef(null);

  // Fetch Categories on mount
  useEffect(() => {
    fetchLiveCategories().then((cats) => {
      setCategories([{ slug: "all", name: "All Categories" }, ...cats]);
    });
  }, []);

  // Fetch Products based on search, category, page, and price range
  const loadProducts = useCallback(async (isAppend = false) => {
    if (!isAppend) setLoading(true);
    
    try {
      const skip = isAppend ? products.length : 0;
      const res = await fetchLiveProducts({
        search: searchQuery,
        category: category,
        minPrice: priceRange[0],
        maxPrice: priceRange[1],
        limit: limit,
        skip: skip
      });

      setProducts((prev) => (isAppend ? [...prev, ...res.products] : res.products));
      setTotal(res.total);
    } catch (err) {
      console.error("Error loading live marketplace:", err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, category, priceRange, products.length]);

  // Initial and reactive load (debounced for search and price range)
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadProducts(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, category, priceRange]);

  // Fetch search suggestions with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSuggestionsLoading(true);
      const res = await fetchLiveSuggestions(searchQuery);
      setSuggestions(res);
      setSuggestionsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside suggestions list to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLoadMore = () => {
    setPage((prev) => prev + 1);
    loadProducts(true);
  };

  const handleAddToCart = async (e, prod) => {
    e.stopPropagation();
    setAddingCartId(prod.id);
    try {
      await addToCart({
        productId: prod.id,
        quantity: 1,
        selectedOptions: {},
        name: prod.name,
        price: prod.discount_price || prod.price,
        image: prod.image,
        is_live: true
      });
      window.dispatchEvent(new Event("storage"));
    } catch (err) {
      console.error("Could not add to cart:", err);
    } finally {
      setAddingCartId(null);
    }
  };

  return (
    <Box
      component="section"
      sx={{
        py: { xs: 4, md: 8 },
        background: isDarkMode
          ? "linear-gradient(180deg, #11141e 0%, #171c2a 100%)"
          : "linear-gradient(180deg, #f7fafc 0%, #edf2f7 100%)",
        borderRadius: 4,
        px: { xs: 2, md: 4 },
        mb: 6,
        boxShadow: "inset 0 1px 3px rgba(0,0,0,0.05)"
      }}
    >
      <Container maxWidth="xl">
        {/* Header Block */}
        <Stack spacing={1} sx={{ mb: 4, textAlign: "center" }}>
          <Typography
            variant="overline"
            fontWeight={800}
            color="primary.main"
            sx={{ letterSpacing: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}
          >
            <ShoppingBagIcon fontSize="small" /> LIVE STOREFRONT
          </Typography>
          <Typography
            variant="h3"
            fontWeight={900}
            sx={{
              fontSize: { xs: 28, md: 42 },
              background: "linear-gradient(90deg, #1976d2, #9c27b0)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}
          >
            Global Live Products Marketplace
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: "auto" }}>
            Dynamically streaming fresh arrivals from verified international sellers. Find real-time deals in seconds.
          </Typography>
        </Stack>

        {/* Filter Controls Row */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Search Box */}
          <Grid size={{ xs: 12, md: 5 }} sx={{ position: "relative" }} ref={suggestionRef}>
            <TextField
              fullWidth
              placeholder="Search live marketplace..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchQuery("")}>
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 3,
                  bgcolor: isDarkMode ? "background.paper" : "#fff",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
                }
              }}
            />

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <Paper
                elevation={6}
                sx={{
                  position: "absolute",
                  top: "105%",
                  left: 24,
                  right: 0,
                  zIndex: 200,
                  borderRadius: 2,
                  maxHeight: 250,
                  overflowY: "auto"
                }}
              >
                <List dense>
                  {suggestions.map((sug, idx) => (
                    <ListItemButton
                      key={idx}
                      onClick={() => {
                        setSearchQuery(sug);
                        setShowSuggestions(false);
                      }}
                    >
                      <ListItemText primary={sug} />
                    </ListItemButton>
                  ))}
                </List>
              </Paper>
            )}
          </Grid>

          {/* Category Chips Scroll */}
          <Grid size={{ xs: 12, md: 7 }} sx={{ display: "flex", alignItems: "center" }}>
            <Box
              sx={{
                display: "flex",
                gap: 1,
                overflowX: "auto",
                width: "100%",
                py: 0.5,
                scrollbarWidth: "none",
                "&::-webkit-scrollbar": { display: "none" }
              }}
            >
              {categories.map((cat) => (
                <Chip
                  key={cat.slug}
                  label={cat.name}
                  clickable
                  color={category === cat.slug ? "primary" : "default"}
                  onClick={() => setCategory(cat.slug)}
                  sx={{
                    fontWeight: 600,
                    px: 1,
                    py: 2,
                    borderRadius: 2.5,
                    bgcolor: category === cat.slug ? undefined : isDarkMode ? "background.paper" : "#fff",
                    boxShadow: category === cat.slug ? "0 4px 12px rgba(25, 118, 210, 0.2)" : "0 2px 6px rgba(0,0,0,0.03)"
                  }}
                />
              ))}
            </Box>
          </Grid>

          {/* Price Range Slider */}
          <Grid size={12} sx={{ mt: 1 }}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 3,
                bgcolor: isDarkMode ? "background.paper" : "#fff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
              }}
            >
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, color: "text.primary" }}>
                Filter by Price Range
              </Typography>
              <Box sx={{ px: 2 }}>
                <Slider
                  value={priceRange}
                  onChange={(e, val) => setPriceRange(val)}
                  valueLabelDisplay="auto"
                  min={0}
                  max={200000}
                  step={5000}
                  valueLabelFormat={(v) => `₹${v}`}
                />
                <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">Min: ₹0</Typography>
                  <Typography variant="body2" fontWeight={800} color="primary">₹{priceRange[0]} - ₹{priceRange[1]}</Typography>
                  <Typography variant="caption" color="text.secondary">Max: ₹2,00,000</Typography>
                </Stack>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Responsive Grid of Cards */}
        {loading && products.length === 0 ? (
          <Grid container spacing={3}>
            {Array.from({ length: 8 }).map((_, idx) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={idx}>
                <Skeleton variant="rounded" height={360} sx={{ borderRadius: 3 }} />
              </Grid>
            ))}
          </Grid>
        ) : products.length === 0 ? (
          <Paper
            sx={{
              py: 8,
              textAlign: "center",
              borderRadius: 3,
              bgcolor: isDarkMode ? "background.paper" : "#fff"
            }}
          >
            <Typography variant="h6" color="text.secondary">
              No live products match your criteria.
            </Typography>
            <Button variant="outlined" sx={{ mt: 2 }} onClick={() => { setSearchQuery(""); setCategory("all"); setPriceRange([0, 150000]); }}>
              Reset Filters
            </Button>
          </Paper>
        ) : (
          <>
            <Grid container spacing={3}>
              {products.map((prod) => (
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={prod.id}>
                  <Card
                    onClick={() => navigate(`/product/${prod.id}`)}
                    sx={{
                      cursor: "pointer",
                      height: "100%",
                      borderRadius: 3,
                      display: "flex",
                      flexDirection: "column",
                      position: "relative",
                      transition: "transform 220ms ease, box-shadow 220ms ease",
                      border: `1px solid ${isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)"}`,
                      bgcolor: isDarkMode ? "background.paper" : "#fff",
                      "&:hover": {
                        transform: "translateY(-6px)",
                        boxShadow: "0 12px 24px rgba(0,0,0,0.12)"
                      }
                    }}
                  >
                    {/* Discount badge */}
                    {prod.discountPercentage && (
                      <Chip
                        size="small"
                        label={`${Math.round(prod.discountPercentage)}% OFF`}
                        color="error"
                        sx={{
                          position: "absolute",
                          top: 12,
                          left: 12,
                          zIndex: 10,
                          fontWeight: 800,
                          fontSize: "0.75rem"
                        }}
                      />
                    )}

                    {/* Stock badge */}
                    <Chip
                      size="small"
                      label={prod.stock <= 5 ? "Low Stock" : "In Stock"}
                      color={prod.stock <= 5 ? "warning" : "success"}
                      sx={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        zIndex: 10,
                        fontWeight: 700,
                        fontSize: "0.7rem",
                        height: 20
                      }}
                    />

                    {/* Product Image */}
                    <CardMedia
                      component="img"
                      image={prod.image || "/images/headphones.jpg"}
                      alt={prod.name}
                      loading="lazy"
                      onError={handleImageFallback}
                      sx={{
                        height: 200,
                        objectFit: "contain",
                        bgcolor: isDarkMode ? "#1d2433" : "#f7fafc",
                        p: 2
                      }}
                    />

                    <CardContent sx={{ p: 2, flexGrow: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                      <Box>
                        {/* Category & Seller */}
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                          <Typography variant="caption" color="primary.main" fontWeight="bold" sx={{ textTransform: "uppercase" }}>
                            {prod.category}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {prod.seller}
                          </Typography>
                        </Stack>

                        {/* Title */}
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ lineClamp: 2, display: "-webkit-box", overflow: "hidden", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", minHeight: "2.8em" }}>
                          {prod.name}
                        </Typography>

                        {/* Ratings */}
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1 }}>
                          <Rating value={prod.rating} precision={0.1} size="small" readOnly />
                          <Typography variant="caption" fontWeight="bold">
                            {prod.rating}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Pricing, Shipping, Cart Trigger */}
                      <Box sx={{ mt: 2 }}>
                        {/* Price */}
                        <Stack direction="row" alignItems="baseline" spacing={1}>
                          <Typography variant="h6" fontWeight="extrabold">
                            {currency.format(prod.discount_price || prod.price)}
                          </Typography>
                          {prod.discount_price && (
                            <Typography variant="caption" color="text.secondary" sx={{ textDecoration: "line-through" }}>
                              {currency.format(prod.price)}
                            </Typography>
                          )}
                        </Stack>

                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                          {prod.shippingInformation}
                        </Typography>

                        {/* CTA button */}
                        <Button
                          fullWidth
                          variant="contained"
                          color="primary"
                          startIcon={addingCartId === prod.id ? <CircularProgress size={16} color="inherit" /> : <AddShoppingCartIcon />}
                          disabled={addingCartId === prod.id}
                          onClick={(e) => handleAddToCart(e, prod)}
                          sx={{
                            mt: 2,
                            borderRadius: 2,
                            textTransform: "none",
                            fontWeight: "bold",
                            boxShadow: "none",
                            "&:hover": { boxShadow: "none" }
                          }}
                        >
                          {addingCartId === prod.id ? "Adding..." : "Add to Cart"}
                        </Button>
                      </Box>

                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Pagination Load More */}
            {products.length < total && (
              <Box sx={{ textAlign: "center", mt: 6 }}>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={handleLoadMore}
                  disabled={loading}
                  endIcon={loading ? <CircularProgress size={20} /> : <ArrowForwardIcon />}
                  sx={{
                    px: 4,
                    py: 1.2,
                    borderRadius: 3,
                    fontWeight: "bold",
                    borderWidth: 2,
                    "&:hover": { borderWidth: 2 }
                  }}
                >
                  {loading ? "Loading..." : "Load More Products"}
                </Button>
              </Box>
            )}
          </>
        )}
      </Container>
    </Box>
  );
};

export default LiveMarketplace;

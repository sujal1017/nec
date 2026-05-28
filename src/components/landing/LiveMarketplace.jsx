import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Grid,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Skeleton,
  Slider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import { useTheme } from "@mui/material/styles";
import EcommerceProductCard from "../product/EcommerceProductCard";
import {
  fetchLiveCategories,
  fetchLiveProducts,
  fetchLiveSuggestions,
} from "../../services/liveProductService";

const LIMIT = 8;

const LiveMarketplace = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const suggestionRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [priceRange, setPriceRange] = useState([0, 150000]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  useEffect(() => {
    fetchLiveCategories().then((cats) => {
      setCategories([{ slug: "all", name: "All" }, ...cats]);
    });
  }, []);

  const loadProducts = useCallback(
    async (append = false, skipCount = 0) => {
      if (!append) setLoading(true);

      try {
        const res = await fetchLiveProducts({
          search: searchQuery,
          category,
          minPrice: priceRange[0],
          maxPrice: priceRange[1],
          limit: LIMIT,
          skip: append ? skipCount : 0,
        });

        setProducts((prev) => (append ? [...prev, ...res.products] : res.products));
        setTotal(res.total);
      } catch (error) {
        console.error("Error loading live marketplace:", error);
      } finally {
        setLoading(false);
      }
    },
    [category, priceRange, searchQuery],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => loadProducts(false), 350);
    return () => window.clearTimeout(timer);
  }, [loadProducts]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      setSuggestionsLoading(true);
      setSuggestions(await fetchLiveSuggestions(searchQuery));
      setSuggestionsLoading(false);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const resetFilters = () => {
    setSearchQuery("");
    setCategory("all");
    setPriceRange([0, 150000]);
  };

  return (
    <Box
      component="section"
      sx={{
        py: { xs: 2, md: 2.5 },
        px: { xs: 1.25, md: 2 },
        my: { xs: 1.5, md: 2 },
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
      }}
    >
      <Container maxWidth="xl" disableGutters>
        <Stack spacing={0.75} sx={{ mb: 2 }}>
          <Typography
            variant="overline"
            fontWeight={900}
            color="primary.main"
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <ShoppingBagIcon fontSize="small" /> Live storefront
          </Typography>
          <Typography variant="h6" fontWeight={950} sx={{ fontSize: { xs: 18, md: 22 }, lineHeight: 1.15 }}>
            Live Products Marketplace
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 760 }}>
            Fresh arrivals from verified marketplace sellers with search, categories, price filters, and real-time deal browsing.
          </Typography>
        </Stack>

        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12, md: 5 }} sx={{ position: "relative" }} ref={suggestionRef}>
            <TextField
              fullWidth
              placeholder="Search live marketplace"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    {suggestionsLoading ? <CircularProgress size={18} /> : null}
                    {searchQuery ? (
                      <IconButton size="small" onClick={() => setSearchQuery("")}>
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    ) : null}
                  </InputAdornment>
                ),
              }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1, bgcolor: isDarkMode ? "background.default" : "#fff" } }}
            />

            {showSuggestions && suggestions.length > 0 ? (
              <Paper
                elevation={8}
                sx={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  left: 0,
                  right: 0,
                  zIndex: 200,
                  borderRadius: 1,
                  overflow: "hidden",
                }}
              >
                <List dense disablePadding>
                  {suggestions.map((suggestion) => (
                    <ListItemButton
                      key={suggestion}
                      onClick={() => {
                        setSearchQuery(suggestion);
                        setShowSuggestions(false);
                      }}
                    >
                      <ListItemText primary={suggestion} />
                    </ListItemButton>
                  ))}
                </List>
              </Paper>
            ) : null}
          </Grid>

          <Grid size={{ xs: 12, md: 7 }} sx={{ display: "flex", alignItems: "center" }}>
            <Box
              sx={{
                display: "flex",
                gap: 1,
                overflowX: "auto",
                width: "100%",
                py: 0.5,
                scrollbarWidth: "thin",
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
                    height: 32,
                    borderRadius: 1,
                    fontWeight: 800,
                    bgcolor: category === cat.slug ? undefined : isDarkMode ? "background.default" : "#f8fafc",
                  }}
                />
              ))}
            </Box>
          </Grid>

          <Grid size={12}>
            <Paper
              variant="outlined"
              sx={{
                p: { xs: 1.25, md: 1.5 },
                borderRadius: 1,
                bgcolor: isDarkMode ? "background.default" : "#f8fafc",
              }}
            >
              <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
                <Typography variant="subtitle2" fontWeight={900} sx={{ minWidth: 130 }}>
                  Price range
                </Typography>
                <Box sx={{ flex: 1, px: { xs: 1, md: 2 } }}>
                  <Slider
                    value={priceRange}
                    onChange={(_, value) => setPriceRange(value)}
                    valueLabelDisplay="auto"
                    min={0}
                    max={200000}
                    step={5000}
                    valueLabelFormat={(value) => `Rs ${Number(value).toLocaleString("en-IN")}`}
                  />
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">Rs 0</Typography>
                    <Typography variant="caption" color="text.secondary">Rs 2,00,000</Typography>
                  </Stack>
                </Box>
                <Typography variant="body2" fontWeight={900} color="primary.main" sx={{ minWidth: 190, textAlign: { md: "right" } }}>
                  Rs {priceRange[0].toLocaleString("en-IN")} - Rs {priceRange[1].toLocaleString("en-IN")}
                </Typography>
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {loading && products.length === 0 ? (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
              gap: 1.5,
            }}
          >
            {Array.from({ length: LIMIT }).map((_, index) => (
              <Skeleton key={index} variant="rounded" height={354} sx={{ width: "100%", borderRadius: 1 }} />
            ))}
          </Box>
        ) : products.length === 0 ? (
          <Paper sx={{ py: 7, textAlign: "center", borderRadius: 1, bgcolor: isDarkMode ? "background.default" : "#f8fafc" }}>
            <Typography variant="h6" color="text.secondary">
              No live products match your filters.
            </Typography>
            <Button variant="outlined" sx={{ mt: 2, borderRadius: 1, fontWeight: 900 }} onClick={resetFilters}>
              Reset filters
            </Button>
          </Paper>
        ) : (
          <>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
                gap: 1.5,
                alignItems: "stretch",
              }}
            >
              {products.map((product) => (
                <Box key={product.id}>
                  <EcommerceProductCard product={product} />
                </Box>
              ))}
            </Box>

            {products.length < total ? (
              <Box sx={{ textAlign: "center", mt: 4 }}>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => loadProducts(true, products.length)}
                  disabled={loading}
                  endIcon={loading ? <CircularProgress size={20} /> : <ArrowForwardIcon />}
                  sx={{ px: 4, borderRadius: 1, fontWeight: 900 }}
                >
                  {loading ? "Loading..." : "Load more products"}
                </Button>
              </Box>
            ) : null}
          </>
        )}
      </Container>
    </Box>
  );
};

export default LiveMarketplace;

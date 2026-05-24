import React, { useEffect, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardMedia,
  CardContent,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  Grid,
  useTheme,
  useMediaQuery,
  Slider,
  Divider,
  Collapse,
  IconButton,
  Button,
  Stack,
  Chip,
  Paper,
} from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const ProductListing = ({ darkMode, setDarkMode }) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: [],
    priceRange: [0, 200000],
    brand: [],
    rating: [],
    availability: [],
  });
  const [expandedFilters, setExpandedFilters] = useState({
    category: true,
    price: true,
    brand: true,
    rating: true,
    availability: true,
  });
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [suggestion, setSuggestion] = useState("");
  const [optionFilters, setOptionFilters] = useState({});
  const [selectedOptions, setSelectedOptions] = useState({});

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const searchQuery = searchParams.get("search")?.toLowerCase() || "";
  const categoryFromURL = searchParams.get("category") || "";
  const productContainerRef = useRef(null);
  const navigate = useNavigate();

  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  // Fetch products data
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/data/products.json");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Fetched products:", data); // Debug log
        setProducts(data);
        setFilteredProducts(data);
      } catch (error) {
        console.error("Error fetching products:", error);
        setError("Failed to load products. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Update optionFilters whenever filteredProducts change (not products)
  useEffect(() => {
    const optionMap = {};
    filteredProducts.forEach(product => {
      if (product.options) {
        Object.entries(product.options).forEach(([key, values]) => {
          if (!optionMap[key]) optionMap[key] = new Set();
          values.forEach(v => optionMap[key].add(v));
        });
      }
    });
    // Convert sets to arrays
    const result = {};
    Object.entries(optionMap).forEach(([k, v]) => { result[k] = Array.from(v); });
    setOptionFilters(result);
  }, [filteredProducts]);

  // Apply filters
  useEffect(() => {
    if (products.length === 0) return;

    console.log("Applying filters with:", { // Debug log
      products: products.length,
      searchQuery,
      categoryFromURL,
      filters
    });

    let filtered = [...products];

    // Apply search query filter
    if (searchQuery) {
      filtered = filtered.filter(product => {
        const matches = 
          product.name.toLowerCase().includes(searchQuery) ||
          (product.description && product.description.toLowerCase().includes(searchQuery));
        console.log("Search filter:", product.name, matches); // Debug log
        return matches;
      });
    }

    // Apply category filter
    if (categoryFromURL) {
      filtered = filtered.filter(product => {
        const matches = product.category.toLowerCase() === categoryFromURL.toLowerCase();
        console.log("Category filter:", product.category, matches); // Debug log
        return matches;
      });
    }

    // Apply category filters
    if (filters.category.length > 0) {
      filtered = filtered.filter(product => {
        const matches = filters.category.includes(product.category);
        console.log("Categories filter:", product.category, matches); // Debug log
        return matches;
      });
    }

    // Apply price range filter
    if (filters.priceRange) {
      filtered = filtered.filter(product => {
        const matches = product.price >= filters.priceRange[0] && product.price <= filters.priceRange[1];
        console.log("Price filter:", product.price, matches); // Debug log
        return matches;
      });
    }

    // Apply brand filters
    if (filters.brand.length > 0) {
      filtered = filtered.filter(product => {
        const matches = filters.brand.includes(product.brand);
        console.log("Brand filter:", product.brand, matches); // Debug log
        return matches;
      });
    }

    // Apply rating filters
    if (filters.rating.length > 0) {
      filtered = filtered.filter(product => {
        const matches = filters.rating.some(rating => {
          const minRating = parseFloat(rating.split(" ")[0]);
          return product.rating >= minRating;
        });
        console.log("Rating filter:", product.rating, matches); // Debug log
        return matches;
      });
    }

    // Apply availability filter
    if (filters.availability.length > 0) {
      filtered = filtered.filter(product => {
        const stockStatus = product.inStock ? "In Stock" : "Out of Stock";
        const matches = filters.availability.includes(stockStatus);
        console.log("Availability filter:", product.name, product.inStock, stockStatus, matches); // Debug log
        return matches;
      });
    }

    // Option filters
    Object.entries(selectedOptions).forEach(([optionKey, optionVals]) => {
      if (optionVals.length > 0) {
        filtered = filtered.filter(product => {
          if (!product.options || !product.options[optionKey]) return false;
          return optionVals.some(val => product.options[optionKey].includes(val));
        });
      }
    });

    console.log("Filtered products count:", filtered.length); // Debug log
    setFilteredProducts(filtered);
  }, [filters, searchQuery, categoryFromURL, products, selectedOptions]);

  useEffect(() => {
    // Only run if products are loaded
    if (products.length === 0) return;
    // If there are filtered results, show related products based on the current search query
    let related = [];
    if (searchQuery) {
      // Remove common stopwords
      const stopwords = ["the","a","an","and","or","for","to","of","in","on","at","with","by","is","it","this","that","these","those","as","are","was","were","be","from","but","not","your","you","we","us","our","can","will","just","so","if","out","about","up","down","over","under","again","more","most","some","such","no","nor","too","very","s","t","d","ll","m","o","re","ve","y"];
      const queryWords = searchQuery.split(/\s+/).filter(w => w && !stopwords.includes(w));
      related = products.filter(product => {
        const text = (product.name + ' ' + (product.description || '')).toLowerCase();
        return queryWords.some(word => text.includes(word));
      });
    }
    // If not enough related, fill with random/popular
    if (related.length < products.length) {
      const extra = products.filter(p => !related.includes(p));
      related = [...related, ...extra];
    }
    setRelatedProducts(related);
  }, [filteredProducts, products, searchQuery]);

  // Helper: Levenshtein distance
  function levenshtein(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  // Enhanced suggestion logic for all spelling mistakes
  useEffect(() => {
    if (!searchQuery) {
      setSuggestion("");
      return;
    }
    // Gather all unique product names, categories, and brands
    const allNames = Array.from(new Set(products.map(p => p.name.toLowerCase())));
    const allCategories = Array.from(new Set(products.map(p => p.category.toLowerCase())));
    const allBrands = Array.from(new Set(products.map(p => (p.brand || '').toLowerCase())));
    const allTerms = [...allNames, ...allCategories, ...allBrands].filter(Boolean);
    const words = searchQuery.split(/\s+/).filter(Boolean);
    let bestWord = "";
    let bestMatch = "";
    let minDist = Infinity;
    // For each word in the query, compare to every word in every term
    for (const word of words) {
      for (const term of allTerms) {
        const termWords = term.split(/\s+/);
        for (const tWord of termWords) {
          // Substring match (case-insensitive)
          if (tWord.includes(word) && tWord !== word) {
            bestWord = word;
            bestMatch = tWord;
            minDist = 0;
            break;
          }
          // Levenshtein match
          const dist = levenshtein(word, tWord);
          const threshold = word.length > 5 ? 3 : 2;
          if (dist < minDist && dist <= threshold && tWord !== word) {
            minDist = dist;
            bestWord = word;
            bestMatch = tWord;
          }
        }
        if (minDist === 0) break; // Prefer substring match
      }
      if (minDist === 0) break;
    }
    if (bestMatch && bestMatch !== searchQuery) {
      setSuggestion(bestMatch);
    } else {
      setSuggestion("");
    }
  }, [searchQuery, products]);

  const handleCheckboxChange = (filterType, value) => {
    setFilters(prevFilters => {
      const newValues = prevFilters[filterType].includes(value)
        ? prevFilters[filterType].filter(item => item !== value)
        : [...prevFilters[filterType], value];
      
      return {
        ...prevFilters,
        [filterType]: newValues
      };
    });
  };

  const handlePriceChange = (event, newValue) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      priceRange: newValue
    }));
  };

  const handleFilterToggle = (filterType) => {
    setExpandedFilters(prev => ({
      ...prev,
      [filterType]: !prev[filterType]
    }));
  };

  const clearFilters = () => {
    setFilters({
      category: [],
      priceRange: [0, 200000],
      brand: [],
      rating: [],
      availability: [],
    });
  };

  const handleOptionFilterChange = (optionKey, value) => {
    setSelectedOptions(prev => {
      const arr = prev[optionKey] || [];
      return {
        ...prev,
        [optionKey]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]
      };
    });
  };

  const filterGroups = [
    {
      title: "Categories",
      type: "category",
      options: ["Electronics", "Clothing", "Home", "Books", "Sports", "Beauty"],
    },
    {
      title: "Brands",
      type: "brand",
      options: ["Apple", "Nike", "Samsung", "Sony", "Adidas", "Dell"],
    },
    {
      title: "Rating",
      type: "rating",
      options: ["4 & Above", "3 & Above", "2 & Above"],
    },
    {
      title: "Availability",
      type: "availability",
      options: ["In Stock", "Out of Stock"],
    },
  ];

  return (
    <>
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} sx={{ mb: '10px' }} />
      <Box
        sx={{
          mt: '100px',
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          minHeight: "100vh",
          bgcolor: isDarkMode ? "background.default" : "#fff",
          color: "text.primary",
          gap: { xs: 0, sm: 3 },
          px: { xs: 2, sm: 3, md: 4 },
          py: 3,
        }}
      >
        {/* Filter Sidebar */}
        <Paper
          elevation={isSmallScreen ? 2 : 0}
          sx={{
            width: { xs: "100%", sm: "320px" },
            flexShrink: 0,
            borderRight: { sm: `1px solid ${isDarkMode ? "#444" : "#ddd"}` },
            borderBottom: { xs: `1px solid ${isDarkMode ? "#444" : "#ddd"}`, sm: "none" },
            bgcolor: isDarkMode ? "background.paper" : "#fff",
            p: 3,
            maxHeight: { xs: "auto", sm: "calc(100vh - 80px)" },
            overflowY: "auto",
            position: { sm: "sticky" },
            top: { sm: 80 },
            borderRadius: { xs: "12px", sm: "0 12px 12px 0" },
          }}
        >
          {/* Filter header */}
          <Box sx={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            mb: 3,
            borderBottom: `1px solid ${isDarkMode ? "#444" : "#1e7e91ff"}`,
            pb: 2,
          }}>
            <Typography variant="h6" sx={{ 
              fontWeight: "bold", 
              display: "flex", 
              alignItems: "center", 
              gap: 1,
              fontSize: "1.1rem",
            }}>
              <FilterListIcon /> FilteRrs
            </Typography>
            <Button
              startIcon={<ClearIcon />}
              onClick={clearFilters}
              sx={{ 
                textTransform: "none",
                color: isDarkMode ? "#90caf9" : "#1976d2",
                "&:hover": {
                  backgroundColor: isDarkMode ? "rgba(144, 202, 249, 0.08)" : "rgba(25, 118, 210, 0.04)",
                }
              }}
            >
              Clear All
            </Button>
          </Box>

          {/* Price Range Filter */}
          <Box sx={{ 
            mb: 4,
            borderBottom: `1px solid ${isDarkMode ? "#444" : "#ddd"}`,
            pb: 3,
          }}>
            <Box sx={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center", 
              mb: 2,
            }}>
              <Typography sx={{ 
                fontWeight: 600,
                fontSize: "0.95rem",
                color: isDarkMode ? "#e2e8f0" : "#1e293b",
              }}>Price Range</Typography>
              <IconButton 
                size="small" 
                onClick={() => handleFilterToggle("price")}
                sx={{
                  color: isDarkMode ? "#90caf9" : "#1976d2",
                }}
              >
                {expandedFilters.price ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
            <Collapse in={expandedFilters.price}>
              <Box sx={{ px: 1 }}>
                <Slider
                  value={filters.priceRange}
                  onChange={handlePriceChange}
                  valueLabelDisplay="auto"
                  min={0}
                  max={200000}
                  step={10000}
                  sx={{
                    color: isDarkMode ? "#90caf9" : "#1976d2",
                    '& .MuiSlider-thumb': {
                      width: 24,
                      height: 24,
                    },
                    '& .MuiSlider-valueLabel': {
                      backgroundColor: isDarkMode ? "#90caf9" : "#1976d2",
                      borderRadius: "4px",
                    },
                  }}
                />
                <Box sx={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  mt: 1,
                  px: 1,
                }}>
                  <Typography variant="body2" sx={{ 
                    color: isDarkMode ? "#94a3b8" : "#64748b",
                    fontSize: "0.85rem",
                  }}>₹{filters.priceRange[0]}</Typography>
                  <Typography variant="body2" sx={{ 
                    color: isDarkMode ? "#94a3b8" : "#64748b",
                    fontSize: "0.85rem",
                  }}>₹{filters.priceRange[1]}</Typography>
                </Box>
              </Box>
            </Collapse>
          </Box>

          {/* Filter Groups */}
          {filterGroups.map(({ title, type, options }) => (
            <Box key={type} sx={{ 
              mb: 4,
              borderBottom: `1px solid ${isDarkMode ? "#444" : "#ddd"}`,
              pb: 3,
            }}>
              <Box sx={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center", 
                mb: 2,
              }}>
                <Typography sx={{ 
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  color: isDarkMode ? "#e2e8f0" : "#1e293b",
                }}>{title}</Typography>
                <IconButton 
                  size="small" 
                  onClick={() => handleFilterToggle(type)}
                  sx={{
                    color: isDarkMode ? "#90caf9" : "#1976d2",
                  }}
                >
                  {expandedFilters[type] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>
              <Collapse in={expandedFilters[type]}>
                <Stack spacing={1.5}>
                  {options.map((option) => (
                    <FormControlLabel
                      key={option}
                      control={
                        <Checkbox
                          checked={filters[type].includes(option)}
                          onChange={() => handleCheckboxChange(type, option)}
                          sx={{
                            color: isDarkMode ? "rgba(255, 255, 255, 0.7)" : "#333",
                            "&.Mui-checked": {
                              color: isDarkMode ? "#90caf9" : "#1976d2",
                            },
                          }}
                        />
                      }
                      label={option}
                      sx={{
                        fontSize: "0.9rem",
                        color: isDarkMode ? "#e2e8f0" : "#1e293b",
                        "& .MuiFormControlLabel-label": {
                          fontSize: "0.9rem",
                        },
                      }}
                    />
                  ))}
                </Stack>
              </Collapse>
            </Box>
          ))}

          {/* Option Filters */}
          {Object.entries(optionFilters).map(([optionKey, optionVals]) => (
            <Box key={optionKey} sx={{ mb: 4, borderBottom: `1px solid ${isDarkMode ? "#444" : "#ddd"}`, pb: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Typography sx={{ fontWeight: 600, fontSize: "0.95rem", color: isDarkMode ? "#e2e8f0" : "#1e293b", minWidth: 80 }}>
                  {optionKey.charAt(0).toUpperCase() + optionKey.slice(1)}
                </Typography>
              </Box>
              {optionKey === 'color' ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, pl: 0.5 }}>
                  {optionVals.map((val) => (
                    <Box key={val} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Checkbox
                        checked={selectedOptions[optionKey]?.includes(val) || false}
                        onChange={() => handleOptionFilterChange(optionKey, val)}
                        sx={{ display: 'none' }}
                      />
                      <Box
                        onClick={() => handleOptionFilterChange(optionKey, val)}
                        sx={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          border: selectedOptions[optionKey]?.includes(val) ? '2.5px solid #1976d2' : '1.5px solid #ccc',
                          background: val.toLowerCase(),
                          cursor: 'pointer',
                          boxShadow: selectedOptions[optionKey]?.includes(val) ? '0 0 0 2px #90caf9' : 'none',
                          transition: 'border 0.2s, box-shadow 0.2s',
                          mr: 0.5
                        }}
                        title={val}
                      />
                      <Typography variant="caption" sx={{ color: 'text.secondary', minWidth: 32 }}>{val}</Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Stack spacing={1.2} sx={{ pl: 0.5 }}>
                  {optionVals.map((val) => (
                    <FormControlLabel
                      key={val}
                      control={
                        <Checkbox
                          checked={selectedOptions[optionKey]?.includes(val) || false}
                          onChange={() => handleOptionFilterChange(optionKey, val)}
                          sx={{ color: isDarkMode ? "rgba(255, 255, 255, 0.7)" : "#333", "&.Mui-checked": { color: isDarkMode ? "#90caf9" : "#1976d2" } }}
                        />
                      }
                      label={<Typography variant="body2" sx={{ color: isDarkMode ? "#e2e8f0" : "#1e293b", fontSize: '0.95rem', pl: 0.5 }}>{val}</Typography>}
                      sx={{ alignItems: 'center', m: 0, p: 0 }}
                    />
                  ))}
                </Stack>
              )}
            </Box>
          ))}

          {/* Active Filters */}
          {Object.values(filters).some((filter) => filter.length > 0) && (
            <Box sx={{ mt: 4 }}>
              <Typography sx={{ 
                fontWeight: 600,
                mb: 2,
                fontSize: "0.95rem",
                color: isDarkMode ? "#e2e8f0" : "#1e293b",
              }}>Active Filters</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {filters.category.map((cat) => (
                  <Chip
                    key={cat}
                    label={cat}
                    onDelete={() => handleCheckboxChange("category", cat)}
                    size="small"
                    sx={{
                      backgroundColor: isDarkMode ? "rgba(144, 202, 249, 0.1)" : "rgba(25, 118, 210, 0.1)",
                      color: isDarkMode ? "#90caf9" : "#1976d2",
                      "& .MuiChip-deleteIcon": {
                        color: isDarkMode ? "#90caf9" : "#1976d2",
                      },
                    }}
                  />
                ))}
                {filters.brand.map((brand) => (
                  <Chip
                    key={brand}
                    label={brand}
                    onDelete={() => handleCheckboxChange("brand", brand)}
                    size="small"
                    sx={{
                      backgroundColor: isDarkMode ? "rgba(144, 202, 249, 0.1)" : "rgba(25, 118, 210, 0.1)",
                      color: isDarkMode ? "#90caf9" : "#1976d2",
                      "& .MuiChip-deleteIcon": {
                        color: isDarkMode ? "#90caf9" : "#1976d2",
                      },
                    }}
                  />
                ))}
                {filters.rating.map((rating) => (
                  <Chip
                    key={rating}
                    label={rating}
                    onDelete={() => handleCheckboxChange("rating", rating)}
                    size="small"
                    sx={{
                      backgroundColor: isDarkMode ? "rgba(144, 202, 249, 0.1)" : "rgba(25, 118, 210, 0.1)",
                      color: isDarkMode ? "#90caf9" : "#1976d2",
                      "& .MuiChip-deleteIcon": {
                        color: isDarkMode ? "#90caf9" : "#1976d2",
                      },
                    }}
                  />
                ))}
                {filters.availability.map((avail) => (
                  <Chip
                    key={avail}
                    label={avail}
                    onDelete={() => handleCheckboxChange("availability", avail)}
                    size="small"
                    sx={{
                      backgroundColor: isDarkMode ? "rgba(144, 202, 249, 0.1)" : "rgba(25, 118, 210, 0.1)",
                      color: isDarkMode ? "#90caf9" : "#1976d2",
                      "& .MuiChip-deleteIcon": {
                        color: isDarkMode ? "#90caf9" : "#1976d2",
                      },
                    }}
                  />
                ))}
                {filters.priceRange[0] > 0 || filters.priceRange[1] < 200000 ? (
                  <Chip
                    label={`₹${filters.priceRange[0]} - ₹${filters.priceRange[1]}`}
                    onDelete={() => setFilters(prev => ({ ...prev, priceRange: [0, 200000] }))}
                    size="small"
                    sx={{
                      backgroundColor: isDarkMode ? "rgba(144, 202, 249, 0.1)" : "rgba(25, 118, 210, 0.1)",
                      color: isDarkMode ? "#90caf9" : "#1976d2",
                      "& .MuiChip-deleteIcon": {
                        color: isDarkMode ? "#90caf9" : "#1976d2",
                      },
                    }}
                  />
                ) : null}
              </Stack>
            </Box>
          )}
        </Paper>

        {/* Product Grid */}
        <Box sx={{ 
          flexGrow: 1,
          minWidth: 0, // Prevents overflow
        }}>
          {error ? (
            <Box sx={{ 
              textAlign: "center", 
              mt: 8,
              p: 4,
              bgcolor: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "#f8fafc",
              borderRadius: "12px",
            }}>
              <Typography
                variant="h6"
                sx={{
                  color: "error.main",
                  mb: 2,
                  fontWeight: 600,
                }}
              >
                Error Loading Products
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: isDarkMode ? "#94a3b8" : "#64748b",
                  maxWidth: "400px",
                  mx: "auto",
                }}
              >
                {error}
              </Typography>
            </Box>
          ) : (
            <>
              <Typography
                variant="h6"
                sx={{ 
                  fontWeight: 600, 
                  mb: 1, 
                  fontSize: "1.1rem", 
                  color: isDarkMode ? "#e2e8f0" : "#1e293b",
                }}
              >
                {filteredProducts.length} results found for "
                {searchQuery || categoryFromURL || "All Products"}"
              </Typography>
              {suggestion && (
                <Typography variant="body2" sx={{ mb: 2, color: 'primary.main' }}>
                  Did you mean{' '}
                  <Box
                    component="span"
                    sx={{ textDecoration: 'underline', cursor: 'pointer', color: 'primary.dark', fontWeight: 600 }}
                    onClick={() => {
                      navigate(`?search=${encodeURIComponent(suggestion)}`);
                    }}
                  >
                    {suggestion}
                  </Box>
                  ?
                </Typography>
              )}

              <Box ref={productContainerRef}>
                {loading ? (
                  <Box sx={{ 
                    display: "flex", 
                    justifyContent: "center", 
                    alignItems: "center",
                    minHeight: "400px",
                  }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <>
                    {filteredProducts.length > 0 ? (
                      <Grid container spacing={3}>
                        {filteredProducts.map((product) => (
                          <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                            <Link
                              to={`/product/${product.id}`}
                              style={{ textDecoration: "none", color: "inherit" }}
                            >
                              <Card
                                sx={{
                                  height: "100%",
                                  display: "flex",
                                  flexDirection: "column",
                                  bgcolor: isDarkMode ? "background.paper" : "#fff",
                                  boxShadow: isDarkMode ? "none" : "0 2px 4px rgba(0,0,0,0.1)",
                                  borderRadius: "12px",
                                  border: `1px solid ${isDarkMode ? "#444" : "#ddd"}`,
                                  transition: "all 0.3s ease",
                                  "&:hover": {
                                    transform: "translateY(-4px)",
                                    boxShadow: isDarkMode ? 2 : "0 4px 8px rgba(0,0,0,0.2)",
                                  },
                                }}
                              >
                                <CardMedia
                                  component="img"
                                  image={product.image}
                                  alt={product.name}
                                  sx={{
                                    width: "100%",
                                    height: "200px",
                                    objectFit: "contain",
                                    p: 2,
                                    bgcolor: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "#f8fafc",
                                  }}
                                />
                                <CardContent sx={{ 
                                  flexGrow: 1, 
                                  p: 2.5,
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 1,
                                }}>
                                  <Typography
                                    variant="body1"
                                    sx={{ 
                                      fontSize: "1rem", 
                                      fontWeight: 500,
                                      display: "-webkit-box",
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: "vertical",
                                      overflow: "hidden",
                                      color: isDarkMode ? "#e2e8f0" : "#1e293b",
                                    }}
                                  >
                                    {product.name}
                                  </Typography>
                                  <Typography
                                    variant="h6"
                                    sx={{ 
                                      fontSize: "1.1rem", 
                                      fontWeight: 600,
                                      color: isDarkMode ? "#90caf9" : "#1976d2",
                                    }}
                                  >
                                    ₹{product.price}
                                  </Typography>
                                  {/* Product Options - show only selected or summary */}
                                  {product.options && (
                                    <Box sx={{ mt: 1, mb: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                      {Object.entries(product.options).map(([optionKey, optionValues]) => {
                                        const selected = selectedOptions[optionKey] || [];
                                        // If any selected, show only those; else show summary
                                        if (selected.length > 0) {
                                          return (
                                            <Box key={optionKey} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, mr: 0.5 }}>
                                                {optionKey.charAt(0).toUpperCase() + optionKey.slice(1)}:
                                              </Typography>
                                              {optionKey === 'color'
                                                ? selected.map((color, idx) => (
                                                    <Box key={color+idx} sx={{ width: 18, height: 18, borderRadius: '50%', border: '1.5px solid #ccc', background: color.toLowerCase(), display: 'inline-block', mr: 0.5 }} title={color} />
                                                  ))
                                                : selected.map((val, idx) => (
                                                    <Chip key={val+idx} label={val} size="small" sx={{ mr: 0.5, bgcolor: isDarkMode ? '#222' : '#f3f4f6', color: isDarkMode ? '#fff' : '#222' }} />
                                                  ))
                                              }
                                            </Box>
                                          );
                                        } else {
                                          // Show summary
                                          return (
                                            <Box key={optionKey} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, mr: 0.5 }}>
                                                {optionKey.charAt(0).toUpperCase() + optionKey.slice(1)}:
                                              </Typography>
                                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                {optionValues.length} option{optionValues.length > 1 ? 's' : ''}
                                              </Typography>
                                            </Box>
                                          );
                                        }
                                      })}
                                    </Box>
                                  )}
                                  <Box sx={{ 
                                    display: "flex", 
                                    alignItems: "center", 
                                    gap: 2,
                                    mt: "auto",
                                  }}>
                                    <Typography
                                      variant="body2"
                                      sx={{ 
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 0.5,
                                        color: isDarkMode ? "#90caf9" : "#1976d2",
                                        fontSize: "0.9rem",
                                      }}
                                    >
                                      ⭐ {product.rating}
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      sx={{ 
                                        color: product.inStock ? "success.main" : "error.main",
                                        fontSize: "0.9rem",
                                      }}
                                    >
                                      {product.inStock ? "In Stock" : "Out of Stock"}
                                    </Typography>
                                  </Box>
                                </CardContent>
                              </Card>
                            </Link>
                          </Grid>
                        ))}
                      </Grid>
                    ) : (
                      <Box sx={{ 
                        textAlign: "center", 
                        mt: 8,
                        p: 4,
                        bgcolor: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "#f8fafc",
                        borderRadius: "12px",
                      }}>
                        <Typography
                          variant="h6"
                          sx={{
                            color: isDarkMode ? "#e2e8f0" : "#1e293b",
                            mb: 2,
                            fontWeight: 600,
                          }}
                        >
                          No products found
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{
                            color: isDarkMode ? "#94a3b8" : "#64748b",
                            maxWidth: "400px",
                            mx: "auto",
                          }}
                        >
                          Try adjusting your filters or search terms to find what you're looking for
                        </Typography>
                      </Box>
                    )}
                    {/* Related Products always below */}
                    {relatedProducts.length > 0 && (
                      <Box sx={{ mt: 6 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                          Related Products
                        </Typography>
                        <Grid container spacing={3}>
                          {relatedProducts.map((product) => (
                            <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                              <Link
                                to={`/product/${product.id}`}
                                style={{ textDecoration: "none", color: "inherit" }}
                              >
                                <Card
                                  sx={{
                                    height: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                    bgcolor: isDarkMode ? "background.paper" : "#fff",
                                    boxShadow: isDarkMode ? "none" : "0 2px 4px rgba(0,0,0,0.1)",
                                    borderRadius: "12px",
                                    border: `1px solid ${isDarkMode ? "#444" : "#ddd"}`,
                                    transition: "all 0.3s ease",
                                    "&:hover": {
                                      transform: "translateY(-4px)",
                                      boxShadow: isDarkMode ? 2 : "0 4px 8px rgba(0,0,0,0.2)",
                                    },
                                  }}
                                >
                                  <CardMedia
                                    component="img"
                                    image={product.image}
                                    alt={product.name}
                                    sx={{
                                      width: "100%",
                                      height: "200px",
                                      objectFit: "contain",
                                      p: 2,
                                      bgcolor: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "#f8fafc",
                                    }}
                                  />
                                  <CardContent sx={{ 
                                    flexGrow: 1, 
                                    p: 2.5,
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 1,
                                  }}>
                                    <Typography
                                      variant="body1"
                                      sx={{ 
                                        fontSize: "1rem", 
                                        fontWeight: 500,
                                        display: "-webkit-box",
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: "vertical",
                                        overflow: "hidden",
                                        color: isDarkMode ? "#e2e8f0" : "#1e293b",
                                      }}
                                    >
                                      {product.name}
                                    </Typography>
                                    <Typography
                                      variant="h6"
                                      sx={{ 
                                        fontSize: "1.1rem", 
                                        fontWeight: 600,
                                        color: isDarkMode ? "#90caf9" : "#1976d2",
                                      }}
                                    >
                                      ₹{product.price}
                                    </Typography>
                                    {/* Product Options - show only selected or summary */}
                                    {product.options && (
                                      <Box sx={{ mt: 1, mb: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        {Object.entries(product.options).map(([optionKey, optionValues]) => {
                                          const selected = selectedOptions[optionKey] || [];
                                          // If any selected, show only those; else show summary
                                          if (selected.length > 0) {
                                            return (
                                              <Box key={optionKey} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, mr: 0.5 }}>
                                                  {optionKey.charAt(0).toUpperCase() + optionKey.slice(1)}:
                                                </Typography>
                                                {optionKey === 'color'
                                                  ? selected.map((color, idx) => (
                                                      <Box key={color+idx} sx={{ width: 18, height: 18, borderRadius: '50%', border: '1.5px solid #ccc', background: color.toLowerCase(), display: 'inline-block', mr: 0.5 }} title={color} />
                                                    ))
                                                  : selected.map((val, idx) => (
                                                      <Chip key={val+idx} label={val} size="small" sx={{ mr: 0.5, bgcolor: isDarkMode ? '#222' : '#f3f4f6', color: isDarkMode ? '#fff' : '#222' }} />
                                                    ))
                                              }
                                              </Box>
                                            );
                                          } else {
                                            // Show summary
                                            return (
                                              <Box key={optionKey} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, mr: 0.5 }}>
                                                  {optionKey.charAt(0).toUpperCase() + optionKey.slice(1)}:
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                  {optionValues.length} option{optionValues.length > 1 ? 's' : ''}
                                                </Typography>
                                              </Box>
                                            );
                                          }
                                        })}
                                      </Box>
                                    )}
                                    <Box sx={{ 
                                      display: "flex", 
                                      alignItems: "center", 
                                      gap: 2,
                                      mt: "auto",
                                    }}>
                                      <Typography
                                        variant="body2"
                                        sx={{ 
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 0.5,
                                          color: isDarkMode ? "#90caf9" : "#1976d2",
                                          fontSize: "0.9rem",
                                        }}
                                      >
                                        ⭐ {product.rating}
                                      </Typography>
                                      <Typography
                                        variant="body2"
                                        sx={{ 
                                          color: product.inStock ? "success.main" : "error.main",
                                          fontSize: "0.9rem",
                                        }}
                                      >
                                        {product.inStock ? "In Stock" : "Out of Stock"}
                                      </Typography>
                                    </Box>
                                  </CardContent>
                                </Card>
                              </Link>
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    )}
                  </>
                )}
              </Box>
            </>
          )}
        </Box>
      </Box>
      <Footer />
    </>
  );
};

export default ProductListing;
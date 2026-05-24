import React, { useState, useEffect, useCallback } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  TextField,
  Autocomplete,
  IconButton,
  Badge,
  Box,
  InputAdornment,
  useTheme,
  useMediaQuery,
  Collapse,
  Button,
} from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import SearchIcon from "@mui/icons-material/Search";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import { useNavigate } from "react-router-dom";
import debounce from "lodash.debounce";

const Navbar = ({ darkMode, setDarkMode, ...props }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  const [allSuggestions, setAllSuggestions] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [notifications, setNotifications] = useState(2);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const updateCartCount = useCallback(() => {
    const carts = JSON.parse(localStorage.getItem("carts")) || {};
    setCartCount(3);
  }, []);

  const updateWishlistCount = useCallback(() => {
    const wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
    setWishlistCount(wishlist.length);
  }, []);

  useEffect(() => {
    updateCartCount();
    updateWishlistCount();
    window.addEventListener("storage", updateCartCount);
    window.addEventListener("storage", updateWishlistCount);
    return () => {
      window.removeEventListener("storage", updateCartCount);
      window.removeEventListener("storage", updateWishlistCount);
    };
  }, [updateCartCount, updateWishlistCount]);

  useEffect(() => {
    const fetchSuggestions = debounce(() => {
      fetch("/data/search.json")
        .then((res) => res.json())
        .then((data) => setAllSuggestions(data.suggestions || []))
        .catch((err) => console.error("Error loading search suggestions:", err));
    }, 300);

    fetchSuggestions();
    return () => fetchSuggestions.cancel();
  }, []);

  const getFilteredSuggestions = (query) => {
    if (!query) return allSuggestions;
    const lowerQuery = query.toLowerCase();
    const startsWith = allSuggestions.filter(s => s.toLowerCase().startsWith(lowerQuery));
    const includes = allSuggestions.filter(
      s => !s.toLowerCase().startsWith(lowerQuery) && s.toLowerCase().includes(lowerQuery)
    );
    return [...startsWith, ...includes];
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/products?search=${searchQuery}`);
      setSearchOpen(false);
    }
  };

  return (
    <>
      <AppBar position="fixed">
        <Box
          sx={{
            width: "100vw",
            backgroundColor: (theme) => theme.palette.background.default,
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            px: 1,
            py: 0.5,
            borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "flex", gap: 1.5, alignItems: "center" }}
          >
            <Button
              onClick={() => navigate("/signin")}
              size="small"
              sx={{
                fontSize: "0.75rem",
                textTransform: "none",
                color: "text.primary",
              }}
            >
              Sign in
            </Button>
            <span>|</span>
            <Button
              onClick={() => navigate("/register")}
              size="small"
              sx={{
                fontSize: "0.75rem",
                textTransform: "none",
                color: "text.primary",
              }}
            >
              Register
            </Button>
            <span>|</span>
            <Button
              onClick={() => navigate("/help")}
              size="small"
              sx={{
                fontSize: "0.75rem",
                textTransform: "none",
                color: "text.primary",
              }}
            >
              Help & Contact
            </Button>
          </Typography>
        </Box>

        <Toolbar sx={{ width: "100vw", display: "flex", justifyContent: "space-between", alignItems: "center", px: isMobile ? 1 : 3 }}>

          {/* Logo */}
          <Typography
            variant="h5"
            sx={{
              fontWeight: "bold",
              cursor: "pointer",
              color: theme.palette.text.primary,
              transition: "color 0.3s",
              "&:hover": { color: theme.palette.primary.main },
            }}
            onClick={() => navigate("/")}
          >
            Ecom
          </Typography>

          {/* Desktop Search Bar */}
          {!isTablet && (
            <Box sx={{ width: "100vw", flexGrow: 1, maxWidth: 700, mx: 3 }}>
              <Autocomplete
                freeSolo
                options={getFilteredSuggestions(searchQuery)}
                inputValue={searchQuery}
                onInputChange={(event, newInputValue) => setSearchQuery(newInputValue)}
                onChange={(event, newValue) => {
                  if (newValue) navigate(`/products?search=${newValue}`);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Search for products..."
                    variant="outlined"
                    size="small"
                    fullWidth
                    sx={{
                      borderRadius: "20px",
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "20px",
                      },
                    }}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </Box>
          )}

          {/* Icons */}
          <Box sx={{ display: "flex", alignItems: "center", gap: isMobile ? 1 : 2 }}>
            {/* Search Icon (Mobile Only) */}
            {isTablet && (
              <IconButton onClick={() => setSearchOpen(!searchOpen)}>
                <SearchIcon />
              </IconButton>
            )}

            {/* Dark Mode Toggle */}
            <IconButton onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>

            {/* Wishlist */}
            {!isMobile && (
              <IconButton onClick={() => navigate("/wishlist")}>
                <Badge badgeContent={wishlistCount} color="error">
                  <FavoriteBorderIcon />
                </Badge>
              </IconButton>
            )}

            {/* Orders */}
            {!isMobile && (
              <IconButton onClick={() => navigate("/orders")}>
                <ReceiptLongIcon />
              </IconButton>
            )}

            {/* Cart */}
            <IconButton onClick={() => navigate("/cart")}>
              <Badge badgeContent={cartCount} color="error" showZero>
                <ShoppingCartIcon />
              </Badge>
            </IconButton>

            {/* Profile */}
            <IconButton onClick={() => navigate("/profile")}>
              <AccountCircleIcon />
            </IconButton>
          </Box>
        </Toolbar>

        <Collapse in={searchOpen} timeout="auto">
          <Box sx={{ width: "100vw", display: "flex", alignItems: "center", px: 2, pb: 1 }}>
            <Box sx={{ flexGrow: 1, maxWidth: 400 }}>
              <Autocomplete
                freeSolo
                options={getFilteredSuggestions(searchQuery)}
                inputValue={searchQuery}
                onInputChange={(event, newInputValue) => setSearchQuery(newInputValue)}
                onChange={(event, newValue) => {
                  if (newValue) {
                    navigate(`/products?search=${newValue}`);
                    setSearchOpen(false);
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    autoFocus
                    placeholder="Search..."
                    variant="outlined"
                    fullWidth
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                    onBlur={() => setSearchOpen(false)}
                  />
                )}
              />
            </Box>

            <Button
              variant="contained"
              color="primary"
              sx={{ ml: 1, height: "40px", minWidth: "64px" }}
              onClick={handleSearch}
            >
              Go
            </Button>
          </Box>
        </Collapse>

      </AppBar>

      <Box sx={{ marginTop: "64px" }} />
    </>
  );
};

export default Navbar;

import React, { useState, useEffect, useCallback } from "react";
import { name } from "../config";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Box,
  useTheme,
  useMediaQuery,
  Collapse,
  Button,
  Avatar,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
} from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import SearchIcon from "@mui/icons-material/Search";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import DashboardIcon from "@mui/icons-material/Dashboard";
import StorefrontIcon from "@mui/icons-material/Storefront";
import MenuIcon from "@mui/icons-material/Menu";
import CategoryIcon from "@mui/icons-material/Category";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LiveSearchBox from "./search/LiveSearchBox";
import { fetchCategories } from "../services/categoryService";
import {
  fetchCartCount,
  fetchOrderNotificationCount,
  fetchSellerAlertCount,
  fetchWishlistCount,
} from "../services/notificationService";

const Navbar = ({ darkMode, setDarkMode, ...props }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [notifications, setNotifications] = useState(0);
  const [categories, setCategories] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileAnchor, setProfileAnchor] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, user, userType, logout } = useAuth();
  const isBusiness = isAuthenticated && userType === "business";
  const isPersonal = isAuthenticated && userType === "personal";

  const updateCounts = useCallback(async () => {
    const [nextCartCount, nextWishlistCount, orderCount, sellerCount] = await Promise.all([
      fetchCartCount(),
      fetchWishlistCount(),
      isPersonal ? fetchOrderNotificationCount() : Promise.resolve(0),
      isBusiness ? fetchSellerAlertCount() : Promise.resolve(0),
    ]);
    setCartCount(nextCartCount);
    setWishlistCount(nextWishlistCount);
    setNotifications(isBusiness ? sellerCount : orderCount);
  }, [isBusiness, isPersonal]);

  useEffect(() => {
    updateCounts();
    window.addEventListener("storage", updateCounts);
    return () => {
      window.removeEventListener("storage", updateCounts);
    };
  }, [updateCounts]);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  const logoutFunc = () => {
    logout();
    setProfileAnchor(null);
    navigate("/");
  };

  const displayName =
    user?.name ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.email ||
    "";

  const drawerItems = [
    ...categories.map((category) => ({ label: category.name, path: `/products?category=${encodeURIComponent(category.name)}`, show: true })),
    { label: "All products", path: "/products", show: true },
    { label: "Cart", path: "/cart", show: true },
    { label: "Wishlist", path: "/wishlist", show: isPersonal },
    { label: "Orders", path: "/orders", show: isPersonal },
    { label: "Seller dashboard", path: "/seller/dashboard", show: isBusiness },
    { label: "Storefront", path: "/products", show: isBusiness },
    { label: "Sign in", path: "/signin", show: !isAuthenticated },
    { label: "Register", path: "/register", show: !isAuthenticated },
  ].filter((item) => item.show);

  const handleDrawerNavigate = (path) => {
    setDrawerOpen(false);
    navigate(path);
  };

  return (
    <>
      <AppBar position="sticky" sx={{ top: 0, zIndex: (theme) => theme.zIndex.drawer + 2 }}>
      <Box
          sx={{
            backgroundColor: (theme) => theme.palette.background.default,
            display: { xs: "none", sm: "flex" },
            justifyContent: "flex-end",
            alignItems: "center",
            px: 2,
            py: 0.5,
            borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "flex", gap: 1.5, alignItems: "center" }}
          >
            {isAuthenticated ? (
              <>
                {isBusiness && (
                  <>
                    <Button
                      onClick={() => navigate("/seller/dashboard")}
                      size="small"
                      startIcon={<DashboardIcon fontSize="small" />}
                      sx={{ fontSize: "0.75rem", textTransform: "none", color: "text.primary" }}
                    >
                      Seller Dashboard
                    </Button>
                    <span>|</span>
                  </>
                )}
                <Button
                  onClick={(event) => setProfileAnchor(event.currentTarget)}
                  size="small"
                  startIcon={<Avatar src={user?.avatar} sx={{ width: 22, height: 22 }}>{displayName.charAt(0)}</Avatar>}
                  sx={{ fontSize: "0.75rem", textTransform: "none", color: "text.primary" }}
                >
                  {displayName || "Profile"}
                </Button>
                <span>|</span>
              </>
            ) : (
              <>
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
              </>
            )}
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

        <Toolbar sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: { xs: 1, md: 3 }, gap: 1, minHeight: { xs: 60, md: 68 } }}>
          {isTablet && (
            <IconButton aria-label="Open menu" onClick={() => setDrawerOpen(true)}>
              <MenuIcon />
            </IconButton>
          )}
          
          {/* Logo */}
          <Typography
            variant="h5"
            sx={{
              fontWeight: 950,
              cursor: "pointer",
              color: theme.palette.text.primary,
              transition: "color 0.3s",
              "&:hover": { color: theme.palette.primary.main },
              letterSpacing: 0,
              whiteSpace: "nowrap",
              fontSize: { xs: "1.25rem", md: "1.5rem" },
            }}
            onClick={() => navigate("/")}
          >
           {name}
          </Typography>

          {/* Desktop Search Bar */}
          {!isTablet && (
            <Box sx={{ flexGrow: 1, maxWidth: 700, mx: 3 }}>
              <LiveSearchBox />
            </Box>
          )}

          {!isTablet && (
            <Button
              startIcon={<CategoryIcon />}
              onClick={() => navigate("/products")}
              sx={{ textTransform: "none", whiteSpace: "nowrap", fontWeight: 800 }}
            >
              Categories
            </Button>
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
            {isPersonal && !isMobile && (
              <IconButton onClick={() => navigate("/wishlist")}>
                <Badge badgeContent={wishlistCount} color="error">
                  <FavoriteBorderIcon />
                </Badge>
              </IconButton>
            )}

            {/* Orders */}
            {isPersonal && !isMobile && (
              <IconButton onClick={() => navigate("/orders")}>
                <ReceiptLongIcon />
              </IconButton>
            )}

            {!isMobile && (
              <IconButton aria-label="Notifications">
                <Badge badgeContent={notifications} color="error">
                  <NotificationsNoneIcon />
                </Badge>
              </IconButton>
            )}

            {/* Cart / Seller dashboard */}
            {isBusiness ? (
              <IconButton onClick={() => navigate("/seller/dashboard")}>
                <DashboardIcon />
              </IconButton>
            ) : (
              <IconButton onClick={() => navigate("/cart")}>
                <Badge badgeContent={cartCount} color="error" showZero>
                  <ShoppingCartIcon />
                </Badge>
              </IconButton>
            )}

            {/* Profile */}
            <IconButton onClick={(event) => isAuthenticated ? setProfileAnchor(event.currentTarget) : navigate("/signin")}>
              {isAuthenticated ? (
                <Avatar src={user?.avatar} sx={{ width: 30, height: 30 }}>{displayName.charAt(0)}</Avatar>
              ) : (
                <AccountCircleIcon />
              )}
            </IconButton>
    
          </Box>
        </Toolbar>
        <Menu
          anchorEl={profileAnchor}
          open={Boolean(profileAnchor)}
          onClose={() => setProfileAnchor(null)}
        >
          <MenuItem disabled>{isBusiness ? "Business account" : "Personal account"}</MenuItem>
          <MenuItem onClick={() => { setProfileAnchor(null); navigate("/profile"); }}>
            Profile
          </MenuItem>
          {isBusiness && (
            <MenuItem onClick={() => { setProfileAnchor(null); navigate("/seller/dashboard"); }}>
              <DashboardIcon fontSize="small" style={{ marginRight: 8 }} />
              Seller dashboard
            </MenuItem>
          )}

          {isBusiness && (
            <MenuItem onClick={() => { setProfileAnchor(null); navigate("/products"); }}>
              <StorefrontIcon fontSize="small" style={{ marginRight: 8 }} />
              View storefront
            </MenuItem>
          )}
          <MenuItem onClick={logoutFunc}>Logout</MenuItem>
        </Menu>

        <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
          <Box sx={{ width: 280, pt: 2 }} role="presentation">
            <Typography variant="h6" fontWeight={900} sx={{ px: 2, pb: 1 }}>
              {name}
            </Typography>
            <Divider />
            <List>
              {drawerItems.map((item) => (
                <ListItemButton key={item.label} onClick={() => handleDrawerNavigate(item.path)}>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              ))}
            </List>
          </Box>
        </Drawer>
        

<Collapse in={searchOpen} timeout="auto">
  <Box sx={{ display: "flex", alignItems: "center", px: 2, pb: 1 }}>
    <Box sx={{ flexGrow: 1, maxWidth: 600 }}>
      <LiveSearchBox autoFocus onNavigate={() => setSearchOpen(false)} />
    </Box>
  </Box>
</Collapse>

      </AppBar>
    </>
  );
};

export default Navbar;

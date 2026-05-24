import React, { useState, useEffect } from "react";
import { ThemeProvider, CssBaseline, Box } from "@mui/material";
import { lightTheme, darkTheme } from "./theme";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import HeroSection from "./pages/HeroSection";
import ProductListing from "./pages/ProductListing";
import Cart from "./pages/Cart";
import ProductDetail from "./pages/ProductDetails";
import Profile from "./pages/Profile";
import Wishlist from "./pages/Wishlist";
import Footer from "./components/Footer";
import OrdersPage from "./pages/OrderSection";
import Checkout from "./pages/Checkout";
import PaymentGateway from "./pages/PaymentGateway";
import Bids from "./pages/Bids";
import Login from './Sellerside/Front-end/Login/Login'
import Register from './Sellerside/Front-end/Signup/Signup'
import Sellerprofile from './Sellerside/Front-end/Maindashboard'

const getInitialDarkMode = () => {
  const stored = localStorage.getItem("darkMode");
  if (stored !== null) return stored === "true";
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const App = () => {
  const [darkMode, setDarkMode] = useState(getInitialDarkMode);

  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
    if (darkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, [darkMode]);

  return (
    <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
      <CssBaseline />
      <Router>
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Box sx={{ mb: 0 }}>
      </Box>

      <Box sx={{ flexGrow: 1 }}>
        <Routes>
          <Route path="/signin" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<HeroSection darkMode={darkMode} setDarkMode={setDarkMode} />} />
          <Route path="/main" element={<Sellerprofile />} />
          <Route path="/products" element={<ProductListing darkMode={darkMode} setDarkMode={setDarkMode} />} />
          <Route path="/cart" element={<Cart darkMode={darkMode} setDarkMode={setDarkMode} />} />
          <Route path="/product/:id" element={<ProductDetail darkMode={darkMode} setDarkMode={setDarkMode} />} />
          <Route path="/profile" element={<Profile darkMode={darkMode} setDarkMode={setDarkMode} />} />
          <Route path="/profile/carts" element={<Profile darkMode={darkMode} setDarkMode={setDarkMode} />} />
          <Route path="/profile/wishlists" element={<Profile darkMode={darkMode} setDarkMode={setDarkMode} />} />
          <Route path="/profile/bids" element={<Bids />} />
          <Route path="/profile/settings" element={<Profile darkMode={darkMode} setDarkMode={setDarkMode} />} />
          <Route path="/wishlist" element={<Wishlist darkMode={darkMode} setDarkMode={setDarkMode} />} />
          <Route path="/orders" element={<OrdersPage darkMode={darkMode} setDarkMode={setDarkMode} />} />
          <Route path="/checkout" element={<Checkout darkMode={darkMode} setDarkMode={setDarkMode} />} />
          <Route path="/payment" element={<PaymentGateway darkMode={darkMode} setDarkMode={setDarkMode} />} />
        </Routes>
      </Box>

    </Box>

      </Router>
    </ThemeProvider>
  );
};

export default App;

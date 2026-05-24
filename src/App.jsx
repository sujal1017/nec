import React, { lazy, Suspense, useEffect, useState } from "react";
import { ThemeProvider, CssBaseline, Box } from "@mui/material";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { lightTheme, darkTheme } from "./theme";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./guards/ProtectedRoute";
import LoadingFallback from "./components/shared/LoadingFallback";

const LandingPage = lazy(() => import("./pages/public/LandingPage"));
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const ProductListing = lazy(() => import("./pages/ProductListing"));
const Cart = lazy(() => import("./pages/Cart"));
const ProductDetail = lazy(() => import("./pages/ProductDetails"));
const Profile = lazy(() => import("./pages/Profile"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const OrdersPage = lazy(() => import("./pages/OrderSection"));
const Checkout = lazy(() => import("./pages/Checkout"));
const PaymentGateway = lazy(() => import("./pages/PaymentGateway"));
const Bids = lazy(() => import("./pages/Bids"));
const SellerDashboard = lazy(() => import("./Sellerside/Front-end/Maindashboard"));
const Help = lazy(() => import("./pages/Contact"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const EmailVerification = lazy(() => import("./pages/EmailVerification"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFoundPage = lazy(() => import("./pages/NotFound"));

const getInitialDarkMode = () => {
  const stored = localStorage.getItem("darkMode");
  if (stored !== null) return stored === "true";
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
};

const App = () => {
  const [darkMode, setDarkMode] = useState(getInitialDarkMode);

  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
    document.body.classList.toggle("dark-mode", darkMode);
  }, [darkMode]);

  const pageProps = { darkMode, setDarkMode };

  return (
    <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
            <Box sx={{ flexGrow: 1 }}>
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  <Route path="/" element={<LandingPage {...pageProps} />} />
                  <Route path="/signin" element={<Login />} />
                  <Route path="/login" element={<Navigate to="/signin" replace />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/verifyEmail" element={<VerifyEmail />} />
                  <Route path="/email-verification" element={<EmailVerification />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/help" element={<Help />} />

                  <Route path="/products" element={<ProductListing {...pageProps} />} />
                  <Route path="/product/:id" element={<ProductDetail {...pageProps} />} />

                  <Route element={<ProtectedRoute allowedRoles={["personal", "business"]} />}>
                    <Route path="/cart" element={<Cart {...pageProps} />} />
                    <Route path="/profile" element={<Profile {...pageProps} />} />
                    <Route path="/profile/carts" element={<Profile {...pageProps} />} />
                    <Route path="/profile/wishlists" element={<Profile {...pageProps} />} />
                    <Route path="/profile/bids" element={<Bids />} />
                    <Route path="/profile/settings" element={<Profile {...pageProps} />} />
                    <Route path="/wishlist" element={<Wishlist {...pageProps} />} />
                    <Route path="/orders" element={<OrdersPage {...pageProps} />} />
                    <Route path="/checkout" element={<Checkout {...pageProps} />} />
                    <Route path="/payment" element={<PaymentGateway {...pageProps} />} />
                  </Route>

                  <Route element={<ProtectedRoute allowedRoles={["business"]} />}>
                    <Route path="/seller/dashboard" element={<SellerDashboard />} />
                    <Route path="/main" element={<Navigate to="/seller/dashboard" replace />} />
                  </Route>

                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            </Box>
          </Box>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;

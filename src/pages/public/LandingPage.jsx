import { useEffect, useMemo, useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Container,
  Stack,
  Typography,
  useTheme,
  Skeleton,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import BuyerRecommendations from "../../components/landing/BuyerRecommendations";
import CategoryStrip from "../../components/landing/CategoryStrip";
import FeaturedProducts from "../../components/landing/FeaturedProducts";
import HeroCarousel from "../../components/landing/HeroCarousel";
import SellerCTA from "../../components/landing/SellerCTA";
import SellerQuickActions from "../../components/landing/SellerQuickActions";
import TrendingProducts from "../../components/landing/TrendingProducts";
import TrustSection from "../../components/landing/TrustSection";
import ProductRail from "../../components/landing/ProductRail";
import RecentlyViewedSection from "../../components/product/RecentlyViewedSection";
import { useAuth } from "../../context/AuthContext";

import { fetchCategories } from "../../services/categoryService";
import { getLandingContent } from "../../services/landingService";

const LandingPage = ({ darkMode, setDarkMode }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { isAuthenticated, user, userType } = useAuth();
  const [content, setContent] = useState({
    banners: [],
    categories: [],
    featuredProducts: [],
    trendingProducts: [],
    recommendedProducts: [],
    deals: [],
  });
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    getLandingContent()
      .then((data) => {
        if (alive) setContent(data);
      })
      .catch(() => {
        if (alive) setError("We could not load the latest storefront content.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;

    fetchCategories()
      .then((items) => {
        if (!alive) return;
        setCategories(items);
      })
      .catch(() => {
        if (!alive) return;
        setCategories([]);
      })
      .finally(() => {
        if (!alive) return;
        setCategoriesLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const landingCategories = useMemo(() => {
    const unique = new Map();
    [...content.categories, ...categories].forEach((category) => {
      const name = String(category?.name || "").trim().toLowerCase();
      if (name && !unique.has(name)) {
        unique.set(name, category);
      }
    });
    return Array.from(unique.values());
  }, [content.categories, categories]);

  const displayName = useMemo(() => {
    if (!user) return "";
    return user.name || [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
  }, [user]);

  const mode = !isAuthenticated ? "public" : userType === "business" ? "seller" : "buyer";

  const verificationNeeded = isAuthenticated && user && (user.isVerified === false || user.userStatus !== "active");

  const handleCategorySelect = (category) => {
    navigate(`/products?category=${encodeURIComponent(category)}`);
  };

  return (
    <>
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
      <Box
        sx={{
          bgcolor: theme.palette.mode === "dark" ? "background.default" : "#eef2f7",
          pt: { xs: 2, md: 3 },
          pb: { xs: 4, md: 6 },
        }}
      >
        <Container maxWidth="xl" sx={{ px: { xs: 1.5, sm: 2, md: 3 } }}>
          {error && <Alert severity="warning" sx={{ mb: 3 }}>{error}</Alert>}

          {verificationNeeded && (
            <Alert severity="warning" sx={{ mb: 2 }} action={
              <Button size="small" color="inherit" onClick={() => navigate("/verify-account", { state: { email: user?.email } })}>
                Verify Now
              </Button>
            }>
              Your account is not fully verified. Please verify your email and phone to access all features.
            </Alert>
          )}

          <HeroCarousel
            banners={content.banners}
            loading={loading}
            mode={mode}
            displayName={displayName}
            onNavigate={navigate}
          />

          {isAuthenticated && (
            <Box sx={{ pt: { xs: 2, md: 3 } }}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                sx={{
                  gap: 2,
                  alignItems: "center",
                  p: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 1,
                  bgcolor: theme.palette.background.paper,
                  boxShadow: "0 10px 28px rgba(15, 23, 42, 0.08)",
                }}
              >
                <Avatar src={user?.avatar}>{displayName?.charAt(0)}</Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="h6" noWrap>
                    Welcome back, {displayName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {mode === "seller"
                      ? user?.businessName || "Business seller account"
                      : "Personal shopping account"}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  onClick={() => navigate(mode === "seller" ? "/seller/dashboard" : "/profile")}
                  sx={{ borderRadius: 1, fontWeight: 900, alignSelf: { xs: "stretch", sm: "center" } }}
                >
                  {mode === "seller" ? "Seller dashboard" : "View profile"}
                </Button>
              </Stack>
            </Box>
          )}

          <CategoryStrip
            categories={landingCategories}
            loading={loading || categoriesLoading}
            onSelect={handleCategorySelect}
          />

          {mode === "seller" ? (
            <SellerQuickActions businessName={user?.businessName} onNavigate={navigate} />
          ) : null}

          {mode === "buyer" ? (
            <BuyerRecommendations
              products={content.recommendedProducts}
              loading={loading}
            />
          ) : null}

          <FeaturedProducts
            products={content.featuredProducts}
            loading={loading}
          />

          <TrendingProducts
            products={content.trendingProducts}
            loading={loading}
          />

          <ProductRail
            title="Best Deals"
            subtitle="Limited-time discounts from marketplace sellers."
            products={content.deals}
            loading={loading}
            limit={8}
          />



          <RecentlyViewedSection />

          <SellerCTA mode={mode} onNavigate={navigate} />

          {mode === "public" ? (
            <BuyerRecommendations
              products={content.recommendedProducts}
              loading={loading}
              limit={4}
            />
          ) : null}

          <TrustSection />
        </Container>
      </Box>
      <Footer />
    </>
  );
};

export default LandingPage;

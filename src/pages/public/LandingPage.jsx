import { useEffect, useMemo, useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Container,
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

const LiveMarketplace = lazy(() => import("../../components/landing/LiveMarketplace"));
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

  const displayName = useMemo(() => {
    if (!user) return "";
    return user.name || [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
  }, [user]);

  const mode = !isAuthenticated ? "public" : userType === "business" ? "seller" : "buyer";

  const handleCategorySelect = (category) => {
    navigate(`/products?category=${encodeURIComponent(category)}`);
  };

  return (
    <>
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
      <Box sx={{ bgcolor: theme.palette.background.default, pt: { xs: 2, md: 4 } }}>
        <Container maxWidth="xl">
          {error && <Alert severity="warning" sx={{ mb: 3 }}>{error}</Alert>}

          <HeroCarousel
            banners={content.banners}
            loading={loading}
            mode={mode}
            displayName={displayName}
            onNavigate={navigate}
          />

          {isAuthenticated && (
            <Box sx={{ py: { xs: 3, md: 4 } }}>
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  alignItems: "center",
                  p: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 1,
                  bgcolor: theme.palette.background.paper,
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
                >
                  {mode === "seller" ? "Seller dashboard" : "View profile"}
                </Button>
              </Box>
            </Box>
          )}

          {mode === "seller" ? (
            <SellerQuickActions businessName={user?.businessName} onNavigate={navigate} />
          ) : null}

          {mode === "buyer" ? (
            <BuyerRecommendations
              products={content.recommendedProducts}
              loading={loading}
            />
          ) : null}

          <CategoryStrip
            categories={content.categories}
            loading={loading}
            onSelect={handleCategorySelect}
          />

          <FeaturedProducts
            products={content.featuredProducts}
            loading={loading}
          />

          <TrendingProducts
            products={content.trendingProducts}
            loading={loading}
          />

          <Suspense
            fallback={
              <Box sx={{ my: 6 }}>
                {/* Skeleton for Title and Category/Filters */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4, flexWrap: "wrap", gap: 2 }}>
                  <Box>
                    <Skeleton variant="text" width={250} height={40} />
                    <Skeleton variant="text" width={180} height={20} />
                  </Box>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 18 }} />
                    <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 18 }} />
                    <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 18 }} />
                  </Box>
                </Box>
                {/* Skeleton for Search and Filter Options */}
                <Box sx={{ display: "flex", gap: 2, mb: 4, flexDirection: { xs: "column", md: "row" } }}>
                  <Skeleton variant="rectangular" height={56} sx={{ flexGrow: 1, borderRadius: 2 }} />
                  <Skeleton variant="rectangular" width={200} height={56} sx={{ borderRadius: 2 }} />
                </Box>
                {/* Skeleton for Products Grid */}
                <Grid container spacing={3}>
                  {[1, 2, 3, 4].map((item) => (
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} key={item}>
                      <Box sx={{ p: 2, border: "1px solid rgba(0,0,0,0.08)", borderRadius: 4, bgcolor: "background.paper" }}>
                        <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 3, mb: 2 }} />
                        <Skeleton variant="text" width="40%" height={20} sx={{ mb: 1 }} />
                        <Skeleton variant="text" width="90%" height={28} sx={{ mb: 1 }} />
                        <Skeleton variant="text" width="60%" height={24} sx={{ mb: 2 }} />
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Skeleton variant="rectangular" width={80} height={36} sx={{ borderRadius: 2 }} />
                          <Skeleton variant="circular" width={40} height={40} />
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            }
          >
            <LiveMarketplace />
          </Suspense>

          <RecentlyViewedSection />

          <ProductRail
            title="Deals & Offers"
            subtitle="Limited-time discounts from marketplace sellers."
            products={content.deals}
            loading={loading}
            limit={8}
          />

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

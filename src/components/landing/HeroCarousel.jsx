import { memo, useEffect, useMemo, useState } from "react";
import { Box, Button, IconButton, Skeleton, Typography } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import StorefrontIcon from "@mui/icons-material/Storefront";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";

const HeroCarousel = ({ banners = [], loading, mode, displayName, onNavigate }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return undefined;
    const timer = setInterval(() => {
      setCurrentIndex((index) => (index + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const hero = banners[currentIndex];
  const copy = useMemo(() => ({
    public: {
      title: hero?.title || "BuySell",
      description: hero?.description || "Shop products from trusted sellers with secure checkout and fast delivery.",
      primaryLabel: "Shop now",
      primaryPath: "/products",
      secondaryLabel: "Sell with us",
      secondaryPath: "/register",
    },
    buyer: {
      title: `Welcome back${displayName ? `, ${displayName.split(" ")[0]}` : ""}`,
      description: "Pick up where you left off with your cart, wishlist, orders, and fresh recommendations.",
      primaryLabel: "Continue shopping",
      primaryPath: "/products",
      secondaryLabel: "View orders",
      secondaryPath: "/orders",
    },
    seller: {
      title: `Seller home${displayName ? `, ${displayName.split(" ")[0]}` : ""}`,
      description: "Manage products, inspect performance, and jump into your seller workspace from one landing page.",
      primaryLabel: "Manage products",
      primaryPath: "/seller/dashboard",
      secondaryLabel: "View storefront",
      secondaryPath: "/products",
    },
  }[mode]), [displayName, hero, mode]);

  if (loading) {
    return <Skeleton variant="rounded" height={520} sx={{ borderRadius: 1 }} />;
  }

  return (
    <Box
      component="section"
      sx={{
        minHeight: { xs: 430, md: 520 },
        borderRadius: 1,
        overflow: "hidden",
        position: "relative",
        display: "flex",
        alignItems: "center",
        bgcolor: "grey.900",
      }}
    >
      <Box
        component="img"
        src={hero?.image || "/images/slide1.jpg"}
        alt={hero?.title || "BuySell"}
        loading="eager"
        sx={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transition: "opacity 400ms ease",
        }}
      />
      <Box sx={{ position: "absolute", inset: 0, bgcolor: "rgba(0,0,0,0.5)" }} />
      <Box sx={{ position: "relative", color: "white", p: { xs: 3, md: 7 }, maxWidth: 720 }}>
        <Typography variant="h1" sx={{ fontWeight: 900, fontSize: { xs: 38, md: 68 }, mb: 2 }}>
          {copy.title}
        </Typography>
        <Typography variant="h6" sx={{ mb: 4, maxWidth: 620, color: "rgba(255,255,255,0.9)" }}>
          {copy.description}
        </Typography>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <Button
            variant="contained"
            size="large"
            startIcon={mode === "seller" ? <StorefrontIcon /> : <ShoppingBagIcon />}
            onClick={() => onNavigate(copy.primaryPath)}
          >
            {copy.primaryLabel}
          </Button>
          <Button
            variant="outlined"
            size="large"
            startIcon={mode === "buyer" ? <ReceiptLongIcon /> : <StorefrontIcon />}
            onClick={() => onNavigate(copy.secondaryPath)}
            sx={{ color: "white", borderColor: "rgba(255,255,255,0.7)" }}
          >
            {copy.secondaryLabel}
          </Button>
        </Box>
      </Box>

      {banners.length > 1 && (
        <>
          <IconButton
            onClick={() => setCurrentIndex((currentIndex - 1 + banners.length) % banners.length)}
            sx={{ position: "absolute", left: 16, top: "50%", bgcolor: "rgba(255,255,255,0.85)" }}
          >
            <ArrowBackIosNewIcon />
          </IconButton>
          <IconButton
            onClick={() => setCurrentIndex((currentIndex + 1) % banners.length)}
            sx={{ position: "absolute", right: 16, top: "50%", bgcolor: "rgba(255,255,255,0.85)" }}
          >
            <ArrowForwardIosIcon />
          </IconButton>
        </>
      )}
    </Box>
  );
};

export default memo(HeroCarousel);

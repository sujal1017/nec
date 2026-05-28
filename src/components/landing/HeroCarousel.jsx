import { memo, useEffect, useMemo, useState } from "react";
import { Box, Button, Chip, IconButton, Skeleton, Stack, Typography } from "@mui/material";
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
    return <Skeleton variant="rounded" height={360} sx={{ borderRadius: 1 }} />;
  }

  return (
    <Box
      component="section"
      sx={{
        minHeight: { xs: 300, sm: 330, md: 360 },
        borderRadius: 1,
        overflow: "hidden",
        position: "relative",
        display: "flex",
        alignItems: "center",
        bgcolor: "grey.900",
        boxShadow: "0 16px 42px rgba(15, 23, 42, 0.16)",
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
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(90deg, rgba(7,12,22,0.86) 0%, rgba(7,12,22,0.58) 48%, rgba(7,12,22,0.08) 100%)",
        }}
      />
      <Box sx={{ position: "relative", color: "white", p: { xs: 2.5, sm: 4, md: 5 }, maxWidth: 650 }}>
        <Chip size="small" label="Big shopping days" sx={{ mb: 1.5, color: "white", bgcolor: "rgba(255,255,255,0.16)", fontWeight: 900 }} />
        <Typography variant="h1" sx={{ fontWeight: 950, fontSize: { xs: 30, sm: 42, md: 50 }, lineHeight: 1.02, mb: 1.25 }}>
          {copy.title}
        </Typography>
        <Typography variant="body1" sx={{ mb: 2.5, maxWidth: 560, color: "rgba(255,255,255,0.9)", lineHeight: 1.55 }}>
          {copy.description}
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} gap={1.5} sx={{ alignItems: { xs: "stretch", sm: "center" }, maxWidth: { xs: 280, sm: "none" } }}>
          <Button
            variant="contained"
            size="large"
            startIcon={mode === "seller" ? <StorefrontIcon /> : <ShoppingBagIcon />}
            onClick={() => onNavigate(copy.primaryPath)}
            sx={{ borderRadius: 1, fontWeight: 900, minHeight: 42 }}
          >
            {copy.primaryLabel}
          </Button>
          <Button
            variant="outlined"
            size="large"
            startIcon={mode === "buyer" ? <ReceiptLongIcon /> : <StorefrontIcon />}
            onClick={() => onNavigate(copy.secondaryPath)}
            sx={{ color: "white", borderColor: "rgba(255,255,255,0.7)", borderRadius: 1, fontWeight: 900, minHeight: 42 }}
          >
            {copy.secondaryLabel}
          </Button>
        </Stack>
      </Box>

      {banners.length > 1 && (
        <>
          <IconButton
            onClick={() => setCurrentIndex((currentIndex - 1 + banners.length) % banners.length)}
            sx={{ position: "absolute", left: 16, top: "50%", bgcolor: "rgba(255,255,255,0.88)", display: { xs: "none", md: "inline-flex" } }}
          >
            <ArrowBackIosNewIcon />
          </IconButton>
          <IconButton
            onClick={() => setCurrentIndex((currentIndex + 1) % banners.length)}
            sx={{ position: "absolute", right: 16, top: "50%", bgcolor: "rgba(255,255,255,0.88)", display: { xs: "none", md: "inline-flex" } }}
          >
            <ArrowForwardIosIcon />
          </IconButton>
        </>
      )}
    </Box>
  );
};

export default memo(HeroCarousel);

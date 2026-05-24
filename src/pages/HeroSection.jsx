import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardMedia,
  Grid,
  Button,
  Container,
  Paper,
  IconButton,
  useTheme,
  useMediaQuery,
  Fade,
  Grow,
} from "@mui/material";
import { styled } from "@mui/system";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import SecurityIcon from "@mui/icons-material/Security";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import StarIcon from "@mui/icons-material/Star";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { BaseUrl,name } from "../config";

// -------------------- THEME COLORS --------------------
const colors = {
  primary: { light: "#2563eb", dark: "#3b82f6" },
  secondary: { light: "#f59e0b", dark: "#fbbf24" },
  background: { light: "#f8fafc", dark: "#0f172a" },
  text: { light: "#1e293b", dark: "#f1f5f9" },
  border: { light: "#e2e8f0", dark: "#1e293b" },
  hover: { light: "#1d4ed8", dark: "#60a5fa" },
  overlay: { light: "rgba(0, 0, 0, 0.4)", dark: "rgba(0, 0, 0, 0.6)" },
};

// -------------------- STYLED COMPONENTS --------------------
const BannerBox = styled(Box)(({ theme }) => ({
  position: "relative",
  width: "100%",
  maxWidth: "1400px",
  margin: "0 auto",
  height: "min(70vh, 600px)",
  borderRadius: "20px",
  overflow: "hidden",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor:
    theme.palette.mode === "dark"
      ? colors.background.dark
      : colors.background.light,
  boxShadow:
    "0 8px 24px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.05)",
}));

const BannerImage = styled("img")({
  width: "100%",
  height: "100%",
  objectFit: "cover",
  transition: "opacity 0.6s ease-in-out",
  position: "absolute",
  borderRadius: "inherit",
});

const Overlay = styled(Box)(({ theme }) => ({
  position: "absolute",
  inset: 0,
  background: `linear-gradient(to bottom right, ${colors.overlay.light}, transparent)`,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "flex-start",
  color: "#fff",
  padding: theme.spacing(5, 6),
  borderRadius: "inherit",
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(3),
    alignItems: "center",
    textAlign: "center",
  },
}));

const CategoryCard = styled(Card)(({ theme }) => ({
  cursor: "pointer",
  borderRadius: "16px",
  overflow: "hidden",
  transition: "all 0.3s ease",
  backgroundColor:
    theme.palette.mode === "dark" ? colors.background.dark : "#fff",
  border: `1px solid ${
    theme.palette.mode === "dark" ? colors.border.dark : colors.border.light
  }`,
  "&:hover": {
    transform: "translateY(-5px)",
    boxShadow:
      "0 8px 20px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.1)",
  },
}));

const CategoryOverlay = styled(Box)({
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  padding: "16px 24px",
  background: "linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.3), transparent)",
  color: "#fff",
  fontWeight: 700,
  fontSize: "1.2rem",
  letterSpacing: "0.5px",
  textAlign: "center",
});

const FeaturePaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  textAlign: "center",
  height: "100%",
  borderRadius: "16px",
  border: `1px solid ${
    theme.palette.mode === "dark" ? colors.border.dark : colors.border.light
  }`,
  transition: "all 0.3s ease",
  backgroundColor:
    theme.palette.mode === "dark" ? colors.background.dark : "#fff",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
  },
}));

// -------------------- MAIN COMPONENT --------------------
const HeroSection = ({ darkMode, setDarkMode }) => {
  const [ads, setAds] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    fetch("/ads.json")
      .then((res) => res.json())
      .then((data) => setAds(data))
      .catch(() => console.error("Failed to load ads"));

    fetch("/categories.json")
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch(() => console.error("Failed to load categories"));
  }, []);

  // Auto-slide banners
  useEffect(() => {
    if (!ads.length) return;
    const timer = setInterval(() => {
      setFadeIn(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % ads.length);
        setFadeIn(true);
      }, 500);
    }, 5000);
    return () => clearInterval(timer);
  }, [ads]);

  const handleCategoryClick = (key) => {
    navigate(`/products?category=${encodeURIComponent(key)}`);
    window.scrollTo(0, 0);
  };

  const displayCategories = useMemo(() => {
    const seen = new Set();
    return categories
      .map((c) => {
        const lower = (c.name || "").toLowerCase();
        const key = lower.replace(/\s+/g, "-");
        if (seen.has(key)) return null;
        seen.add(key);
        return { ...c, _routeKey: key };
      })
      .filter(Boolean);
  }, [categories]);

  return (
    <>
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
      <Box
        sx={{
          mt: { xs: "70px", md: "90px" },
          bgcolor:
            theme.palette.mode === "dark"
              ? colors.background.dark
              : colors.background.light,
        }}
      >
        {/* -------------------- HERO BANNER -------------------- */}
        <Container sx={{ py: { xs: 2, md: 4 } }}>
          <BannerBox>
            {ads.length > 0 && (
              <>
                <Fade in={fadeIn} timeout={600}>
                  <BannerImage
                    src={ads[currentIndex].image}
                    alt={ads[currentIndex].title}
                  />
                </Fade>

                <Overlay>
                  <Fade in={fadeIn} timeout={700}>
                    <Box sx={{ maxWidth: { xs: "90%", md: "500px" } }}>
                      <Typography
                        variant="h3"
                        sx={{
                          fontWeight: 800,
                          mb: 1,
                          fontSize: { xs: "1.8rem", sm: "2.4rem", md: "3rem" },
                        }}
                      >
                        {ads[currentIndex].title}
                      </Typography>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          mb: 3,
                          opacity: 0.9,
                          fontSize: { xs: "1rem", md: "1.2rem" },
                        }}
                      >
                        {ads[currentIndex].description}
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<ShoppingBagIcon />}
                        size={isMobile ? "medium" : "large"}
                        sx={{
                          px: 4,
                          py: 1.2,
                          fontWeight: 600,
                          borderRadius: "10px",
                          backgroundColor: colors.primary.light,
                          "&:hover": { backgroundColor: colors.hover.light },
                        }}
                      >
                        Shop Now
                      </Button>
                    </Box>
                  </Fade>
                </Overlay>

                {/* Arrows */}
                <IconButton
                  onClick={() =>
                    setCurrentIndex(
                      (currentIndex - 1 + ads.length) % ads.length
                    )
                  }
                  sx={{
                    position: "absolute",
                    left: 16,
                    top: "50%",
                    transform: "translateY(-50%)",
                    bgcolor: "rgba(255,255,255,0.8)",
                  }}
                >
                  <ArrowBackIosIcon />
                </IconButton>
                <IconButton
                  onClick={() => setCurrentIndex((currentIndex + 1) % ads.length)}
                  sx={{
                    position: "absolute",
                    right: 16,
                    top: "50%",
                    transform: "translateY(-50%)",
                    bgcolor: "rgba(255,255,255,0.8)",
                  }}
                >
                  <ArrowForwardIosIcon />
                </IconButton>

                {/* Dots */}
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 20,
                    width: "100%",
                    display: "flex",
                    justifyContent: "center",
                    gap: 1,
                  }}
                >
                  {ads.map((_, i) => (
                    <FiberManualRecordIcon
                      key={i}
                      sx={{
                        fontSize: 10,
                        color:
                          i === currentIndex
                            ? colors.secondary.light
                            : "rgba(255,255,255,0.6)",
                        cursor: "pointer",
                      }}
                      onClick={() => setCurrentIndex(i)}
                    />
                  ))}
                </Box>
              </>
            )}
          </BannerBox>
        </Container>

        {/* -------------------- CATEGORIES -------------------- */}
        <Container sx={{ py: { xs: 4, md: 6 } }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              mb: 6,
              textAlign: "center",
              background: theme.palette.mode === "dark" 
                ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                : "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" },
              letterSpacing: "-0.02em",
              position: "relative",
              "&::after": {
                content: '""',
                position: "absolute",
                bottom: "-8px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "80px",
                height: "4px",
                background: theme.palette.mode === "dark"
                  ? "linear-gradient(90deg, #667eea, #764ba2)"
                  : "linear-gradient(90deg, #2563eb, #7c3aed)",
                borderRadius: "2px",
              },
            }}
          >
            Shop by Category
          </Typography>

          <Grid container spacing={3} justifyContent="center">
            {displayCategories.map((cat, i) => (
              <Grid item xs={12} sm={6} md={6} key={cat._routeKey}>
                <Grow in timeout={400} style={{ transitionDelay: `${i * 80}ms` }}>
                  <CategoryCard
                    onClick={() => handleCategoryClick(cat._routeKey)}
                    sx={{
                      width: "100%",
                      borderRadius: "20px",
                      maxWidth: { xs: "100%", sm: "400px", md: "450px" },
                      mx: "auto",
                    }}
                  >
                    <Box sx={{ position: "relative" }}>
                      <CardMedia
                        component="img"
                        image={cat.image}
                        alt={cat.name}
                        sx={{
                          width: "100%",
                          height: { xs: 250, sm: 300, md: 350 },
                          objectFit: "cover",
                        }}
                      />
                      <CategoryOverlay>{cat.name}</CategoryOverlay>
                    </Box>
                  </CategoryCard>
                </Grow>
              </Grid>
            ))}
          </Grid>
        </Container>


        {/* -------------------- FEATURES -------------------- */}
        <Box
          sx={{
            py: { xs: 5, md: 7 },
            borderTop: `1px solid ${
              theme.palette.mode === "dark"
                ? colors.border.dark
                : colors.border.light
            }`,
          }}
        >
          <Container>
            <Grid container spacing={3} justifyContent="center">
              {[
                {
                  icon: <LocalShippingIcon fontSize="large" color="primary" />,
                  title: "Free Shipping",
                  desc: "On orders over $50",
                },
                {
                  icon: <SecurityIcon fontSize="large" color="primary" />,
                  title: "Secure Payment",
                  desc: "100% safe checkout",
                },
                {
                  icon: <FlashOnIcon fontSize="large" color="primary" />,
                  title: "Fast Delivery",
                  desc: "2-3 day shipping",
                },
                {
                  icon: <StarIcon fontSize="large" color="primary" />,
                  title: "Best Quality",
                  desc: "Trusted products",
                },
              ].map((f, i) => (
                <Grid item xs={6} sm={3} key={i} sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Grow in timeout={500}>
                    <FeaturePaper sx={{ maxWidth: { xs: '100%', sm: '250px' }, width: '100%' }}>
                      {f.icon}
                      <Typography variant="subtitle1" fontWeight={700}>
                        {f.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {f.desc}
                      </Typography>
                    </FeaturePaper>
                  </Grow>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* -------------------- CTA -------------------- */}
        <Container sx={{ py: { xs: 5, md: 8 }, textAlign: "center" }}>
          <Grow in timeout={500}>
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  mb: 2,
                  color:
                    theme.palette.mode === "dark"
                      ? colors.text.dark
                      : colors.text.light,
                }}
              >
                Ready to Start Shopping?
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mb: 4, maxWidth: "600px", mx: "auto" }}
              >
                Join millions of happy customers who trust us for their shopping
                needs.
              </Typography>
              <Button
                variant="contained"
                startIcon={<ShoppingBagIcon />}
                sx={{
                  px: 4,
                  py: 1.3,
                  fontWeight: 600,
                  borderRadius: "10px",
                  backgroundColor: colors.primary.light,
                  "&:hover": { backgroundColor: colors.hover.light },
                }}
              >
                Start Shopping
              </Button>
            </Box>
          </Grow>
        </Container>
      </Box>
      <Footer />
    </>
  );
};

export default HeroSection;

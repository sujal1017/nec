import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Avatar,
  Box,
  Chip,
  Container,
  Divider,
  Paper,
  Rating,
  Skeleton,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LocalPhoneOutlinedIcon from "@mui/icons-material/LocalPhoneOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import EcommerceProductCard from "../components/product/EcommerceProductCard";
import { fetchPublicSellerProfile } from "../services/sellerService";

const formatDate = (value) => {
  if (!value) return "Recently joined";
  return new Date(value).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
};

const SellerProfile = ({ darkMode, setDarkMode }) => {
  const { id } = useParams();
  const theme = useTheme();
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchPublicSellerProfile(id)
      .then((data) => {
        if (alive) setSeller(data);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [id]);

  const distribution = useMemo(() => seller?.rating_distribution || {}, [seller]);
  const maxRatingCount = Math.max(1, ...Object.values(distribution).map(Number));

  return (
    <>
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
      <Box sx={{ bgcolor: theme.palette.mode === "dark" ? "background.default" : "#f4f6f8", minHeight: "100vh", py: { xs: 2, md: 4 } }}>
        <Container maxWidth="xl">
          {loading ? (
            <Stack spacing={2}>
              <Skeleton variant="rounded" height={260} />
              <Skeleton variant="rounded" height={180} />
            </Stack>
          ) : seller ? (
            <Stack spacing={3}>
              <Paper variant="outlined" sx={{ overflow: "hidden", borderRadius: 1 }}>
                <Box
                  sx={{
                    height: { xs: 180, md: 260 },
                    backgroundImage: `linear-gradient(90deg, rgba(0,0,0,.55), rgba(0,0,0,.1)), url(${seller.banner_image})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
                <Stack direction={{ xs: "column", md: "row" }} spacing={2.5} sx={{ p: { xs: 2, md: 3 }, mt: { xs: -7, md: -8 }, alignItems: { xs: "flex-start", md: "flex-end" } }}>
                  <Avatar src={seller.profile_image} sx={{ width: 132, height: 132, border: "4px solid", borderColor: "background.paper" }}>
                    {seller.name?.charAt(0)}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                      <Typography variant="h4" fontWeight={950}>{seller.name}</Typography>
                      {seller.verified ? <Chip color="success" size="small" label="Verified seller" sx={{ borderRadius: 1 }} /> : null}
                    </Stack>
                    <Typography color="text.secondary" sx={{ mt: 0.5 }}>{seller.shop_name}</Typography>
                    <Stack direction="row" gap={1.5} alignItems="center" flexWrap="wrap" sx={{ mt: 1 }}>
                      <Rating value={Number(seller.rating || 0)} precision={0.1} readOnly size="small" />
                      <Typography variant="body2" fontWeight={800}>{seller.rating} average rating</Typography>
                      <Typography variant="body2" color="text.secondary">{seller.total_reviews} reviews</Typography>
                      <Typography variant="body2" color="text.secondary">Member since {formatDate(seller.joined_date)}</Typography>
                    </Stack>
                  </Box>
                </Stack>
              </Paper>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 8 }}>
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 1, height: "100%" }}>
                    <Typography variant="h6" fontWeight={950}>About Seller</Typography>
                    <Typography color="text.secondary" sx={{ mt: 1, lineHeight: 1.7 }}>{seller.description}</Typography>
                    <Divider sx={{ my: 2 }} />
                    <Grid container spacing={1.5}>
                      {[
                        [EmailOutlinedIcon, seller.email],
                        [LocalPhoneOutlinedIcon, seller.phone],
                        [LocationOnOutlinedIcon, seller.address],
                        [PeopleAltOutlinedIcon, `${Number(seller.followers || 0).toLocaleString("en-IN")} followers`],
                        [StorefrontOutlinedIcon, `${seller.total_products} products`],
                      ].map(([Icon, label]) => (
                        <Grid size={{ xs: 12, sm: 6 }} key={label}>
                          <Stack direction="row" gap={1} alignItems="center">
                            <Icon color="primary" fontSize="small" />
                            <Typography variant="body2">{label}</Typography>
                          </Stack>
                        </Grid>
                      ))}
                    </Grid>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 1 }}>
                    <Typography variant="h6" fontWeight={950}>Rating Distribution</Typography>
                    <Stack spacing={1.1} sx={{ mt: 2 }}>
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = Number(distribution[String(star)] || 0);
                        return (
                          <Stack key={star} direction="row" alignItems="center" gap={1}>
                            <Typography variant="body2" sx={{ width: 28 }}>{star} star</Typography>
                            <Box sx={{ flex: 1, height: 8, bgcolor: "action.hover", borderRadius: 1, overflow: "hidden" }}>
                              <Box sx={{ width: `${(count / maxRatingCount) * 100}%`, height: "100%", bgcolor: "warning.main" }} />
                            </Box>
                            <Typography variant="body2" sx={{ width: 20, textAlign: "right" }}>{count}</Typography>
                          </Stack>
                        );
                      })}
                    </Stack>
                  </Paper>
                </Grid>
              </Grid>

              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 1 }}>
                <Typography variant="h6" fontWeight={950} sx={{ mb: 2 }}>All Products</Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)", xl: "repeat(5, 1fr)" }, gap: 2 }}>
                  {(seller.products || []).map((product) => <EcommerceProductCard key={product.id} product={product} dense />)}
                </Box>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 1 }}>
                <Typography variant="h6" fontWeight={950} sx={{ mb: 2 }}>Customer Reviews About Seller</Typography>
                <Stack spacing={1.5}>
                  {(seller.reviews || []).map((review) => (
                    <Box key={review.id} sx={{ borderBottom: "1px solid", borderColor: "divider", pb: 1.5 }}>
                      <Stack direction="row" gap={1.5} alignItems="center">
                        <Avatar src={review.customer_profile_image}>{review.customer_name?.charAt(0)}</Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography fontWeight={900}>{review.customer_name}</Typography>
                          <Rating value={review.rating} size="small" readOnly />
                        </Box>
                        <Chip size="small" label={review.verified ? "Verified Purchase" : "Review"} sx={{ borderRadius: 1 }} />
                      </Stack>
                      <Typography fontWeight={800} sx={{ mt: 1 }}>{review.title}</Typography>
                      <Typography color="text.secondary" variant="body2">{review.comment}</Typography>
                    </Box>
                  ))}
                </Stack>
              </Paper>
            </Stack>
          ) : (
            <Paper variant="outlined" sx={{ p: 4, borderRadius: 1 }}>
              <Typography variant="h6">Seller not found.</Typography>
            </Paper>
          )}
        </Container>
      </Box>
      <Footer />
    </>
  );
};

export default SellerProfile;

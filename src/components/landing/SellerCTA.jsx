import { memo } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import StorefrontIcon from "@mui/icons-material/Storefront";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

const SellerCTA = ({ mode, onNavigate }) => (
  <Box
    component="section"
    sx={{
      my: { xs: 1.5, md: 2 },
      p: { xs: 2.5, md: 3.5 },
      borderRadius: 1,
      color: "white",
      background:
        "linear-gradient(120deg, #111827 0%, #1d4ed8 52%, #f59e0b 100%)",
      display: "flex",
      gap: 2,
      alignItems: { xs: "flex-start", md: "center" },
      justifyContent: "space-between",
      flexDirection: { xs: "column", md: "row" },
      overflow: "hidden",
      position: "relative",
      boxShadow: "0 16px 42px rgba(29, 78, 216, 0.22)",
      "&:after": {
        content: '""',
        position: "absolute",
        right: { xs: -70, md: 32 },
        top: -40,
        width: 190,
        height: 190,
        borderRadius: "50%",
        bgcolor: "rgba(255,255,255,0.12)",
      },
    }}
  >
    <Box sx={{ position: "relative", zIndex: 1 }}>
      <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 0.75 }}>
        <TrendingUpIcon fontSize="small" />
        <Typography variant="overline" fontWeight={900} sx={{ color: "rgba(255,255,255,0.85)" }}>
          Marketplace partner program
        </Typography>
      </Stack>
      <Typography variant="h5" fontWeight={950} sx={{ fontSize: { xs: 24, md: 32 }, lineHeight: 1.12 }}>
        {mode === "seller" ? "Grow your storefront today" : "Become a Seller"}
      </Typography>
      <Typography sx={{ opacity: 0.9, mt: 0.75, maxWidth: 680 }}>
        Reach more customers, manage listings, and track performance from one marketplace dashboard.
      </Typography>
    </Box>
    <Button
      variant="contained"
      size="large"
      startIcon={<StorefrontIcon />}
      onClick={() => onNavigate(mode === "seller" ? "/seller/dashboard" : "/register")}
      sx={{
        position: "relative",
        zIndex: 1,
        bgcolor: "#facc15",
        color: "#111827",
        borderRadius: 1,
        fontWeight: 950,
        px: 3,
        "&:hover": { bgcolor: "#fde047" },
      }}
    >
      {mode === "seller" ? "Open dashboard" : "Start selling"}
    </Button>
  </Box>
);

export default memo(SellerCTA);

import { memo } from "react";
import { Box, Button, Typography } from "@mui/material";
import StorefrontIcon from "@mui/icons-material/Storefront";

const SellerCTA = ({ mode, onNavigate }) => (
  <Box
    component="section"
    sx={{
      my: { xs: 3, md: 5 },
      p: { xs: 3, md: 5 },
      borderRadius: 1,
      bgcolor: "primary.main",
      color: "primary.contrastText",
      display: "flex",
      gap: 2,
      alignItems: { xs: "flex-start", md: "center" },
      justifyContent: "space-between",
      flexDirection: { xs: "column", md: "row" },
    }}
  >
    <Box>
      <Typography variant="h4" fontWeight={900}>
        {mode === "seller" ? "Grow your storefront today" : "Become a Seller"}
      </Typography>
      <Typography sx={{ opacity: 0.9, mt: 0.5 }}>
        Reach more customers, manage listings, and track performance from one marketplace dashboard.
      </Typography>
    </Box>
    <Button
      variant="contained"
      color="secondary"
      size="large"
      startIcon={<StorefrontIcon />}
      onClick={() => onNavigate(mode === "seller" ? "/seller/dashboard" : "/register")}
    >
      {mode === "seller" ? "Open dashboard" : "Start selling"}
    </Button>
  </Box>
);

export default memo(SellerCTA);

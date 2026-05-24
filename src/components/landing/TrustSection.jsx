import { memo } from "react";
import { Chip, Grid } from "@mui/material";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import StorefrontIcon from "@mui/icons-material/Storefront";

const TrustSection = () => (
  <Grid container spacing={2} component="section" sx={{ py: { xs: 3, md: 5 } }}>
    {[
      { icon: <VerifiedUserIcon />, label: "Secure payments" },
      { icon: <LocalShippingIcon />, label: "Fast delivery" },
      { icon: <StorefrontIcon />, label: "Verified sellers" },
    ].map((item) => (
      <Grid item xs={12} md={4} key={item.label}>
        <Chip icon={item.icon} label={item.label} sx={{ width: "100%", py: 3, borderRadius: 1, fontWeight: 800 }} />
      </Grid>
    ))}
  </Grid>
);

export default memo(TrustSection);

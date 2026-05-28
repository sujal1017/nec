import { memo } from "react";
import { Box, Chip } from "@mui/material";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import StorefrontIcon from "@mui/icons-material/Storefront";

const TrustSection = () => (
  <Box
    component="section"
    sx={{
      display: "grid",
      gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
      gap: 1.25,
      py: { xs: 1.5, md: 2 },
    }}
  >
    {[
      { icon: <VerifiedUserIcon />, label: "Secure payments" },
      { icon: <LocalShippingIcon />, label: "Fast delivery" },
      { icon: <StorefrontIcon />, label: "Verified sellers" },
    ].map((item) => (
      <Chip
        key={item.label}
        icon={item.icon}
        label={item.label}
        sx={{
          width: "100%",
          height: 44,
          borderRadius: 1,
          fontWeight: 900,
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
        }}
      />
    ))}
  </Box>
);

export default memo(TrustSection);

import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Skeleton, Stack, Typography } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import EcommerceProductCard from "../product/EcommerceProductCard";

const ProductRail = ({ title, subtitle, products = [], loading, limit = 8 }) => {
  const navigate = useNavigate();
  const items = loading ? Array.from({ length: limit }) : products.slice(0, limit);

  if (!loading && !items.length) return null;

  return (
    <Box
      component="section"
      sx={{
        py: { xs: 2, md: 2.5 },
        px: { xs: 1.25, md: 2 },
        my: { xs: 1.5, md: 2 },
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        boxShadow: (theme) => (theme.palette.mode === "dark" ? "none" : "0 10px 28px rgba(15, 23, 42, 0.06)"),
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2} sx={{ mb: 1.75 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 950, fontSize: { xs: 18, md: 22 }, lineHeight: 1.15 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: { xs: "none", sm: "block" } }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <Button size="small" endIcon={<ArrowForwardIcon />} onClick={() => navigate("/products")} sx={{ fontWeight: 900, whiteSpace: "nowrap" }}>
          View all
        </Button>
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridAutoFlow: "column",
          gridAutoColumns: { xs: "72%", sm: "38%", md: "24%", lg: "19%" },
          gap: 1.5,
          overflowX: "auto",
          overscrollBehaviorX: "contain",
          scrollSnapType: "x mandatory",
          pb: 0.75,
          scrollbarWidth: "thin",
        }}
      >
        {items.map((product, index) => (
          <Box key={product?.id || index} sx={{ scrollSnapAlign: "start" }}>
            {loading ? (
              <Skeleton variant="rounded" height={318} sx={{ width: "100%", borderRadius: 1 }} />
            ) : (
              <EcommerceProductCard product={product} dense />
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default memo(ProductRail);

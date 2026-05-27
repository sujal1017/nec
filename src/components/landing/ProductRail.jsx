import { memo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Grid,
  Rating,
  Skeleton,
  Typography,
} from "@mui/material";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

const ProductRail = ({ title, subtitle, products = [], loading, limit = 8 }) => {
  const navigate = useNavigate();
  const items = loading ? Array.from({ length: limit }) : products.slice(0, limit);

  return (
    <Box component="section" sx={{ py: { xs: 3, md: 5 } }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, mb: 2, alignItems: "end" }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, fontSize: { xs: 24, md: 32 } }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        <Button onClick={() => navigate("/products")}>View all</Button>
      </Box>

      <Grid container spacing={2}>
        {items.map((product, index) => (
          <Grid item xs={6} sm={4} md={3} lg={1.5} key={product?.id || index}>
            {loading ? (
              <Skeleton variant="rounded" height={276} />
            ) : (
              <Card
                onClick={() => navigate(`/product/${product.id}`)}
                sx={{
                  cursor: "pointer",
                  height: "100%",
                  borderRadius: 1,
                  position: "relative",
                  transition: "transform 180ms ease, box-shadow 180ms ease",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 6,
                  },
                }}
              >
                {product.discount_price ? (
                  <Chip
                    size="small"
                    label="Offer"
                    color="error"
                    sx={{ position: "absolute", top: 8, left: 8, zIndex: 1, fontWeight: 800 }}
                  />
                ) : null}
                <CardMedia
                  component="img"
                  image={product.image || "/images/headphones.jpg"}
                  alt={product.name}
                  loading="lazy"
                  sx={{ height: { xs: 150, md: 170 }, objectFit: "cover" }}
                />
                <CardContent sx={{ p: 1.5 }}>
                  <Typography variant="subtitle2" fontWeight={800} noWrap>
                    {product.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: "capitalize" }} noWrap>
                    {product.category}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                    <Rating value={product.rating || 0} precision={0.5} size="small" readOnly />
                    <Typography variant="caption" color="text.secondary">
                      {product.rating || "New"}
                    </Typography>
                  </Box>
                  <Typography variant="h6" sx={{ mt: 0.5, fontWeight: 900 }}>
                    {currency.format(Number(product.discount_price || product.price || 0))}
                  </Typography>
                  {product.discount_price ? (
                    <Typography variant="caption" color="text.secondary" sx={{ textDecoration: "line-through" }}>
                      {currency.format(Number(product.price || 0))}
                    </Typography>
                  ) : null}
                </CardContent>
              </Card>
            )}
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default memo(ProductRail);

import React from "react";
import { Box, Button, Card, CardContent, CardMedia, Rating, Typography } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";

const ProductMiniRail = ({ title, products = [], emptyText, limit = 6 }) => {
  const navigate = useNavigate();
  const items = products.slice(0, limit);
  if (!items.length && !emptyText) return null;

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
        {title}
      </Typography>
      {items.length ? (
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 2 }}>
          {items.map((product) => (
            <Card key={product.id} component={Link} to={`/product/${product.id}`} sx={{ textDecoration: "none", color: "inherit", height: "100%" }}>
              <CardMedia component="img" image={product.image} alt={product.name} sx={{ height: 140, objectFit: "contain", p: 1, bgcolor: "background.default" }} />
              <CardContent sx={{ p: 1.5 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ minHeight: 40 }} noWrap>
                  {product.name}
                </Typography>
                <Typography color="primary" fontWeight={700}>
                  ₹{Number(product.price || 0).toLocaleString("en-IN")}
                </Typography>
                <Rating value={Number(product.rating || 0)} size="small" precision={0.5} readOnly />
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        <Box sx={{ p: 3, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
          <Typography color="text.secondary">{emptyText}</Typography>
          <Button sx={{ mt: 1 }} onClick={() => navigate("/products")}>Browse products</Button>
        </Box>
      )}
    </Box>
  );
};

export default ProductMiniRail;

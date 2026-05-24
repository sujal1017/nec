import React from "react";
import { Card, CardMedia, CardContent, Typography, Box, Rating } from "@mui/material";

const ProductCard = ({ product }) => {
  return (
    <Card sx={{ display: "flex", alignItems: "center", p: 2, mb: 2 }}>
      <CardMedia
        component="img"
        sx={{ width: 100, height: 100, objectFit: "contain", mr: 2 }}
        image={product.image}
        alt={product.name}
      />
      <CardContent sx={{ flex: 1 }}>
        <Typography variant="h6">{product.name}</Typography>
        <Typography variant="body1" color="primary">${product.price}</Typography>
        <Box display="flex" alignItems="center">
          <Rating value={product.rating} precision={0.1} readOnly />
          <Typography variant="body2" sx={{ ml: 1 }}>
            ({product.rating})
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ProductCard;

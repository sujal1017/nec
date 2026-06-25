import { memo, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  IconButton,
  Rating,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { addToCart, fetchCart } from "../../services/commerceService";
import { FALLBACK_PRODUCT_IMAGE, handleImageFallback } from "../../utils/images";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const clampStyles = (lines) => ({
  display: "-webkit-box",
  WebkitLineClamp: lines,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
});

const getProductUrl = (product) => `/product/${product.id}`;

const EcommerceProductCard = ({ product, dense = false, onCartAdded }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [adding, setAdding] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  const [wishlisted, setWishlisted] = useState(() => {
    const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
    return wishlist.some((item) => String(item.id || item.product_id) === String(product?.id));
  });

  const pricing = useMemo(() => {
    const price = Number(product?.price || 0);
    const offerPrice = Number(product?.discount_price || product?.salePrice || 0);
    const hasOffer = offerPrice > 0 && offerPrice < price;
    const finalPrice = hasOffer ? offerPrice : price;
    const discountPercent = hasOffer ? Math.round(((price - offerPrice) / price) * 100) : Number(product?.discountPercentage || 0);

    return { price, finalPrice, hasOffer, discountPercent };
  }, [product]);

  useEffect(() => {
    if (!product?.id) return;
    let alive = true;
    fetchCart()
      .then((carts) => {
        const found = carts.some((cart) =>
          (cart.items || []).some((item) => String(item.product_id || item.product || item.id) === String(product.id))
        );
        if (alive) setIsInCart(found);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [product?.id]);

  const handleWishlist = (event) => {
    event.stopPropagation();
    const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
    const exists = wishlist.some((item) => String(item.id || item.product_id) === String(product.id));
    const next = exists
      ? wishlist.filter((item) => String(item.id || item.product_id) !== String(product.id))
      : [...wishlist, product];

    localStorage.setItem("wishlist", JSON.stringify(next));
    setWishlisted(!exists);
    window.dispatchEvent(new Event("storage"));
  };

  const handleAddToCart = async (event) => {
    event.stopPropagation();
    if (!isAuthenticated) {
      navigate("/signin", {
        state: {
          from: {
            pathname: `/product/${product.id}`,
            state: {
              intendedAction: "addToCart",
              productId: product.id,
              quantity: 1,
            },
          },
        },
      });
      return;
    }
    if (isInCart) {
      navigate("/cart");
      return;
    }
    setAdding(true);
    try {
      await addToCart({
        productId: product.id,
        quantity: 1,
        selectedOptions: {},
        name: product.name || product.title,
        price: pricing.finalPrice,
        image: product.image,
        is_live: product.isLive,
      });
      setIsInCart(true);
      onCartAdded?.(product);
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = async (event) => {
    event.stopPropagation();
    if (!isAuthenticated) {
      navigate("/signin", {
        state: {
          from: {
            pathname: "/checkout",
            state: {
              buyNow: true,
              productId: product.id,
              productName: product.name || product.title,
              price: pricing.finalPrice,
              image: product.image,
              quantity: 1,
            },
          },
        },
      });
      return;
    }
    if (!isInCart) await handleAddToCart(event);
    navigate("/checkout", {
      state: {
        buyNow: true,
        productId: product.id,
        productName: product.name || product.title,
        price: pricing.finalPrice,
        image: product.image,
        quantity: 1,
      },
    });
  };

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        minHeight: dense ? 350 : 390,
        display: "flex",
        flexDirection: "column",
        borderRadius: 1,
        border: "1px solid",
        borderColor: "divider",
        overflow: "hidden",
        position: "relative",
        bgcolor: "background.paper",
        boxShadow: (theme) => (theme.palette.mode === "dark" ? "0 10px 28px rgba(0,0,0,0.22)" : "0 10px 26px rgba(15, 23, 42, 0.08)"),
        transition: "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",
        "&:hover": {
          transform: "translateY(-3px)",
          borderColor: "primary.light",
          boxShadow: "0 18px 40px rgba(15, 23, 42, 0.16)",
        },
      }}
    >
      {pricing.discountPercent > 0 ? (
        <Chip
          size="small"
          color="error"
          label={`${Math.round(pricing.discountPercent)}% OFF`}
          sx={{ position: "absolute", top: 10, left: 10, zIndex: 2, fontWeight: 900, borderRadius: 1 }}
        />
      ) : null}

      <Tooltip title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}>
        <IconButton
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          onClick={handleWishlist}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 2,
            width: 36,
            height: 36,
            bgcolor: "rgba(255,255,255,0.92)",
            color: wishlisted ? "error.main" : "text.secondary",
            "&:hover": { bgcolor: "background.paper", color: "error.main" },
          }}
        >
          {wishlisted ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
        </IconButton>
      </Tooltip>

      <CardActionArea
        onClick={() => navigate(getProductUrl(product))}
        sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "stretch" }}
      >
        <Box sx={{ bgcolor: (theme) => (theme.palette.mode === "dark" ? "#151b2b" : "#f7f9fc"), p: 1.25, height: 220, }}>
          <CardMedia
            component="img"
            image={product.image || FALLBACK_PRODUCT_IMAGE}
            alt={product.name || product.title || "Product image"}
            loading="lazy"
            onError={handleImageFallback}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              display: "block",
              margin: "0 auto",
              maxWidth: "100%",
              maxHeight: "100%",
              mixBlendMode: "multiply",
              filter: (theme) => (theme.palette.mode === "dark" ? "none" : "drop-shadow(0 8px 14px rgba(15,23,42,0.08))"),
            }}
          />
        </Box>

        <CardContent sx={{ p: dense ? 1.5 : 1.75, flex: 1, width: "100%", display: "flex", flexDirection: "column" }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} sx={{ mb: 0.75 }}>
            <Typography variant="caption" color="primary.main" fontWeight={900} sx={{ textTransform: "uppercase" }} noWrap>
              {product.category || product.brand || "Marketplace"}
            </Typography>
            {product.in_stock === false || product.stock === 0 ? (
              <Chip size="small" label="Out" color="default" sx={{ height: 20, borderRadius: 1 }} />
            ) : null}
          </Stack>

          <Typography
            variant="subtitle2"
            fontWeight={900}
            color="text.primary"
            sx={{ ...clampStyles(2), minHeight: 38, lineHeight: 1.3 }}
          >
            {product.name || product.title}
          </Typography>

          <Stack direction="row" alignItems="center" gap={0.75} sx={{ mt: 0.75 }}>
            <Rating value={Number(product.rating || 0)} precision={0.5} size="small" readOnly />
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              {Number(product.rating || 0) > 0 ? Number(product.rating).toFixed(1) : "New"}
            </Typography>
          </Stack>

          {product.seller_name ? (
            <Typography variant="caption" color="text.secondary" noWrap sx={{ mt: 0.5 }}>
              Seller: {product.seller_name}
            </Typography>
          ) : null}

          <Box sx={{ mt: 1 }}>
            <Stack direction="row" alignItems="baseline" gap={1} flexWrap="wrap">
              <Typography variant={dense ? "subtitle1" : "h6"} fontWeight={950}>
                {currency.format(pricing.finalPrice)}
              </Typography>
              {pricing.hasOffer ? (
                <Typography variant="caption" color="text.secondary" sx={{ textDecoration: "line-through" }}>
                  {currency.format(pricing.price)}
                </Typography>
              ) : null}
            </Stack>
            <Stack direction="row" alignItems="center" gap={0.5} sx={{ mt: 0.5, minHeight: 20 }}>
              <LocalShippingOutlinedIcon sx={{ fontSize: 16, color: "success.main" }} />
              <Typography variant="caption" color="text.secondary" noWrap>
                {product.shippingInformation || "Free delivery available"}
              </Typography>
            </Stack>
          </Box>
        </CardContent>
      </CardActionArea>

      <Box sx={{ px: dense ? 1.5 : 1.75, pb: dense ? 1.5 : 1.75, mt: "auto" }}>
        <Stack direction="row" spacing={1}>
          <Button
            fullWidth
            variant="contained"
            startIcon={adding ? <CircularProgress color="inherit" size={16} /> : <AddShoppingCartIcon />}
            disabled={adding || product.in_stock === false || product.stock === 0}
            onClick={handleAddToCart}
            sx={{ minHeight: 38, borderRadius: 1, textTransform: "none", fontWeight: 900, boxShadow: "none" }}
          >
            {adding ? "Adding..." : isInCart ? "Go cart" : "Add"}
          </Button>
          <Button
            variant="outlined"
            disabled={adding || product.in_stock === false || product.stock === 0}
            onClick={handleBuyNow}
            sx={{ minHeight: 38, borderRadius: 1, textTransform: "none", fontWeight: 900, whiteSpace: "nowrap" }}
          >
            Buy
          </Button>
          <Tooltip title="Quick view">
            <IconButton
              aria-label="Quick view"
              onClick={(event) => {
                event.stopPropagation();
                navigate(getProductUrl(product));
              }}
              sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, width: 38, height: 38 }}
            >
              <VisibilityOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>
    </Card>
  );
};

export default memo(EcommerceProductCard);

import api from "./api";
import { resolveImageUrl } from "../utils/images";

const unwrap = (response) => response.data;

export const normalizeProduct = (product = {}) => ({
  ...product,
  image: resolveImageUrl(product.image),
  images: product.images,
  price: Number(product.price || 0),
  discount_price: product.discount_price ? Number(product.discount_price) : null,
  stock_quantity: product.stock_quantity ?? (product.in_stock ? 1 : 0),
});

export const normalizeCartItem = (item = {}) => ({
  ...item,
  product_id: item.product_id || item.id,
  image: resolveImageUrl(item.image),
  price: Number(item.price || 0),
  quantity: Number(item.quantity || 1),
  selectedOptions: item.selectedOptions || item.selected_options || {},
});

export const fetchProducts = async (params = {}) => {
  const data = await api.get("/api/products/", { params }).then(unwrap);
  const products = data.results || data.products || data;
  return Array.isArray(products) ? products.map(normalizeProduct) : [];
};

export const fetchProduct = async (id) => {
  const product = await api.get(`/api/products/${id}/`).then(unwrap);
  return normalizeProduct(product);
};

export const fetchCart = async () => {
  const data = await api.get("/api/cart/").then(unwrap);
  return (data.carts || []).map((cart) => ({
    ...cart,
    items: (cart.items || []).map(normalizeCartItem),
  }));
};

export const addToCart = async ({ productId, quantity = 1, selectedOptions = {}, cartId }) =>
  api.post("/api/cart/add/", {
    product_id: productId,
    quantity,
    selectedOptions,
    cart_id: cartId,
  }).then(unwrap);

export const updateCartItem = async ({ itemId, productId, quantity }) =>
  api.put("/api/cart/update/", {
    item_id: itemId,
    product_id: productId,
    quantity,
  }).then(unwrap);

export const removeCartItem = async ({ itemId, productId, cartId }) =>
  api.delete("/api/cart/remove/", {
    data: {
      item_id: itemId,
      product_id: productId,
      cart_id: cartId,
    },
  }).then(unwrap);

export const createOrder = async (payload) =>
  api.post("/api/orders/create/", payload).then(unwrap);

export const fetchOrders = async () =>
  api.get("/api/orders/").then(unwrap);

export const fetchCheckoutProfile = async () =>
  api.get("/customer/profile/").then(unwrap);

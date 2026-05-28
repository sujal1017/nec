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

// Helper to check authentication
const isAuthenticated = () => {
  return !!(localStorage.getItem("token") || sessionStorage.getItem("token"));
};

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
  if (!isAuthenticated()) {
    // Guest User Cart
    const guestCartItems = JSON.parse(localStorage.getItem("guest_cart")) || [];
    return [{
      id: "guest_default",
      name: "Guest Cart",
      items: guestCartItems.map(normalizeCartItem),
    }];
  }

  // Logged-in User Cart
  const data = await api.get("/api/cart/").then(unwrap);
  return (data.carts || []).map((cart) => ({
    ...cart,
    items: (cart.items || []).map(normalizeCartItem),
  }));
};

export const addToCart = async ({ productId, quantity = 1, selectedOptions = {}, cartId, name, price, image, is_live }) => {
  if (!isAuthenticated()) {
    // Guest Cart Add
    const guestCart = JSON.parse(localStorage.getItem("guest_cart")) || [];
    const existingIndex = guestCart.findIndex(
      (item) => item.product_id === productId && JSON.stringify(item.selected_options || {}) === JSON.stringify(selectedOptions)
    );

    if (existingIndex > -1) {
      guestCart[existingIndex].quantity += quantity;
    } else {
      guestCart.push({
        id: `guest_item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        product_id: productId,
        name: name || "Live Product",
        price: Number(price || 0),
        quantity,
        image: image || "",
        selected_options: selectedOptions,
      });
    }

    localStorage.setItem("guest_cart", JSON.stringify(guestCart));
    window.dispatchEvent(new Event("storage"));
    return { message: "Added to guest cart successfully." };
  }

  // Logged-in DB Cart Add
  return api.post("/api/cart/add/", {
    product_id: productId,
    quantity,
    selectedOptions,
    cart_id: cartId,
    name,
    price,
    image,
    is_live,
  }).then(unwrap);
};

export const updateCartItem = async ({ itemId, productId, quantity }) => {
  if (!isAuthenticated()) {
    // Guest Cart Update
    const guestCart = JSON.parse(localStorage.getItem("guest_cart")) || [];
    const idx = guestCart.findIndex((item) => item.id === itemId || item.product_id === productId);
    
    if (idx > -1) {
      if (quantity <= 0) {
        guestCart.splice(idx, 1);
      } else {
        guestCart[idx].quantity = quantity;
      }
      localStorage.setItem("guest_cart", JSON.stringify(guestCart));
      window.dispatchEvent(new Event("storage"));
    }
    return { message: "Guest cart item updated." };
  }

  // Logged-in Cart Update
  return api.put("/api/cart/update/", {
    item_id: itemId,
    product_id: productId,
    quantity,
  }).then(unwrap);
};

export const removeCartItem = async ({ itemId, productId, cartId }) => {
  if (!isAuthenticated()) {
    // Guest Cart Remove
    let guestCart = JSON.parse(localStorage.getItem("guest_cart")) || [];
    guestCart = guestCart.filter((item) => item.id !== itemId && item.product_id !== productId);
    localStorage.setItem("guest_cart", JSON.stringify(guestCart));
    window.dispatchEvent(new Event("storage"));
    return { message: "Guest cart item removed." };
  }

  // Logged-in Cart Remove
  return api.delete("/api/cart/remove/", {
    data: {
      item_id: itemId,
      product_id: productId,
      cart_id: cartId,
    },
  }).then(unwrap);
};

export const createOrder = async (payload) =>
  api.post("/api/orders/create/", payload).then(unwrap);

export const fetchOrders = async () =>
  api.get("/api/orders/").then(unwrap);

export const fetchCheckoutProfile = async () =>
  api.get("/customer/profile/").then(unwrap);

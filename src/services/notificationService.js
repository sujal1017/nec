import { fetchCart } from "./commerceService";
import api from "./api";

const readList = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
};

export const fetchWishlistCount = async () => {
  try {
    const response = await api.get("/wishlist/getWishListPage");
    const wishlists = response.data?.wishlists || response.data?.results || [];
    return wishlists.reduce((total, wishlist) => total + (wishlist.products?.length || wishlist.items?.length || 0), 0);
  } catch {
    return readList("wishlist").length;
  }
};

export const fetchCartCount = async () => {
  try {
    const carts = await fetchCart();
    return carts.reduce((total, cart) => total + (cart.items || []).reduce((sum, item) => sum + Number(item.quantity || 1), 0), 0);
  } catch {
    return readList("guest_cart").reduce((sum, item) => sum + Number(item.quantity || 1), 0);
  }
};

export const fetchOrderNotificationCount = async () => {
  try {
    const response = await api.get("/api/orders/");
    const orders = response.data?.orders || response.data?.results || response.data || [];
    return Array.isArray(orders)
      ? orders.filter((order) => ["pending", "processing", "shipped"].includes(String(order.status || "").toLowerCase())).length
      : 0;
  } catch {
    return 0;
  }
};

export const fetchSellerAlertCount = async () => {
  try {
    const response = await api.get("/api/seller/dashboard/");
    const metrics = response.data?.metrics || {};
    return Number(metrics.low_stock_products || 0) + Number(metrics.pending_orders || 0);
  } catch {
    return 0;
  }
};

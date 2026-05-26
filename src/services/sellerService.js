import api from "./api";

const unwrap = (response) => response.data;

export const fetchSellerDashboard = () =>
  api.get("/api/seller/dashboard/").then(unwrap);

export const fetchSellerProducts = (params = {}) =>
  api.get("/api/seller/products/", { params }).then(unwrap);

export const createSellerProduct = (payload) =>
  api.post("/api/seller/products/", payload).then(unwrap);

export const updateSellerProduct = (id, payload) =>
  api.put(`/api/seller/products/${id}/`, payload).then(unwrap);

export const deleteSellerProduct = (id) =>
  api.delete(`/api/seller/products/${id}/`).then(unwrap);

export const fetchSellerOrders = (params = {}) =>
  api.get("/api/seller/orders/", { params }).then(unwrap);

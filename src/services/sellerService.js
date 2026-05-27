import api from "./api";

const unwrap = (response) => response.data;

export const fetchSellerDashboard = () =>
  api.get("/api/seller/dashboard/").then(unwrap);

export const fetchSellerProfile = () =>
  api.get("/api/seller/profile/").then(unwrap);

export const updateSellerProfile = (payload) =>
  api.put("/api/seller/profile/", payload, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then(unwrap);

export const fetchSellerProducts = (params = {}) =>
  api.get("/api/seller/products/", { params }).then(unwrap);

export const createSellerProduct = (payload) =>
  api.post("/api/seller/products/", payload, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then(unwrap);

export const updateSellerProduct = (id, payload) =>
  api.put(`/api/seller/products/${id}/`, payload, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then(unwrap);

export const deleteSellerProduct = (id) =>
  api.delete(`/api/seller/products/${id}/`).then(unwrap);

export const fetchSellerOrders = (params = {}) =>
  api.get("/api/seller/orders/", { params }).then(unwrap);

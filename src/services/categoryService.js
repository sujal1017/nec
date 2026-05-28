import api from "./api";
import { FALLBACK_PRODUCT_IMAGE, resolveImageUrl } from "../utils/images";

const slugify = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const normalizeCategory = (category) => {
  const name = typeof category === "string" ? category : category?.name || category?.slug || "";
  return {
    id: category?.id || slugify(name),
    name,
    slug: category?.slug || slugify(name),
    image: category?.image ? resolveImageUrl(category.image) : FALLBACK_PRODUCT_IMAGE,
  };
};

export const fetchCategories = async () => {
  const response = await api.get("/api/categories/");
  const payload = response.data?.results || response.data?.categories || response.data || [];
  return Array.isArray(payload) ? payload.map(normalizeCategory).filter((item) => item.name) : [];
};

export const categoryMatches = (category, value) => {
  const target = slugify(value);
  return slugify(category?.name) === target || slugify(category?.slug) === target;
};

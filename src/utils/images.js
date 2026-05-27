import { API_BASE_URL } from "../services/api";

export const FALLBACK_PRODUCT_IMAGE = "/images/noCart.png";

export const resolveImageUrl = (image) => {
  if (!image) return FALLBACK_PRODUCT_IMAGE;
  if (/^https?:\/\//i.test(image)) return image;
  if (image.startsWith("/")) return `${API_BASE_URL}${image}`;
  return `${API_BASE_URL}/${image}`;
};

export const handleImageFallback = (event) => {
  event.currentTarget.onerror = null;
  event.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
};

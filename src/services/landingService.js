import api from "./api";

let landingContentCache = null;

const normalizeImageUrl = (image) => {
  if (!image) return "";
  if (/^https?:\/\//i.test(image)) return image;
  return `${api.defaults.baseURL}${image.startsWith("/") ? "" : "/"}${image}`;
};

const normalizeProduct = (product) => ({
  ...product,
  image: normalizeImageUrl(product.image),
  price: Number(product.price || 0),
  discount_price: product.discount_price ? Number(product.discount_price) : null,
  rating: Number(product.rating || 0),
});

export const getLandingContent = async () => {
  if (landingContentCache) return landingContentCache;

  const landingResult = await api.get("/api/landing/");
  const data = landingResult.data || {};

  const normalizeList = (items) => (items || []).map(normalizeProduct);

  landingContentCache = {
    banners: (data.banners || []).map((banner) => ({
      id: banner.id || banner.image,
      title: banner.title || banner.alt || "Shop new arrivals",
      description: banner.description || "Discover fresh finds from trusted sellers.",
      image: normalizeImageUrl(banner.image),
      ctaLabel: banner.cta_label,
      ctaUrl: banner.cta_url,
    })),
    categories: (data.categories || []).map((category) => ({
      ...category,
      image: normalizeImageUrl(category.image),
    })),
    featuredProducts: normalizeList(data.featuredProducts),
    trendingProducts: normalizeList(data.trendingProducts),
    recommendedProducts: normalizeList(data.recommendedProducts),
    deals: normalizeList(data.deals),
  };

  return landingContentCache;
};

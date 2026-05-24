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
  rating: Number(product.rating || 0),
});

export const getLandingContent = async () => {
  if (landingContentCache) return landingContentCache;

  const [bannersResult, productsResult] = await Promise.allSettled([
    api.get("/banners/"),
    api.get("/products/", { params: { in_stock: true } }),
  ]);

  const banners =
    bannersResult.status === "fulfilled"
      ? bannersResult.value.data?.banners || bannersResult.value.data || []
      : [];
  const products =
    productsResult.status === "fulfilled"
      ? productsResult.value.data?.results || productsResult.value.data || []
      : [];

  const normalizedProducts = products.map(normalizeProduct);

  const categories = Array.from(
    normalizedProducts.reduce((map, product) => {
      if (!product.category) return map;
      const key = product.category.toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          name: product.category,
          image: normalizeImageUrl(product.image),
        });
      }
      return map;
    }, new Map()).values()
  );

  landingContentCache = {
    banners: banners.map((banner) => ({
      id: banner.id || banner.image,
      title: banner.title || banner.alt || "Shop new arrivals",
      description: banner.description || "Discover fresh finds from trusted sellers.",
      image: normalizeImageUrl(banner.image),
    })),
    categories,
    featuredProducts: normalizedProducts.slice(0, 8),
    trendingProducts: [...normalizedProducts]
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 8),
    recommendedProducts: normalizedProducts.slice(4, 12),
  };

  return landingContentCache;
};

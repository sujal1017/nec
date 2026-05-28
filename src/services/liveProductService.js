import axios from "axios";

// Cache to prevent redundant API calls
const productCache = new Map();
const categoryCache = { list: null, timestamp: 0 };
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes cache expiry

// Normalization function to convert USD to INR and format product schema
const normalizeLiveProduct = (p) => {
  const inrPrice = Math.round((p.price || 0) * 80);
  const discountAmount = p.discountPercentage ? Math.round(inrPrice * (p.discountPercentage / 100)) : 0;
  const inrDiscountPrice = p.discountPercentage ? inrPrice - discountAmount : null;

  return {
    id: 100000000 + p.id, // Offset ID by 100M to prevent collisions with DB products
    originalId: p.id,
    name: p.title,
    title: p.title,
    description: p.description,
    price: inrPrice,
    discount_price: inrDiscountPrice,
    discountPercentage: p.discountPercentage || null,
    rating: p.rating || 0,
    category: p.category,
    brand: p.brand || "Global Marketplace",
    seller: p.brand || "Global Marketplace",
    image: p.thumbnail,
    images: p.images || [],
    stock: p.stock || 0,
    in_stock: (p.stock || 0) > 0,
    shippingInformation: p.shippingInformation || "Ships in 2-3 business days",
    availabilityStatus: p.availabilityStatus || ((p.stock || 0) > 0 ? "In Stock" : "Out of Stock"),
    isLive: true
  };
};

/**
 * Fetch all categories from DummyJSON
 */
export const fetchLiveCategories = async () => {
  const now = Date.now();
  if (categoryCache.list && now - categoryCache.timestamp < CACHE_EXPIRY_MS) {
    return categoryCache.list;
  }

  try {
    const res = await axios.get("https://dummyjson.com/products/categories");
    let categoriesList = [];
    if (Array.isArray(res.data)) {
      categoriesList = res.data.map((cat) => {
        if (typeof cat === "string") {
          return { slug: cat, name: cat.replace(/-/g, " ") };
        }
        return { slug: cat.slug || cat.name, name: cat.name || cat.slug };
      });
    }
    categoryCache.list = categoriesList;
    categoryCache.timestamp = now;
    return categoriesList;
  } catch (err) {
    console.error("Error fetching live categories:", err);
    return [];
  }
};

/**
 * Fetch search suggestions for live products
 */
export const fetchLiveSuggestions = async (query = "") => {
  if (!query.trim()) return [];
  try {
    const res = await axios.get(`https://dummyjson.com/products/search?q=${encodeURIComponent(query)}&limit=5`);
    const products = res.data.products || [];
    return products.map((p) => p.title);
  } catch (err) {
    console.error("Error fetching live suggestions:", err);
    return [];
  }
};

/**
 * Fetch live products from DummyJSON with full criteria support
 */
export const fetchLiveProducts = async ({
  search = "",
  category = "",
  minPrice = 0,
  maxPrice = Infinity,
  limit = 12,
  skip = 0
}) => {
  const cacheKey = JSON.stringify({ search, category, limit, skip });
  const now = Date.now();

  let products = [];
  let total = 0;

  // Check cache first
  if (productCache.has(cacheKey)) {
    const cached = productCache.get(cacheKey);
    if (now - cached.timestamp < CACHE_EXPIRY_MS) {
      products = cached.products;
      total = cached.total;
    }
  }

  // Fetch from API if cache miss or expired
  if (products.length === 0) {
    try {
      let url = "https://dummyjson.com/products";
      const params = { limit: 100 }; // Fetch a larger set to allow high quality client filtering if needed

      if (search.trim()) {
        url = "https://dummyjson.com/products/search";
        params.q = search;
      } else if (category && category !== "all") {
        url = `https://dummyjson.com/products/category/${category}`;
      }

      const res = await axios.get(url, { params });
      const rawProducts = res.data.products || [];
      
      products = rawProducts.map(normalizeLiveProduct);
      total = res.data.total || products.length;

      // Save to cache
      productCache.set(cacheKey, {
        products,
        total,
        timestamp: now
      });
    } catch (err) {
      console.error("Error fetching live products:", err);
      return { products: [], total: 0 };
    }
  }

  // Apply price filters locally
  let filtered = products.filter(
    (p) => p.price >= minPrice && p.price <= maxPrice
  );

  // Paginate locally
  const paginated = filtered.slice(skip, skip + limit);

  return {
    products: paginated,
    total: filtered.length
  };
};

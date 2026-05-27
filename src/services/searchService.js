import api from "./api";

const RECENT_SEARCH_KEY = "recentSearches";
const RECENT_VIEWED_KEY = "recentlyViewedProducts";
const COMPARE_KEY = "compareProducts";

export const getLocalList = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
};

export const saveLocalList = (key, values, limit = 10) => {
  const unique = Array.from(new Set(values.filter(Boolean))).slice(0, limit);
  localStorage.setItem(key, JSON.stringify(unique));
  return unique;
};

export const fetchSuggestions = (query, signal) =>
  api.get("/products/suggestions/", { params: { q: query }, signal }).then((res) => res.data);

export const recordSearch = async (query) => {
  const trimmed = query?.trim();
  if (!trimmed) return [];
  saveLocalList(RECENT_SEARCH_KEY, [trimmed, ...getLocalList(RECENT_SEARCH_KEY).filter((item) => item.toLowerCase() !== trimmed.toLowerCase())]);
  try {
    const res = await api.post("/products/search/history/", { query: trimmed });
    return res.data?.history || getLocalList(RECENT_SEARCH_KEY);
  } catch {
    return getLocalList(RECENT_SEARCH_KEY);
  }
};

export const fetchSearchHistory = async () => {
  try {
    const res = await api.get("/products/search/history/");
    return res.data?.history?.length ? res.data.history : getLocalList(RECENT_SEARCH_KEY);
  } catch {
    return getLocalList(RECENT_SEARCH_KEY);
  }
};

export const fetchTrendingSearches = () =>
  api.get("/products/search/trending/").then((res) => res.data?.terms || []);

export const fetchSearchMeta = () =>
  api.get("/products/search/meta/").then((res) => res.data);

export const recordProductView = async (productId) => {
  const id = Number(productId);
  if (!id) return;
  saveLocalList(RECENT_VIEWED_KEY, [id, ...getLocalList(RECENT_VIEWED_KEY).filter((item) => Number(item) !== id)]);
  try {
    await api.post("/products/recently-viewed/", { product_id: id });
  } catch {
    // Guest/local storage mode is enough when the authenticated endpoint is unavailable.
  }
};

export const fetchRecentlyViewed = async () => {
  const ids = getLocalList(RECENT_VIEWED_KEY).join(",");
  try {
    const res = await api.get("/products/recently-viewed/", { params: { ids } });
    return res.data?.products || [];
  } catch {
    return [];
  }
};

export const getCompareIds = () => getLocalList(COMPARE_KEY).map(Number).filter(Boolean).slice(0, 4);

export const saveCompareIds = (ids) => saveLocalList(COMPARE_KEY, ids.map(Number).filter(Boolean), 4);

export const fetchComparison = (ids) =>
  api.get("/products/compare/", { params: { ids: ids.slice(0, 4).join(",") } }).then((res) => res.data?.products || []);

export const fetchRecommendations = (productId) =>
  api.get(`/products/${productId}/recommendations/`).then((res) => res.data);

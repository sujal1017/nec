import React, { useEffect, useState } from "react";
import { fetchRecentlyViewed } from "../../services/searchService";
import ProductMiniRail from "./ProductMiniRail";

const RecentlyViewedSection = ({ excludeId }) => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    let alive = true;
    fetchRecentlyViewed().then((items) => {
      if (alive) setProducts(items.filter((product) => Number(product.id) !== Number(excludeId)));
    });
    return () => {
      alive = false;
    };
  }, [excludeId]);

  return <ProductMiniRail title="Recently Viewed Products" products={products} limit={10} />;
};

export default RecentlyViewedSection;

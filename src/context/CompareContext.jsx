import React, { createContext, useContext, useMemo, useState } from "react";
import { getCompareIds, saveCompareIds } from "../services/searchService";

const CompareContext = createContext(null);

export const CompareProvider = ({ children }) => {
  const [ids, setIds] = useState(getCompareIds);

  const toggleCompare = (productId) => {
    const id = Number(productId);
    if (!id) return { ok: false, message: "Invalid product" };
    if (ids.includes(id)) {
      const next = ids.filter((item) => item !== id);
      setIds(saveCompareIds(next));
      return { ok: true, selected: false };
    }
    if (ids.length >= 4) {
      return { ok: false, message: "You can compare up to 4 products." };
    }
    const next = saveCompareIds([...ids, id]);
    setIds(next);
    return { ok: true, selected: true };
  };

  const clearCompare = () => {
    setIds(saveCompareIds([]));
  };

  const value = useMemo(() => ({ ids, toggleCompare, clearCompare }), [ids]);

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
};

export const useCompare = () => useContext(CompareContext);

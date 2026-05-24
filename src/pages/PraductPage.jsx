import React, { useState, useEffect } from "react";
import HeroSection from "./HeroSection";
import ProductCard from "./ProductCard"; // Assuming this exists
import productsData from "./products.json"; // Load mock products
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Box } from "@mui/material";

const ProductsPage = () => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [filteredProducts, setFilteredProducts] = useState(productsData);

  useEffect(() => {
    if (selectedCategory) {
      setFilteredProducts(productsData.filter((p) => p.category === selectedCategory));
    } else {
      setFilteredProducts(productsData);
    }
  }, [selectedCategory]);

  return (
    <>
      <Navbar sx={{ mb: '10px' }} />
      <div style={{ mt: '100px' }}>
        <HeroSection setSelectedCategory={setSelectedCategory} />
        <div style={{ padding: "20px" }}>
          <h2>Products {selectedCategory && `- ${selectedCategory}`}</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => <ProductCard key={product.id} product={product} />)
            ) : (
              <p>No products found in this category.</p>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ProductsPage;

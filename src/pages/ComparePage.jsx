import React, { useEffect, useState } from "react";
import { Box, Button, Paper, Table, TableBody, TableCell, TableContainer, TableRow, Typography } from "@mui/material";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useCompare } from "../context/CompareContext";
import { fetchComparison } from "../services/searchService";
import { useNavigate } from "react-router-dom";

const rows = [
  ["Image", (p) => <img src={p.image} alt={p.name} style={{ width: 120, height: 120, objectFit: "contain" }} />],
  ["Name", (p) => p.name],
  ["Price", (p) => `₹${Number(p.price || 0).toLocaleString("en-IN")}`],
  ["Brand", (p) => p.brand],
  ["Rating", (p) => p.rating],
  ["Condition", (p) => p.condition || "New"],
  ["Specifications", (p) => Array.isArray(p.features) ? p.features.join(", ") : ""],
  ["Description", (p) => p.description],
  ["Availability", (p) => (p.in_stock ? "In Stock" : "Out of Stock")],
];

const ComparePage = ({ darkMode, setDarkMode }) => {
  const compare = useCompare();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (!compare.ids.length) {
      setProducts([]);
      return;
    }
    fetchComparison(compare.ids).then(setProducts).catch(() => setProducts([]));
  }, [compare.ids]);

  return (
    <>
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
      <Box sx={{ maxWidth: 1200, mx: "auto", p: 3, mt: 8 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, mb: 3, flexWrap: "wrap" }}>
          <Typography variant="h4" fontWeight={800}>Product Comparison</Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button onClick={() => navigate("/products")}>Add products</Button>
            <Button color="error" onClick={compare.clearCompare}>Clear</Button>
          </Box>
        </Box>
        {!products.length ? (
          <Paper sx={{ p: 4, textAlign: "center" }}>
            <Typography>No products selected for comparison.</Typography>
            <Button sx={{ mt: 2 }} variant="contained" onClick={() => navigate("/products")}>Browse products</Button>
          </Paper>
        ) : (
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 760 }}>
              <TableBody>
                {rows.map(([label, render]) => (
                  <TableRow key={label}>
                    <TableCell sx={{ fontWeight: 800, width: 180, position: "sticky", left: 0, bgcolor: "background.paper", zIndex: 1 }}>{label}</TableCell>
                    {products.map((product) => (
                      <TableCell key={`${label}-${product.id}`} sx={{ minWidth: 220, verticalAlign: "top" }}>
                        {render(product)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
      <Footer />
    </>
  );
};

export default ComparePage;

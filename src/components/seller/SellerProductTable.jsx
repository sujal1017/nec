import {
  Avatar,
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import SellerDataState from "./SellerDataState";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

const SellerProductTable = ({ products = [] }) => {
  if (!products.length) {
    return <SellerDataState title="No products listed" message="Create products through the seller API to populate inventory." />;
  }

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Product</TableCell>
            <TableCell>Category</TableCell>
            <TableCell>Stock</TableCell>
            <TableCell>Price</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id} hover>
              <TableCell>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Avatar src={product.image || undefined} variant="rounded">
                    <Inventory2Icon fontSize="small" />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight={700}>
                      {product.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {product.sku || product.slug}
                    </Typography>
                  </Box>
                </Box>
              </TableCell>
              <TableCell>{product.category || "Uncategorized"}</TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={product.stock_quantity}
                  color={product.stock_quantity <= 5 ? "warning" : "default"}
                />
              </TableCell>
              <TableCell>{currency.format(Number(product.discount_price || product.price || 0))}</TableCell>
              <TableCell>
                <Chip size="small" label={product.status} color={product.status === "active" ? "success" : "default"} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default SellerProductTable;

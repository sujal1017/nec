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
  IconButton,
} from "@mui/material";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SellerDataState from "./SellerDataState";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

const SellerProductTable = ({ products = [], onEdit, onDelete }) => {
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
            {(onEdit || onDelete) && <TableCell align="right">Actions</TableCell>}
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
              {(onEdit || onDelete) && (
                <TableCell align="right">
                  {onEdit && (
                    <IconButton size="small" onClick={() => onEdit(product)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  )}
                  {onDelete && (
                    <IconButton size="small" color="error" onClick={() => onDelete(product)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default SellerProductTable;

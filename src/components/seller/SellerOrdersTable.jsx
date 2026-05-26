import { Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import SellerDataState from "./SellerDataState";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });
const dateFormatter = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" });

const statusColor = (status) => {
  if (["DELIVERED", "PAID"].includes(status)) return "success";
  if (["PENDING", "PROCESSING"].includes(status)) return "warning";
  if (status === "CANCELLED") return "error";
  return "default";
};

const SellerOrdersTable = ({ orders = [] }) => {
  if (!orders.length) {
    return <SellerDataState title="No seller orders yet" message="Orders containing your products will appear here." />;
  }

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Order</TableCell>
            <TableCell>Buyer</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Total</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id} hover>
              <TableCell>
                <Typography variant="body2" fontWeight={700}>#{order.id}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {order.items?.length || 0} item(s)
                </Typography>
              </TableCell>
              <TableCell>{order.buyer}</TableCell>
              <TableCell>{order.created_at ? dateFormatter.format(new Date(order.created_at)) : "-"}</TableCell>
              <TableCell>{currency.format(Number(order.seller_total || order.total_amount || 0))}</TableCell>
              <TableCell>
                <Chip size="small" label={order.order_status} color={statusColor(order.order_status)} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default SellerOrdersTable;

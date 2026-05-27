import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
<<<<<<< HEAD
import axios from "axios";
import { BaseUrl } from "../config";
import OrderTrackingTimeline from "../components/orders/OrderTrackingTimeline";
=======
import { fetchOrders } from "../services/commerceService";
import { handleImageFallback, resolveImageUrl } from "../utils/images";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const dateFormatter = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" });
>>>>>>> 0e91b93c18a15c809815810e835e7568b67aa556

const OrdersPage = ({ darkMode, setDarkMode }) => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchOrders()
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch(() => setError("Orders could not be loaded."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Typography variant="h4" fontWeight={900} sx={{ mb: 3 }}>My Orders</Typography>
        {loading ? (
          <Stack spacing={2}>{Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} variant="rounded" height={120} />)}</Stack>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : !orders.length ? (
          <Paper variant="outlined" sx={{ minHeight: 360, display: "grid", placeItems: "center", p: 4, borderRadius: 1 }}>
            <Stack spacing={2} alignItems="center">
              <Box component="img" src="/images/noOrder.png" alt="No orders" sx={{ width: 150, height: 150 }} />
              <Typography variant="h6">No orders yet.</Typography>
              <Button variant="contained" component={Link} to="/products">Start Shopping</Button>
            </Stack>
          </Paper>
        ) : (
          <Stack spacing={2}>
            {orders.map((order) => (
              <Accordion key={order.id} variant="outlined" sx={{ borderRadius: 1, "&:before": { display: "none" } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1} sx={{ width: "100%", pr: 2 }}>
                    <Box>
                      <Typography fontWeight={900}>Order #{order.id}</Typography>
                      <Typography variant="body2" color="text.secondary">{order.created_at ? dateFormatter.format(new Date(order.created_at)) : "-"}</Typography>
                    </Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip size="small" label={order.status} color={order.status === "CANCELLED" ? "error" : "success"} />
                      <Typography fontWeight={900}>{currency.format(Number(order.total_amount || 0))}</Typography>
                    </Stack>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={2}>
                    {(order.items || []).map((item) => (
                      <Stack direction="row" spacing={2} key={item.id}>
                        <Box component="img" src={resolveImageUrl(item.image)} alt={item.name} loading="lazy" onError={handleImageFallback} sx={{ width: 80, height: 80, objectFit: "cover", borderRadius: 1 }} />
                        <Box sx={{ flex: 1 }}>
                          <Typography onClick={() => item.product_id && navigate(`/product/${item.product_id}`)} fontWeight={800} sx={{ cursor: "pointer" }}>{item.name}</Typography>
                          <Typography variant="body2" color="text.secondary">Qty {item.quantity}</Typography>
                        </Box>
                        <Typography fontWeight={900}>{currency.format(Number(item.price || 0) * Number(item.quantity || 1))}</Typography>
                      </Stack>
                    ))}
                    <Divider />
                    <Typography variant="body2" color="text.secondary">
                      Delivery Address: {[order.shipping_address?.addressLine1, order.shipping_address?.addressLine2, order.shipping_address?.city, order.shipping_address?.state, order.shipping_address?.country, order.shipping_address?.pin_code].filter(Boolean).join(", ")}
                    </Typography>
<<<<<<< HEAD
                    <Chip label={order.status} color="success" size="small" />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Date: {order?.created_at?.split("T")[0]} | Total: ₹{order.total_amount}
                  </Typography>
                </Box>
              </AccordionSummary>

              <AccordionDetails>
                {order.items.map((item, index) => (
                  <Card key={index} sx={{ display: "flex", mb: 1 }}>
                    <CardMedia
                      component="img"
                      sx={{ width: 100, objectFit: "contain" }}
                      image={item.image}
                      alt={item.name}
                    />
                    <CardContent>
                      <Typography
                        onClick={() => navigate(`/product/${item.product_id}`)}
                        sx={{
                          cursor: "pointer",
                          textDecoration: "underline",
                          "&:hover": { color: "primary.main" },
                        }}
                        variant="body1"
                      >
                        {item.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Price: ₹{item.price}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}

                <Divider sx={{ my: 2 }} />
                <OrderTrackingTimeline orderId={order.id} />
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2">
                  Delivery Address: {[
                    order?.shipping_address?.addressLine1,
                    order?.shipping_address?.addressLine2,
                    order?.shipping_address?.city,
                    order?.shipping_address?.state,
                    order?.shipping_address?.country,
                    order?.shipping_address?.pin_code
                  ].filter(Boolean).join(", ")}

                </Typography>
              </AccordionDetails>
            </Accordion>
          )))}

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
=======
                  </Stack>
                </AccordionDetails>
              </Accordion>
            ))}
          </Stack>
        )}
      </Container>
>>>>>>> 0e91b93c18a15c809815810e835e7568b67aa556
      <Footer />
    </>
  );
};

export default OrdersPage;

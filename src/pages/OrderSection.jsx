import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Divider,
  Snackbar,
  Alert,
  CircularProgress
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import profileData from "../../public/data/profile.json";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import axios from "axios";
import { BaseUrl } from "../config";
import OrderTrackingTimeline from "../components/orders/OrderTrackingTimeline";

const OrdersPage = ({ darkMode, setDarkMode }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({});

  const navigate = useNavigate();

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };


  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BaseUrl}/orders/my-orders/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      // Handle 401 Unauthorized inside try
      if (response.status === 401) {
        setSnackbar({ open: true, message: "❌ Unauthorized. Redirecting to login...", severity: "error" });
        setTimeout(() => navigate("/signin"), 1500);
        return;
      }

      if (response.status === 200) {
        setOrders(response.data);
      } else {
        console.log("⚠️ Error fetching orders:", response);
        setSnackbar({ open: true, message: "❌ Error fetching orders", severity: "error" });
      }
    } catch (error) {
      console.error("❌ Fetch orders failed:", error);
      if (error.response && error.response.status === 401) {
        setSnackbar({ open: true, message: "❌ Unauthorized. Redirecting to login...", severity: "error" });
        setTimeout(() => navigate("/signin"), 1500);
      } else {
        setSnackbar({ open: true, message: "❌ Failed to fetch orders. Please try again.", severity: "error" });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 2,
        }}
      >
        {/* Loader GIF */}
        <img
          src="/images/orderLoader.gif"
          alt="Loading..."
          className="w-70 h-70"
        />

        {/* Dynamic text with fade + dots */}
        <Typography
          variant="h6"
          sx={{
            fontWeight: "bold",
            color: "gray",
            animation: "fade 2s ease-in-out infinite",
          }}
        >
          Your orders is loading
          <span className="dots">...</span>
        </Typography>

        <style>
          {`
             /* Dots animation */
             .dots {
               display: inline-block;
               width: 1.5em;
               text-align: left;
               animation: dots 1.5s steps(3, end) infinite;
             }
             @keyframes dots {
               0%, 20% { content: ""; }
               40% { content: "."; }
               60% { content: ".."; }
               80%, 100% { content: "..."; }
             }
   
             /* Fade animation */
             @keyframes fade {
               0% { opacity: 0.2; }
               50% { opacity: 1; }
               100% { opacity: 0.2; }
             }
           `}
        </style>
      </Box>
    );
  }


  return (
    <>
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} sx={{ mb: '10px' }} />
      <Box sx={{ p: 3, mt: '100px' }}>
        <Typography variant="h5" fontWeight={600} mb={3}>
          My Orders
        </Typography>

        {!orders || orders.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              height: "60vh",
              width: "100%",
            }}
          >
            <img
              src="/images/noCart.png"
              alt="Loading..."
              style={{ width: "150px", height: "150px" }}
            />
            <Typography variant="h6" sx={{ color: "gray", mt: 2 }}>
              No carts created yet.
            </Typography>
          </Box>) :
          (orders.map((order) => (
            <Accordion key={order.id} sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    width: "100%",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography variant="subtitle1">
                      Order ID: {order.id}
                    </Typography>
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
      <Footer />
    </>
  );
};

export default OrdersPage;

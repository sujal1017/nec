import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Box, Button, Container, Paper, Stack, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const OrderSuccess = ({ darkMode, setDarkMode }) => {
  const { state } = useLocation();
  const order = state?.order;

  return (
    <>
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
      <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
        <Paper variant="outlined" sx={{ p: { xs: 3, md: 5 }, borderRadius: 1, textAlign: "center" }}>
          <Stack spacing={2} alignItems="center">
            <CheckCircleIcon color="success" sx={{ fontSize: 72 }} />
            <Typography variant="h4" fontWeight={900}>Order Placed Successfully</Typography>
            <Typography color="text.secondary">
              {order?.id ? `Your order #${order.id} has been created and is ready for tracking.` : "Your order has been created and is ready for tracking."}
            </Typography>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center", pt: 2 }}>
              <Button variant="contained" component={Link} to="/orders">View Orders</Button>
              <Button variant="outlined" component={Link} to="/products">Continue Shopping</Button>
            </Box>
          </Stack>
        </Paper>
      </Container>
      <Footer />
    </>
  );
};

export default OrderSuccess;

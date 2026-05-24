

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Divider,
  Paper,
  Button,
  Grid,
  Avatar,
  TextField,
  MenuItem,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import axios from "axios";
import {BaseUrl} from "../config";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress
} from "@mui/material";

const countryList = [
  "India",
  "United States",
  "Canada",
  "Australia",
  "United Kingdom",
  "Germany",
  "France",
  "Japan",
  "China",
  "Brazil",
  "South Africa",
];



const Checkout = ({ darkMode, setDarkMode }) => {

  const [dialogOpen, setDialogOpen] = useState(false);
const [selectedAddressId, setSelectedAddressId] = useState(null);

  const { state } = useLocation();
  const navigate = useNavigate();
  const selectedCarts = state?.selectedCarts || [];

  const [loading, setLoading] = useState(false);

  const [savedAddresses, setSavedAddresses] = useState([]);

  const [address, setAddress] = useState({
    firstName: "",
    lastName: "",
    email: "",
    addressLine1: "",
    addressLine2: "",
    pinCode: "",
    city: "",
    state: "",
    country: "India",
  });

useEffect(() => {

  setLoading(true);

  const fetchData = async () => {
    try {

      console.log("Fetching profile data...");
      const res = await axios.get(`${BaseUrl}/customer/profile/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      console.log("Profile data response:", res.data);
      if (res.status === 200) {

        const { savedAddresses } = res.data.profileData;

        const newSavedAddress = savedAddresses.map(addr => ({
          id: addr.id,
          label: addr.label,
          firstName: addr.firstName || "",
          lastName: addr.lastName || "",
          email: addr.email || "",
          addressLine1: addr.address1,
          addressLine2: addr.address2,
          city: addr.city,
          state: addr.state,
          country: addr.country,
          pinCode: addr.zipCode,
          full: `${addr.address1}, ${addr.address2}, ${addr.city}, ${addr.state}, ${addr.country}, ${addr.zipCode}`
        }));

        setSavedAddresses(newSavedAddress || []);

        if (newSavedAddress.length > 0) {
          setDialogOpen(true); // open dialog automatically
        }
      }

    } catch (error) {

  if (error.response?.status === 401) {

   console.log("Profile data response:", res.data);
    // redirect to signin
    navigate("/signin");
    return;
  }

  console.error("Profile fetch error:", error);
} finally {
      setLoading(false);
    }
  };

  fetchData();

}, []);

const handleAddressSelect = (id) => {

  const selected = savedAddresses.find(
    (addr) => String(addr.id) === String(id)
  );

  if (!selected) return;

  setSelectedAddressId(id);

  setAddress({
    firstName: selected.firstName || "",
    lastName: selected.lastName || "",
    email: selected.email || "",
    addressLine1: selected.addressLine1 || "",
    addressLine2: selected.addressLine2 || "",
    pinCode: selected.pinCode || "",
    city: selected.city || "",
    state: selected.state || "",
    country: selected.country || "India"
  });

  setDialogOpen(false);
};


  const allItems = selectedCarts.flatMap((cart) => cart.items);
const cartArray = selectedCarts?.map(cart => cart.id) || [];



  const handleInputChange = (e) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };



const handlePlaceOrder = () => {
  // Convert your address state to the desired format
  const formattedAddress = {
    full_name: `${address.firstName} ${address.lastName}`.trim(),

    addressLine1 : address.addressLine1,
    addressLine2 : address.addressLine2,
    country: address.country,
    email: address.email,
    city: address.city,
    state: address.state,
    pin_code: address.pinCode,
    phone: address.phone || "", // optional field if you add phone input later
  };

  const conformOrder = {
    cartIds: cartArray,
    items: allItems,
    shippingAddress: formattedAddress,
  };

  navigate("/payment", {
    state: {
      order: conformOrder,
      totalAmount: totalAmount,
    },
  });
};


// const handlePlaceOrder = async() => {
// try {
   
//   const res = await axios.post(`${BaseUrl}/createOrder`, {
//     cartIds: cartArray,
//     items: allItems,
//     shippingAddress: address,
//   }, {
//     headers: {
//       Authorization: `Bearer ${localStorage.getItem("token")}`,
//     }
//   });
//   if (res.status === 201) {
//     navigate("/orders");
//   } 
//   else {
//     alert("Failed to create order");
//     console.error("Failed to create order");
//   } 
// } catch (error) {
//   console.log("error:",error)
// } 
// };
  const totalAmount = allItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  if (loading) {
  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      }}
    >
      <CircularProgress size={60} />
    </Box>
  );
}

  return (
    <>
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} sx={{ mb: '10px' }} />
      <Box sx={{ p: { xs: 2, md: 4 }, minHeight: "100vh", mt: '100px' }}>
        <Typography variant="h5" fontWeight="bold" mb={3}>
          Review Orders
        </Typography>

        <Grid container spacing={3}>
          {/* Left: Items and Address */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, mb: 3 }}>
              {allItems.map((item, index) => (
                <Box
                  key={`${item.id}-${index}`}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 2,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar
                      variant="square"
                      src={item.image}
                      alt={item.name}
                      sx={{ width: 80, height: 80, borderRadius: 1 }}
                    />
                    <Box>
                      <Typography fontWeight="500">{item.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Qty: {item.quantity}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography fontWeight="bold">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </Typography>
                </Box>
              ))}
              <Divider sx={{ my: 2 }} />
              <Typography fontWeight="bold" textAlign="right">
                Total: ₹{totalAmount.toFixed(2)}
              </Typography>
            </Paper>

            {/* Address Form */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Shipping Address
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="firstName"
                    label="First Name"
                    value={address.firstName}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="lastName"
                    label="Last Name"
                    value={address.lastName}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="email"
                    label="Email Address"
                    type="email"
                    value={address.email}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="addressLine1"
                    label="Address Line 1"
                    value={address.addressLine1}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="addressLine2"
                    label="Address Line 2"
                    value={address.addressLine2}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    name="pinCode"
                    label="Pin Code"
                    value={address.pinCode}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    name="city"
                    label="city"
                    value={address.city}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    name="state"
                    label="State"
                    value={address.state}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    select
                    name="country"
                    label="Country"
                    value={address.country}
                    onChange={handleInputChange}
                  >
                    {countryList.map((country) => (
                      <MenuItem key={country} value={country}>
                        {country}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Right: Summary */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" mb={1}>
                Item ({allItems.length})
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="subtitle1">Subtotal</Typography>
                <Typography variant="subtitle1" fontWeight="bold">
                  ₹{totalAmount.toFixed(2)}
                </Typography>
              </Box>

<Button
  variant="contained"
  onClick={handlePlaceOrder}   // ✅ just reference, not call
  fullWidth
  sx={{ mt: 3 }}
  disabled={
    !address.firstName ||
    !address.lastName ||
    !address.email ||
    !address.addressLine1 ||
    !address.pinCode ||
    !address.city ||
    !address.state ||
    !address.country
  }
>
  Confirm and Pay Now
</Button>


              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                textAlign="center"
                mt={2}
              >
                Purchase protected by YourSite Money Back Guarantee
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      <Dialog
  open={dialogOpen}
  onClose={() => setDialogOpen(false)}
  fullWidth
  maxWidth="sm"
>
  <DialogTitle>Select Saved Address</DialogTitle>

  <DialogContent>

    {savedAddresses.length === 0 ? (
      <Typography>No saved addresses found</Typography>
    ) : (

      <RadioGroup
        value={selectedAddressId}
        onChange={(e) => handleAddressSelect(e.target.value)}
      >

        {savedAddresses.map(addr => (

          <Paper
            key={addr.id}
            sx={{
              p: 2,
              mb: 2,
              borderRadius: 2
            }}
          >

            <FormControlLabel
              value={addr.id}
              control={<Radio />}
              label={
                <Box>

                  <Typography fontWeight="bold">
                    {addr.label}
                  </Typography>

                  <Typography variant="body2">
                    {addr.full}
                  </Typography>

                </Box>
              }
            />

          </Paper>

        ))}

      </RadioGroup>

    )}

  </DialogContent>
</Dialog>


      <Footer />
    </>
  );
};

export default Checkout;


import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Avatar,
  Grid,
  IconButton,
  FormControl,
  Tabs,
  Tab,
  Divider,
  Stack,
  Select,
  InputLabel,
  MenuItem,
  Alert,
  Snackbar,
  Chip,
  CircularProgress ,
  
} from "@mui/material";
import LogoutIcon from '@mui/icons-material/Logout';
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import profileData from "../../public/data/profile.json";
import PersonIcon from "@mui/icons-material/Person";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import FavoriteIcon from "@mui/icons-material/Favorite";
import GavelIcon from "@mui/icons-material/Gavel";
import SettingsIcon from "@mui/icons-material/Settings";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import StorefrontIcon from "@mui/icons-material/Storefront";
import ReceiptIcon from "@mui/icons-material/Receipt";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import axios from "axios";
import { BaseUrl } from "../config";
import { getApiErrorMessage, getApiFieldErrors } from "../utils/apiErrors";

const Profile = ({ darkMode, setDarkMode }) => {
  const [editingProfile, setEditingProfile] = useState(false);
  const [updatedName, setUpdatedName] = useState(profileData.profile.name);
  const [updatedPhone, setUpdatedPhone] = useState(profileData.profile.phone);
  const [userEmail, setUserEmail] = useState("");
  const [userVerified, setUserVerified] = useState(false);
  const [userStatus, setUserStatus] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [openAddressDialog, setOpenAddressDialog] = useState(false);
  const [newAddress, setNewAddress] = useState("");
  const [newAddressLabel, setNewAddressLabel] = useState("");
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("India"); // default country
  const [zipCode, setZipCode] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [saving, setSaving] = useState(false);
  const [addingAddress, setAddingAddress] = useState(false); // ✅ new state
  const [loading, setLoading] = useState(true); // ✅ loading for fetchData
  const [deleting, setDeleting] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});
  const [addressErrors, setAddressErrors] = useState({});

  const theme = useTheme();
  const navigate = useNavigate();

  const handleEditProfile = () => setEditingProfile(true);

useEffect(() => {
  setLoading(true); // start loader
  console.log("Fetching profile data..."); // Debug log
  
  const fetchData = async () => {
    try {
      const res = await axios.get(`${BaseUrl}/customer/profile/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      
      console.log("Profile data response:", res); // Debug log
      
      if (res.status === 200) {
        const { profile, savedAddresses } = res.data.profileData;
        const newSavedAdress = convertSavedAddresses(savedAddresses); 

        setUpdatedName(profile?.name || "");
        setUpdatedPhone(profile?.phoneno || "");
        setUserEmail(profile?.email || "");
        setUserVerified(profile?.is_verified || false);
        setUserStatus(profile?.user_status || "");
        setSavedAddresses(newSavedAdress || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      
      // Handle 401 Unauthorized error
      if (error.response && error.response.status === 401) {
        console.log("Unauthorized - redirecting to signin");
        localStorage.removeItem("token"); // Clear invalid token
        navigate("/signin");
      } else if (error.response) {
        // Other server errors (400, 500, etc.)
        console.error("Server error:", error.response.status, error.response.data);
      } else if (error.request) {
        // Network error - request made but no response
        console.error("Network error - no response received");
      } else {
        // Other errors
        console.error("Error:", error.message);
      }
    } finally {
      setLoading(false); // ✅ hide loader
    }
  };

  fetchData();
}, []); // empty dependency array → run only once when component mounts


  const handleSaveProfile = async () => {
    setSaving(true);
    setProfileErrors({});
    try {
      const res = await axios.put(
        `${BaseUrl}/customer/updateProfile/`,
        {
          name: updatedName,
          phoneno: updatedPhone,
          email: userEmail,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          validateStatus: () => true,
        }
      );

      if (res.status === 200) {
        setUpdatedName(res.data.updatedData.name);
        setUpdatedPhone(res.data.updatedData.phoneno);
        setEditingProfile(false);
        setSnackbar({
          open: true,
          severity: "success",
          message: "✅ Profile updated successfully!",
        });


      } else if (res.status === 401) {
        setEditingProfile(false);
        setSnackbar({
          open: true,
          severity: "warning",
          message: "🔑🚪 Please signin first!",
        });
        setTimeout(() => {
          localStorage.removeItem("token");
          navigate("/signin");
        }, 2000);
      } else {
        const backendError = { response: res };
        const fieldErrors = getApiFieldErrors(backendError, {
          phoneno: "phone",
          name: "name",
          non_field_errors: "form",
        });

        setProfileErrors(fieldErrors);
        setSnackbar({
          open: true,
          severity: "error",
          message: getApiErrorMessage(backendError),
        });

      }
    } catch (error) {
      const fieldErrors = getApiFieldErrors(error, {
        phoneno: "phone",
        name: "name",
        non_field_errors: "form",
      });

      setProfileErrors(fieldErrors);
      setSnackbar({
        open: true,
        severity: "error",
        message: getApiErrorMessage(error),
      });
    } finally {
      setSaving(false); // ✅ stop loading
    }
  };


  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // const handleAddAddress = () => {
  //   if (newAddress.trim() && newAddressLabel.trim()) {
  //     setSavedAddresses([
  //       ...savedAddresses,
  //       { id: savedAddresses.length + 1, label: newAddressLabel, address: newAddress },
  //     ]);
  //     setNewAddress("");
  //     setNewAddressLabel("");
  //     setOpenAddressDialog(false);
  //   }
  // };

function convertSavedAddresses(savedAddresses) {
  const  Addresses = savedAddresses.map(addr => ({
    id:addr.id,
      label: addr.label,
      address: `${addr.address1}, ${addr.address2}, ${addr.city}, ${addr.state}, ${addr.country}, ${addr.zipCode}`
    }))
  return Addresses;
}

  const handleAddAddress = async () => {
    try {
      setAddingAddress(true); // ✅ disable buttons & show loading text
      setAddressErrors({});

      const newAddress = {
        label: newAddressLabel,
        address1: addressLine1,
        address2: addressLine2,
        city,
        state,
        country,
        zipCode,
      };
  
      const res = await axios.post(
        `${BaseUrl}/customer/address/`,
        newAddress,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          validateStatus: () => true,
        }
      );
    
      if (res.status === 201) {
        const newAdress = res.data.newAddress;
        const newAdrress = convertSavedAddresses( [newAdress]); // convert to required format
        setSavedAddresses((prev) => [...prev, ...newAdrress]);
        setOpenAddressDialog(false);

        // ✅ Clear form fields
        setNewAddressLabel("");
        setAddressLine1("");
        setAddressLine2("");
        setCity("");
        setState("");
        setCountry("");
        setZipCode("");

        // ✅ Show success snackbar
        setSnackbar({
          open: true,
          severity: "success",
          message: "Address added successfully!",
        });
      } else if (res.status === 401) {
        setOpenAddressDialog(false);
        setSnackbar({
          open: true,
          severity: "warning",
          message: "🔑🚪 Please signin first!",
        });

        setTimeout(() => {
          localStorage.removeItem("token");
          navigate("/signin");
        }, 2000);
      } else {
        const backendError = { response: res };
        const fieldErrors = getApiFieldErrors(backendError, {
          label: "newAddressLabel",
          address1: "addressLine1",
          address2: "addressLine2",
          city: "city",
          state: "state",
          country: "country",
          zipCode: "zipCode",
          non_field_errors: "form",
        });

        setAddressErrors(fieldErrors);
        setSnackbar({
          open: true,
          severity: "error",
          message: getApiErrorMessage(backendError),
        });
      }
    } catch (error) {
      console.error("Error adding address:", error);
      const fieldErrors = getApiFieldErrors(error, {
        label: "newAddressLabel",
        address1: "addressLine1",
        address2: "addressLine2",
        city: "city",
        state: "state",
        country: "country",
        zipCode: "zipCode",
        non_field_errors: "form",
      });

      setAddressErrors(fieldErrors);
      setSnackbar({
        open: true,
        severity: "error",
        message: getApiErrorMessage(error),
      });
    } finally {
      setAddingAddress(false); // ✅ re-enable buttons
    }
  };


const handleLogout = () => {
  
  localStorage.removeItem("token");
  navigate("/signin");
};


const handleDeleteAddress = async (id) => {
  setDeleting(true); // start loading

  try {
    console.log("addr id",id);
    const res = await axios.delete(`${BaseUrl}/customer/address/?id=${id}`,
     {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });

    if (res.status == 200) {
      setSavedAddresses((prev) => prev.filter((address) => address.id !== id));
      setSnackbar({
        open: true,
        message: "Address deleted successfully",
        severity: "success",
      });
    } else if (res.status == 401) {
      setSnackbar({
        open: true,
        message: "Unauthorized. Redirecting to login...",
        severity: "error",
      });

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } else {
      setSnackbar({
        open: true,
        message: "Failed to delete address",
        severity: "error",
      });
    }
  } catch (error) {
    setSnackbar({
      open: true,
      message: "Error occurred while deleting address",
      severity: "error",
    });
  } finally {
    setDeleting(false); // stop loading
  }
};



  const menuItems = [
    { icon: <PersonIcon />, text: 'Personal Information', path: '/profile' },
    { icon: <ShoppingCartIcon />, text: 'My Carts', path: '/profile/carts' },
    { icon: <FavoriteIcon />, text: 'My Wishlists', path: '/profile/wishlists' },
    { icon: <GavelIcon />, text: 'My Bids', path: '/profile/bids' },
    { icon: <SettingsIcon />, text: 'Settings', path: '/profile/settings' },
  ];

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
        src="/images/profileLoader.gif"
        alt="Loading..."
        style={{ width: "150px", height: "150px" }}
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
        Your profile is loading
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
      <Box sx={{ width: '100%', p: { xs: 2, md: 4 }, mt: '100px'  ,  filter: deleting ? "blur(3px)" : "none", pointerEvents: deleting ? "none" : "auto" }}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          mb: 4,
          width: '100%',
        
        }}>
          <PersonIcon fontSize="large" color="primary" />
          <Typography variant="h4" fontWeight="bold">
            My Profile
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Left: Profile */}
          <Grid item xs={12} md={4}>
            <Card sx={{
              p: 3,
              textAlign: "center",
              bgcolor: 'background.paper',
              boxShadow: 1,
              borderRadius: 2,
              height: '100%',
              width: '100%'
            }}>
              <Avatar
                src={profileData.profile.avatar}
                alt="Profile Photo"
                sx={{
                  width: { xs: 100, sm: 120, md: 140 },
                  height: { xs: 100, sm: 120, md: 140 },
                  mx: "auto",
                  mb: 2,
                  border: `4px solid ${theme.palette.primary.main}`,
                }}
              />
              <CardContent>
                {editingProfile ? (
                  <Stack spacing={2}>
                    <TextField
                      fullWidth
                      label="Name"
                      value={updatedName}
                      onChange={(e) => {
                        setUpdatedName(e.target.value);
                        setProfileErrors((current) => ({ ...current, name: "" }));
                      }}
                      error={Boolean(profileErrors.name)}
                      helperText={profileErrors.name}
                      size="small"
                    />
                    <TextField
                      fullWidth
                      label="Phone"
                      value={updatedPhone}
                      onChange={(e) => {
                        setUpdatedPhone(e.target.value);
                        setProfileErrors((current) => ({ ...current, phone: "" }));
                      }}
                      error={Boolean(profileErrors.phone)}
                      helperText={profileErrors.phone}
                      size="small"
                    />
                    {profileErrors.form && <Alert severity="error">{profileErrors.form}</Alert>}
                  </Stack>
                ) : (
                  <Stack spacing={1}>
                    <Typography variant="h5" fontWeight="bold">
                      {updatedName}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {updatedPhone}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {userEmail}
                    </Typography>
                    {userStatus !== "active" && (
                      <Box sx={{ mt: 1 }}>
                        <Chip
                          label={userStatus === "pending_verification" ? "Email not verified" : userStatus === "pending_otp" ? "Phone not verified" : "Account not verified"}
                          color="warning"
                          size="small"
                          onClick={() => navigate("/verify-account")}
                        />
                      </Box>
                    )}
                  </Stack>
                )}
                <Button
                  variant={editingProfile ? "contained" : "outlined"}
                  startIcon={editingProfile && !saving ? null : (!editingProfile ? <EditIcon /> : null)}
                  fullWidth
                  sx={{ mt: 3 }}
                  onClick={editingProfile ? handleSaveProfile : handleEditProfile}
                  disabled={saving} // ✅ disabled while saving
                >
                  {editingProfile ? (saving ? "Saving changes..." : "Save Changes") : "Edit Profile"}
                </Button>
                 <Button
                  variant={"contained"}
                  startIcon={<LogoutIcon />}
                  fullWidth
                  sx={{ mt: 3 }}
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Grid container spacing={2} alignItems="stretch">
              {/* Orders */}
              <Grid item xs={12} sm={6}>
                <Card
                  sx={{
                    p: 3,
                    height: "100%", // fills parent
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between", // keeps button at bottom
                    bgcolor: "background.paper",
                    boxShadow: 1,
                    borderRadius: 2,
                    "&:hover": {
                      boxShadow: 3,
                      transform: "translateY(-2px)",
                      transition: "all 0.2s ease-in-out",
                    },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                    <ReceiptIcon color="primary" fontSize="large" />
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        Orders
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        View your past orders and their details
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => navigate("/orders")}
                    sx={{ mt: 2 }}
                  >
                    View Orders
                  </Button>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Card
                  sx={{
                    p: 3,
                    height: "100%", // fills parent
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between", // keeps button at bottom
                    bgcolor: "background.paper",
                    boxShadow: 1,
                    borderRadius: 2,
                    "&:hover": {
                      boxShadow: 3,
                      transform: "translateY(-2px)",
                      transition: "all 0.2s ease-in-out",
                    },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                    <GavelIcon color="primary" fontSize="large" />          <Box>
                      <Typography variant="h6" fontWeight="bold">
                        My Bids
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Track your active and past bids
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => navigate("/profile/bids")}
                    sx={{ mt: 2 }}
                  >
                    View Bids
                  </Button>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Card
                  sx={{
                    p: 3,
                    height: "100%", // fills parent
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between", // keeps button at bottom
                    bgcolor: "background.paper",
                    boxShadow: 1,
                    borderRadius: 2,
                    "&:hover": {
                      boxShadow: 3,
                      transform: "translateY(-2px)",
                      transition: "all 0.2s ease-in-out",
                    },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                    <ReceiptIcon color="primary" fontSize="large" />
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        Seller Dashboard
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Manage your product listings

                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => navigate("/main")}
                    sx={{ mt: 2 }}
                  >
                    Go to Seller Panel
                  </Button>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Card
                  sx={{
                    p: 3,
                    height: "100%", // fills parent
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between", // keeps button at bottom
                    bgcolor: "background.paper",
                    boxShadow: 1,
                    borderRadius: 2,
                    "&:hover": {
                      boxShadow: 3,
                      transform: "translateY(-2px)",
                      transition: "all 0.2s ease-in-out",
                    },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>

                    <FavoriteBorderIcon color="primary" fontSize="large" />
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        Wishlist
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        View your saved items
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => navigate("/wishlist")}
                    sx={{ mt: 2 }}
                  >
                    Go to Wishlist
                  </Button>
                </Card>
              </Grid>





              {/* Repeat the same structure for other cards (Bids, Seller Dashboard, Wishlist) */}
            </Grid>
          </Grid>


          {/* Saved Addresses Section */}
          <Grid item xs={12}>
            <Card sx={{
              p: 3,
              bgcolor: 'background.paper',
              boxShadow: 1,
              borderRadius: 2,
              width: '100%'
            }}>
              <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3,
                width: '100%'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <LocalShippingIcon color="primary" fontSize="large" />
                  <Typography variant="h6" fontWeight="bold">
                    Saved Addresses
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenAddressDialog(true)}
                >
                  Add New Address
                </Button>
              </Box>
              <Grid container spacing={2}>
                {savedAddresses.map((address) => (
                  <Grid item xs={12} sm={6} md={4} key={address.id}>
                    <Card sx={{
                      p: 2,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      bgcolor: 'background.default',
                      boxShadow: 0,
                      border: '1px solid',
                      borderColor: 'divider',
                      width: '100%',
                      '&:hover': {
                        borderColor: 'primary.main',
                      }
                    }}>
                      <Box sx={{ flex: 1 }}>
                        {address.label && (
                          <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 0.5, color: 'primary.main' }}>
                            {address.label}
                          </Typography>
                        )}
                        <Typography variant="body1">
                          {address.address}
                        </Typography>
                      </Box>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteAddress(address.id)}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Card>
          </Grid>
        </Grid>

        {/* Add Address Dialog */}
        <Dialog
          open={openAddressDialog}
          onClose={() => setOpenAddressDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle
            sx={{
              py: 2,
              borderBottom: "1px solid",
              borderColor: "divider",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <LocalShippingIcon color="primary" />
            Add New Address
          </DialogTitle>

          <DialogContent sx={{ pt: 3 }}>
            {/* Address Label */}
            <TextField
              fullWidth
              label="Address Label (e.g. Home, Work)"
              value={newAddressLabel}
              onChange={(e) => {
                setNewAddressLabel(e.target.value);
                setAddressErrors((current) => ({ ...current, newAddressLabel: "" }));
              }}
              error={Boolean(addressErrors.newAddressLabel)}
              helperText={addressErrors.newAddressLabel}
              variant="outlined"
              size="small"
              sx={{ mb: 2 }}
            />

            {/* Address Line 1 */}
            <TextField
              fullWidth
              label="Address Line 1"
              value={addressLine1}
              onChange={(e) => {
                setAddressLine1(e.target.value);
                setAddressErrors((current) => ({ ...current, addressLine1: "" }));
              }}
              error={Boolean(addressErrors.addressLine1)}
              helperText={addressErrors.addressLine1}
              variant="outlined"
              size="small"
              sx={{ mb: 2 }}
            />

            {/* Address Line 2 */}
            <TextField
              fullWidth
              label="Address Line 2 (Optional)"
              value={addressLine2}
              onChange={(e) => {
                setAddressLine2(e.target.value);
                setAddressErrors((current) => ({ ...current, addressLine2: "" }));
              }}
              error={Boolean(addressErrors.addressLine2)}
              helperText={addressErrors.addressLine2}
              variant="outlined"
              size="small"
              sx={{ mb: 2 }}
            />

            {/* City & State side by side */}
            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                label="City"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setAddressErrors((current) => ({ ...current, city: "" }));
                }}
                error={Boolean(addressErrors.city)}
                helperText={addressErrors.city}
                variant="outlined"
                size="small"
              />
              <TextField
                fullWidth
                label="State"
                value={state}
                onChange={(e) => {
                  setState(e.target.value);
                  setAddressErrors((current) => ({ ...current, state: "" }));
                }}
                error={Boolean(addressErrors.state)}
                helperText={addressErrors.state}
                variant="outlined"
                size="small"
              />
            </Box>

            {/* Country & Zipcode side by side */}
            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
              <TextField
                select
                fullWidth
                label="Country"
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value);
                  setAddressErrors((current) => ({ ...current, country: "" }));
                }}
                error={Boolean(addressErrors.country)}
                helperText={addressErrors.country}
                variant="outlined"
                size="small"
              >
                <MenuItem value="India">India</MenuItem>
                <MenuItem value="USA">USA</MenuItem>
                <MenuItem value="UK">UK</MenuItem>
                <MenuItem value="Canada">Canada</MenuItem>
                {/* Add more countries as needed */}
              </TextField>

              <TextField
                fullWidth
                label="Zip Code"
                value={zipCode}
                onChange={(e) => {
                  setZipCode(e.target.value);
                  setAddressErrors((current) => ({ ...current, zipCode: "" }));
                }}
                error={Boolean(addressErrors.zipCode)}
                helperText={addressErrors.zipCode}
                variant="outlined"
                size="small"
              />
            </Box>
            {addressErrors.form && <Alert severity="error" sx={{ mb: 2 }}>{addressErrors.form}</Alert>}
          </DialogContent>

          <DialogActions
            sx={{
              p: 2,
              pt: 1,
              bgcolor: "background.paper",
              borderTop: "1px solid",
              borderColor: "divider",
              gap: 1,
            }}
          >
            <Button
              onClick={() => setOpenAddressDialog(false)}
              color="inherit"
              variant="outlined"
              disabled={addingAddress} // ✅ disable cancel while loading
            >
              Cancel
            </Button>

            <Button
              onClick={handleAddAddress}
              variant="contained"
              disabled={
                addingAddress || // ✅ disable when loading
                !newAddressLabel.trim() ||
                !addressLine1.trim() ||
                !city.trim() ||
                !state.trim() ||
                !country.trim() ||
                !zipCode.trim()
              }
            >
              {addingAddress ? "Adding Address..." : "Add Address"} {/* ✅ dynamic text */}
            </Button>
          </DialogActions>

        </Dialog>

        {/* Snackbar for feedback messages */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={2000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          TransitionProps={{
            appear: true,
            onEnter: (node) => {
              node.style.opacity = 0;
              node.style.transform = 'translateY(40px)';
              setTimeout(() => {
                node.style.transition = 'opacity 400ms cubic-bezier(0.4,0,0.2,1), transform 400ms cubic-bezier(0.4,0,0.2,1)';
                node.style.opacity = 1;
                node.style.transform = 'translateY(0)';
              }, 10);
            },
            onExit: (node) => {
              node.style.transition = 'opacity 300ms cubic-bezier(0.4,0,0.2,1), transform 300ms cubic-bezier(0.4,0,0.2,1)';
              node.style.opacity = 0;
              node.style.transform = 'translateY(40px)';
            },
          }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{
              width: '100%',
              bgcolor:
                snackbar.severity === "error"
                  ? "#f44336" // 🔴 red for error
                  : snackbar.severity === "success"
                    ? "#4caf50" // 🟢 green for success
                    : snackbar.severity === "warning"
                      ? "#ff9800" // 🟠 orange for warning
                      : "#fff",   // default white
              color: '#222',
              border: '1px solid #eee',
              fontWeight: 600,
              fontSize: '1.1rem',
              boxShadow: 6,
              borderRadius: 3,
              px: 3,
              py: 2,
              transition: 'box-shadow 0.3s cubic-bezier(0.4,0,0.2,1), background 0.3s cubic-bezier(0.4,0,0.2,1)',
              letterSpacing: 0.2,
            }}
            icon={false}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box >
      <Footer />
    </>
  );
};

export default Profile;



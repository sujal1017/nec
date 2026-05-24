import React, { useState } from "react";
import {
  Box, Typography, Container, Grid, Link,
  IconButton, TextField, Button, Divider,CircularProgress 
} from "@mui/material";
import { Facebook, Twitter, Instagram, LinkedIn } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import axios from "axios";
import { BaseUrl } from "../config";
const Footer = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (email) {
      try {
         setLoading(true); // start loader
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          alert("Please enter a valid email address");
          return;
        }
        const res = await axios.post(`${BaseUrl}/subscribe`, { email });
        if (res.status !== 201) {
          alert("Subscription failed. Please try again later.");
          return;
        }
        alert("Subscribed successfully!");
        setEmail("");
      }
      catch (err) {
        console.error("Subscription error:", err);
        alert("An error occurred. Please try again later.");
      }finally {
      setTimeout(() => {
        setLoading(false); // stop loader
      }, 2000);
    }

    }
  };

  return (
    <Box
      component="footer"
      sx={{
        position: "relative",
        width: "100vw",
        bgcolor: isDarkMode ? "grey.900" : "#f9f9f9ff",
        color: isDarkMode ? "grey.300" : "grey.800",
        py: 4,
        px: 3,
        boxShadow: "0 -2px 5px rgba(0,0,0,0.1)",
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} justifyContent="space-between">
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Stay Updated
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Subscribe to our newsletter for the latest updates.
            </Typography>
            <Box display="flex" gap={1} mt={2}>
              <TextField
                size="small"
                fullWidth
                variant="outlined"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{
                  bgcolor: "white",
                  borderRadius: 1,
                  "& .MuiInputBase-input": {
                    color: "black", // text inside input
                    fontWeight: "bold" // optional, makes it stronger
                  },
                  "& .MuiInputBase-input::placeholder": {
                    color: "black", // placeholder color
                    opacity: 1 // ensures it’s fully dark
                  }
                }}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubscribe}
                sx={{ minWidth: "80px", fontSize: "0.85rem",color:"07414dff" }}
                disabled={loading} // disable while loading
                startIcon={loading ? <CircularProgress size={18}  sx={{color:"07414dff"}} /> : null} // show loader
              >
                {loading ? "Subscribing…" : "Subscribe"}
              </Button>
            </Box>
          </Grid>

          <Grid item xs={6} sm={3} md={2}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Quick Links
            </Typography>
            <Link href="/" color="inherit" underline="none" display="block" sx={{ mb: 1 }}>
              Home
            </Link>
            <Link href="/about" color="inherit" underline="none" display="block" sx={{ mb: 1 }}>
              About
            </Link>
            <Link href="/contact" color="inherit" underline="none" display="block">
              Contact
            </Link>
          </Grid>

          <Grid item xs={6} sm={3} md={2}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Contact
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>support@ecom.com</Typography>
            <Typography variant="body2">+91 8595585912</Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={3} textAlign={{ xs: "center", sm: "left" }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Follow Us
            </Typography>
            <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
              <IconButton size="small" color="inherit"><Facebook /></IconButton>
              <IconButton size="small" color="inherit"><Twitter /></IconButton>
              <IconButton size="small" color="inherit"><Instagram /></IconButton>
              <IconButton size="small" color="inherit"><LinkedIn /></IconButton>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Typography
          variant="body2"
          textAlign="center"
          sx={{ pt: 1, color: "text.secondary" }}
        >
          &copy; {new Date().getFullYear()} Ecom. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;

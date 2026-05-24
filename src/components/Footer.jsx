import React, { useState } from "react";
import { 
  Box, Typography, Container, Grid, Link, 
  IconButton, TextField, Button, Divider 
} from "@mui/material";
import { Facebook, Twitter, Instagram, LinkedIn } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { BaseUrl ,name } from "../config";
const Footer = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const [email, setEmail] = useState("");

  const handleSubscribe = () => {
    if (email) {
      alert(`Subscribed with: ${email}`);
      setEmail("");
    }
  };

  return (
    <Box
  component="footer"
  sx={{
    position: "relative",
    width: "100vw",
    bgcolor: isDarkMode ? "grey.900" : "#f9f9f9",
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
                sx={{ bgcolor: "white", borderRadius: 1 }}
              />
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleSubscribe}
                sx={{ minWidth: "80px", fontSize: "0.85rem" }}
              >
                Subscribe
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
            <Typography> 
                  <Link
                    href="https://mail.google.com/mail/?view=cm&fs=1&to=support@ecom.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="hover"
                    sx={{ mb: 1, display: "block", cursor: "pointer" }}
                  >
                    support@ecom.com
                  </Link>

            </Typography>
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
          &copy; {new Date().getFullYear()} {name}. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;

import React, { useState } from "react";
import {
  Box,
  Button,
  Container,
  Divider,
  Grid,
  IconButton,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Facebook, Instagram, LinkedIn, Twitter } from "@mui/icons-material";
import { name } from "../config";

const columns = [
  {
    title: "Shop",
    links: [
      ["All products", "/products"],
      ["Best deals", "/products"],
      ["Wishlist", "/wishlist"],
      ["Cart", "/cart"],
    ],
  },
  {
    title: "Company",
    links: [
      ["About", "/help"],
      ["Contact", "/help"],
      ["Seller program", "/register"],
      ["Support", "/help"],
    ],
  },
  {
    title: "Account",
    links: [
      ["Profile", "/profile"],
      ["Orders", "/orders"],
      ["Sign in", "/signin"],
      ["Register", "/register"],
    ],
  },
];

const Footer = () => {
  const [email, setEmail] = useState("");

  const handleSubscribe = () => {
    if (!email.trim()) return;
    alert(`Subscribed with: ${email}`);
    setEmail("");
  };

  return (
    <Box component="footer" sx={{ width: "100%", bgcolor: "#080d18", color: "rgba(255,255,255,0.86)", mt: 0 }}>
      <Container maxWidth="xl" sx={{ py: { xs: 4, md: 5 }, px: { xs: 2, md: 3 } }}>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Typography variant="h5" fontWeight={950} sx={{ color: "white", mb: 1 }}>
              {name}
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.66)", maxWidth: 390, mb: 2.5 }}>
              A modern marketplace for daily shopping, trusted sellers, fast delivery, secure checkout, and fresh deals.
            </Typography>
            <Stack direction="row" spacing={1}>
              {[Facebook, Twitter, Instagram, LinkedIn].map((Icon, index) => (
                <IconButton
                  key={index}
                  size="small"
                  sx={{ color: "white", bgcolor: "rgba(255,255,255,0.08)", "&:hover": { bgcolor: "primary.main" } }}
                >
                  <Icon fontSize="small" />
                </IconButton>
              ))}
            </Stack>
          </Grid>

          {columns.map((column) => (
            <Grid size={{ xs: 6, sm: 4, md: 2 }} key={column.title}>
              <Typography variant="subtitle2" fontWeight={950} sx={{ color: "white", mb: 1.5 }}>
                {column.title}
              </Typography>
              <Stack spacing={1}>
                {column.links.map(([label, href]) => (
                  <Link key={label} href={href} underline="none" sx={{ color: "rgba(255,255,255,0.64)", fontSize: 14, "&:hover": { color: "white" } }}>
                    {label}
                  </Link>
                ))}
              </Stack>
            </Grid>
          ))}

          <Grid size={{ xs: 12, md: 2 }}>
            <Typography variant="subtitle2" fontWeight={950} sx={{ color: "white", mb: 1.5 }}>
              Newsletter
            </Typography>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.64)", display: "block", mb: 1.5 }}>
              Get deal alerts and marketplace updates.
            </Typography>
            <Stack direction="row" spacing={1}>
              <TextField
                size="small"
                placeholder="Email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                sx={{
                  bgcolor: "white",
                  borderRadius: 1,
                  flex: 1,
                  "& .MuiOutlinedInput-root": { borderRadius: 1 },
                }}
              />
              <Button variant="contained" onClick={handleSubscribe} sx={{ borderRadius: 1, fontWeight: 900 }}>
                Join
              </Button>
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3, borderColor: "rgba(255,255,255,0.1)" }} />
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1}>
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.52)" }}>
            © {new Date().getFullYear()} {name}. All rights reserved.
          </Typography>
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.52)" }}>
            Secure payments · Verified sellers · Fast delivery
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
};

export default Footer;

import { memo } from "react";
import { Box, Card, CardContent, Grid, Typography } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import InventoryIcon from "@mui/icons-material/Inventory";
import InsightsIcon from "@mui/icons-material/Insights";
import PersonIcon from "@mui/icons-material/Person";

const SellerQuickActions = ({ businessName, onNavigate }) => {
  const actions = [
    { icon: <DashboardIcon />, title: "Seller dashboard", desc: "Open your seller control center.", path: "/seller/dashboard" },
    { icon: <InventoryIcon />, title: "Manage products", desc: "Add and update product listings.", path: "/seller/dashboard" },
    { icon: <InsightsIcon />, title: "Analytics", desc: "Review performance and sales signals.", path: "/seller/dashboard" },
    { icon: <PersonIcon />, title: "Seller profile", desc: businessName || "Business account workspace.", path: "/profile" },
  ];

  return (
    <Box component="section" sx={{ py: { xs: 3, md: 5 } }}>
      <Typography variant="h4" sx={{ fontWeight: 900, mb: 2 }}>
        Seller Shortcuts
      </Typography>
      <Grid container spacing={2}>
        {actions.map((item) => (
          <Grid item xs={12} sm={6} md={3} key={item.title}>
            <Card onClick={() => onNavigate(item.path)} sx={{ cursor: "pointer", height: "100%", borderRadius: 1 }}>
              <CardContent>
                <Box sx={{ color: "primary.main", mb: 1 }}>{item.icon}</Box>
                <Typography variant="h6" fontWeight={900}>{item.title}</Typography>
                <Typography variant="body2" color="text.secondary">{item.desc}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default memo(SellerQuickActions);

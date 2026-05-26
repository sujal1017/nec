import React, { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Container,
  Grid,
  Stack,
  Typography,
  Button,
  Divider,
  LinearProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import PaymentsIcon from "@mui/icons-material/Payments";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { useAuth } from "../../context/AuthContext";
import { fetchSellerDashboard, fetchSellerProducts, fetchSellerOrders } from "../../services/sellerService";
import SellerDataState from "../../components/seller/SellerDataState";
import SellerDashboardSkeleton from "../../components/seller/SellerDashboardSkeleton";
import SellerStatCard from "../../components/seller/SellerStatCard";

const SellerProductTable = lazy(() => import("../../components/seller/SellerProductTable"));
const SellerOrdersTable = lazy(() => import("../../components/seller/SellerOrdersTable"));
const SellerInventoryAlerts = lazy(() => import("../../components/seller/SellerInventoryAlerts"));
const SellerAnalyticsPlaceholder = lazy(() => import("../../components/seller/SellerAnalyticsPlaceholder"));

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

const SectionCard = ({ title, action, children }) => (
  <Card variant="outlined" sx={{ borderRadius: 2, height: "100%" }}>
    <CardContent>
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight={800}>
          {title}
        </Typography>
        {action}
      </Stack>
      <Divider sx={{ mb: 2 }} />
      {children}
    </CardContent>
  </Card>
);

const getResults = (payload) => (Array.isArray(payload) ? payload : payload?.results || []);

const SellerDashboard = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const [dashboardData, productData, orderData] = await Promise.all([
        fetchSellerDashboard(),
        fetchSellerProducts({ page_size: 8 }),
        fetchSellerOrders({ page_size: 8 }),
      ]);
      setDashboard(dashboardData);
      setProducts(getResults(productData));
      setOrders(getResults(orderData));
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.error ||
          "Seller dashboard could not be loaded."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const metrics = dashboard?.metrics || {};
  const displayName = dashboard?.seller?.business_name || user?.business_name || user?.businessName || user?.name || "Seller";

  const stats = useMemo(
    () => [
      {
        label: "Total Products",
        value: metrics.total_products ?? 0,
        helper: "Active catalog records",
        icon: <Inventory2Icon />,
      },
      {
        label: "Total Orders",
        value: metrics.total_orders ?? 0,
        helper: "Orders containing your products",
        icon: <LocalShippingIcon />,
        color: "info.main",
      },
      {
        label: "Pending Orders",
        value: metrics.pending_orders ?? 0,
        helper: "Awaiting processing",
        icon: <PendingActionsIcon />,
        color: "warning.main",
      },
      {
        label: "Revenue",
        value: currency.format(Number(metrics.total_revenue || 0)),
        helper: "Completed non-cancelled value",
        icon: <PaymentsIcon />,
        color: "success.main",
      },
      {
        label: "Low Stock",
        value: metrics.low_stock_products ?? 0,
        helper: "Products at 5 units or less",
        icon: <WarningAmberIcon />,
        color: "error.main",
      },
    ],
    [metrics]
  );

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <SellerDashboardSkeleton />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <SellerDataState type="error" message={error} onRetry={() => loadDashboard()} />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
      {refreshing ? <LinearProgress sx={{ mb: 2 }} /> : null}
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="overline" color="text.secondary">
            Seller dashboard
          </Typography>
          <Typography variant="h4" fontWeight={900}>
            {displayName}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => loadDashboard(true)}>
          Refresh
        </Button>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {stats.map((stat) => (
          <Grid item xs={12} sm={6} lg={2.4} key={stat.label}>
            <SellerStatCard {...stat} />
          </Grid>
        ))}
      </Grid>

      <Suspense fallback={<SellerDashboardSkeleton />}>
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <SectionCard title="Product Table">
              <SellerProductTable products={products} />
            </SectionCard>
          </Grid>
          <Grid item xs={12} lg={4}>
            <SectionCard title="Inventory Alerts">
              <SellerInventoryAlerts items={dashboard?.low_stock_items || []} />
            </SectionCard>
          </Grid>
          <Grid item xs={12} lg={8}>
            <SectionCard title="Recent Orders">
              <SellerOrdersTable orders={dashboard?.recent_orders?.length ? dashboard.recent_orders : orders} />
            </SectionCard>
          </Grid>
          <Grid item xs={12} lg={4}>
            <SectionCard title="Top Selling Products">
              {(dashboard?.top_selling_products || []).length ? (
                <Stack spacing={1.5}>
                  {dashboard.top_selling_products.map((item) => (
                    <Box key={`${item.product_id}-${item.name}`}>
                      <Stack direction="row" justifyContent="space-between" spacing={2}>
                        <Typography variant="body2" fontWeight={700} noWrap>
                          {item.name}
                        </Typography>
                        <Typography variant="body2">{item.quantity_sold}</Typography>
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {currency.format(Number(item.revenue || 0))}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <SellerDataState title="No sales yet" message="Top sellers will appear after orders are placed." />
              )}
            </SectionCard>
          </Grid>
          <Grid item xs={12}>
            <SectionCard title="Revenue Stats">
              <SellerAnalyticsPlaceholder />
            </SectionCard>
          </Grid>
        </Grid>
      </Suspense>
    </Container>
  );
};

export default SellerDashboard;

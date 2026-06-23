import React, { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  LinearProgress,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import AddIcon from "@mui/icons-material/Add";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import PaymentsIcon from "@mui/icons-material/Payments";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { useAuth } from "../../context/AuthContext";
import {
  createSellerProduct,
  deleteSellerProduct,
  fetchSellerDashboard,
  fetchSellerOrders,
  fetchSellerProducts,
  fetchSellerProfile,
  updateSellerProduct,
  updateSellerProfile,
} from "../../services/sellerService";
import { fetchCategories } from "../../services/categoryService";
import SellerDataState from "../../components/seller/SellerDataState";
import SellerDashboardSkeleton from "../../components/seller/SellerDashboardSkeleton";
import SellerStatCard from "../../components/seller/SellerStatCard";

const SellerProductTable = lazy(() => import("../../components/seller/SellerProductTable"));
const SellerOrdersTable = lazy(() => import("../../components/seller/SellerOrdersTable"));
const SellerInventoryAlerts = lazy(() => import("../../components/seller/SellerInventoryAlerts"));
const SellerAnalyticsPlaceholder = lazy(() => import("../../components/seller/SellerAnalyticsPlaceholder"));

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

const emptyProduct = {
  name: "",
  description: "",
  category: "",
  brand: "",
  sku: "",
  price: "",
  discount_price: "",
  stock_quantity: 0,
  status: "active",
  is_featured: false,
  thumbnail: null,
  uploaded_images: [],
};

const SectionCard = ({ title, action, children }) => (
  <Card variant="outlined" sx={{ borderRadius: 1, height: "100%" }}>
    <CardContent>
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight={800}>{title}</Typography>
        {action}
      </Stack>
      <Divider sx={{ mb: 2 }} />
      {children}
    </CardContent>
  </Card>
);

const getResults = (payload) => (Array.isArray(payload) ? payload : payload?.results || []);

const appendFormValue = (formData, key, value) => {
  if (value === null || value === undefined || value === "") return;
  formData.append(key, value);
};

const buildProductFormData = (product) => {
  const formData = new FormData();
  ["name", "description", "category", "brand", "sku", "price", "discount_price", "stock_quantity", "status"].forEach((key) => {
    appendFormValue(formData, key, product[key]);
  });
  formData.append("is_featured", product.is_featured ? "true" : "false");
  if (product.thumbnail instanceof File) formData.append("thumbnail", product.thumbnail);
  Array.from(product.uploaded_images || []).forEach((file) => formData.append("uploaded_images", file));
  return formData;
};

const ProductForm = ({ value, onChange, onSubmit, saving, editingId, onCancel, categories = [] }) => {
  const preview = value.thumbnail instanceof File ? URL.createObjectURL(value.thumbnail) : value.image;

  return (
    <Stack spacing={2} component="form" onSubmit={onSubmit}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField required fullWidth label="Product name" value={value.name} onChange={(e) => onChange("name", e.target.value)} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Autocomplete
            freeSolo
            options={categories.map((category) => category.name)}
            value={value.category || ""}
            onChange={(_, nextValue) => onChange("category", nextValue || "")}
            onInputChange={(_, inputValue) => onChange("category", inputValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                required
                fullWidth
                label="Category"
                helperText="Choose or type a marketplace category"
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <TextField fullWidth label="Brand" value={value.brand} onChange={(e) => onChange("brand", e.target.value)} />
        </Grid>
        <Grid size={12}>
          <TextField required fullWidth multiline minRows={3} label="Description" value={value.description} onChange={(e) => onChange("description", e.target.value)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField required fullWidth type="number" label="Price" value={value.price} onChange={(e) => onChange("price", e.target.value)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField fullWidth type="number" label="Discount price" value={value.discount_price || ""} onChange={(e) => onChange("discount_price", e.target.value)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField required fullWidth type="number" label="Stock" value={value.stock_quantity} onChange={(e) => onChange("stock_quantity", e.target.value)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField fullWidth label="SKU" value={value.sku} onChange={(e) => onChange("sku", e.target.value)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField select fullWidth label="Status" value={value.status} onChange={(e) => onChange("status", e.target.value)}>
            {["active", "draft", "inactive", "archived"].map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Button variant="outlined" component="label" fullWidth>
            Upload thumbnail
            <input hidden type="file" accept="image/*" onChange={(e) => onChange("thumbnail", e.target.files?.[0] || null)} />
          </Button>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 5 }}>
          <Button variant="outlined" component="label" fullWidth>
            Upload gallery images
            <input hidden multiple type="file" accept="image/*" onChange={(e) => onChange("uploaded_images", e.target.files || [])} />
          </Button>
        </Grid>
      </Grid>
      {preview && (
        <Box component="img" src={preview} alt="Product preview" sx={{ width: 120, height: 120, objectFit: "cover", borderRadius: 1 }} />
      )}
      <Stack direction="row" spacing={1}>
        <Button type="submit" variant="contained" startIcon={<AddIcon />} disabled={saving}>
          {editingId ? "Update product" : "Add product"}
        </Button>
        {editingId && <Button onClick={onCancel}>Cancel edit</Button>}
      </Stack>
    </Stack>
  );
};

const SellerDashboard = () => {
  const navigate = useNavigate();
  const { user, userType, isAuthenticated, logout } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [profile, setProfile] = useState(null);
  const [productForm, setProductForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState(null);
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [categories, setCategories] = useState([]);

  const loadDashboard = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      if (!isAuthenticated || userType !== "business") {
        navigate("/signin", { replace: true, state: { from: "/seller/dashboard" } });
        return;
      }

      const [dashboardResult, productResult, orderResult, profileResult] = await Promise.allSettled([
        fetchSellerDashboard(),
        fetchSellerProducts({ page_size: 25 }),
        fetchSellerOrders({ page_size: 25 }),
        fetchSellerProfile(),
      ]);
      const failedAuth = [dashboardResult, productResult, orderResult, profileResult].find(
        (result) => result.status === "rejected" && result.reason?.response?.status === 401
      );
      if (failedAuth) {
        logout();
        navigate("/signin", { replace: true, state: { from: "/seller/dashboard" } });
        return;
      }

      const dashboardData = dashboardResult.status === "fulfilled" ? dashboardResult.value : { metrics: {}, recent_orders: [], low_stock_items: [] };
      const productData = productResult.status === "fulfilled" ? productResult.value : [];
      const orderData = orderResult.status === "fulfilled" ? orderResult.value : [];
      const profileData = profileResult.status === "fulfilled" ? profileResult.value : null;

      setDashboard(dashboardData);
      setProducts(getResults(productData));
      setOrders(getResults(orderData));
      setProfile(profileData);
      const rejected = [dashboardResult, productResult, orderResult, profileResult].filter((result) => result.status === "rejected");
      if (rejected.length) {
        setError("Some seller data could not be loaded. Empty sections are shown safely.");
      }
    } catch (err) {
      const detail = err?.response?.data?.detail || "";
      const code = err?.response?.data?.code || "";
      if (err?.response?.status === 401 && (code === "token_not_valid" || String(detail).includes("token not valid") || String(detail).includes("credentials"))) {
        logout();
        navigate("/signin", { replace: true, state: { from: "/seller/dashboard" } });
        return;
      }
      setError(err?.response?.data?.detail || err?.response?.data?.error || "Seller dashboard could not be loaded.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, logout, navigate, userType]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  const metrics = dashboard?.metrics || {};
  const displayName = dashboard?.seller?.business_name || user?.business_name || user?.businessName || user?.name || "Seller";

  const stats = useMemo(() => [
    { label: "Total Products", value: metrics.total_products ?? 0, helper: "Active catalog records", icon: <Inventory2Icon /> },
    { label: "Total Orders", value: metrics.total_orders ?? 0, helper: "Orders containing your products", icon: <LocalShippingIcon />, color: "info.main" },
    { label: "Pending Orders", value: metrics.pending_orders ?? 0, helper: "Awaiting processing", icon: <PendingActionsIcon />, color: "warning.main" },
    { label: "Revenue", value: currency.format(Number(metrics.total_revenue || 0)), helper: "Completed non-cancelled value", icon: <PaymentsIcon />, color: "success.main" },
    { label: "Low Stock", value: metrics.low_stock_products ?? 0, helper: "Products at 5 units or less", icon: <WarningAmberIcon />, color: "error.main" },
  ], [metrics]);

  const updateProductForm = (field, value) => {
    setProductForm((current) => ({ ...current, [field]: value }));
  };

  const resetProductForm = () => {
    setEditingId(null);
    setProductForm(emptyProduct);
  };

  const handleSubmitProduct = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload = buildProductFormData(productForm);
      if (editingId) await updateSellerProduct(editingId, payload);
      else await createSellerProduct(payload);
      setSuccess(editingId ? "Product updated." : "Product added.");
      resetProductForm();
      await loadDashboard(true);
    } catch (err) {
      setError(err?.response?.data ? JSON.stringify(err.response.data) : "Product could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditProduct = (product) => {
    setTab(1);
    setEditingId(product.id);
    setProductForm({ ...emptyProduct, ...product, thumbnail: null, uploaded_images: [] });
  };

  const handleDeleteProduct = async (product) => {
    if (!window.confirm(`Delete ${product.name}?`)) return;
    await deleteSellerProduct(product.id);
    setSuccess("Product deleted.");
    await loadDashboard(true);
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    const formData = new FormData(event.currentTarget);
    try {
      const saved = await updateSellerProfile(formData);
      setProfile(saved);
      setSuccess("Seller profile updated.");
      await loadDashboard(true);
    } catch (err) {
      setError(err?.response?.data ? JSON.stringify(err.response.data) : "Seller profile could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Container maxWidth="xl" sx={{ py: 4 }}><SellerDashboardSkeleton /></Container>;
  }

  if (error && !dashboard) {
    return <Container maxWidth="lg" sx={{ py: 4 }}><SellerDataState type="error" message={error} onRetry={() => loadDashboard()} /></Container>;
  }

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
      {refreshing ? <LinearProgress sx={{ mb: 2 }} /> : null}
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="overline" color="text.secondary">Seller dashboard</Typography>
          <Typography variant="h4" fontWeight={900}>{displayName}</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => navigate("/")}>Home</Button>
          <Button variant="contained" onClick={() => loadDashboard(true)}>Refresh</Button>
        </Stack>
      </Stack>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>{success}</Alert>}

      <Tabs value={tab} onChange={(_, next) => setTab(next)} variant="scrollable" scrollButtons="auto" sx={{ mb: 3 }}>
        <Tab label="Overview" />
        <Tab label="Products" />
        <Tab label="Orders" />
        <Tab label="Inventory" />
        <Tab label="Profile" />
      </Tabs>

      <Suspense fallback={<SellerDashboardSkeleton />}>
        {tab === 0 && (
          <Grid container spacing={3}>
            {stats.map((stat) => (
              <Grid size={{ xs: 12, sm: 6, lg: 2.4 }} key={stat.label}><SellerStatCard {...stat} /></Grid>
            ))}
            <Grid size={{ xs: 12, lg: 8 }}><SectionCard title="Recent Orders"><SellerOrdersTable orders={dashboard?.recent_orders?.length ? dashboard.recent_orders : orders} /></SectionCard></Grid>
            <Grid size={{ xs: 12, lg: 4 }}><SectionCard title="Top Selling Products"><SellerAnalyticsPlaceholder /></SectionCard></Grid>
          </Grid>
        )}

        {tab === 1 && (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, lg: 5 }}><SectionCard title={editingId ? "Update Product" : "Add Product"}><ProductForm value={productForm} onChange={updateProductForm} onSubmit={handleSubmitProduct} saving={saving} editingId={editingId} onCancel={resetProductForm} categories={categories} /></SectionCard></Grid>
            <Grid size={{ xs: 12, lg: 7 }}><SectionCard title="Product Management"><SellerProductTable products={products} onEdit={handleEditProduct} onDelete={handleDeleteProduct} /></SectionCard></Grid>
          </Grid>
        )}

        {tab === 2 && <SectionCard title="Order Management"><SellerOrdersTable orders={orders} /></SectionCard>}

        {tab === 3 && (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 5 }}><SectionCard title="Low Stock Alerts"><SellerInventoryAlerts items={dashboard?.low_stock_items || []} /></SectionCard></Grid>
            <Grid size={{ xs: 12, md: 7 }}><SectionCard title="Inventory Management"><SellerProductTable products={products.filter((product) => Number(product.stock_quantity) <= 5)} onEdit={handleEditProduct} /></SectionCard></Grid>
          </Grid>
        )}

        {tab === 4 && (
          <SectionCard title="Seller Profile">
            <Stack spacing={2} component="form" onSubmit={handleProfileSave}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}><TextField required fullWidth name="business_name" label="Business name" defaultValue={profile?.business_name || ""} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><TextField required fullWidth name="business_email" label="Business email" defaultValue={profile?.business_email || ""} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth name="business_phone" label="Business phone" defaultValue={profile?.business_phone || ""} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth name="gst_number" label="GST / tax number" defaultValue={profile?.gst_number || ""} /></Grid>
                <Grid size={12}><TextField fullWidth multiline minRows={3} name="business_address" label="Business address" defaultValue={profile?.business_address || ""} /></Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Button variant="outlined" component="label" fullWidth>
                    Upload business logo
                    <input hidden type="file" name="logo" accept="image/*" />
                  </Button>
                </Grid>
              </Grid>
              <Button type="submit" variant="contained" disabled={saving}>Save profile</Button>
            </Stack>
          </SectionCard>
        )}
      </Suspense>
    </Container>
  );
};

export default SellerDashboard;

import { Box, Typography } from "@mui/material";
import InsightsIcon from "@mui/icons-material/Insights";

const SellerAnalyticsPlaceholder = () => (
  <Box
    sx={{
      minHeight: 220,
      display: "grid",
      placeItems: "center",
      border: "1px dashed",
      borderColor: "divider",
      borderRadius: 2,
      bgcolor: "action.hover",
      textAlign: "center",
      px: 3,
    }}
  >
    <Box>
      <InsightsIcon color="primary" sx={{ fontSize: 42, mb: 1 }} />
      <Typography variant="subtitle1" fontWeight={800}>
        Analytics charts
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Revenue and conversion charts can connect here once event analytics are captured.
      </Typography>
    </Box>
  </Box>
);

export default SellerAnalyticsPlaceholder;

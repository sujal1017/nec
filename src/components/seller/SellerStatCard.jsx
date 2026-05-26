import { Card, CardContent, Stack, Typography, Box } from "@mui/material";

const SellerStatCard = ({ label, value, helper, icon, color = "primary.main" }) => (
  <Card variant="outlined" sx={{ height: "100%", borderRadius: 2 }}>
    <CardContent>
      <Stack direction="row" spacing={2} alignItems="center">
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            display: "grid",
            placeItems: "center",
            color,
            bgcolor: "action.hover",
          }}
        >
          {icon}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="h5" fontWeight={800}>
            {value}
          </Typography>
          {helper ? (
            <Typography variant="caption" color="text.secondary">
              {helper}
            </Typography>
          ) : null}
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

export default SellerStatCard;

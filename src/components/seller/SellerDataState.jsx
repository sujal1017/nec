import { Alert, Box, Button, Typography } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";

const SellerDataState = ({ type = "empty", title, message, onRetry }) => {
  if (type === "error") {
    return (
      <Alert
        severity="error"
        action={
          onRetry ? (
            <Button color="inherit" size="small" startIcon={<RefreshIcon />} onClick={onRetry}>
              Retry
            </Button>
          ) : null
        }
      >
        <Typography fontWeight={700}>{title || "Unable to load seller data"}</Typography>
        <Typography variant="body2">{message || "Please try again."}</Typography>
      </Alert>
    );
  }

  return (
    <Box sx={{ py: 5, textAlign: "center", color: "text.secondary" }}>
      <Typography variant="subtitle1" fontWeight={700} color="text.primary">
        {title || "Nothing here yet"}
      </Typography>
      <Typography variant="body2">{message || "New records will appear here automatically."}</Typography>
    </Box>
  );
};

export default SellerDataState;

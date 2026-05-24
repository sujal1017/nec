import { Box, CircularProgress } from "@mui/material";

const LoadingFallback = () => (
  <Box
    sx={{
      minHeight: "60vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <CircularProgress />
  </Box>
);

export default LoadingFallback;

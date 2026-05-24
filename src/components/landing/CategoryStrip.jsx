import { memo } from "react";
import { Avatar, Box, Skeleton, Typography } from "@mui/material";

const CategoryStrip = ({ categories = [], loading, onSelect }) => (
  <Box component="section" sx={{ py: 3 }}>
    <Box
      sx={{
        display: "flex",
        gap: 2,
        overflowX: "auto",
        pb: 1,
        scrollSnapType: "x mandatory",
      }}
    >
      {(loading ? Array.from({ length: 10 }) : categories).map((category, index) => (
        <Box
          key={category?.name || index}
          onClick={() => category?.name && onSelect(category.name)}
          sx={{
            minWidth: 112,
            textAlign: "center",
            cursor: loading ? "default" : "pointer",
            scrollSnapAlign: "start",
          }}
        >
          {loading ? (
            <Skeleton variant="circular" width={72} height={72} sx={{ mx: "auto" }} />
          ) : (
            <Avatar src={category.image || "/images/slide2.jpg"} sx={{ width: 72, height: 72, mx: "auto", mb: 1 }} />
          )}
          <Typography variant="body2" fontWeight={800} sx={{ textTransform: "capitalize" }} noWrap>
            {loading ? <Skeleton width={80} /> : category.name}
          </Typography>
        </Box>
      ))}
    </Box>
  </Box>
);

export default memo(CategoryStrip);

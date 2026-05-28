import { memo } from "react";
import { Avatar, Box, Skeleton, Stack, Typography } from "@mui/material";

const CategoryStrip = ({ categories = [], loading, onSelect }) => (
  <Box
    component="section"
    sx={{
      py: { xs: 1.75, md: 2.25 },
      px: { xs: 1.25, md: 2 },
      mt: { xs: 1.5, md: 2 },
      bgcolor: "background.paper",
      border: "1px solid",
      borderColor: "divider",
      borderRadius: 1,
    }}
  >
    <Stack direction="row" alignItems="baseline" justifyContent="space-between" sx={{ mb: 1.5 }}>
      <Box>
        <Typography variant="h6" fontWeight={950} sx={{ fontSize: { xs: 18, md: 22 } }}>
          Shop by category
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Browse popular departments
        </Typography>
      </Box>
    </Stack>
    <Box
      sx={{
        display: "flex",
        gap: 1,
        overflowX: "auto",
        pb: 1,
        scrollSnapType: "x mandatory",
        scrollbarWidth: "thin",
      }}
    >
      {(loading ? Array.from({ length: 10 }) : categories).map((category, index) => (
        <Box
          key={category?.name || index}
          onClick={() => category?.name && onSelect(category.name)}
          sx={{
            minWidth: { xs: 94, md: 116 },
            textAlign: "center",
            cursor: loading ? "default" : "pointer",
            scrollSnapAlign: "start",
            p: 1,
            borderRadius: 1,
            border: "1px solid",
            borderColor: "divider",
            transition: "transform 160ms ease, border-color 160ms ease, background-color 160ms ease",
            "&:hover": loading
              ? {}
              : {
                  transform: "translateY(-2px)",
                  borderColor: "primary.light",
                  bgcolor: (theme) => (theme.palette.mode === "dark" ? "rgba(79,117,194,0.12)" : "#eef5ff"),
                },
          }}
        >
          {loading ? (
            <Skeleton variant="circular" width={56} height={56} sx={{ mx: "auto" }} />
          ) : (
            <Avatar
              src={category.image || "/images/slide2.jpg"}
              sx={{ width: 56, height: 56, mx: "auto", mb: 0.75, bgcolor: "grey.100", border: "3px solid rgba(37,99,235,0.12)" }}
              imgProps={{ loading: "lazy" }}
            />
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

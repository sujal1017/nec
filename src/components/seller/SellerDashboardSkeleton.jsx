import { Card, CardContent, Grid, Skeleton, Stack } from "@mui/material";

const SellerDashboardSkeleton = () => (
  <Stack spacing={3}>
    <Grid container spacing={2}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Grid item xs={12} sm={6} lg={2.4} key={index}>
          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent>
              <Skeleton width="55%" />
              <Skeleton width="75%" height={42} />
              <Skeleton width="45%" />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardContent>
        <Skeleton width="25%" />
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} height={48} />
        ))}
      </CardContent>
    </Card>
  </Stack>
);

export default SellerDashboardSkeleton;

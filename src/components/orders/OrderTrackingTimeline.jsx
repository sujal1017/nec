import React, { useEffect, useState } from "react";
import { Box, Button, CircularProgress, Step, StepContent, StepLabel, Stepper, Typography } from "@mui/material";
import api from "../../services/api";

const OrderTrackingTimeline = ({ orderId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open || data) return;
    setLoading(true);
    api.get(`/orders/${orderId}/tracking/`)
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, [data, open, orderId]);

  const activeStep = data?.timeline?.findIndex((step) => step.current) ?? 0;

  return (
    <Box sx={{ mt: 2 }}>
      <Button size="small" variant="outlined" onClick={() => setOpen((value) => !value)}>
        {open ? "Hide tracking" : "Track order"}
      </Button>
      {open && (
        <Box sx={{ mt: 2 }}>
          {loading ? (
            <CircularProgress size={22} />
          ) : (
            <Stepper activeStep={activeStep} orientation="vertical">
              {(data?.timeline || []).map((step) => (
                <Step key={step.status} completed={step.completed}>
                  <StepLabel>
                    <Typography fontWeight={step.current ? 800 : 500}>{step.label}</Typography>
                  </StepLabel>
                  <StepContent>
                    <Typography variant="body2" color="text.secondary">
                      {step.timestamp ? new Date(step.timestamp).toLocaleString("en-IN") : "Pending"}
                    </Typography>
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          )}
        </Box>
      )}
    </Box>
  );
};

export default OrderTrackingTimeline;

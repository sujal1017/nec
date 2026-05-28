import React from "react";
import { Button, Tooltip } from "@mui/material";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import { useCompare } from "../../context/CompareContext";

const CompareButton = ({ productId, size = "small" }) => {
  const compare = useCompare();
  const selected = compare?.ids?.includes(Number(productId));

  const handleClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const result = compare?.toggleCompare(productId);
    if (result && !result.ok) window.alert(result.message);
  };

  return (
    <Tooltip title={selected ? "Remove from comparison" : "Add to comparison"}>
      <Button
        variant={selected ? "contained" : "outlined"}
        size={size}
        startIcon={<CompareArrowsIcon />}
        onClick={handleClick}
        sx={{ textTransform: "none" }}
      >
        Compare
      </Button>
    </Tooltip>
  );
};

export default CompareButton;

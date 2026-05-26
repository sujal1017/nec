import { List, ListItem, ListItemText, Chip } from "@mui/material";
import SellerDataState from "./SellerDataState";

const SellerInventoryAlerts = ({ items = [] }) => {
  if (!items.length) {
    return <SellerDataState title="Inventory looks healthy" message="Low stock products will be flagged here." />;
  }

  return (
    <List dense disablePadding>
      {items.map((item) => (
        <ListItem
          key={item.id}
          divider
          secondaryAction={<Chip size="small" color="warning" label={`${item.stock_quantity} left`} />}
        >
          <ListItemText primary={item.name} secondary={item.sku || item.category} />
        </ListItem>
      ))}
    </List>
  );
};

export default SellerInventoryAlerts;

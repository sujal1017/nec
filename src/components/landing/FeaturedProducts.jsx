import ProductRail from "./ProductRail";

const FeaturedProducts = (props) => (
  <ProductRail title="Featured Products" subtitle="Fresh picks from trusted sellers" limit={20} {...props} />
);

export default FeaturedProducts;

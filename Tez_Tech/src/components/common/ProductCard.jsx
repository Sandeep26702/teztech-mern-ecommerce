import { useNavigate } from "react-router-dom";

const ProductCard = ({ product }) => {
  const navigate = useNavigate();

  return (
    <div
      className="border rounded p-3 shadow-sm"
      style={{ cursor: "pointer" }}
      onClick={() => navigate(`/products/${product._id}`)}
    >
      <img
        src={product.images?.[0]?.url}
        alt={product.name}
        style={{ width: "100%", height: 180, objectFit: "cover" }}
      />

      <h5 className="mt-2">{product.name}</h5>
      <p className="text-muted">{product.category}</p>
      <strong>₹ {product.price}</strong>
    </div>
  );
};

export default ProductCard;

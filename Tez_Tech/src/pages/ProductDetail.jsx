import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getProductById } from "../services/productService";
import { useCart } from "../context/CartContext";

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart } = useCart(); // ✅ IMPORTANT
  const [product, setProduct] = useState(null);

  useEffect(() => {
    loadProduct();
  }, []);

  const loadProduct = async () => {
    const { data } = await getProductById(id);
    setProduct(data.product);
  };

  if (!product) {
    return <p className="text-center mt-5">Loading...</p>;
  }

  return (
    <div className="container mt-4">
      <div className="row">
        {/* IMAGE */}
        <div className="col-md-6">
          <img
            src={product.images?.[0]?.url}
            alt={product.name}
            className="img-fluid rounded"
          />
        </div>

        {/* DETAILS */}
        <div className="col-md-6">
          <h2>{product.name}</h2>
          <h4 className="text-success">₹ {product.price}</h4>

          <p className="mt-3">{product.description}</p>

          <p>
            <strong>Category:</strong> {product.category}
          </p>
          <p>
            <strong>Stock:</strong>{" "}
            {product.stock > 0 ? "In Stock" : "Out of Stock"}
          </p>

          {/* ✅ ADD TO CART */}
          <button
            className="btn btn-primary mt-3"
            disabled={product.stock === 0}
            onClick={() => addToCart(product)}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;

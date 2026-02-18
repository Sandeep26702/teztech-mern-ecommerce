import { useEffect, useState } from "react";
import axios from "axios";

const AdminProducts = () => {
  const [products, setProducts] = useState([]);

  const fetchProducts = async () => {
    const token = localStorage.getItem("token");

    const { data } = await axios.get(
      "http://localhost:5000/api/products",
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setProducts(data.products);
  };

  const deleteProduct = async (id) => {
    const token = localStorage.getItem("token");

    await axios.delete(
      `http://localhost:5000/api/products/${id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    fetchProducts();
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div style={{ padding: "40px" }}>
      <h2>Manage Products</h2>

      {products.map((product) => (
        <div key={product._id} style={{ marginBottom: "15px" }}>
          {product.name} - ₹{product.price}
          <button onClick={() => deleteProduct(product._id)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
};

export default AdminProducts;

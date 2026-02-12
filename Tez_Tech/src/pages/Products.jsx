import { useState } from "react";
import { Link } from "react-router-dom";
import { PRODUCT_CATEGORIES } from "../utils/constants";
import "../styles/components/Products.css";

const Products = () => {
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredProducts = PRODUCT_CATEGORIES.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="products-container">
      <h1 className="products-title">Our Product Categories</h1>
      <p className="products-subtitle">
        Explore our comprehensive range of electronic components and solutions
      </p>

      <div className="search-container">
        <input
          type="text"
          placeholder="Search product categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="products-grid">
        {filteredProducts.map(product => (
          <Link key={product.id} to={`/products/${product.id}`} className="product-card-link">
            <div className="product-card">
              <div className="product-icon">{product.icon}</div>
              <h3 className="product-name">{product.name}</h3>
              <button className="product-button">View Products</button>
            </div>
          </Link>
        ))}
      </div>

      <div className="products-cta">
        <h2>Need Something Specific?</h2>
        <p>
          Can't find what you're looking for? Contact us for custom solutions and bulk orders.
        </p>
        <button className="products-cta-button">Contact Us</button>
      </div>
    </div>
  );
};

export default Products;
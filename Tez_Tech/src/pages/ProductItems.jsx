// ✅ React imports
import React, { useCallback } from "react";

// ✅ Router imports (NAMED exports)
import { useParams, Link } from "react-router-dom";

import { useCart } from "../context/CartContext";
import { CATEGORY_ITEMS } from "../utils/constants";





// React.memo → unnecessary re-render avoid karta hai
const ProductItems = React.memo(() => {

  // URL se categoryId milta hai
  const { categoryId } = useParams();

  // Cart context se function
  const { addToCart } = useCart();

  // Agar categoryId galat ho to empty fallback
  const category = CATEGORY_ITEMS[categoryId] || {
    name: "Category",
    items: []
  };

  // useCallback → performance optimization
  const handleAddToCart = useCallback((item, index) => {
    const product = {
      id: `${categoryId}-${index}`,
      name: item.name,
      price: item.price,
      image: "📦"
    };
    addToCart(product);
  }, [categoryId, addToCart]);

  return (
    <div className="product-items-container">

      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link to="/products">Products</Link> / {category.name}
      </div>

      <h1 className="category-title">{category.name}</h1>
      <p className="category-subtitle">
        Browse our selection of {category.name.toLowerCase()}
      </p>

      {/* Products Grid */}
      <div className="items-grid">
        {category.items.map((item, index) => (
          <div key={`${categoryId}-${index}`} className="item-card">
            <div className="item-image">📦</div>
            <h3 className="item-name">{item.name}</h3>
            <p className="item-price">₹{item.price}</p>

            <div className="item-buttons">
              <button
                onClick={() => handleAddToCart(item, index)}
                className="add-to-cart-btn"
              >
                Add to Cart
              </button>

              <Link to="/quotation" className="quote-btn">
                Get Quote
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Back Button */}
      <div className="back-section">
        <Link to="/products" className="back-button">
          ← Back to Categories
        </Link>
      </div>
    </div>
  );
});

ProductItems.displayName = "ProductItems";
export default ProductItems;

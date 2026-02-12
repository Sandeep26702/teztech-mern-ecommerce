import React from 'react';
import '../../styles/AdminCss/TopProducts.css';


// ✅ YAHI LINE FIX KARNI THI
import { useAdmin } from "../context/AdminContext";



const TopProducts = () => {
  const { topProducts } = useAdmin();

  return (
    <div className="top-products">
      <div className="table-header">
        <h3>Top Selling Products</h3>
        <button className="view-all">View All →</button>
      </div>
      
      <div className="products-list">
        {topProducts.map(product => (
          <div key={product.id} className="product-item">
            <div className="product-info">
              <span className="product-rank">#{product.id}</span>
              <div className="product-details">
                <h4>{product.name}</h4>
                <p>{product.sales.toLocaleString()} units sold</p>
              </div>
            </div>
            <div className="product-revenue">
              <span className="revenue-amount">${product.revenue.toLocaleString()}</span>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ 
                    width: `${(product.sales / topProducts[0].sales) * 100}%`,
                    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopProducts;
import { useNavigate } from "react-router-dom";
import { CATEGORY_ITEMS } from "../utils/constants";
import "../styles/components/Home.css";

const Home = () => {
  const navigate = useNavigate();

  const handleExploreProducts = () => {
    const categoryIds = Object.keys(CATEGORY_ITEMS);
    const randomCategoryId = categoryIds[Math.floor(Math.random() * categoryIds.length)];
    navigate(`/products/${randomCategoryId}`);
  };

  return (
    <div className="home-container">
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Welcome to Sonani Electronics</h1>
          <p className="hero-text">Your trusted partner for premium electronic components and solutions</p>
          <button className="hero-button" onClick={handleExploreProducts}>Explore Products</button>
        </div>
      </section>

      <section className="features-section">
        <div className="features-container">
          <h2 className="features-title">Why Choose Us</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>Quality Products</h3>
              <p>Premium electronic components from trusted manufacturers worldwide</p>
            </div>
            <div className="feature-card">
              <h3>Fast Delivery</h3>
              <p>Quick and reliable shipping to meet your project deadlines</p>
            </div>
            <div className="feature-card">
              <h3>Expert Support</h3>
              <p>Technical assistance from our experienced electronics team</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

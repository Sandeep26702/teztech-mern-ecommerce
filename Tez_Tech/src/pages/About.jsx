import "../styles/components/About.css";

const About = () => {
  return (
    <div style={{ padding: "60px 20px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ textAlign: "center", marginBottom: "50px", fontSize: "42px", color: "#333" }}>About Sonani Electronics</h1>
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "50px", alignItems: "center", marginBottom: "60px" }}>
        <div>
          <h2 style={{ color: "#667eea", marginBottom: "20px" }}>Our Story</h2>
          <p style={{ fontSize: "16px", lineHeight: "1.6", color: "#666", marginBottom: "20px" }}>
            Founded in 2010, Sonani Electronics has been at the forefront of providing high-quality electronic components 
            and solutions to businesses and individuals across the industry.
          </p>
          <p style={{ fontSize: "16px", lineHeight: "1.6", color: "#666" }}>
            With over a decade of experience, we've built strong relationships with leading manufacturers and 
            developed expertise in cutting-edge technologies.
          </p>
        </div>
        <div style={{ backgroundColor: "#f8f9fa", padding: "40px", borderRadius: "10px" }}>
          <h3 style={{ color: "#333", marginBottom: "20px" }}>Our Mission</h3>
          <p style={{ fontSize: "16px", lineHeight: "1.6", color: "#666" }}>
            To provide reliable, innovative electronic solutions that empower our customers to achieve their goals 
            while maintaining the highest standards of quality and service.
          </p>
        </div>
      </div>

      <div style={{ textAlign: "center", backgroundColor: "#667eea", color: "white", padding: "50px", borderRadius: "15px" }}>
        <h2 style={{ marginBottom: "30px" }}>Our Achievements</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "30px" }}>
          <div>
            <h3 style={{ fontSize: "36px", marginBottom: "10px" }}>10,000+</h3>
            <p>Happy Customers</p>
          </div>
          <div>
            <h3 style={{ fontSize: "36px", marginBottom: "10px" }}>50,000+</h3>
            <p>Products Delivered</p>
          </div>
          <div>
            <h3 style={{ fontSize: "36px", marginBottom: "10px" }}>99.9%</h3>
            <p>Customer Satisfaction</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
const Footer = () => {
  return (
    <footer style={{
      background: "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)",
      color: "white",
      padding: "50px 20px 20px",
      marginTop: "auto"
    }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "40px", marginBottom: "30px" }}>
          <div>
            <h3 style={{ marginBottom: "20px", fontSize: "24px" }}>SONANI ELECTRONICS</h3>
            <p style={{ color: "#bdc3c7", lineHeight: "1.6", marginBottom: "20px" }}>
              Your trusted partner for premium electronic components and innovative solutions since 2010.
            </p>
            <div style={{ display: "flex", gap: "15px" }}>
              <span style={{ fontSize: "24px", cursor: "pointer" }}>📱</span>
              <span style={{ fontSize: "24px", cursor: "pointer" }}>📧</span>
              <span style={{ fontSize: "24px", cursor: "pointer" }}>🔗</span>
            </div>
          </div>
          
          <div>
            <h4 style={{ marginBottom: "20px", color: "#ecf0f1" }}>Quick Links</h4>
            <ul style={{ listStyle: "none", padding: "0", margin: "0" }}>
              <li style={{ marginBottom: "10px" }}><a href="/" style={{ color: "#bdc3c7", textDecoration: "none" }}>Home</a></li>
              <li style={{ marginBottom: "10px" }}><a href="/about" style={{ color: "#bdc3c7", textDecoration: "none" }}>About Us</a></li>
              <li style={{ marginBottom: "10px" }}><a href="/products" style={{ color: "#bdc3c7", textDecoration: "none" }}>Products</a></li>
              <li style={{ marginBottom: "10px" }}><a href="/quotation" style={{ color: "#bdc3c7", textDecoration: "none" }}>Get Quote</a></li>
            </ul>
          </div>
          
          <div>
            <h4 style={{ marginBottom: "20px", color: "#ecf0f1" }}>Contact Info</h4>
            <div style={{ color: "#bdc3c7", lineHeight: "1.8" }}>
              <p style={{ margin: "0 0 10px 0" }}>📍 123 Electronics Street, Tech City</p>
              <p style={{ margin: "0 0 10px 0" }}>📞 +1 (555) 123-4567</p>
              <p style={{ margin: "0 0 10px 0" }}>📧 info@sonanielectronics.com</p>
              <p style={{ margin: "0 0 10px 0" }}>🕰️ Mon-Fri: 9AM-6PM</p>
            </div>
          </div>
          
          <div>
            <h4 style={{ marginBottom: "20px", color: "#ecf0f1" }}>Our Location</h4>
            <div style={{ borderRadius: "10px", overflow: "hidden" }}>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3024.123456789!2d-74.0059413!3d40.7127753!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDDCsDQyJzQ2LjAiTiA3NMKwMDAnMjEuNCJX!5e0!3m2!1sen!2sus!4v1234567890123"
                width="100%"
                height="200"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </div>
        
        <div style={{ borderTop: "1px solid #34495e", paddingTop: "20px", textAlign: "center" }}>
          <p style={{ margin: "0", color: "#bdc3c7", fontSize: "14px" }}>
            © 2024 Sonani Electronics. All rights reserved. | Privacy Policy | Terms of Service
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

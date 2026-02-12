import { useState } from "react";
import "../styles/components/Quotation.css";

const Quotation = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    products: "",
    quantity: "",
    message: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Quotation request submitted successfully!");
  };

  return (
    <div style={{ padding: "60px 20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ textAlign: "center", marginBottom: "20px", fontSize: "42px", color: "#333" }}>Request a Quote</h1>
      <p style={{ textAlign: "center", marginBottom: "50px", fontSize: "18px", color: "#666" }}>
        Get competitive pricing for your electronic component needs
      </p>

      <form onSubmit={handleSubmit} style={{
        backgroundColor: "white",
        padding: "40px",
        borderRadius: "15px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", color: "#333" }}>Full Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e9ecef",
                borderRadius: "8px",
                fontSize: "16px"
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", color: "#333" }}>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e9ecef",
                borderRadius: "8px",
                fontSize: "16px"
              }}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", color: "#333" }}>Company</label>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e9ecef",
                borderRadius: "8px",
                fontSize: "16px"
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", color: "#333" }}>Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e9ecef",
                borderRadius: "8px",
                fontSize: "16px"
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", color: "#333" }}>Products Needed *</label>
          <input
            type="text"
            name="products"
            value={formData.products}
            onChange={handleChange}
            required
            placeholder="e.g., Arduino Uno, Raspberry Pi, LED Strips"
            style={{
              width: "100%",
              padding: "12px",
              border: "2px solid #e9ecef",
              borderRadius: "8px",
              fontSize: "16px"
            }}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", color: "#333" }}>Quantity</label>
          <input
            type="text"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            placeholder="e.g., 10 units, 5 sets"
            style={{
              width: "100%",
              padding: "12px",
              border: "2px solid #e9ecef",
              borderRadius: "8px",
              fontSize: "16px"
            }}
          />
        </div>

        <div style={{ marginBottom: "30px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", color: "#333" }}>Additional Requirements</label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows="4"
            placeholder="Please describe your specific requirements, timeline, or any other details..."
            style={{
              width: "100%",
              padding: "12px",
              border: "2px solid #e9ecef",
              borderRadius: "8px",
              fontSize: "16px",
              resize: "vertical"
            }}
          />
        </div>

        <button
          type="submit"
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            border: "none",
            padding: "15px 40px",
            borderRadius: "25px",
            cursor: "pointer",
            fontSize: "18px",
            width: "100%",
            fontWeight: "bold"
          }}
        >
          Submit Quote Request
        </button>
      </form>

      <div style={{ marginTop: "40px", textAlign: "center", padding: "30px", backgroundColor: "#f8f9fa", borderRadius: "10px" }}>
        <h3 style={{ color: "#333", marginBottom: "15px" }}>Quick Response Guarantee</h3>
        <p style={{ color: "#666", margin: "0" }}>We'll get back to you within 24 hours with a detailed quotation</p>
      </div>
    </div>
  );
};

export default Quotation;
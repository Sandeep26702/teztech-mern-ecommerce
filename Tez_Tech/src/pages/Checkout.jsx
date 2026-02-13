import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axios";

const Checkout = () => {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const navigate = useNavigate();

  const placeOrder = async (e) => {
    e.preventDefault();

    try {
      const shippingAddress = {
        fullName: e.target.fullName.value,
        phone: e.target.phone.value,
        address: e.target.address.value,
        city: e.target.city.value,
        pincode: e.target.pincode.value,
      };

      const items = cartItems.map((item) => ({
        product: item._id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.images?.[0]?.url,
      }));

      await axios.post("/orders", {
        items,
        shippingAddress,
        totalAmount: getCartTotal(),
      });

      clearCart(); // 🔥 Cart clear after order

      alert("Order placed successfully ✅");

      navigate("/my-orders"); // Better UX
    } catch (error) {
      console.error("Order Error:", error);
      alert("Failed to place order ❌");
    }
  };

  return (
    <div className="container mt-4">
      <h2>Checkout</h2>

      <form onSubmit={placeOrder}>
        <input
          name="fullName"
          className="form-control mb-2"
          placeholder="Full Name"
          required
        />
        <input
          name="phone"
          className="form-control mb-2"
          placeholder="Phone"
          required
        />
        <input
          name="address"
          className="form-control mb-2"
          placeholder="Address"
          required
        />
        <input
          name="city"
          className="form-control mb-2"
          placeholder="City"
          required
        />
        <input
          name="pincode"
          className="form-control mb-2"
          placeholder="Pincode"
          required
        />

        <h4>Total: ₹ {getCartTotal()}</h4>

        <button className="btn btn-success mt-3">
          Place Order (COD)
        </button>
      </form>
    </div>
  );
};

export default Checkout;

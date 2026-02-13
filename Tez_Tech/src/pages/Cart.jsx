import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";

const Cart = () => {
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    getCartTotal,
  } = useCart();

  const navigate = useNavigate();

  if (cartItems.length === 0)
    return <h4 className="text-center mt-4">Cart is empty</h4>;

  return (
    <div className="container mt-4">
      <h3>My Cart</h3>

      {cartItems.map((item) => (
        <div key={item._id} className="border p-3 mb-3">
          <h5>{item.name}</h5>
          <p>₹ {item.price}</p>

          <input
            type="number"
            min="1"
            value={item.quantity}
            onChange={(e) =>
              updateQuantity(item._id, Number(e.target.value))
            }
          />

          <button
            className="btn btn-danger btn-sm ms-3"
            onClick={() => removeFromCart(item._id)}
          >
            Remove
          </button>
        </div>
      ))}

      {/* 🔥 CART SUMMARY */}
      <div className="border-top pt-3 mt-4">
        <h4>Total: ₹ {getCartTotal()}</h4>

        <button
          className="btn btn-success w-100 mt-3"
          onClick={() => navigate("/checkout")}
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
};

export default Cart;

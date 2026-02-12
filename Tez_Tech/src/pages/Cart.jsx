import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import "../styles/components/Cart.css";

const Cart = () => {
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    getCartTotal,
    getCartItemsCount
  } = useCart();

  // 🔗 SHARE CART FUNCTION (FINAL)
  const shareCart = () => {
    if (cartItems.length === 0) {
      alert("Cart is empty, nothing to share!");
      return;
    }

    const cartId = Date.now().toString(); // unique id

    // ✅ SAVE PROPER STRUCTURE
    localStorage.setItem(
      `shared-cart-${cartId}`,
      JSON.stringify({
        items: cartItems,        // array
        total: getCartTotal()    // total price
      })
    );

    const shareLink = `${window.location.origin}/cart/shared/${cartId}`;
    navigator.clipboard.writeText(shareLink);

    alert("✅ Cart link copied! Share it with anyone.");
  };

  return (
    <div className="cart-container">
      <h1 className="cart-title">
        Shopping Cart ({getCartItemsCount()} items)
      </h1>

      {cartItems.length > 0 ? (
        <>
          <div className="cart-items">
            {cartItems.map(item => (
              <div key={item.id} className="cart-item">
                <div className="item-info">
                  <span className="item-icon">{item.image}</span>
                  <div className="item-details">
                    <h3>{item.name}</h3>
                    <p>₹{item.price}</p>
                  </div>
                </div>

                <div className="quantity-controls">
                  <button
                    className="qty-btn"
                    onClick={() =>
                      updateQuantity(item.id, item.quantity - 1)
                    }
                  >
                    -
                  </button>

                  <span className="quantity">{item.quantity}</span>

                  <button
                    className="qty-btn"
                    onClick={() =>
                      updateQuantity(item.id, item.quantity + 1)
                    }
                  >
                    +
                  </button>
                </div>

                <div className="item-total">
                  ₹{item.price * item.quantity}
                </div>

                <button
                  className="remove-btn"
                  onClick={() => removeFromCart(item.id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <div className="total-section">
              <h2>Total: ₹{getCartTotal()}</h2>

              <div className="cart-actions">
                <Link to="/quotation" className="checkout-btn">
                  Proceed to Checkout
                </Link>

                <Link to="/products" className="continue-btn">
                  Continue Shopping
                </Link>

                {/* 🔗 SHARE CART BUTTON */}
                <button
                  onClick={shareCart}
                  className="share-cart-btn"
                >
                  🔗 Share Cart
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="empty-cart">
          <h2>Your cart is empty</h2>
          <p>Add some products to get started!</p>
          <Link to="/products" className="shop-btn">
            Start Shopping
          </Link>
        </div>
      )}
    </div>
  );
};

export default Cart;

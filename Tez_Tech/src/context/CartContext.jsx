import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  // LocalStorage se purana cart data nikalne ka logic
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem("cartItems");
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // Jab bhi cart update ho, use LocalStorage mein save kar do
  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
  }, [cartItems]);

  // 🛒 Add to Cart Logic
  const addToCart = (product) => {
    setCartItems((prevItems) => {
      const itemExists = prevItems.find((item) => item._id === product._id);
      if (itemExists) {
        // Agar pehle se hai, toh quantity +1 kar do
        alert(`✅ ${product.name} Successfully Addin Cart!`);
        return prevItems.map((item) =>
          item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        // Naya item hai toh array mein add kar do
        alert(`🛒 ${product.name} Successfully added to cart!`);
        return [...prevItems, { ...product, quantity: 1 }];
      }
    });
  };

  // ❌ Remove from Cart
  const removeFromCart = (id) => {
    setCartItems((prevItems) => prevItems.filter((item) => item._id !== id));
  };

  // 🔢 Update Quantity
  const updateQuantity = (id, quantity) => {
    setCartItems((prevItems) =>
      prevItems.map((item) => (item._id === id ? { ...item, quantity } : item))
    );
  };

  // 💰 Get Total Price
  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  // 🧹 Clear Cart (Checkout ke baad)
  const clearCart = () => setCartItems([]);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, getCartTotal, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

// Custom Hook taaki har jagah easily use kar sakein
export const useCart = () => useContext(CartContext);
import { createContext, useContext, useState } from "react";

// 1️⃣ Context create
const CartContext = createContext();

// 2️⃣ Custom hook (safe use)
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return context;
};

export const CartProvider = ({ children }) => {
  // 3️⃣ State
  const [cartItems, setCartItems] = useState([]);
  const [isSideCartOpen, setIsSideCartOpen] = useState(false);

  // 4️⃣ ➕ ADD TO CART
  const addToCart = (product) => {
    setIsSideCartOpen(true); // 🔥 auto open side cart

    setCartItems((prev) => {
      const found = prev.find((i) => i.id === product.id);

      if (found) {
        return prev.map((i) =>
          i.id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }

      return [...prev, { ...product, quantity: 1 }];
    });
  };

  // 5️⃣ ➖ REMOVE ITEM
  const removeFromCart = (id) => {
    setCartItems((prev) => prev.filter((i) => i.id !== id));
  };

  // 6️⃣ 🔢 UPDATE QUANTITY
  const updateQuantity = (id, qty) => {
    if (qty <= 0) {
      removeFromCart(id);
      return;
    }

    setCartItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, quantity: qty } : i
      )
    );
  };

  // 7️⃣ 💰 TOTAL PRICE
  const getCartTotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  // 8️⃣ 🧮 TOTAL ITEMS COUNT  ✅ (🔥 ERROR FIX HERE)
  const getCartItemsCount = () => {
    return cartItems.reduce(
      (total, item) => total + item.quantity,
      0
    );
  };

  // 9️⃣ Context value
  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    getCartTotal,
    getCartItemsCount, // ✅ IMPORTANT
    isSideCartOpen,
    setIsSideCartOpen
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

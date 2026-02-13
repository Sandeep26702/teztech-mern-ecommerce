import { createContext, useContext, useState } from "react";

// 1️⃣ Context
const CartContext = createContext();

// 2️⃣ Custom hook
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isSideCartOpen, setIsSideCartOpen] = useState(false);

  // 3️⃣ ➕ ADD TO CART
  const addToCart = (product) => {
    setIsSideCartOpen(true);

    setCartItems((prev) => {
      const found = prev.find((i) => i._id === product._id);

      if (found) {
        return prev.map((i) =>
          i._id === product._id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }

      return [...prev, { ...product, quantity: 1 }];
    });
  };

  // 4️⃣ ➖ REMOVE FROM CART
  const removeFromCart = (_id) => {
    setCartItems((prev) => prev.filter((i) => i._id !== _id));
  };

  // 5️⃣ 🔢 UPDATE QUANTITY
  const updateQuantity = (_id, qty) => {
    if (qty <= 0) {
      removeFromCart(_id);
      return;
    }

    setCartItems((prev) =>
      prev.map((i) =>
        i._id === _id ? { ...i, quantity: qty } : i
      )
    );
  };

  // 6️⃣ 💰 TOTAL PRICE
  const getCartTotal = () =>
    cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

  // 7️⃣ 🧮 TOTAL ITEMS COUNT
  const getCartItemsCount = () =>
    cartItems.reduce((t, i) => t + i.quantity, 0);

  // 8️⃣ 🧹 CLEAR CART (🔥 NEW)
  const clearCart = () => {
    setCartItems([]);
    setIsSideCartOpen(false);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        getCartTotal,
        getCartItemsCount,
        clearCart,          // ✅ IMPORTANT
        isSideCartOpen,
        setIsSideCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

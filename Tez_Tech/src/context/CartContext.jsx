import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../utils/api"; 
import { useAuth } from "./AuthContext"; // We need Auth context to check if user is logged in

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth(); // Check user status

  // 🛠 Helper function to safely parse localStorage cart
  const getLocalCart = () => {
    try {
      const storedCart = localStorage.getItem("guestCart");
      return storedCart ? JSON.parse(storedCart) : [];
    } catch (e) {
      return [];
    }
  };

  // 🔄 1. Fetch Cart from Backend OR LocalStorage
  const fetchCart = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("token");

    if (token && user) {
      // 🟢 LOGGED IN: Fetch from Database
      try {
        const { data } = await api.get("/cart");
        if (data.success && data.cart) {
          setCartItems(data.cart.items || []);
        }
      } catch (error) {
        console.error("Cart fetch error:", error);
        setCartItems([]); 
      }
    } else {
      // 🟠 GUEST: Fetch from LocalStorage
      setCartItems(getLocalCart());
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // 🛒 2. Add to Cart (Handles both Logged in & Guest)
  const addToCart = async (product) => {
    const token = localStorage.getItem("token");

    if (token && user) {
      // 🟢 LOGGED IN: Send to Database
      try {
        const { data } = await api.post("/cart/add", {
          productId: product._id,
          quantity: 1, 
        });
        if (data.success) {
          setCartItems(data.cart.items); 
          alert(`✅ ${product.name} added to cart!`);
        }
      } catch (error) {
        console.error("Add to cart error:", error);
        alert("Failed to add item to cart. Please try again.");
      }
    } else {
      // 🟠 GUEST: Save to LocalStorage
      let localCart = getLocalCart();
      
      // Check if product exists in local cart
      const existingItemIndex = localCart.findIndex(
        (item) => item.productId._id === product._id || item.productId === product._id
      );

      if (existingItemIndex > -1) {
        localCart[existingItemIndex].quantity += 1;
      } else {
        // Need to structure it like Mongoose populated data for frontend consistency
        localCart.push({
          productId: {
            _id: product._id,
            name: product.name,
            price: product.price,
            images: product.images || [product.image],
            stock: product.stock
          },
          quantity: 1
        });
      }

      localStorage.setItem("guestCart", JSON.stringify(localCart));
      setCartItems(localCart);
      alert(`✅ ${product.name} added to cart (Guest)!`);
    }
  };

  // ❌ 3. Remove from Cart
  const removeFromCart = async (productId) => {
    const token = localStorage.getItem("token");
    const previousCart = [...cartItems];

    // Optimistic Update UI
    setCartItems((prevItems) => 
      prevItems.filter((item) => item.productId?._id !== productId && item.productId !== productId)
    );

    if (token && user) {
      // 🟢 LOGGED IN: Remove from Database
      try {
        const { data } = await api.delete(`/cart/remove/${productId}`);
        if (data.success) setCartItems(data.cart.items);
      } catch (error) {
        setCartItems(previousCart); 
        alert("Failed to remove item.");
      }
    } else {
      // 🟠 GUEST: Remove from LocalStorage
      const newLocalCart = previousCart.filter((item) => item.productId?._id !== productId && item.productId !== productId);
      localStorage.setItem("guestCart", JSON.stringify(newLocalCart));
    }
  };

  // 🔢 4. Update Quantity
  const updateQuantity = async (productId, quantity) => {
    if (quantity < 1) return;
    const token = localStorage.getItem("token");
    const previousCart = [...cartItems];

    // Optimistic Update UI
    setCartItems((prevItems) =>
      prevItems.map((item) => {
        const currentId = item.productId?._id || item.productId;
        return currentId === productId ? { ...item, quantity } : item;
      })
    );

    if (token && user) {
      // 🟢 LOGGED IN: Update in Database
      try {
        const { data } = await api.put("/cart/update", { productId, quantity });
        if (data.success) setCartItems(data.cart.items);
      } catch (error) {
        setCartItems(previousCart);
        alert("Failed to update quantity.");
      }
    } else {
      // 🟠 GUEST: Update in LocalStorage
      const newLocalCart = previousCart.map((item) => {
        const currentId = item.productId?._id || item.productId;
        return currentId === productId ? { ...item, quantity } : item;
      });
      localStorage.setItem("guestCart", JSON.stringify(newLocalCart));
    }
  };

  // 💰 5. Get Total Cart Price
  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = item.productId?.price || item.price || 0;
      return total + (price * item.quantity);
    }, 0);
  };

  // 🧹 6. Clear Cart (After Checkout)
  const clearCart = async () => {
    const token = localStorage.getItem("token");
    setCartItems([]);
    
    if (token && user) {
      try {
        await api.delete("/cart/clear"); // Ensure this route is working in your backend
      } catch (error) {
        console.error("Clear DB cart error:", error);
      }
    } else {
      localStorage.removeItem("guestCart");
    }
  };

  // 🚀 7. MERGE CART ON LOGIN
  // This needs to be called in AuthContext right after a successful login
  const mergeLocalCartWithDB = async () => {
    const localCart = getLocalCart();
    if (localCart.length === 0) {
      fetchCart(); // Just fetch DB cart if no local items
      return;
    }

    try {
      // Send local storage items to the new /merge route
      const { data } = await api.post("/cart/merge", { localItems: localCart });
      if (data.success) {
        setCartItems(data.cart.items);
        localStorage.removeItem("guestCart"); // Clear local storage after successful merge
        console.log("Cart merged successfully!");
      }
    } catch (error) {
      console.error("Failed to merge cart:", error);
      fetchCart(); // Fallback to fetching whatever is in DB
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        loading, 
        addToCart,
        removeFromCart,
        updateQuantity,
        getCartTotal,
        clearCart,
        fetchCart, 
        mergeLocalCartWithDB // Pass this down to be triggered on login
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
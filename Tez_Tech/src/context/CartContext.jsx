import { createContext, useCallback, useContext, useEffect, useState } from "react";
import api from "../utils/api";
import { useAuth } from "./AuthContext";

const CartContext = createContext();

const round2 = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const normalizeSelectionValue = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((v) => String(v).trim())
      .filter(Boolean)
      .sort();
  }
  if (value === undefined || value === null) return "";
  return String(value).trim();
};

const normalizeSelectedCustomFields = (input) => {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const normalized = {};
  Object.keys(input)
    .sort()
    .forEach((key) => {
      const safeKey = String(key).trim();
      if (!safeKey) return;
      normalized[safeKey] = normalizeSelectionValue(input[key]);
    });
  return normalized;
};

const getSelectionSignature = (input) => JSON.stringify(normalizeSelectedCustomFields(input));
const createLocalId = () => `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const getItemKey = (item) => item._id || item.localItemId || item.productId?._id || item.productId || item._id;

const getItemUnitPrice = (item) => {
  const unitPrice =
    item?.pricing?.unitPrice ??
    item?.pricingSnapshot?.unitPrice ??
    item?.unitPrice ??
    item?.productId?.price ??
    item?.price ??
    0;
  return Number(unitPrice) || 0;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const getLocalCart = () => {
    try {
      const storedCart = localStorage.getItem("guestCart");
      return storedCart ? JSON.parse(storedCart) : [];
    } catch {
      return [];
    }
  };

  const setLocalCart = (items) => {
    localStorage.setItem("guestCart", JSON.stringify(items));
    setCartItems(items);
  };

  const fetchCart = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("token");

    if (token && user) {
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
      setCartItems(getLocalCart());
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (product) => {
    const token = localStorage.getItem("token");
    const selectedCustomFields = normalizeSelectedCustomFields(product?.selectedCustomFields);
    const pricingSnapshot = product?.pricingSnapshot || null;

    if (token && user) {
      try {
        const { data } = await api.post("/cart/add", {
          productId: product._id,
          quantity: 1,
          selectedCustomFields,
          pricingSnapshot,
        });
        if (data.success) {
          setCartItems(data.cart.items || []);
          alert(`${product.name} added to cart.`);
        }
      } catch (error) {
        console.error("Add to cart error:", error);
        alert("Failed to add item to cart. Please try again.");
      }
      return;
    }

    const localCart = getLocalCart();
    const targetSignature = getSelectionSignature(selectedCustomFields);
    const existingIndex = localCart.findIndex((item) => {
      const itemProductId = item.productId?._id || item.productId;
      if (String(itemProductId) !== String(product._id)) return false;
      return getSelectionSignature(item.selectedCustomFields) === targetSignature;
    });

    if (existingIndex > -1) {
      localCart[existingIndex].quantity += 1;
      localCart[existingIndex].pricingSnapshot = pricingSnapshot || localCart[existingIndex].pricingSnapshot;
    } else {
      localCart.push({
        localItemId: createLocalId(),
        productId: {
          _id: product._id,
          name: product.name,
          price: product.price,
          gstRate: product.gstRate || 0,
          image: product.image,
          stock: product.stock,
          category: product.category,
          customFields: product.customFields || [],
        },
        quantity: 1,
        selectedCustomFields,
        pricingSnapshot,
      });
    }

    setLocalCart(localCart);
    alert(`${product.name} added to cart.`);
  };

  const removeFromCart = async (itemKey) => {
    const token = localStorage.getItem("token");
    const previousCart = [...cartItems];

    setCartItems((prevItems) => prevItems.filter((item) => getItemKey(item) !== itemKey));

    if (token && user) {
      try {
        const { data } = await api.delete(`/cart/remove/${itemKey}`);
        if (data.success) setCartItems(data.cart.items || []);
      } catch (error) {
        console.error("Remove from cart error:", error);
        setCartItems(previousCart);
        alert("Failed to remove item.");
      }
      return;
    }

    const newLocalCart = previousCart.filter((item) => getItemKey(item) !== itemKey);
    setLocalCart(newLocalCart);
  };

  const updateQuantity = async (itemKey, quantity) => {
    if (quantity < 1) return;
    const token = localStorage.getItem("token");
    const previousCart = [...cartItems];

    setCartItems((prevItems) =>
      prevItems.map((item) => (getItemKey(item) === itemKey ? { ...item, quantity } : item))
    );

    if (token && user) {
      try {
        const { data } = await api.put("/cart/update", { itemId: itemKey, quantity });
        if (data.success) setCartItems(data.cart.items || []);
      } catch (error) {
        console.error("Update cart quantity error:", error);
        setCartItems(previousCart);
        alert("Failed to update quantity.");
      }
      return;
    }

    const newLocalCart = previousCart.map((item) =>
      getItemKey(item) === itemKey ? { ...item, quantity } : item
    );
    setLocalCart(newLocalCart);
  };

  const getCartTotal = () =>
    round2(
      cartItems.reduce((total, item) => total + getItemUnitPrice(item) * Number(item.quantity || 0), 0)
    );

  const clearCart = async () => {
    const token = localStorage.getItem("token");
    setCartItems([]);

    if (token && user) {
      try {
        await api.delete("/cart/clear");
      } catch (error) {
        console.error("Clear DB cart error:", error);
      }
      return;
    }

    localStorage.removeItem("guestCart");
  };

  const mergeLocalCartWithDB = async () => {
    const localCart = getLocalCart();
    if (localCart.length === 0) {
      fetchCart();
      return;
    }

    try {
      const { data } = await api.post("/cart/merge", { localItems: localCart });
      if (data.success) {
        setCartItems(data.cart.items || []);
        localStorage.removeItem("guestCart");
      }
    } catch (error) {
      console.error("Failed to merge cart:", error);
      fetchCart();
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
        mergeLocalCartWithDB,
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

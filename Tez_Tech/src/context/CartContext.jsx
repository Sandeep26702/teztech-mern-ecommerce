import { createContext, useCallback, useContext, useEffect, useState } from "react";
import api from "../utils/api";
import { useAuth } from "./AuthContext";
import toast from 'react-hot-toast';

const CartContext = createContext();

const round2 = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const normalizeSelectionValue = (value) => {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean).sort();
  if (value === undefined || value === null) return "";
  return String(value).trim();
};

const normalizeSelectedCustomFields = (input) => {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const normalized = {};
  Object.keys(input).sort().forEach((key) => {
    const safeKey = String(key).trim();
    if (!safeKey) return;
    normalized[safeKey] = normalizeSelectionValue(input[key]);
  });
  return normalized;
};

const createLocalId = () => `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const getItemKey = (item) => item._id || item.localItemId || item.productId?._id || item.productId || item._id;

// 🚀 MASTER PRICE CALCULATOR
export const getTrueUnitPrice = (item) => {
  if (item?.selectedCustomFields?._finalPrice) {
    return Number(item.selectedCustomFields._finalPrice);
  }

  let basePrice = Number(item?.variant?.sellingPrice || item?.variant?.price || item?.productId?.sellingPrice || item?.productId?.price || item?.sellingPrice || item?.price || 0);
  let extraCharges = 0;
  const rawFields = item?.productId?.customFields || item?.productId?.attributes || item?.customFields || item?.attributes || [];
  const customFields = Array.isArray(rawFields) ? rawFields : [];
  const selections = item?.selectedCustomFields || {};

  customFields.forEach(field => {
    if (!field) return;
    const fieldId = String(field._id || "");
    const fieldLabel = String(field.label || field.name || "").trim();
    const selectedValue = selections[fieldId] ?? selections[fieldLabel] ?? selections[field.name];
    
    if (!selectedValue) return;

    const selectedValuesArr = Array.isArray(selectedValue) ? selectedValue : [selectedValue];
    selectedValuesArr.forEach(val => {
      const safeVal = String(val).trim();
      const matchedOption = (Array.isArray(field.options) ? field.options : []).find(opt => {
        const optValue = typeof opt === 'object' ? String(opt.value || opt.label || "") : String(opt);
        return optValue.trim() === safeVal;
      });

      if (matchedOption && matchedOption.priceAdjustment) extraCharges += Number(matchedOption.priceAdjustment);
    });
  });

  const gstRate = Number(item?.gstRate || item?.productId?.gstRate || item?.productId?.GST || 18);
  return Math.round((basePrice + extraCharges) * (1 + (gstRate / 100)));
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const mergeLocalItemsByProduct = (items) => {
    if (!Array.isArray(items)) return [];
    const merged = new Map();
    items.forEach((item) => {
      const productId = String(item?.productId?._id || item?.productId || item?._id || "").trim();
      if (!productId) return;
      if (!merged.has(productId)) { merged.set(productId, { ...item }); return; }
      const existing = merged.get(productId);
      existing.quantity = (existing.quantity || 0) + Number(item.quantity || 0);
      if (item.selectedCustomFields) existing.selectedCustomFields = item.selectedCustomFields;
      if (item.variant) existing.variant = item.variant;
      if (item.attributes) existing.attributes = item.attributes;
    });
    return Array.from(merged.values());
  };

  const getLocalCart = () => {
    try {
      const stored = localStorage.getItem("guestCart");
      return stored ? mergeLocalItemsByProduct(JSON.parse(stored)) : [];
    } catch { return []; }
  };

  const setLocalCart = (items) => {
    localStorage.setItem("guestCart", JSON.stringify(items));
    setCartItems(items);
  };

  // 🚀 BULLETPROOF HELPER: Har API me ye config jayegi
  const getAuthConfig = (token) => ({
    headers: { Authorization: `Bearer ${token}` },
    withCredentials: true
  });

  const fetchCart = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (token && user) {
      try {
        const { data } = await api.get("/cart", getAuthConfig(token)); // Added Config
        if (data.success && data.cart) setCartItems(data.cart.items || []);
      } catch (error) { setCartItems([]); }
    } else setCartItems(getLocalCart());
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const addToCart = async (product) => {
    const token = localStorage.getItem("token");
    const selectedCustomFields = { ...product?.selectedCustomFields }; 

    let variantToAdd = product?.variant;
    let attributesToAdd = product?.attributes;

    if (!variantToAdd && product?.variants?.length > 0) variantToAdd = product.variants[0];
    if (!attributesToAdd && product?.attributes?.length > 0) {
      attributesToAdd = {};
      product.attributes.forEach((attr) => {
        if (attr.options && attr.options.length > 0) attributesToAdd[attr.name] = attr.options[0];
      });
    }

    const finalItemPrice = Number(variantToAdd?.sellingPrice ?? variantToAdd?.price ?? product?.sellingPrice ?? product?.price ?? 0);

    if (token && user) {
      try {
        // 🚀 THE FIX: Manually sending config to bypass interceptor delays
        const { data } = await api.post("/cart/add", {
          productId: product._id, 
          quantity: 1, 
          selectedCustomFields, 
          variant: variantToAdd,      
          attributes: attributesToAdd 
        }, getAuthConfig(token));

        if (data.success) {
          setCartItems(data.cart.items || []);
          toast.success(`${product.name} added to cart!`);
        }
      } catch (error) { toast.error("Failed to add item to cart."); }
      return;
    }

    const localCart = getLocalCart();
    const existingIndex = localCart.findIndex(item =>
      String(item.productId?._id || item.productId) === String(product._id) &&
      String(item.variant?._id || item.variant?.sku) === String(variantToAdd?._id || variantToAdd?.sku)
    );

    if (existingIndex > -1) {
      localCart[existingIndex].quantity += 1;
      localCart[existingIndex].selectedCustomFields = selectedCustomFields;
      localCart[existingIndex].variant = variantToAdd;
      localCart[existingIndex].attributes = attributesToAdd;
    } else {
      localCart.push({
        localItemId: createLocalId(),
        productId: {
          _id: product._id, 
          name: product.name,
          image: product.image,
          category: product.category || "",
          price: finalItemPrice, 
          gstRate: product.gstRate || 0,
          shippingCharge: product.shippingCharge || 0,
          weightKg: product.weightKg || 0,
          customFields: product.customFields || product.attributes || [] 
        },
        sku: variantToAdd?.sku || product.baseSku || product.sku || "N/A", 
        price: finalItemPrice,   
        quantity: 1,
        variant: variantToAdd,
        attributes: attributesToAdd,
        selectedCustomFields,
      });
    }
    setLocalCart(localCart);
    toast.success(`${product.name} added to cart!`);
  };

  const removeFromCart = async (itemKey) => {
    const token = localStorage.getItem("token");
    const previousCart = [...cartItems];
    setCartItems(prev => prev.filter(item => getItemKey(item) !== itemKey));

    if (token && user) {
      try {
        // 🚀 THE FIX
        const { data } = await api.delete(`/cart/remove/${itemKey}`, getAuthConfig(token));
        if (data.success) { setCartItems(data.cart.items || []); toast.success("Item removed"); }
      } catch (error) { setCartItems(previousCart); toast.error("Failed to remove item."); }
      return;
    }
    setLocalCart(previousCart.filter(item => getItemKey(item) !== itemKey));
    toast.success("Item removed");
  };

  const updateQuantity = async (itemKey, quantity) => {
    if (quantity < 1) return;
    const token = localStorage.getItem("token");
    const previousCart = [...cartItems];
    setCartItems(prev => prev.map(item => getItemKey(item) === itemKey ? { ...item, quantity } : item));

    if (token && user) {
      try {
        // 🚀 THE FIX
        const { data } = await api.put("/cart/update", { itemId: itemKey, quantity }, getAuthConfig(token));
        if (data.success) setCartItems(data.cart.items || []);
      } catch (error) { setCartItems(previousCart); toast.error("Failed to update quantity."); }
      return;
    }
    setLocalCart(previousCart.map(item => getItemKey(item) === itemKey ? { ...item, quantity } : item));
  };

  const getCartTotal = () => round2(cartItems.reduce((total, item) => total + getTrueUnitPrice(item) * Number(item.quantity || 0), 0));

  const clearCart = async () => {
    const token = localStorage.getItem("token");
    if (token && user) {
      try { await api.delete("/cart/clear", getAuthConfig(token)); } catch (e) {} // 🚀 THE FIX
    }
    setCartItems([]); localStorage.removeItem("guestCart");
  };

  return (
    <CartContext.Provider value={{ cartItems, loading, addToCart, removeFromCart, updateQuantity, getCartTotal, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
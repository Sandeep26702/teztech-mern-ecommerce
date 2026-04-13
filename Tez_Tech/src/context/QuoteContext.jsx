import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../utils/api"; 
// 🔥 NAYA: toast import kiya
import toast from 'react-hot-toast';

const QuoteContext = createContext();

export const QuoteProvider = ({ children }) => {
  const [quoteItems, setQuoteItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔄 1. Fetch Quote Items from Backend Database
  const fetchQuote = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/quote"); 
      
      if (data.success && data.quote) {
        setQuoteItems(data.quote.items || data.quote.requestedItems || []);
      }
    } catch (error) {
      console.error("Quote fetch error:", error);
      setQuoteItems([]); 
    } finally {
      setLoading(false);
    }
  }, []);

  // 🚀 Fetch quotation data on initial app load if the user is logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchQuote();
    } else {
      setLoading(false); 
    }
  }, [fetchQuote]);

  // 📝 2. Add to Quote (Save to Database)
  const addToQuote = async (product, quantity = 1, selectedVariant = null, selectedAttributes = {}) => {
    try {
      const payload = {
        productId: product._id || product.id, 
        quantity: quantity,
        selectedVariant: selectedVariant,       
        selectedAttributes: selectedAttributes, 
        selectedCustomFields: product.selectedCustomFields || {},
      };

      const { data } = await api.post("/quote/add", payload);

      if (data.success) {
        setQuoteItems(data.quote.items || data.quote.requestedItems || []); 
        
        // 🔥 NAYA: Alert hata kar 1 second wala premium Toast lagaya
        toast.success(`${product.name || 'Item'} added to quotation!`, {
          duration: 1000, 
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        });
      }
    } catch (error) {
      console.error("Add to quote error:", error);
      if (error.response?.status === 401) {
        toast.error("Please login first to request a quotation!", { duration: 2500 });
      } else {
        toast.error("Failed to add item. Please try again.", { duration: 2000 });
      }
    }
  };

  // ❌ 3. Remove from Quote
  const removeFromQuote = async (productId) => {
    const previousQuote = [...quoteItems];
    
    setQuoteItems((prev) => 
      prev.filter((item) => {
        const currentId = item.productId?._id || item.productId;
        return String(currentId) !== String(productId);
      })
    );

    try {
      const { data } = await api.delete(`/quote/remove/${productId}`);
      if (data.success) {
        setQuoteItems(data.quote.items || data.quote.requestedItems || []); 
        // 🔥 Optional: Remove message
        toast.success("Item removed from quotation", { duration: 1000 });
      }
    } catch (error) {
      console.error("Remove from quote error:", error);
      setQuoteItems(previousQuote); 
      toast.error("Failed to remove item. Restoring data.", { duration: 2000 });
    }
  };

  // 🔢 4. Update Quote Quantity
  const updateQuoteQuantity = async (productId, quantity) => {
    if (quantity < 1) return;
    const previousQuote = [...quoteItems];

    setQuoteItems((prev) =>
      prev.map((item) => {
        const currentId = item.productId?._id || item.productId;
        return String(currentId) === String(productId) ? { ...item, quantity } : item;
      })
    );

    try {
      const { data } = await api.put("/quote/update", {
        productId,
        quantity,
      });

      if (data.success) {
        setQuoteItems(data.quote.items || data.quote.requestedItems || []); 
      }
    } catch (error) {
      console.error("Update quote quantity error:", error);
      setQuoteItems(previousQuote); 
      toast.error("Failed to update quantity. Restoring data.", { duration: 2000 });
    }
  };

  // 🧹 5. Clear Quote State
  const clearQuote = () => {
    setQuoteItems([]);
  };

  return (
    <QuoteContext.Provider 
      value={{ 
        quoteItems, 
        loading,
        addToQuote, 
        removeFromQuote, 
        updateQuoteQuantity, 
        clearQuote,
        fetchQuote 
      }}
    >
      {children}
    </QuoteContext.Provider>
  );
};

export const useQuote = () => {
  const context = useContext(QuoteContext);
  if (!context) {
    throw new Error("useQuote must be used within a QuoteProvider");
  }
  return context;
};
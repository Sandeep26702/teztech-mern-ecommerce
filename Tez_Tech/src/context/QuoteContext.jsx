import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../utils/api"; // Your Axios instance for API calls

const QuoteContext = createContext();

export const QuoteProvider = ({ children }) => {
  const [quoteItems, setQuoteItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔄 1. Fetch Quote Items from Backend Database
  // Using useCallback so we can safely use it inside useEffect without infinite loops
  const fetchQuote = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/quote"); // Make sure this route exists in your backend
      
      if (data.success && data.quote) {
        setQuoteItems(data.quote.items || []);
      }
    } catch (error) {
      console.error("Quote fetch error:", error);
      setQuoteItems([]); // Clear state if fetching fails (e.g., token expired)
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
      setLoading(false); // Stop loading if guest user
    }
  }, [fetchQuote]);

  // 📝 2. Add to Quote (Save to Database)
  const addToQuote = async (product) => {
    try {
      const { data } = await api.post("/quote/add", {
        productId: product._id,
        quantity: 1, // Default quantity
        selectedCustomFields: product.selectedCustomFields || {},
      });

      if (data.success) {
        setQuoteItems(data.quote.items); // Sync state with backend response
        alert("✅ Added to Quotation!");
      }
    } catch (error) {
      console.error("Add to quote error:", error);
      if (error.response?.status === 401) {
        alert("Please login first to request a quotation!");
      } else {
        alert("Failed to add item. Please try again.");
      }
    }
  };

  // ❌ 3. Remove from Quote (With Optimistic UI Update)
  const removeFromQuote = async (productId) => {
    // Snapshot previous state for rollback
    const previousQuote = [...quoteItems];

    // Optimistic Update: Instantly remove from screen
    setQuoteItems((prev) => 
      prev.filter((item) => item.productId?._id !== productId && item.productId !== productId)
    );

    try {
      // Background API call to delete from database
      const { data } = await api.delete(`/quote/remove/${productId}`);
      
      if (data.success) {
        setQuoteItems(data.quote.items); // Final sync with DB
      }
    } catch (error) {
      console.error("Remove from quote error:", error);
      setQuoteItems(previousQuote); // Rollback to original state if API fails
      alert("Failed to remove item. Restoring data.");
    }
  };

  // 🔢 4. Update Quote Quantity (With Optimistic UI Update)
  const updateQuoteQuantity = async (productId, quantity) => {
    if (quantity < 1) return;

    // Snapshot previous state
    const previousQuote = [...quoteItems];

    // Optimistic Update: Instantly update quantity on screen
    setQuoteItems((prev) =>
      prev.map((item) => {
        const currentId = item.productId?._id || item.productId;
        return currentId === productId ? { ...item, quantity } : item;
      })
    );

    try {
      // API call to update database
      const { data } = await api.put("/quote/update", {
        productId,
        quantity,
      });

      if (data.success) {
        setQuoteItems(data.quote.items); // Final sync
      }
    } catch (error) {
      console.error("Update quote quantity error:", error);
      setQuoteItems(previousQuote); // Rollback on failure
      alert("Failed to update quantity. Restoring data.");
    }
  };

  // 🧹 5. Clear Quote State (Used during Logout)
  const clearQuote = () => {
    setQuoteItems([]);
    // Note: We DO NOT call a delete API here. 
    // We only clear the frontend state so the next user doesn't see it.
    // The data remains safely stored in the backend database for this user.
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
        fetchQuote // Exported so AuthContext can call it right after a successful Login
      }}
    >
      {children}
    </QuoteContext.Provider>
  );
};

// 🛡️ Custom Hook with Safety Check
export const useQuote = () => {
  const context = useContext(QuoteContext);
  if (!context) {
    throw new Error("useQuote must be used within a QuoteProvider");
  }
  return context;
};

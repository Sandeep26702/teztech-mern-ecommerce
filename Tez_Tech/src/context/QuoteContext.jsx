import { createContext, useContext, useState, useEffect } from "react";

const QuoteContext = createContext();

export const QuoteProvider = ({ children }) => {
  const [quoteItems, setQuoteItems] = useState(() => {
    const savedQuotes = localStorage.getItem("quoteItems");
    return savedQuotes ? JSON.parse(savedQuotes) : [];
  });

  useEffect(() => {
    localStorage.setItem("quoteItems", JSON.stringify(quoteItems));
  }, [quoteItems]);

  // 📄 Add to Quote
  const addToQuote = (product) => {
    setQuoteItems((prevItems) => {
      const itemExists = prevItems.find((item) => item._id === product._id);
      if (itemExists) {
        alert(`ℹ️ ${product.name} SUccessfully Add in Quatation list!`);
        return prevItems; // Quote mein dubara add nahi karenge
      } else {
        alert(`📄 ${product.name} Successfully Add in Quatation!`);
        return [...prevItems, { ...product, quantity: 1 }]; // Default qty 1
      }
    });
  };

  // ❌ Remove from Quote
  const removeFromQuote = (id) => {
    setQuoteItems((prevItems) => prevItems.filter((item) => item._id !== id));
  };

  // 🔢 Update Quote Item Quantity
  const updateQuoteQuantity = (id, quantity) => {
    setQuoteItems((prevItems) =>
      prevItems.map((item) => (item._id === id ? { ...item, quantity } : item))
    );
  };

  // 🧹 Clear Quote List
  const clearQuote = () => setQuoteItems([]);

  return (
    <QuoteContext.Provider value={{ quoteItems, addToQuote, removeFromQuote, updateQuoteQuantity, clearQuote }}>
      {children}
    </QuoteContext.Provider>
  );
};

export const useQuote = () => useContext(QuoteContext);
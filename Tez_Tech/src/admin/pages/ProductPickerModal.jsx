import React, { useState, useEffect, useMemo } from "react";
import { FaTimes, FaSearch, FaSpinner, FaImage, FaCheckCircle } from "react-icons/fa";
import api from "../../utils/api";

const ProductPickerModal = ({ isOpen, onClose, onAddProduct }) => {
  const [productSearch, setProductSearch] = useState("");
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  
  // Selected Product State
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Configuration States
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [selectedCustomFields, setSelectedCustomFields] = useState({});

  // 🟢 Live Debounced Search API Call
  useEffect(() => {
    if (!isOpen) return;

    const fetchProducts = async () => {
      try {
        setProductsLoading(true);
        const res = await api.get("/products", { params: { keyword: productSearch, limit: 20 } });
        setProducts(res.data.products || res.data.data || res.data || []);
      } catch (error) {
        console.error("Product fetch error:", error);
        setProducts([]);
      } finally {
        setProductsLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchProducts();
    }, 400); // 400ms debounce for live search

    return () => clearTimeout(timer);
  }, [productSearch, isOpen]);

  // 🟢 Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedProduct(null);
      setProductSearch("");
      setSelectedVariant(null);
      setSelectedAttributes({});
      setSelectedCustomFields({});
    }
  }, [isOpen]);

  // 🟢 Extract Variant Combinations for UI (MOVED BEFORE EARLY RETURN)
  const variantOptions = useMemo(() => {
    if (!selectedProduct?.variants) return {};
    const opt = {};
    selectedProduct.variants.forEach((v) => {
      Object.entries(v.combination || {}).forEach(([k, val]) => {
        if (!opt[k]) opt[k] = new Set();
        opt[k].add(val);
      });
    });
    return opt;
  }, [selectedProduct]);

  // 🟢 Calculate Dynamic Price (MOVED BEFORE EARLY RETURN)
  const calculateComputedPrice = () => {
    if (!selectedProduct) return 0;
    
    let finalPrice = Number(selectedProduct.price || selectedProduct.sellingPrice || 0);

    if (selectedVariant) {
      const vPrice = selectedVariant.sellingPrice || selectedVariant.price;
      if (vPrice !== undefined && vPrice !== null) finalPrice = Number(vPrice);
    }

    Object.values(selectedAttributes || {}).forEach((opt) => {
      if (opt && opt.priceAdjustment) finalPrice += Number(opt.priceAdjustment);
    });

    Object.entries(selectedCustomFields || {}).forEach(([key, val]) => {
      const field = selectedProduct.customFields?.find(f => f._id === key || f.label === key);
      const values = Array.isArray(val) ? val : [val];
      values.forEach(v => {
        const opt = field?.options?.find(o => o.label === v || o.value === v);
        if (opt?.priceAdjustment) finalPrice += Number(opt.priceAdjustment);
      });
    });

    return finalPrice > 0 ? finalPrice : 0;
  };

  const computedBasePrice = calculateComputedPrice();

  // 🔴 EARLY RETURN YAHAN AAYEGA (Saare Hooks call hone ke baad)
  if (!isOpen) return null;

  // 🟢 Handle Product Click & Set Defaults
  const handlePickProduct = (product) => {
    setSelectedProduct(product);
    
    // Set Default Variant
    let defaultVariant = null;
    if (product.variants?.length > 0) {
      defaultVariant = product.variants[0];
    }
    setSelectedVariant(defaultVariant);

    // Set Default Attributes
    let defaultAttrs = {};
    if (product.attributes?.length > 0) {
      product.attributes.forEach(attr => {
        if (attr.options?.length > 0) defaultAttrs[attr.name] = attr.options[0];
      });
    }
    setSelectedAttributes(defaultAttrs);

    // Reset Custom Fields
    setSelectedCustomFields({});
  };

  // 🟢 Handle Configuration Changes
  const handleOptionChange = (type, fieldOrName, value, mode = "set") => {
    if (type === 'variant') {
      setSelectedVariant(value);
    } else if (type === 'attribute') {
      setSelectedAttributes(prev => ({ ...prev, [fieldOrName]: value }));
    } else if (type === 'customField') {
      const key = String(fieldOrName._id || fieldOrName.label || "");
      setSelectedCustomFields(prev => {
        const currentSelections = { ...prev };
        if (mode === "toggle") {
          const existing = Array.isArray(currentSelections[key]) ? currentSelections[key] : [];
          const safeValue = String(value || "").trim();
          if (safeValue) {
            currentSelections[key] = existing.includes(safeValue) ? existing.filter((v) => v !== safeValue) : [...existing, safeValue];
          }
        } else {
          currentSelections[key] = value;
        }
        return currentSelections;
      });
    }
  };

  const getFieldKey = (field) => String(field?._id || field?.label || "");
  const getFieldLabel = (field, key) => field?.label ? String(field.label) : String(key || "");

  // 🟢 Add to Quote
  const handleAddToQuote = () => {
    if (!selectedProduct) return;

    const configuredProduct = {
      productId: selectedProduct, 
      name: selectedProduct.name,
      sku: selectedProduct.sku || selectedProduct.baseSku || "N/A",
      image: selectedProduct.image || selectedProduct.images?.[0],
      basePrice: selectedProduct.price || 0,
      originalPrice: computedBasePrice,
      offeredPrice: computedBasePrice, 
      quantity: 1, 
      selectedVariant: selectedVariant,
      selectedAttributes: selectedAttributes,
      selectedCustomFields: selectedCustomFields
    };

    onAddProduct(configuredProduct);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-start justify-center p-4 bg-gray-900/60 backdrop-blur-sm md:items-center font-sans">
      <div className="w-full max-w-6xl overflow-hidden bg-white shadow-2xl rounded-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b shrink-0">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Add Product to Quote</h3>
            <p className="text-sm text-gray-500">Search and configure products before adding.</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 transition-colors bg-white border rounded-full hover:bg-red-50 hover:text-red-500 hover:border-red-200 shadow-sm">
            <FaTimes size={16} />
          </button>
        </div>

        {/* Main Body Grid */}
        <div className="grid grid-cols-1 md:grid-cols-[380px_1fr] flex-1 overflow-hidden">
          
          {/* ========================================= */}
          {/* LEFT SIDE: SEARCH & PRODUCT LIST */}
          {/* ========================================= */}
          <div className="flex flex-col border-r bg-white overflow-hidden">
            <div className="p-4 border-b bg-white shrink-0">
              <div className="relative">
                <FaSearch className="absolute text-gray-400 left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search product name..."
                  className="w-full py-2.5 pl-10 pr-4 text-sm border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-gray-50/50"
                />
                {productsLoading && <FaSpinner className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" />}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {productsLoading && products.length === 0 ? (
                <div className="p-8 text-center text-gray-500 flex flex-col items-center gap-3">
                  <FaSpinner className="text-2xl animate-spin text-blue-500" />
                  <span className="text-sm">Searching...</span>
                </div>
              ) : products.length === 0 ? (
                <p className="p-8 text-sm text-center text-gray-500">No products found. Try a different keyword.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {products.map((product) => (
                    <button
                      key={product._id}
                      type="button"
                      onClick={() => handlePickProduct(product)}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                        selectedProduct?._id === product._id ? "bg-blue-50 border-l-4 border-l-blue-600" : "hover:bg-gray-50 border-l-4 border-l-transparent"
                      }`}
                    >
                      {product.image || product.images?.[0] ? (
                        <img src={product.image || product.images?.[0]} alt={product.name} className="object-contain w-12 h-12 bg-white border border-gray-200 rounded-md mix-blend-multiply p-1 shrink-0" />
                      ) : (
                        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 border border-gray-200 rounded-md shrink-0"><FaImage className="text-gray-300" /></div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{product.name}</p>
                        <p className="text-[11px] text-gray-500 uppercase mt-0.5">SKU: {product.sku || product.baseSku || "N/A"}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ========================================= */}
          {/* RIGHT SIDE: CONFIGURATION & PRICE */}
          {/* ========================================= */}
          <div className="flex flex-col bg-gray-50 overflow-hidden">
            {!selectedProduct ? (
              <div className="flex flex-col items-center justify-center flex-1 p-8 text-center text-gray-500">
                 <FaImage className="text-6xl text-gray-200 mb-4" />
                 <h3 className="text-lg font-bold text-gray-800">No Product Selected</h3>
                 <p className="text-sm">Please select a product from the list to configure its options.</p>
              </div>
            ) : (
              <>
                <div className="flex-1 p-8 overflow-y-auto">
                  
                  {/* Selected Product Hero */}
                  <div className="flex items-start gap-6 mb-8">
                    <div className="w-24 h-24 bg-white border border-gray-200 rounded-xl flex items-center justify-center p-2 shrink-0 shadow-sm">
                       {selectedProduct.image || selectedProduct.images?.[0] ? (
                         <img src={selectedProduct.image || selectedProduct.images?.[0]} alt={selectedProduct.name} className="object-contain w-full h-full mix-blend-multiply" />
                       ) : (
                         <FaImage className="text-3xl text-gray-300" />
                       )}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 leading-tight">{selectedProduct.name}</h2>
                      <div className="mt-1 text-xs text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <span>SKU: {selectedProduct.sku || selectedProduct.baseSku || "N/A"}</span>
                        <span>|</span>
                        <span>STORE / {selectedProduct.category?.name || selectedProduct.category || "General"}</span>
                      </div>
                      <div className="mt-3">
                         <span className="text-2xl font-light text-gray-900">₹{computedBasePrice.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <hr className="mb-8 border-gray-200" />

                  {/* Configuration Options */}
                  <div className="space-y-6 max-w-2xl">
                    
                    {/* 1. Variants */}
                    {Object.entries(variantOptions).length > 0 && Object.entries(variantOptions).map(([key, values]) => (
                      <div key={key}>
                        <h4 className="mb-3 text-[12px] font-bold tracking-wider text-gray-800 uppercase">{key}</h4>
                        <div className="flex flex-wrap gap-3">
                          {[...values].map((v) => {
                            const isSelected = selectedVariant?.combination?.[key] === v;
                            return (
                              <label key={v} className="flex items-center gap-2 cursor-pointer group">
                                <input
                                  type="radio"
                                  name={`variant-${key}`}
                                  checked={isSelected}
                                  onChange={() => {
                                    const found = selectedProduct.variants?.find((variant) => variant.combination?.[key] === v);
                                    if (found) handleOptionChange('variant', null, found);
                                  }}
                                  className="w-4 h-4 text-blue-600 bg-white border-gray-400 focus:ring-blue-600 cursor-pointer"
                                />
                                <span className="text-sm text-gray-800 group-hover:text-black font-medium">{v}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {/* 2. Attributes */}
                    {selectedProduct.attributes?.length > 0 && selectedProduct.attributes.map((attr, i) => (
                      <div key={i}>
                        <h4 className="mb-3 text-[12px] font-bold tracking-wider text-gray-800 uppercase">{attr.name}</h4>
                        <div className="flex flex-col gap-3">
                          {attr.options?.map(opt => {
                            const optVal = opt.value || opt.label;
                            const selectedOpt = selectedAttributes?.[attr.name];
                            const isSelected = selectedOpt && (selectedOpt.value === optVal || selectedOpt.label === optVal);
                            const adjText = opt.priceAdjustment ? ` (+ ₹${Number(opt.priceAdjustment).toFixed(2)})` : '';
                            
                            return (
                              <label key={optVal} className="flex items-center gap-3 cursor-pointer group">
                                <input 
                                  type="radio" 
                                  name={`attr-${attr.name}`}
                                  checked={isSelected} 
                                  onChange={() => handleOptionChange('attribute', attr.name, opt)}
                                  className="w-4 h-4 text-blue-600 bg-white border-gray-400 focus:ring-blue-600 cursor-pointer" 
                                />
                                <span className="text-sm text-gray-800 group-hover:text-black font-medium leading-tight">
                                  {optVal} <span className="text-gray-500 font-normal">{adjText}</span>
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {/* 3. Custom Fields */}
                    {selectedProduct.customFields?.length > 0 && selectedProduct.customFields.map((field) => {
                      const fieldKey = getFieldKey(field);
                      const selectedValue = selectedCustomFields?.[fieldKey] || "";
                      
                      return (
                        <div key={fieldKey}>
                          <h4 className="mb-3 text-[12px] font-bold tracking-wider text-gray-800 uppercase">{getFieldLabel(field, fieldKey)}</h4>
                          
                          {field.type === "text" ? (
                            <input
                              type="text" 
                              value={selectedValue} 
                              onChange={(e) => handleOptionChange('customField', field, e.target.value, "set")}
                              className="w-full max-w-md p-2.5 text-sm bg-white border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm" 
                              placeholder="Enter value..."
                            />
                          ) : field.type === "checkbox" ? (
                            <div className="flex flex-col gap-3">
                              {(field.options || []).map((opt) => {
                                const optLabel = String(opt.label || opt.value).trim();
                                const isChecked = (Array.isArray(selectedValue) ? selectedValue : []).includes(optLabel);
                                const adjText = opt.priceAdjustment ? ` (+ ₹${Number(opt.priceAdjustment).toFixed(2)})` : '';
                                return (
                                  <label key={optLabel} className="flex items-center gap-3 cursor-pointer group">
                                    <input 
                                      type="checkbox" 
                                      checked={isChecked} 
                                      onChange={() => handleOptionChange('customField', field, optLabel, "toggle")}
                                      className="w-4 h-4 text-blue-600 rounded border-gray-400 focus:ring-blue-600 cursor-pointer"
                                    />
                                    <span className="text-sm text-gray-800 group-hover:text-black font-medium leading-tight">
                                      {optLabel} <span className="text-gray-500 font-normal">{adjText}</span>
                                    </span>
                                  </label>
                                )
                              })}
                            </div>
                          ) : (
                            <div className="flex flex-col gap-3">
                              {(field.options || []).map((opt) => {
                                const optLabel = String(opt.label || opt.value);
                                const isSelected = selectedValue === optLabel;
                                const adjText = opt.priceAdjustment ? ` (+ ₹${Number(opt.priceAdjustment).toFixed(2)})` : '';
                                return (
                                  <label key={optLabel} className="flex items-center gap-3 cursor-pointer group">
                                    <input 
                                      type="radio" 
                                      name={`cf-${fieldKey}`}
                                      checked={isSelected} 
                                      onChange={() => handleOptionChange('customField', field, optLabel, "set")}
                                      className="w-4 h-4 text-blue-600 bg-white border-gray-400 focus:ring-blue-600 cursor-pointer" 
                                    />
                                    <span className="text-sm text-gray-800 group-hover:text-black font-medium leading-tight">
                                      {optLabel} <span className="text-gray-500 font-normal">{adjText}</span>
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {(!variantOptions || Object.keys(variantOptions).length === 0) && 
                     (!selectedProduct.attributes || selectedProduct.attributes.length === 0) && 
                     (!selectedProduct.customFields || selectedProduct.customFields.length === 0) && (
                      <div className="p-4 border border-gray-200 border-dashed rounded-lg bg-white/50">
                         <p className="text-sm italic text-gray-500 text-center">No customizable options available for this product.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="flex items-center justify-between p-6 bg-white border-t shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Final Line Price</p>
                    <span className="text-2xl font-black text-emerald-600">₹{computedBasePrice.toFixed(2)}</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={handleAddToQuote} 
                    className="flex items-center gap-2 px-8 py-3.5 text-[15px] font-bold text-white transition-colors bg-gray-900 rounded-lg shadow-md hover:bg-black"
                  >
                    Add Product to Quote <FaCheckCircle />
                  </button>
                </div>
              </>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default ProductPickerModal;
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { FaTimes, FaTrash, FaSearch, FaCheckCircle, FaArrowRight, FaArrowLeft, FaCopy, FaWhatsapp, FaShoppingCart, FaEdit } from 'react-icons/fa';
import api from '../../utils/api'; 

const CreateManualQuotationModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [activeProduct, setActiveProduct] = useState(null); 
  const [cartItems, setCartItems] = useState([]);
  
  const [quoteData, setQuoteData] = useState({
    userDetails: { name: '', phone: '', message: '' },
    shippingCharge: 0,
    additionalChargeName: '',
    additionalChargeAmount: 0,
    gstPercentage: 0,
    extraDiscountType: 'flat',
    extraDiscountValue: 0, 
  });

  const [_shareLink, setShareLink] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const searchRef = useRef();
  const debounceRef = useRef();

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    return () => document.body.style.overflow = 'unset';
  }, [isOpen]);

  const debouncedSearch = useCallback((query) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (query.length < 2) return setSearchResults([]);
      try {
        const res = await api.get(`/products?keyword=${encodeURIComponent(query)}&limit=10`);
        setSearchResults(res.data.products || []);
      } catch (err) { console.error('Search error:', err); }
    }, 300);
  }, []);

  useEffect(() => {
    debouncedSearch(searchQuery);
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery, debouncedSearch]);

  const getFieldKey = (field) => String(field?._id || field?.label || "");
  const getFieldLabel = (field, key) => field?.label ? String(field.label) : String(key || "");

  const variantOptions = useMemo(() => {
    if (!activeProduct?.variants) return {};
    const opt = {};
    activeProduct.variants.forEach((v) => {
      Object.entries(v.combination || {}).forEach(([k, val]) => {
        if (!opt[k]) opt[k] = new Set();
        opt[k].add(val);
      });
    });
    return opt;
  }, [activeProduct]);

  const calculatePrice = (item) => {
    let finalPrice = Number(item.price || item.sellingPrice || 0);

    if (item.selectedVariant) {
      const vPrice = item.selectedVariant.sellingPrice || item.selectedVariant.price;
      if (vPrice !== undefined && vPrice !== null) finalPrice = Number(vPrice);
    }

    Object.values(item.selectedAttributes || {}).forEach((opt) => {
      if (opt && opt.priceAdjustment) finalPrice += Number(opt.priceAdjustment);
    });

    Object.entries(item.selectedCustomFields || {}).forEach(([key, val]) => {
      const field = item.customFields?.find(f => f._id === key || f.label === key);
      const values = Array.isArray(val) ? val : [val];
      values.forEach(v => {
        const opt = field?.options?.find(o => o.label === v || o.value === v);
        if (opt?.priceAdjustment) finalPrice += Number(opt.priceAdjustment);
      });
    });

    return finalPrice > 0 ? finalPrice : 0;
  };

  const handleActiveProductChange = (type, fieldOrName, value, mode = "set") => {
    setActiveProduct(prev => {
      let updated = { ...prev };
      
      if (type === 'variant') {
        updated.selectedVariant = value;
      } else if (type === 'attribute') {
        updated.selectedAttributes = { ...updated.selectedAttributes, [fieldOrName]: value };
      } else if (type === 'customField') {
        const key = getFieldKey(fieldOrName);
        const currentSelections = { ...(updated.selectedCustomFields || {}) };
        
        if (mode === "toggle") {
          const existing = Array.isArray(currentSelections[key]) ? currentSelections[key] : [];
          const safeValue = String(value || "").trim();
          if (safeValue) {
            currentSelections[key] = existing.includes(safeValue) ? existing.filter((v) => v !== safeValue) : [...existing, safeValue];
          }
        } else {
          currentSelections[key] = value;
        }
        updated.selectedCustomFields = currentSelections;
      }

      updated.basePrice = calculatePrice(updated);
      updated.offeredPrice = updated.basePrice; 
      return updated;
    });
  };

  const addToQuoteCart = () => {
    if (!activeProduct) return;
    
    setCartItems(prev => {
      const existingIndex = prev.findIndex(item => item.cartId === activeProduct.cartId);
      if (existingIndex >= 0) {
        const newCart = [...prev];
        newCart[existingIndex] = { ...activeProduct };
        return newCart;
      } else {
        return [...prev, { ...activeProduct, cartId: Date.now(), quantity: 1 }];
      }
    });
    
    setActiveProduct(null); 
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleEditItem = (item) => {
    setActiveProduct({ ...item }); 
  };

  const calculateTotals = () => {
    const subtotal = cartItems.reduce((sum, item) => sum + (Number(item.offeredPrice) * Number(item.quantity)), 0);
    const discountAmount = quoteData.extraDiscountType === "percent"
      ? (subtotal * (Number(quoteData.extraDiscountValue) / 100))
      : Number(quoteData.extraDiscountValue) || 0;
    const afterDiscount = Math.max(0, subtotal - discountAmount);
    const gstAmount = afterDiscount * (Number(quoteData.gstPercentage) / 100);
    const total = afterDiscount + gstAmount + Number(quoteData.shippingCharge) + Number(quoteData.additionalChargeAmount);
    
    return { subtotal, discountAmount, afterDiscount, gstAmount, total };
  };

  const totals = calculateTotals();

const submitQuote = async () => {
    if (cartItems.length === 0) return alert('Please add items first');
    if (!quoteData.userDetails.name || !quoteData.userDetails.phone) return alert('Client Name & Phone Number are required');
    
    setSubmitting(true);
    try {
      const payload = {
        userDetails: quoteData.userDetails,
        requestedItems: cartItems.map(item => ({
          productId: item._id,
          name: item.name,
          quantity: item.quantity,
          basePrice: item.basePrice,
          offeredPrice: item.offeredPrice,
          gstRate: item.gstRate || 18, // Excel wala GST yahan se jayega
          selectedVariant: item.selectedVariant || null,
          selectedAttributes: item.selectedAttributes || {},
          selectedCustomFields: item.selectedCustomFields || {}
        })),
        shippingCharge: quoteData.shippingCharge,
        additionalChargeName: quoteData.additionalChargeName,
        additionalChargeAmount: quoteData.additionalChargeAmount,
        gstPercentage: Number(quoteData.gstPercentage) || 0, 
        extraDiscountType: quoteData.extraDiscountType,
        extraDiscountValue: Number(quoteData.extraDiscountValue) || 0,
        totalDiscount: totals.discountAmount,
        finalTotal: totals.total,
        isManualAdminQuote: true
      };
      
      const res = await api.post('/quote/manual', payload);

      // 🚀 TOKEN EXTRACTION FIX: Sabhi tariko se check karega
      const data = res.data;
      const token = data.quoteToken || data.token || data.quote?.quoteToken || data.quote?.token;

      if (token) {
        // Link ko bypass karke direct client-side URL bana rahe hain
        const finalLink = `${window.location.origin}/quote/${token}`;
        setShareLink(finalLink);
        setStep(3); 
      } else {
        console.error("Backend Response Data:", data);
        alert("Quote saved but Token not received from server. Check console.");
      }

    } catch (err) {
      alert('Failed to create quote: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };
  
  if (!isOpen) return null;

  const renderStep1Selection = () => (
    <div className="grid h-full grid-cols-1 gap-6 overflow-hidden lg:grid-cols-3">
      
      <div className="flex flex-col h-full pr-2 overflow-y-auto lg:col-span-2">
        
        {!activeProduct && (
          <div className="p-5 bg-white border border-gray-200 shadow-sm rounded-xl">
            <h2 className="mb-4 text-lg font-bold text-gray-800">Search & Select Products</h2>
            <div className="relative">
              <FaSearch className="absolute text-gray-400 -translate-y-1/2 left-4 top-1/2" />
              <input 
                ref={searchRef}
                placeholder="Type product name or SKU..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="w-full p-3 pl-12 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>
            
            {searchResults.length > 0 && (
              <div className="mt-2 overflow-y-auto bg-white border rounded-lg shadow-sm max-h-96">
                {searchResults.map(product => (
                  <div 
                    key={product._id} 
                    className="flex items-center gap-4 p-4 transition-colors border-b cursor-pointer hover:bg-gray-50"
                    onClick={() => {
                      let defaultVariant = null;
                      if (product.variants?.length > 0) defaultVariant = product.variants[0];

                      const defaultAttrs = {};
                      if (product.attributes?.length > 0) {
                        product.attributes.forEach(attr => {
                          if (attr.options?.length > 0) defaultAttrs[attr.name] = attr.options[0];
                        });
                      }

                      const initProduct = { 
                        ...product, 
                        selectedVariant: defaultVariant, 
                        selectedAttributes: defaultAttrs, 
                        selectedCustomFields: {}
                      };
                      
                      const defaultPrice = calculatePrice(initProduct);
                      initProduct.basePrice = defaultPrice;
                      initProduct.offeredPrice = defaultPrice;

                      setActiveProduct(initProduct);
                      setSearchResults([]);
                      setSearchQuery('');
                    }}
                  >
                    <img src={product.image || product.images?.[0]} alt={product.name} className="object-cover w-16 h-16 bg-gray-100 border rounded" />
                    <div>
                      <div className="text-lg font-semibold text-gray-800">{product.name}</div>
                      {/* 🚀 FIX: SKU now explicitly checks baseSku too */}
                      <div className="text-sm text-gray-500">SKU: {product.sku || product.baseSku || 'N/A'} | ₹{product.sellingPrice || product.price}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeProduct && (
          <div className="relative flex flex-col h-fit shrink-0 mb-6 bg-white border border-gray-200 shadow-sm rounded-xl">
            <button 
              onClick={() => setActiveProduct(null)} 
              className="absolute top-4 right-4 text-gray-500 hover:text-red-600 bg-gray-100 hover:bg-red-50 p-2.5 rounded-full transition-colors z-10"
              title="Close and go back to search"
            >
              <FaTimes size={16}/>
            </button>
            
            <div className="grid flex-1 grid-cols-1 gap-8 p-8 md:grid-cols-2">
              
              <div className="w-full">
                <div className="flex items-center justify-center w-full h-64 md:h-72 overflow-hidden bg-gray-200 rounded-lg">
                   <img 
                     src={activeProduct.image || activeProduct.images?.[0]} 
                     alt={activeProduct.name} 
                     className="object-contain w-full h-full p-4 mix-blend-multiply" 
                   />
                </div>

                {activeProduct.details?.length > 0 && (
                  <div className="p-6 mt-8 border border-gray-200 rounded-lg bg-gray-50">
                    <h3 className="mb-4 text-base font-medium text-gray-900">Product Details</h3>
                    <div className="flex flex-col gap-2">
                      {activeProduct.details.map((detail, idx) => (
                        <div key={idx} className="text-[14px] text-gray-800 uppercase flex gap-2">
                          <span className="font-bold">{detail.key.replace(/_/g, ' ')}:</span>
                          <span>{detail.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Product Pricing & Radio Buttons Panel */}
              <div className="flex flex-col">
                <h2 className="text-2xl font-normal tracking-wide text-gray-800 uppercase">{activeProduct.name}</h2>
                <div className="flex gap-2 mt-2 text-xs tracking-widest text-gray-500 uppercase">
                  STORE {activeProduct.category && `/ ${activeProduct.category.name || activeProduct.category}`}
                </div>
                {/* 🚀 FIX: SKU check enhanced here too */}
                <div className="mt-1 mb-4 text-xs text-gray-500">
                  SKU: {activeProduct.sku || activeProduct.baseSku || 'N/A'}
                </div>

                <div className="mb-6">
                  <div className="text-3xl font-light text-gray-800">
                    ₹{activeProduct.basePrice.toFixed(2)}
                  </div>
                  <div className="mt-1 text-sm text-gray-500">Price incl. GST (18%)</div>
                </div>

                <hr className="mb-6 border-gray-200" />

                <div className="flex-1 space-y-6">
                  {Object.entries(variantOptions).length > 0 && Object.entries(variantOptions).map(([key, values]) => (
                    <div key={key}>
                      <label className="block mb-3 text-xs font-bold text-gray-800 uppercase">{key}</label>
                      <div className="flex flex-col gap-3">
                        {[...values].map((v) => {
                          const isSelected = activeProduct.selectedVariant?.combination?.[key] === v;
                          return (
                            <label key={v} className="flex items-center gap-3 cursor-pointer group">
                              <input
                                type="radio"
                                name={`variant-${key}`}
                                checked={isSelected}
                                onChange={() => {
                                  const found = activeProduct.variants.find((variant) => variant.combination?.[key] === v);
                                  if (found) handleActiveProductChange('variant', null, found);
                                }}
                                className="w-4 h-4 text-blue-600 border-gray-300 cursor-pointer focus:ring-blue-500"
                              />
                              <span className="text-[14.5px] text-gray-800 group-hover:text-black">
                                {v}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {!activeProduct.variants?.[0]?.combination && activeProduct.variants?.length > 0 && (
                    <div>
                      <label className="block mb-3 text-xs font-bold text-gray-800 uppercase">VARIANT</label>
                      <div className="flex flex-col gap-3">
                        {activeProduct.variants.map(v => {
                          const isSelected = activeProduct.selectedVariant?._id === v._id;
                          return (
                            <label key={v._id} className="flex items-center gap-3 cursor-pointer group">
                              <input 
                                type="radio" 
                                name="variant-selection"
                                checked={isSelected} 
                                onChange={() => handleActiveProductChange('variant', null, v)}
                                className="w-4 h-4 text-blue-600 border-gray-300 cursor-pointer focus:ring-blue-500" 
                              />
                              <span className="text-[14.5px] text-gray-800 group-hover:text-black">
                                {v.name || v.title} (+ ₹{(v.sellingPrice || v.price).toFixed(2)})
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {activeProduct.attributes?.length > 0 && activeProduct.attributes.map((attr, i) => (
                    <div key={i}>
                      <label className="block mb-3 text-xs font-bold text-gray-800 uppercase">{attr.name}</label>
                      <div className="flex flex-col gap-3">
                        {attr.options?.map(opt => {
                          const optVal = opt.value || opt.label;
                          const selectedOpt = activeProduct.selectedAttributes?.[attr.name];
                          const isSelected = selectedOpt && (selectedOpt.value === optVal || selectedOpt.label === optVal);
                          const adjText = opt.priceAdjustment ? ` (+ ₹${Number(opt.priceAdjustment).toFixed(2)})` : '';
                          
                          return (
                            <label key={optVal} className="flex items-center gap-3 cursor-pointer group">
                              <input 
                                type="radio" 
                                name={`attr-${attr.name}`}
                                checked={isSelected} 
                                onChange={() => handleActiveProductChange('attribute', attr.name, opt)}
                                className="w-4 h-4 text-blue-600 border-gray-300 cursor-pointer focus:ring-blue-500" 
                              />
                              <span className="text-[14.5px] text-gray-800 group-hover:text-black leading-tight">
                                {optVal}{adjText}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {activeProduct.customFields?.length > 0 && activeProduct.customFields.map((field) => {
                    const fieldKey = getFieldKey(field);
                    const selectedValue = activeProduct.selectedCustomFields?.[fieldKey] || "";
                    
                    return (
                      <div key={fieldKey}>
                        <label className="block mb-3 text-xs font-bold text-gray-800 uppercase">{getFieldLabel(field, fieldKey)}</label>
                        {field.type === "text" ? (
                          <input
                            type="text" value={selectedValue} onChange={(e) => handleActiveProductChange('customField', field, e.target.value, "set")}
                            className="w-full p-2 bg-transparent border-b border-gray-300 outline-none focus:border-blue-500" 
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
                                    onChange={() => handleActiveProductChange('customField', field, optLabel, "toggle")}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded cursor-pointer focus:ring-blue-500"
                                  />
                                  <span className="text-sm text-gray-700 group-hover:text-black">{optLabel}{adjText}</span>
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
                                    onChange={() => handleActiveProductChange('customField', field, optLabel, "set")}
                                    className="w-4 h-4 text-blue-600 border-gray-300 cursor-pointer focus:ring-blue-500" 
                                  />
                                  <span className="text-sm text-gray-700 group-hover:text-black">
                                    {optLabel}{adjText}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  <div className="mt-6">
                    <span className="text-[15px] font-medium text-gray-900">In stock</span>
                  </div>
                </div>
                
                <div className="pt-6 mt-4 border-t border-gray-100">
                  <button 
                    onClick={addToQuoteCart} 
                    className="w-full md:w-auto bg-[#333333] text-white px-8 py-3.5 rounded-sm font-medium hover:bg-black shadow-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    {activeProduct.cartId ? 'Update Configured Item' : 'Add to Quotation'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col h-full p-5 border border-gray-200 shadow-inner bg-gray-50 rounded-xl">
        <h3 className="pb-2 mb-4 text-lg font-bold text-gray-800 border-b border-gray-300">Quotation Items ({cartItems.length})</h3>
        
        <div className="flex-1 pr-2 space-y-3 overflow-y-auto">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <FaShoppingCart className="mb-3 text-5xl opacity-20" />
              <p className="text-sm font-medium">No items selected yet.</p>
            </div>
          ) : (
            cartItems.map((item) => (
              <div 
                key={item.cartId} 
                className={`relative flex justify-between items-start text-sm bg-white p-3.5 rounded-xl shadow-sm border transition-all cursor-pointer group hover:border-blue-400 hover:shadow-md ${activeProduct?.cartId === item.cartId ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50/30' : 'border-gray-200'}`}
                onClick={() => handleEditItem(item)}
              >
                <div className="flex items-center w-full gap-4">
                  <div className="p-1 bg-gray-100 border rounded-md">
                    <img src={item.image || item.images?.[0]} alt={item.name} className="object-contain w-12 h-12 rounded mix-blend-multiply" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-gray-800 line-clamp-1">{item.name}</div>
                    
                    <div className="mt-1 text-xs text-gray-500 line-clamp-2">
                      {item.selectedVariant && <span className="mr-2">Var: {item.selectedVariant.name || Object.values(item.selectedVariant.combination || {}).join('/')}</span>}
                      {Object.entries(item.selectedAttributes || {}).map(([k,v]) => <span key={k} className="mr-2">{v.value || v.label || v}</span>)}
                      {Object.entries(item.selectedCustomFields || {}).map(([k,v]) => <span key={k} className="mr-2">{Array.isArray(v) ? v.join(', ') : v}</span>)}
                    </div>
                    
                    <div className="text-sm text-green-600 font-bold mt-1.5">₹{item.basePrice.toFixed(2)}</div>
                  </div>
                </div>

                <div className="absolute flex flex-col gap-2 transition-opacity opacity-0 top-2 right-2 group-hover:opacity-100">
                   <button 
                     onClick={(e) => { e.stopPropagation(); setCartItems(prev => prev.filter(i => i.cartId !== item.cartId)); if(activeProduct?.cartId === item.cartId) setActiveProduct(null); }} 
                     className="text-red-400 hover:text-red-600 p-1.5 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
                     title="Remove Item"
                   >
                     <FaTrash size={12}/>
                   </button>
                </div>
                
                <div className="absolute text-blue-400 transition-opacity -translate-y-1/2 opacity-0 top-1/2 right-3 group-hover:opacity-100">
                  <FaEdit size={16}/>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="pt-4 mt-4 border-t border-gray-300">
          <button 
            onClick={() => setStep(2)} 
            disabled={cartItems.length === 0 || activeProduct}
            className="flex items-center justify-center w-full gap-2 py-4 text-lg font-bold text-white transition-colors bg-gray-800 shadow-md rounded-xl hover:bg-black disabled:bg-gray-300"
          >
            {activeProduct ? 'Save Item Before Proceeding' : 'Next: Setup Pricing'} <FaArrowRight />
          </button>
        </div>
      </div>
    </div>
  );

  const renderStep2Pricing = () => (
    <div className="h-full pr-2 space-y-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setStep(1)} className="flex items-center gap-2 px-4 py-2 font-bold text-blue-600 transition-colors rounded-lg hover:underline bg-blue-50 hover:bg-blue-100">
          <FaArrowLeft /> Back to Selection
        </button>
        <h2 className="text-xl font-bold text-gray-800">2. Setup Pricing & Client Details</h2>
      </div>

      <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-xl">
        <div className="p-4 text-white bg-gray-800"><h3 className="text-sm font-bold tracking-wider uppercase">Adjust Item Prices</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-gray-600 border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-semibold">Product Info</th>
                <th className="w-24 px-4 py-3 font-semibold text-center">Qty</th>
                <th className="px-4 py-3 font-semibold text-right">Base Price</th>
                <th className="px-4 py-3 font-semibold text-right">Offered Price (Edit)</th>
                <th className="px-4 py-3 font-semibold text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {cartItems.map((item, index) => (
                <tr key={item.cartId} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="text-base font-bold text-gray-800">{item.name}</div>
                    <div className="flex flex-wrap gap-1 mt-1 text-xs text-gray-500">
                      {item.selectedVariant && <span>Var: {item.selectedVariant.name || Object.values(item.selectedVariant.combination || {}).join('/')}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input 
                      type="number" min="1" value={item.quantity} 
                      onChange={(e) => {
                        const newCart = [...cartItems];
                        newCart[index].quantity = Number(e.target.value);
                        setCartItems(newCart);
                      }}
                      className="w-16 p-2 font-bold text-center border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500" 
                    />
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500 line-through">₹{item.basePrice.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">
                    <input 
                      type="number" min="0" value={item.offeredPrice} 
                      onChange={(e) => {
                        const newCart = [...cartItems];
                        newCart[index].offeredPrice = Number(e.target.value);
                        setCartItems(newCart);
                      }}
                      className="p-2 font-bold text-right text-blue-700 border-2 border-blue-300 rounded-md outline-none w-28 focus:border-blue-600 bg-blue-50" 
                    />
                  </td>
                  <td className="px-4 py-3 text-base font-black text-right text-green-600">₹{(item.offeredPrice * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 pb-6 md:grid-cols-2">
        <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-xl">
          <h3 className="pb-2 mb-4 text-lg font-bold text-gray-800 border-b">Client Details</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-xs font-bold text-gray-500 uppercase">Client Name *</label>
                <input 
                  value={quoteData.userDetails.name} 
                  onChange={(e) => setQuoteData({...quoteData, userDetails: {...quoteData.userDetails, name: e.target.value}})} 
                  className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="John Doe" 
                />
              </div>
              <div>
                <label className="block mb-1 text-xs font-bold text-gray-500 uppercase">Phone Number *</label>
                <input 
                  value={quoteData.userDetails.phone} 
                  onChange={(e) => setQuoteData({...quoteData, userDetails: {...quoteData.userDetails, phone: e.target.value}})} 
                  className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="+91..." 
                />
              </div>
            </div>
            <div>
              <label className="block mb-1 text-xs font-bold text-gray-500 uppercase">Additional Message (Optional)</label>
              <textarea 
                value={quoteData.userDetails.message || ''} 
                onChange={(e) => setQuoteData({...quoteData, userDetails: {...quoteData.userDetails, message: e.target.value}})} 
                className="w-full h-24 p-3 border border-gray-300 rounded-lg outline-none resize-none focus:ring-2 focus:ring-blue-500" 
                placeholder="Any specific requests or notes for the client..." 
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between p-6 bg-white border border-gray-200 shadow-sm rounded-xl">
          <div>
            <h3 className="pb-2 mb-4 text-lg font-bold text-gray-800 border-b">Additional Costs</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between group">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-gray-600">Discount</span>
                  <div className="flex items-center p-0.5 bg-gray-100 rounded-md w-fit border border-gray-200">
                    <button
                      type="button"
                      onClick={() => setQuoteData({...quoteData, extraDiscountType: "flat"})}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded ${quoteData.extraDiscountType === "flat" ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      ₹ Flat
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuoteData({...quoteData, extraDiscountType: "percent"})}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded ${quoteData.extraDiscountType === "percent" ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      % Perc
                    </button>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="relative flex items-center">
                    <span className="absolute text-gray-400 text-[11px] left-2">
                      {quoteData.extraDiscountType === "percent" ? "%" : "₹"}
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={quoteData.extraDiscountValue === 0 ? "" : quoteData.extraDiscountValue}
                      onChange={(e) => setQuoteData({...quoteData, extraDiscountValue: e.target.value})}
                      className="w-24 py-1.5 pl-6 pr-2 font-semibold text-right transition-all border border-gray-300 outline-none rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      placeholder="0"
                    />
                  </div>
                  {totals.discountAmount > 0 && (
                    <span className="text-[10px] font-bold text-emerald-600">
                      - ₹ {totals.discountAmount.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-600">GST Tax (%)</label>
                <input type="number" value={quoteData.gstPercentage} onChange={(e) => setQuoteData({...quoteData, gstPercentage: e.target.value})} className="w-24 p-2 text-right border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-600">Shipping (₹)</label>
                <input type="number" value={quoteData.shippingCharge} onChange={(e) => setQuoteData({...quoteData, shippingCharge: e.target.value})} className="w-24 p-2 text-right border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex items-center justify-between gap-2">
                 <input type="text" placeholder="Extra Charge Reason" value={quoteData.additionalChargeName} onChange={(e) => setQuoteData({...quoteData, additionalChargeName: e.target.value})} className="flex-1 p-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                 <input type="number" placeholder="Amt" value={quoteData.additionalChargeAmount} onChange={(e) => setQuoteData({...quoteData, additionalChargeAmount: e.target.value})} className="w-24 p-2 text-right border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>
          
          <div className="pt-4 mt-6 border-t-2 border-gray-200 border-dashed">
            <div className="flex items-center justify-between p-4 border border-green-100 bg-green-50 rounded-xl">
              <span className="font-black text-gray-700 uppercase">Grand Total</span>
              <span className="text-2xl font-black text-green-700">₹{totals.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 flex justify-end pt-4 pb-4 border-t bg-gray-50/90">
        <button onClick={submitQuote} disabled={submitting} className="bg-green-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-green-700 shadow-lg flex items-center gap-3 text-lg transition-transform transform hover:scale-[1.02]">
          {submitting ? 'Saving to Database...' : <><FaCheckCircle /> Generate & Save Link</>}
        </button>
      </div>
    </div>
  );

  const renderStep3Success = () => (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <div className="p-6 mb-6 rounded-full bg-green-50">
        <FaCheckCircle className="text-green-500 text-7xl" />
      </div>
      <h3 className="mb-2 text-3xl font-black text-gray-800">Quotation Saved!</h3>
      <p className="max-w-md mb-8 text-gray-500">This quote is now stored securely in the database. Share the link below with your client.</p>
      
      <div className="flex items-center w-full max-w-xl gap-2 p-2 bg-white border-2 border-green-200 shadow-sm rounded-xl">
        <input type="text" readOnly value={_shareLink} className="w-full p-4 font-bold text-gray-700 bg-transparent outline-none" />
        <button onClick={() => { navigator.clipboard.writeText(_shareLink); alert("Copied to clipboard!"); }} className="flex items-center gap-2 px-6 py-4 font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 whitespace-nowrap">
          <FaCopy /> Copy 
        </button>
      </div>

      {/* 🚀 FIX: Naya WhatsApp Button Add Kiya Gaya Hai */}
      {quoteData.userDetails.phone && (
        <a 
          href={`https://wa.me/${quoteData.userDetails.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${quoteData.userDetails.name},\n\nHere is your requested quotation. You can view it here:\n${_shareLink}\n\nThank you!`)}`}
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-8 py-3 mt-6 font-bold text-white transition-colors bg-green-500 rounded-xl hover:bg-green-600"
        >
          <FaWhatsapp size={22} /> Send link via WhatsApp
        </a>
      )}

      <div className="flex gap-4 mt-8">
        <button onClick={() => {
          setStep(1); setCartItems([]); setShareLink(''); setActiveProduct(null);
          setQuoteData({ userDetails: {name:'', phone:'', message:''}, shippingCharge: 0, additionalChargeName: '', additionalChargeAmount: 0, gstPercentage: 0, extraDiscountType: 'flat', extraDiscountValue: 0 });
        }} className="px-8 py-3 font-bold text-blue-600 transition-colors border-2 border-blue-200 hover:bg-blue-50 rounded-xl">
          Create Another Quote
        </button>
        <button onClick={onClose} className="px-8 py-3 font-bold text-white transition-colors bg-gray-800 hover:bg-black rounded-xl">
          Close Window
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
      <div className="bg-gray-50 rounded-2xl shadow-2xl w-full max-w-7xl h-[92vh] flex flex-col overflow-hidden relative border border-gray-200">
        
        <div className="z-10 flex items-center justify-between px-6 py-4 bg-white border-b shadow-sm">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-black text-gray-800">Create Custom Quote</h1>
            {step !== 3 && (
              <div className="hidden md:flex items-center gap-3 ml-6 px-4 py-1.5 bg-gray-100 rounded-full text-sm font-bold">
                <span className={`${step === 1 ? 'text-blue-600' : 'text-gray-400'}`}>1. Details</span>
                <FaArrowRight className="text-xs text-gray-300" />
                <span className={`${step === 2 ? 'text-blue-600' : 'text-gray-400'}`}>2. Pricing</span>
              </div>
            )}
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 transition-colors bg-gray-100 rounded-full hover:bg-red-50 hover:text-red-500">
            <FaTimes size={20} />
          </button>
        </div>

        <div className="flex-1 p-6 overflow-hidden">
          {step === 1 && renderStep1Selection()}
          {step === 2 && renderStep2Pricing()}
          {step === 3 && renderStep3Success()}
        </div>

      </div>
    </div>
  );
};

export default CreateManualQuotationModal;
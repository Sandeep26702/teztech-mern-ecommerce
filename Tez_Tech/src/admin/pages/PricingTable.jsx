import React, { useState, useMemo } from "react";
import { FaTrash, FaPlus, FaClipboardList, FaImage, FaLock, FaTimes, FaEdit, FaCheckCircle } from "react-icons/fa";
import ProductPickerModal from "./ProductPickerModal";

// 🌟 EDIT OPTIONS MODAL (For editing already added rows)
const EditOptionsModal = ({ item, isOpen, onClose, onSave, isViewOnly }) => {
  if (!isOpen || !item) return null;

  const [editedItem, setEditedItem] = useState({ 
    ...item,
    quantity: item.quantity || 1,
    offeredPrice: item.offeredPrice || item.originalPrice || item.basePrice || 0
  });
  
  const [isPriceManuallyEdited, setIsPriceManuallyEdited] = useState(false);

  const productData = (item.productId && typeof item.productId === 'object') ? item.productId : item;
  const variants = productData?.variants || item?.variants || [];
  const attributes = productData?.attributes || item?.attributes || [];
  const customFields = productData?.customFields || item?.customFields || [];
  const productDetails = productData?.details || item?.details || []; 

  const getFieldKey = (field) => String(field?._id || field?.label || "");
  const getFieldLabel = (field, key) => field?.label ? String(field.label) : String(key || "");

  const variantOptions = useMemo(() => {
    if (!variants || variants.length === 0) return {};
    const opt = {};
    variants.forEach((v) => {
      Object.entries(v.combination || {}).forEach(([k, val]) => {
        if (!opt[k]) opt[k] = new Set();
        opt[k].add(val);
      });
    });
    return opt;
  }, [variants]);

  const calculateComputedPrice = (currentItem) => {
    let finalPrice = Number(productData?.price || productData?.sellingPrice || currentItem.basePrice || 0);
    if (currentItem.selectedVariant) {
      const vPrice = currentItem.selectedVariant.sellingPrice || currentItem.selectedVariant.price;
      if (vPrice !== undefined && vPrice !== null) finalPrice = Number(vPrice);
    }
    Object.values(currentItem.selectedAttributes || {}).forEach((opt) => {
      if (opt && opt.priceAdjustment) finalPrice += Number(opt.priceAdjustment);
    });
    Object.entries(currentItem.selectedCustomFields || {}).forEach(([key, val]) => {
      const field = customFields.find(f => f._id === key || f.label === key);
      const values = Array.isArray(val) ? val : [val];
      values.forEach(v => {
        const opt = field?.options?.find(o => o.label === v || o.value === v);
        if (opt?.priceAdjustment) finalPrice += Number(opt.priceAdjustment);
      });
    });
    return finalPrice > 0 ? finalPrice : 0;
  };

  const computedBasePrice = calculateComputedPrice(editedItem);

  const handleOptionChange = (type, fieldOrName, value, mode = "set") => {
    if(isViewOnly) return;
    setEditedItem(prev => {
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
      const newPrice = calculateComputedPrice(updated);
      if (!isPriceManuallyEdited) {
        updated.offeredPrice = newPrice;
      }
      return updated;
    });
  };

  const handleSave = () => {
    onSave(editedItem._id, {
        productId: productData, 
        name: productData.name,
        sku: productData.sku || productData.baseSku,
        image: productData.image || productData.images?.[0],
        basePrice: productData.price || productData.sellingPrice || 0,
        originalPrice: computedBasePrice,
        selectedVariant: editedItem.selectedVariant,
        selectedAttributes: editedItem.selectedAttributes,
        selectedCustomFields: editedItem.selectedCustomFields,
        quantity: editedItem.quantity,
        offeredPrice: editedItem.offeredPrice
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm font-sans">
      <div className="flex flex-col w-full max-w-6xl max-h-[95vh] overflow-hidden bg-white shadow-2xl rounded-2xl relative">
        <button onClick={onClose} className="absolute z-10 p-2 text-gray-500 transition-colors bg-white rounded-full shadow-md top-4 right-4 hover:bg-red-50 hover:text-red-500">
          <FaTimes size={16} />
        </button>

        <div className="flex flex-col flex-1 overflow-hidden lg:flex-row">
          <div className="flex-1 p-6 overflow-y-auto lg:p-10">
            <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
              <div className="flex flex-col w-full gap-6">
                <div className="flex items-center justify-center w-full p-4 bg-[#f8f8f8] rounded-md aspect-square">
                  {item.image || productData.image || productData.images?.[0] ? (
                    <img src={item.image || productData.image || productData.images?.[0]} alt={item.name} className="object-contain w-full h-full mix-blend-multiply" />
                  ) : (
                    <FaImage className="text-6xl text-gray-300" />
                  )}
                </div>

                {productDetails && productDetails.length > 0 && (
                  <div className="p-6 border border-gray-100 bg-gray-50 rounded-xl">
                    <h3 className="mb-3 text-[15px] font-medium text-gray-900">Product Details</h3>
                    <div className="flex flex-col gap-1.5">
                      {productDetails.map((detail, idx) => (
                        <div key={idx} className="text-[14px] text-gray-800 flex gap-2">
                          <span className="font-bold uppercase">{detail.key.replace(/_/g, ' ')}:</span>
                          <span>{detail.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col w-full">
                <h1 className="text-[26px] leading-tight font-normal text-gray-900 uppercase">
                  {item.name || productData.name}
                </h1>
                
                <div className="mt-3 text-[13px] text-gray-500 uppercase tracking-wide flex items-center gap-2">
                  <span>STORE</span>
                  {productData.category && (
                    <><span>/</span><span>{productData.category.name || productData.category}</span></>
                  )}
                </div>
                
                <p className="mt-2 text-[13px] text-gray-500 uppercase">
                  SKU {item.sku || productData.sku || productData.baseSku || "N/A"}
                </p>

                <div className="mt-6 mb-6">
                  <h2 className="text-3xl font-light text-gray-900">
                    ₹{computedBasePrice.toFixed(2)}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Computed Base Price (incl. options)
                  </p>
                </div>

                <div className="w-full h-px my-6 bg-gray-200"></div>

                <div className="flex-1 space-y-6">
                  {Object.entries(variantOptions).length > 0 && Object.entries(variantOptions).map(([key, values]) => (
                    <div key={key}>
                      <h4 className="mb-3 text-[13px] font-semibold tracking-wider text-gray-900 uppercase">
                        {key}
                      </h4>
                      <div className="flex flex-col gap-2.5">
                        {[...values].map((v) => {
                          const isSelected = editedItem.selectedVariant?.combination?.[key] === v;
                          return (
                            <label key={v} className="flex items-start gap-3 cursor-pointer group">
                              <input
                                type="radio"
                                name={`variant-${key}`}
                                checked={isSelected}
                                disabled={isViewOnly}
                                onChange={() => {
                                  const found = variants.find((variant) => variant.combination?.[key] === v);
                                  if (found) handleOptionChange('variant', null, found);
                                }}
                                className="w-4 h-4 mt-0.5 text-[#1e73be] bg-white border-gray-400 focus:ring-[#1e73be] cursor-pointer disabled:opacity-50"
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

                  {attributes.length > 0 && attributes.map((attr, i) => (
                    <div key={i}>
                      <h4 className="mb-3 text-[13px] font-semibold tracking-wider text-gray-900 uppercase">
                        {attr.name}
                      </h4>
                      <div className="flex flex-col gap-2.5">
                        {attr.options?.map(opt => {
                          const optVal = opt.value || opt.label;
                          const selectedOpt = editedItem.selectedAttributes?.[attr.name];
                          const isSelected = selectedOpt && (selectedOpt.value === optVal || selectedOpt.label === optVal);
                          const adjText = opt.priceAdjustment ? ` (+ ₹${Number(opt.priceAdjustment).toFixed(2)})` : '';
                          
                          return (
                            <label key={optVal} className="flex items-start gap-3 cursor-pointer group">
                              <input 
                                type="radio" 
                                name={`attr-${attr.name}`}
                                checked={isSelected} 
                                disabled={isViewOnly}
                                onChange={() => handleOptionChange('attribute', attr.name, opt)}
                                className="w-4 h-4 mt-0.5 text-[#1e73be] bg-white border-gray-400 focus:ring-[#1e73be] cursor-pointer disabled:opacity-50" 
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

                  {customFields.length > 0 && customFields.map((field) => {
                    const fieldKey = getFieldKey(field);
                    const selectedValue = editedItem.selectedCustomFields?.[fieldKey] || "";
                    
                    return (
                      <div key={fieldKey}>
                        <h4 className="mb-3 text-[13px] font-semibold tracking-wider text-gray-900 uppercase">
                          {getFieldLabel(field, fieldKey)}
                        </h4>
                        {field.type === "text" ? (
                          <input
                            type="text" 
                            value={selectedValue} 
                            disabled={isViewOnly}
                            onChange={(e) => handleOptionChange('customField', field, e.target.value, "set")}
                            className="w-full p-2.5 border border-gray-300 rounded outline-none focus:border-blue-500 disabled:opacity-50 text-sm" 
                            placeholder="Enter value..."
                          />
                        ) : field.type === "checkbox" ? (
                          <div className="flex flex-col gap-2.5">
                            {(field.options || []).map((opt) => {
                              const optLabel = String(opt.label || opt.value).trim();
                              const isChecked = (Array.isArray(selectedValue) ? selectedValue : []).includes(optLabel);
                              const adjText = opt.priceAdjustment ? ` (+ ₹${Number(opt.priceAdjustment).toFixed(2)})` : '';
                              return (
                                <label key={optLabel} className="flex items-start gap-3 cursor-pointer group">
                                  <input 
                                    type="checkbox" 
                                    checked={isChecked} 
                                    disabled={isViewOnly}
                                    onChange={() => handleOptionChange('customField', field, optLabel, "toggle")}
                                    className="w-4 h-4 mt-0.5 text-[#1e73be] rounded border-gray-400 focus:ring-[#1e73be] cursor-pointer disabled:opacity-50"
                                  />
                                  <span className="text-[14.5px] text-gray-800 group-hover:text-black leading-tight">{optLabel}{adjText}</span>
                                </label>
                              )
                            })}
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2.5">
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
                                    disabled={isViewOnly}
                                    onChange={() => handleOptionChange('customField', field, optLabel, "set")}
                                    className="w-4 h-4 mt-0.5 text-[#1e73be] bg-white border-gray-400 focus:ring-[#1e73be] cursor-pointer disabled:opacity-50" 
                                  />
                                  <span className="text-[14.5px] text-gray-800 group-hover:text-black leading-tight">
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
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col w-full border-t border-gray-200 lg:w-96 bg-gray-50 lg:border-t-0 lg:border-l shrink-0">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-[15px] font-bold text-gray-900">Pricing Setup</h3>
              <p className="text-sm text-gray-500">Configure final quantity and price.</p>
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              <div>
                <label className="block mb-2 text-[11px] font-bold tracking-wider text-gray-600 uppercase">Quantity</label>
                <input
                  type="number"
                  min="1"
                  disabled={isViewOnly}
                  value={editedItem.quantity === "" ? "" : editedItem.quantity}
                  onChange={(e) => setEditedItem({...editedItem, quantity: e.target.value})}
                  className="w-full p-3 text-lg font-bold text-gray-900 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block mb-2 text-[11px] font-bold tracking-wider text-gray-600 uppercase">Offered Price (Per Unit)</label>
                <div className="relative flex items-center">
                  <span className="absolute z-10 font-bold text-gray-500 left-4">₹</span>
                  <input
                    type="number"
                    min="0"
                    disabled={isViewOnly}
                    value={editedItem.offeredPrice === "" ? "" : editedItem.offeredPrice}
                    onChange={(e) => {
                      setIsPriceManuallyEdited(true);
                      setEditedItem({...editedItem, offeredPrice: e.target.value});
                    }}
                    className="w-full py-3 pl-8 pr-4 text-lg font-bold text-blue-700 transition-colors border-2 border-blue-200 rounded-lg outline-none bg-blue-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100 disabled:border-gray-300 disabled:text-gray-600"
                  />
                </div>
                {isPriceManuallyEdited && (
                  <div className="mt-2 text-xs text-amber-600 flex justify-end">
                    <button 
                      onClick={() => {
                        setIsPriceManuallyEdited(false);
                        setEditedItem({...editedItem, offeredPrice: computedBasePrice});
                      }}
                      className="hover:underline"
                    >
                      Reset to Base (₹{computedBasePrice.toFixed(2)})
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-gray-200">
                <div className="flex justify-between items-center text-gray-600 text-sm mb-2">
                   <span>Item Total</span>
                   <span>{editedItem.quantity || 0} x ₹{Number(editedItem.offeredPrice || 0).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white border border-green-200 rounded-xl shadow-sm">
                  <span className="font-bold text-gray-800 uppercase text-sm">Line Total</span>
                  <span className="text-xl font-black text-green-600">
                    ₹{((Number(editedItem.quantity) || 0) * (Number(editedItem.offeredPrice) || 0)).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white border-t border-gray-200">
              <button 
                onClick={handleSave} 
                disabled={isViewOnly}
                className="flex items-center justify-center w-full gap-2 py-3.5 text-[15px] font-medium text-white transition-colors bg-[#333333] rounded-sm hover:bg-black disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isViewOnly ? "Close View" : "Save Item Before Proceeding"} <FaCheckCircle />
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};


// 🌟 MAIN PRICING TABLE COMPONENT
const PricingTable = ({
  items = [],
  onItemChange,
  onRemoveItem,
  onAddItem, // Parent ka function jo configured product accept karega
  isViewOnly = false,
}) => {
  const [editingItem, setEditingItem] = useState(null);
  
  // 🟢 Naya State Modal Khulne ke liye
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const safeItems = Array.isArray(items) ? items : [];

  const getSelectionsSummary = (item) => {
    let summary = [];
    if (item.selectedVariant) {
      summary.push(item.selectedVariant.name || Object.values(item.selectedVariant.combination || {}).join('/'));
    }
    Object.entries(item.selectedAttributes || {}).forEach(([k,v]) => summary.push(v.value || v.label || v));
    Object.entries(item.selectedCustomFields || {}).forEach(([k,v]) => summary.push(Array.isArray(v) ? v.join(', ') : v));
    return summary.join(' | ');
  };

  return (
    <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-2xl relative">
      <div className="flex flex-col items-start justify-between gap-4 p-5 border-b border-gray-200 bg-gray-50 sm:flex-row sm:items-center">
        <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900">
          Requested Items & Pricing
          {isViewOnly && <FaLock className="text-sm text-amber-500" title="Locked (Read Only)" />}
        </h3>
        {!isViewOnly && (
          <button
            type="button"
            onClick={() => setIsPickerOpen(true)} // 🟢 Click pe seedha Picker khulega
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white transition bg-blue-600 border border-transparent rounded-lg shadow-sm hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/30"
          >
            <FaPlus /> Add Product / Upsell
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-700 whitespace-nowrap">
          <thead className="text-[11px] font-bold tracking-wider text-gray-500 uppercase border-b border-gray-200 bg-gray-50/50">
            <tr>
              <th className="px-6 py-4 rounded-tl-xl">Product Details</th>
              <th className="w-32 px-6 py-4 text-center">SKU</th>
              <th className="w-32 px-6 py-4">Quantity</th>
              <th className="w-48 px-6 py-4">Price (Offer)</th>
              <th className="w-32 px-6 py-4 text-right">Total (₹)</th>
              {!isViewOnly && <th className="w-16 px-6 py-4 text-center">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {safeItems.map((item, index) => {
              const rowKey = item._id || `temp-item-${index}`;

              // Safety check: Agar koi blank row bach gayi ho galti se, use ignore karo
              if (!item.productId && !item.name) return null;

              const clientQty = Number(item.clientQty || item.quantity || 1);
              const adminQty = Number(item.quantity || 1); 
              const clientPrice = Number(item.clientPrice || item.originalPrice || 0);
              const adminPrice = Number(item.offeredPrice || 0); 
              const lineTotal = adminQty * adminPrice;

              const isQtyChanged = clientQty !== adminQty;
              const isPriceChanged = clientPrice !== adminPrice;

              return (
                <tr key={rowKey} className="transition-colors hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div 
                      className="flex items-start gap-4 min-w-[250px] whitespace-normal cursor-pointer group"
                      onClick={() => setEditingItem(item)} // OPEN EDIT MODAL
                    >
                      {item.image || item.productId?.image || item.productId?.images?.[0] ? (
                        <img src={item.image || item.productId?.image || item.productId?.images?.[0]} alt={item.name} className="object-cover w-12 h-12 border border-gray-200 rounded-lg shadow-sm shrink-0 mix-blend-multiply group-hover:border-blue-400 transition-colors" />
                      ) : (
                        <div className="flex items-center justify-center w-12 h-12 text-gray-400 bg-gray-100 border border-gray-200 rounded-lg shrink-0 group-hover:border-blue-400 transition-colors">
                          <FaImage size={20} />
                        </div>
                      )}

                      <div className="flex flex-col w-full gap-1">
                        <div className="text-sm font-bold leading-tight text-blue-600 transition-colors group-hover:text-blue-800 flex items-center gap-2">
                          {item.name || "Unknown Product"}
                          <FaEdit className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        
                        <div className="text-[11px] text-gray-500 font-medium line-clamp-2 mt-0.5">
                          {getSelectionsSummary(item) || <span className="italic">Click to configure options</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 text-center align-middle">
                     <span className="px-2 py-1 text-xs font-bold text-gray-600 bg-gray-100 border border-gray-200 rounded-md">
                        {item.sku || item.productId?.sku || item.productId?.baseSku || "N/A"}
                     </span>
                  </td>

                  <td className="px-6 py-4 align-middle">
                    <div className="flex flex-col gap-1.5">
                      <input
                        type="number"
                        min="1"
                        disabled={isViewOnly}
                        value={item.quantity === "" ? "" : adminQty}
                        onChange={(e) => onItemChange && onItemChange(item._id, "quantity", e.target.value)}
                        className={`w-20 rounded-lg border px-3 py-2 text-sm font-bold text-gray-900 outline-none focus:ring-2 disabled:bg-transparent disabled:border-transparent disabled:px-0 transition-all ${
                          isQtyChanged && !isViewOnly ? "border-amber-400 bg-amber-50 focus:border-amber-500 focus:ring-amber-500/20" : "border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                        }`}
                      />
                    </div>
                  </td>

                  <td className="px-6 py-4 align-middle">
                    <div className="flex flex-col gap-1.5">
                      <div className="relative flex items-center w-32">
                        <span className="absolute z-10 font-medium text-gray-500 left-3">₹</span>
                        <input
                          type="number"
                          min="0"
                          disabled={isViewOnly}
                          value={item.offeredPrice === "" ? "" : adminPrice}
                          onChange={(e) => onItemChange && onItemChange(item._id, "offeredPrice", e.target.value)}
                          className={`w-full relative z-0 py-2 pl-7 pr-2 text-sm font-bold text-gray-900 transition-all outline-none rounded-lg border disabled:bg-transparent disabled:border-transparent disabled:pl-3 ${
                            isPriceChanged && !isViewOnly ? "border-emerald-400 bg-emerald-50 focus:border-emerald-500 focus:ring-emerald-500/20" : "border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                          }`}
                        />
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-base font-black text-right text-gray-900 align-middle">
                    <div className="py-2">₹ {lineTotal > 0 ? lineTotal.toLocaleString("en-IN", { maximumFractionDigits: 2 }) : "0.00"}</div>
                  </td>

                  {!isViewOnly && (
                    <td className="px-6 py-4 text-center align-middle">
                      <div>
                        <button
                          type="button"
                          onClick={() => onRemoveItem && onRemoveItem(item._id)}
                          className="p-2 text-gray-400 transition-colors rounded-lg hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                          title="Remove Item"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {safeItems.length === 0 && (
        <div className="py-12 text-center text-gray-500">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-gray-100 rounded-full">
            <FaClipboardList className="text-2xl text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-600">No items in this quotation yet.</p>
          {!isViewOnly && (
            <button
              type="button"
              onClick={() => setIsPickerOpen(true)} // 🟢 Click pe seedha Picker khulega
              className="px-6 py-2 mt-4 text-sm font-bold text-blue-700 transition-colors bg-blue-100 rounded-lg hover:bg-blue-200"
            >
              Add Your First Product
            </button>
          )}
        </div>
      )}

      {/* 🟢 NAYA PRODUCT PICKER MODAL */}
      <ProductPickerModal 
         isOpen={isPickerOpen}
         onClose={() => setIsPickerOpen(false)}
         onAddProduct={(configuredProduct) => {
            onAddItem(configuredProduct); // Passes configured product directly to Parent!
         }}
      />

      {/* EDIT MODAL OUTSIDE TABLE */}
      <EditOptionsModal 
        item={editingItem} 
        isOpen={!!editingItem} 
        onClose={() => setEditingItem(null)}
        isViewOnly={isViewOnly}
        onSave={(itemId, updatedFields) => {
           onItemChange(itemId, updatedFields);
        }}
      />
    </div>
  );
};

export default PricingTable;
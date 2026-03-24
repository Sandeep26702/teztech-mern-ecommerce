import { useState, useEffect, useCallback, useRef, Fragment } from 'react';
import { FaTimes, FaTrash, FaDownload, FaSearch } from 'react-icons/fa';
import api from '../../utils/api';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const CreateManualQuotationModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    userDetails: { name: '', phone: '', email: '', company: '' },
    items: [],
    shippingCharge: 0,
    additionalChargeName: '',
    additionalChargeAmount: 0,
    gstPercentage: 0,
  });
  const [_shareLink, setShareLink] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const searchRef = useRef();
  const debounceRef = useRef();
  const printRef = useRef(null);

  // Debounced search
  const debouncedSearch = useCallback((query) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (query.length < 2) {
        setSearchResults([]);
        return;
      }
      try {
        const res = await api.get(`/products?q=${encodeURIComponent(query)}&limit=10`);
        setSearchResults(res.data.products || []);
      } catch (err) {
        console.error('Search error:', err);
      }
    }, 300);
  }, []);

  useEffect(() => {
    debouncedSearch(searchQuery);
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery, debouncedSearch]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    return () => document.body.style.overflow = 'unset';
  }, [isOpen]);

  const updateTotal = useCallback(() => {
    const { items, shippingCharge, additionalChargeAmount, gstPercentage } = formData;
    const safeShipping = Number.isFinite(Number(shippingCharge)) ? Number(shippingCharge) : 0;
    const safeAdditional = Number.isFinite(Number(additionalChargeAmount)) ? Number(additionalChargeAmount) : 0;
    const safeGst = Number.isFinite(Number(gstPercentage)) ? Number(gstPercentage) : 0;
    const subtotal = items.reduce((sum, item) => sum + (Number(item.offeredPrice) * Number(item.quantity)), 0);
    const gstAmount = Math.round(subtotal * (safeGst / 100) * 100) / 100;
    const total = subtotal + gstAmount + safeShipping + safeAdditional;
    return { subtotal, gstAmount, total };
  }, [formData]);

  const { subtotal, gstAmount, total } = updateTotal();

  const getFieldKey = (field) => String(field?._id || field?.label || "");

  const getFieldLabel = (field, key) => {
    if (field?.label) return String(field.label);
    return String(key || "");
  };

  const getSelectedValue = (item, field, fieldKey) => {
    const key = fieldKey || getFieldKey(field);
    return item?.selectedCustomFields?.[key] ?? item?.selectedCustomFields?.[field?.label];
  };

  const updateItemSelection = (index, field, value, mode = "set") => {
    const key = getFieldKey(field);
    if (!key) return;
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i !== index) return item;
        const current = { ...(item.selectedCustomFields || {}) };
        if (mode === "toggle") {
          const existing = Array.isArray(current[key]) ? current[key] : [];
          const safeValue = String(value || "").trim();
          if (!safeValue) return item;
          current[key] = existing.includes(safeValue)
            ? existing.filter((v) => v !== safeValue)
            : [...existing, safeValue];
        } else {
          current[key] = value;
        }
        return { ...item, selectedCustomFields: current };
      }),
    }));
  };

  const getSelectedOptionsLines = (item) => {
    const selections = item?.selectedCustomFields || {};
    const fields = Array.isArray(item?.customFields) ? item.customFields : [];
    const lines = [];

    Object.entries(selections).forEach(([key, rawValue]) => {
      const field = fields.find(
        (f) => String(f?._id || "") === String(key) || String(f?.label || "") === String(key)
      );
      const label = getFieldLabel(field, key);
      const values = Array.isArray(rawValue) ? rawValue : [rawValue];

      values.forEach((value) => {
        const safeValue = String(value || "").trim();
        if (!safeValue) return;
        const options = Array.isArray(field?.options) ? field.options : [];
        const matched = options.find((opt) => String(opt?.label || "").trim() === safeValue);
        const adj = Number(matched?.priceAdjustment || 0);
        const adjText = adj ? ` (${adj >= 0 ? "+" : "-"}Rs ${Math.abs(adj)})` : "";
        lines.push(`${label}: ${safeValue}${adjText}`);
      });
    });

    return lines;
  };

  const addItem = (product) => {
    const newItem = {
      productId: product._id,
      name: product.name,
      sku: product.sku || '',
      image: product.image || product.images?.[0],
      customFields: Array.isArray(product.customFields) ? product.customFields : [],
      selectedCustomFields: {},
      price: product.sellingPrice || product.price || 0,
      offeredPrice: product.sellingPrice || product.price || 0,
      quantity: 1,
    };
    setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }));
    setSearchQuery('');
    setSearchResults([]);
  };

  const updateItemField = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => i === index ? { ...item, [field]: value } : item)
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const updateField = (field, value) => {
    const path = field.split('.');
    setFormData(prev => {
      const newData = { ...prev };
      let obj = newData;
      for (let i = 0; i < path.length - 1; i++) obj = obj[path[i]];
      obj[path[path.length - 1]] = value;
      return newData;
    });
  };

  const generatePDF = async () => {
    const element = printRef.current;
    if (!element) return;

    const waitForImages = async (container) => {
      const images = Array.from(container.querySelectorAll('img'));
      await Promise.all(
        images.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          });
        })
      );
    };

    await waitForImages(element);
    const canvas = await html2canvas(element, {
      useCORS: true,
      allowTaint: true,
      scale: 2,
      backgroundColor: "#ffffff",
    });

    let imgData = "";
    try {
      imgData = canvas.toDataURL('image/png');
    } catch (err) {
      const fallbackCanvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: true,
        scale: 2,
        backgroundColor: "#ffffff",
        ignoreElements: (el) => el.tagName === "IMG",
      });
      imgData = fallbackCanvas.toDataURL('image/png');
    }
    const pdf = new jsPDF('p', 'pt', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position -= pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    pdf.save('quotation.pdf');
  };

  const submitQuote = async () => {
    if (formData.items.length === 0) return alert('Add at least one item');
    setSubmitting(true);
    try {
      const payload = {
        userDetails: formData.userDetails,
        requestedItems: formData.items.map((item) => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          offeredPrice: item.offeredPrice,
          selectedCustomFields: item.selectedCustomFields || {},
        })),
        shippingCharge: formData.shippingCharge,
        additionalChargeName: formData.additionalChargeName,
        additionalChargeAmount: formData.additionalChargeAmount,
        gstPercentage: formData.gstPercentage,
      };
      const res = await api.post('/quote/manual', payload);
      if (res.data.success) {
        setShareLink(res.data.shareLink);
        alert('Manual quote created! Share link copied.');
        navigator.clipboard.writeText(res.data.shareLink);
        onClose();
      }
    } catch (err) {
      alert('Failed to create quote: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl max-h-[90vh] w-full flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">Create Manual Quotation</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <FaTimes />
          </button>
        </div>
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Client Details */}
          <div className="grid grid-cols-1 gap-4 p-4 mb-6 md:grid-cols-2 bg-gray-50 rounded-xl">
            <input placeholder="Client Name *" value={formData.userDetails.name} onChange={(e) => updateField('userDetails.name', e.target.value)} className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500" />
            <input placeholder="Phone *" value={formData.userDetails.phone} onChange={(e) => updateField('userDetails.phone', e.target.value)} className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500" />
            <input placeholder="Email" value={formData.userDetails.email} onChange={(e) => updateField('userDetails.email', e.target.value)} className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500" />
            <input placeholder="Company" value={formData.userDetails.company} onChange={(e) => updateField('userDetails.company', e.target.value)} className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* Product Search & Items */}
          <div className="mb-6">
            <div className="relative mb-4">
              <FaSearch className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2" />
              <input ref={searchRef} placeholder="Search SKU or Product Name" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            {searchResults.length > 0 && (
              <div className="grid grid-cols-1 gap-3 overflow-auto bg-white border rounded-lg shadow-lg md:grid-cols-2 lg:grid-cols-3 max-h-60">
                {searchResults.map((product) => (
                  <div key={product._id} className="flex items-center gap-3 p-3 border-b cursor-pointer hover:bg-gray-50" onClick={() => addItem(product)}>
                    <img src={product.image} alt={product.name} className="object-cover w-12 h-12 rounded" />
                    <div>
                      <div className="font-semibold">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.sku}</div>
                      <div className="text-lg font-bold text-green-600">Rs. {(product.sellingPrice || product.price || 0).toFixed(0)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Items Table */}
          {formData.items.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-3 font-bold">Items ({formData.items.length})</h3>
              <div className="overflow-x-auto">
                <table className="w-full bg-white border rounded-lg shadow-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="p-3 text-left">Item</th>
                      <th className="w-20 p-3 text-right">Qty</th>
                      <th className="w-32 p-3 text-right">Price</th>
                      <th className="w-32 p-3 text-right">Total</th>
                      <th className="w-12 p-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                  {formData.items.map((item, index) => {
                    const fields = Array.isArray(item.customFields) ? item.customFields : [];
                    const optionLines = getSelectedOptionsLines(item);
                    return (
                      <Fragment key={`${item.productId || index}-block`}>
                        <tr className="border-t">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <img src={item.image} alt={item.name} className="object-cover w-8 h-8 rounded" />
                              <div>
                                <div className="font-medium">{item.name}</div>
                                <div className="text-xs text-gray-500">{item.sku}</div>
                                {optionLines.length > 0 && (
                                  <div className="mt-1 space-y-0.5">
                                    {optionLines.map((line, idx) => (
                                      <div key={`${item.productId || index}-sel-${idx}`} className="text-[11px] text-gray-500">
                                        {line}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-right">
                            <input type="number" min="1" value={item.quantity} onChange={(e) => updateItemField(index, 'quantity', Number(e.target.value))} className="w-16 p-1 text-right border rounded" />
                          </td>
                          <td className="p-3 text-right">
                            <input type="number" min="0" step="0.01" value={item.offeredPrice} onChange={(e) => updateItemField(index, 'offeredPrice', Number(e.target.value))} className="w-24 p-1 text-right border rounded" />
                          </td>
                          <td className="p-3 font-semibold text-right text-green-600">Rs. {(item.offeredPrice * item.quantity).toFixed(2)}</td>
                          <td className="p-3">
                            <button onClick={() => removeItem(index)} className="p-1 text-red-500 hover:text-red-700">
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                        <tr className="border-b bg-gray-50/70">
                          <td colSpan={5} className="p-3">
                            <div className="text-xs font-semibold text-gray-600 uppercase">Options</div>
                            {fields.length === 0 ? (
                              <div className="mt-1 text-xs text-gray-500">No options for this product.</div>
                            ) : (
                              <div className="grid grid-cols-1 gap-3 mt-2 md:grid-cols-2">
                                {fields.map((field) => {
                                  const fieldKey = getFieldKey(field);
                                  const selectedValue = getSelectedValue(item, field, fieldKey);
                                  const options = Array.isArray(field.options) ? field.options : [];

                                  return (
                                    <div key={`${item.productId || index}-${fieldKey}`} className="p-3 bg-white border rounded-lg">
                                      <div className="text-xs font-semibold text-gray-700 uppercase">{getFieldLabel(field, fieldKey)}</div>
                                      {field.type === "text" ? (
                                        <input
                                          type="text"
                                          value={selectedValue || ""}
                                          onChange={(e) => updateItemSelection(index, field, e.target.value, "set")}
                                          className="w-full p-2 mt-2 text-sm border rounded"
                                          placeholder="Enter value"
                                        />
                                      ) : field.type === "checkbox" ? (
                                        <div className="grid grid-cols-1 gap-2 mt-2">
                                          {options.map((opt) => {
                                            const optLabel = String(opt.label || "").trim();
                                            const selectedValues = Array.isArray(selectedValue) ? selectedValue : [];
                                            const isChecked = selectedValues.includes(optLabel);
                                            const adj = Number(opt.priceAdjustment || 0);
                                            const adjText = adj ? ` (${adj >= 0 ? "+" : "-"}Rs ${Math.abs(adj)})` : "";

                                            return (
                                              <label key={optLabel} className="flex items-center gap-2 text-sm text-gray-700">
                                                <input
                                                  type="checkbox"
                                                  checked={isChecked}
                                                  onChange={() => updateItemSelection(index, field, optLabel, "toggle")}
                                                />
                                                <span>{optLabel}{adjText}</span>
                                              </label>
                                            );
                                          })}
                                        </div>
                                      ) : (
                                        <div className="grid grid-cols-1 gap-2 mt-2">
                                          {options.map((opt) => {
                                            const optLabel = String(opt.label || "").trim();
                                            const adj = Number(opt.priceAdjustment || 0);
                                            const adjText = adj ? ` (${adj >= 0 ? "+" : "-"}Rs ${Math.abs(adj)})` : "";
                                            return (
                                              <label key={optLabel} className="flex items-center gap-2 text-sm text-gray-700">
                                                <input
                                                  type="radio"
                                                  name={`item-${index}-${fieldKey}`}
                                                  checked={selectedValue === optLabel}
                                                  onChange={() => updateItemSelection(index, field, optLabel, "set")}
                                                />
                                                <span>{optLabel}{adjText}</span>
                                              </label>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </td>
                        </tr>
                      </Fragment>
                    );
                  })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Charges */}
          <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 bg-gray-50 rounded-xl">
            <div>
              <label>GST (%)</label>
              <input type="number" min="0" max="100" step="0.01" value={formData.gstPercentage} onChange={(e) => updateField('gstPercentage', Number(e.target.value))} className="w-full p-3 mt-1 border rounded-lg" />
            </div>
            <div>
              <label>Shipping Charge</label>
              <input type="number" min="0" step="0.01" value={formData.shippingCharge} onChange={(e) => updateField('shippingCharge', Number(e.target.value))} className="w-full p-3 mt-1 border rounded-lg" />
            </div>
            <div>
              <label>Additional Charge Name</label>
              <input type="text" value={formData.additionalChargeName} onChange={(e) => updateField('additionalChargeName', e.target.value)} className="w-full p-3 mt-1 placeholder-gray-500 border rounded-lg" placeholder="e.g. Installation" />
            </div>
            <div>
              <label>Additional Charge Amount</label>
              <input type="number" min="0" step="0.01" value={formData.additionalChargeAmount} onChange={(e) => updateField('additionalChargeAmount', Number(e.target.value))} className="w-full p-3 mt-1 border rounded-lg" />
            </div>
          </div>

          {/* Totals */}
          <div className="p-4 mt-6 border bg-emerald-50 rounded-xl">
            <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2 lg:grid-cols-4">
              <div>Subtotal: <strong>Rs. {subtotal.toFixed(2)}</strong></div>
              <div>GST ({formData.gstPercentage.toFixed(2)}%): <strong>Rs. {gstAmount.toFixed(2)}</strong></div>
              {formData.additionalChargeName && <div>{formData.additionalChargeName}: <strong>Rs. {formData.additionalChargeAmount.toFixed(2)}</strong></div>}
              <div>Shipping: <strong>Rs. {formData.shippingCharge.toFixed(2)}</strong></div>
              <div className="text-right md:col-span-2 lg:col-span-1">
                <div className="text-2xl font-bold text-emerald-700">Grand Total: Rs. {total.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute pointer-events-none opacity-0 -left-[9999px] top-0">
          <div ref={printRef} className="w-[794px] p-8 text-gray-900 bg-white">
            <div className="flex items-center justify-between pb-4 mb-4 border-b">
              <div>
                <h1 className="text-2xl font-bold">Tez Tech Quotation</h1>
                <p className="text-sm text-gray-600">Date: {new Date().toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">Client: {formData.userDetails.name || "-"}</p>
                <p className="text-sm text-gray-600">Phone: {formData.userDetails.phone || "-"}</p>
              </div>
            </div>

            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-sm uppercase border-b">
                  <th className="p-2">Thumbnail</th>
                  <th className="p-2">Item Name</th>
                  <th className="p-2 text-right">Qty</th>
                  <th className="p-2 text-right">Price</th>
                  <th className="p-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {formData.items.map((item, index) => (
                  <tr key={`pdf-${item.productId || index}`} className="border-b">
                    <td className="p-2">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          crossOrigin="anonymous"
                          className="object-cover w-12 h-12 rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded" />
                      )}
                    </td>
                    <td className="p-2">
                      <div className="font-medium">{item.name}</div>
                      {item.sku && <div className="text-xs text-gray-500">{item.sku}</div>}
                      {getSelectedOptionsLines(item).length > 0 && (
                        <div className="mt-1 space-y-0.5">
                          {getSelectedOptionsLines(item).map((line, idx) => (
                            <div key={`pdf-opt-${index}-${idx}`} className="text-[11px] text-gray-500">
                              {line}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="p-2 text-right">{item.quantity}</td>
                    <td className="p-2 text-right">Rs. {Number(item.offeredPrice || 0).toFixed(2)}</td>
                    <td className="p-2 text-right">Rs. {(Number(item.offeredPrice || 0) * Number(item.quantity || 0)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="grid grid-cols-1 gap-2 mt-4 text-sm">
              <div className="flex justify-between">
                <span>Sub-Total:</span>
                <span className="font-semibold">Rs. {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>GST ({formData.gstPercentage}%):</span>
                <span className="font-semibold">Rs. {gstAmount.toFixed(2)}</span>
              </div>
              {formData.additionalChargeName && (
                <div className="flex justify-between">
                  <span>{formData.additionalChargeName}:</span>
                  <span className="font-semibold">Rs. {Number(formData.additionalChargeAmount || 0).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span className="font-semibold">Rs. {Number(formData.shippingCharge || 0).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between pt-2 mt-2 border-t">
                <span className="text-base font-bold">Grand Total:</span>
                <span className="text-base font-bold">Rs. {total.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 mt-6 border-t">
              <div className="text-sm">
                <p className="font-semibold">Bank Details</p>
                <p>Bank: Tez Tech</p>
                <p>A/C: XXXXXXXXXXXX</p>
                <p>IFSC: XXXXXXXX</p>
                <p>UPI: teztech@upi</p>
              </div>
              <img
                src={`${window.location.origin}/upi-qr-placeholder.svg`}
                alt="UPI QR"
                crossOrigin="anonymous"
                className="w-28 h-28"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button onClick={generatePDF} className="flex items-center gap-2 px-6 py-3 font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700">
            <FaDownload /> Download PDF
          </button>
          <button onClick={submitQuote} disabled={submitting || formData.items.length === 0} className="flex items-center gap-2 px-8 py-3 font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-50">
            {submitting ? 'Creating...' : 'Save & Share'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateManualQuotationModal;

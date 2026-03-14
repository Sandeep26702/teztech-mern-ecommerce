import { useState, useEffect, useCallback, useRef } from 'react';
import { FaTimes, FaPlus, FaTrash, FaDownload, FaCopy, FaSearch } from 'react-icons/fa';
import api from '../../../utils/api';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const CreateManualQuotationModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    clientDetails: { name: '', phone: '', email: '', company: '' },
    items: [],
    shippingCharge: 0,
    additionalChargeName: '',
    additionalChargeAmount: 0,
    gstPercentage: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const searchRef = useRef();
  const debounceRef = useRef();

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
    const subtotal = items.reduce((sum, item) => sum + (item.offeredPrice * item.quantity), 0);
    const gstAmount = Math.round(subtotal * (gstPercentage / 100) * 100) / 100;
    const total = subtotal + gstAmount + shippingCharge + additionalChargeAmount;
    return { subtotal, gstAmount, total };
  }, [formData]);

  const { subtotal, gstAmount, total } = updateTotal();

  const addItem = (product) => {
    const newItem = {
      productId: product._id,
      name: product.name,
      sku: product.sku || '',
      image: product.image || product.images?.[0],
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
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head><title>Quotation</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .table th { background-color: #f2f2f2; }
            .totals { margin: 20px 0; }
            .footer { margin-top: 40px; text-align: center; }
            .qr { display: inline-block; margin: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Tez Tech Quotation</h1>
            <p>QT-${new Date().toLocaleDateString()}</p>
            <p>Client: ${formData.clientDetails.name}<br>Phone: ${formData.clientDetails.phone}</p>
          </div>
          <table class="table">
            <thead>
              <tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>
            </thead>
            <tbody>
              ${formData.items.map(item => `<tr>
                <td>${item.name} (${item.sku})</td>
                <td>${item.quantity}</td>
                <td>Rs. ${item.offeredPrice.toFixed(2)}</td>
                <td>Rs. ${(item.offeredPrice * item.quantity).toFixed(2)}</td>
              </tr>`).join('')}
            </tbody>
          </table>
          <div class="totals">
            <p>Subtotal: Rs. ${subtotal.toFixed(2)}</p>
            <p>GST (${formData.gstPercentage}%): Rs. ${gstAmount.toFixed(2)}</p>
            ${formData.additionalChargeName ? `<p>${formData.additionalChargeName}: Rs. ${formData.additionalChargeAmount.toFixed(2)}</p>` : ''}
            <p>Shipping: Rs. ${formData.shippingCharge.toFixed(2)}</p>
            <p><strong>Grand Total: Rs. ${total.toFixed(2)}</strong></p>
          </div>
          <div class="footer">
            <div class="qr">[UPI QR PLACEHOLDER]</div>
            <p>Bank: [Details]<br>Thank you for your business!</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = () => {
      html2canvas(printWindow.document.body).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF();
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('quotation.pdf');
      });
      printWindow.close();
    };
  };

  const submitQuote = async () => {
    if (formData.items.length === 0) return alert('Add at least one item');
    setSubmitting(true);
    try {
      const res = await api.post('/quote/manual', formData);
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
            <input placeholder="Client Name *" value={formData.clientDetails.name} onChange={(e) => updateField('clientDetails.name', e.target.value)} className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500" />
            <input placeholder="Phone *" value={formData.clientDetails.phone} onChange={(e) => updateField('clientDetails.phone', e.target.value)} className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500" />
            <input placeholder="Email" value={formData.clientDetails.email} onChange={(e) => updateField('clientDetails.email', e.target.value)} className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500" />
            <input placeholder="Company" value={formData.clientDetails.company} onChange={(e) => updateField('clientDetails.company', e.target.value)} className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500" />
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
                    {formData.items.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <img src={item.image} alt={item.name} className="object-cover w-8 h-8 rounded" />
                            <div>
                              <div className="font-medium">{item.name}</div>
                              <div className="text-xs text-gray-500">{item.sku}</div>
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
                    ))}
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

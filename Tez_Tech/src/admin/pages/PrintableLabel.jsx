import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { getApiUrl } from '../../utils/api'; // Assuming this exists or using full URL if needed

const PrintableLabel = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [labelData, setLabelData] = useState({
    trackingNoText: 'Tracking No.',
    trackingBarcode: '[ Barcode Here ]',
    logisticName: 'TIRUPATI SURFACE',
    packageId: 'PKG-00000',
    deliveryBranch: '',
    expectedShipmentDate: '',
    hwl: '',
    weight: '',
    packingBy: '',
    orderBy: '',
    orderDate: '',
    packageDate: '',
    salesOrder: '',
    totalQty: '0.00',
    shippingAddress: '',
    bill: 'Y',
    eWay: 'N',
    packageCreateBy: 'KARMAKSH',
    items: []
  });

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const config = { headers: { Authorization: `Bearer ${token}` } };
        // Trying relative to getApiUrl(), fallback to hardcoded if not matching
        const API_URL = typeof getApiUrl === 'function' ? getApiUrl() : 'https://sonani-backend.onrender.com/api';
        
        const res = await axios.get(`${API_URL}/admin/orders/${id}`, config);
        
        if (res.data.success) {
          const order = res.data.order;
          
          // Format Address
          const s = order.shippingInfo || {};
          const addressLines = [
            s.fullName,
            s.companyName,
            s.address,
            s.city && s.state ? `${s.city}, ${s.state}` : (s.city || s.state),
            s.zipCode || s.pincode ? `Pincode - ${s.zipCode || s.pincode}` : '',
            'India',
            s.phone
          ].filter(Boolean).join('\n');

          // Calculate total Qty
          let totalQ = 0;
          const formattedItems = (order.items || []).map((item, index) => {
            totalQ += Number(item.quantity || 0);
            
            // Handle SKU extraction properly even if it was saved as "N/A"
            let finalSku = item.sku;
            if (!finalSku || finalSku === "N/A") {
              finalSku = item.variant?.sku || item.productId?.sku || item.productId?.baseSku || '';
            }

            return {
              no: index + 1,
              name: item.productName || item.name || '',
              sku: finalSku,
              verifyBy: '',
              qty: Number(item.quantity || 0).toFixed(2)
            };
          });

          setLabelData({
            trackingNoText: 'Tracking No.',
            trackingBarcode: '[ Barcode Here ]',
            logisticName: order.courierPartner || 'TIRUPATI SURFACE',
            packageId: `PKG-${order.orderNumber || order._id.slice(-5)}`,
            deliveryBranch: '',
            expectedShipmentDate: formatDate(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)), // default +2 days
            hwl: '',
            weight: '',
            packingBy: '',
            orderBy: s.fullName || '',
            orderDate: formatDate(order.createdAt),
            packageDate: formatDate(new Date()),
            salesOrder: order.orderCode || `${order.orderNumber || ''}`,
            totalQty: totalQ.toFixed(2),
            shippingAddress: addressLines,
            bill: 'Y',
            eWay: 'N',
            packageCreateBy: 'KARMAKSH',
            items: formattedItems
          });
        }
      } catch (error) {
        console.error("Error fetching order for label:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrder();
    } else {
      setLoading(false);
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLabelData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...labelData.items];
    newItems[index][field] = value;
    setLabelData(prev => ({ ...prev, items: newItems }));
  };

  if (loading) {
    return <div className="p-10 text-center">Loading label data...</div>;
  }

  // Common input classes to look like plain text
  const inputBase = "w-full bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 outline-none p-0 m-0 transition-colors";

  return (
    <div className="w-full min-h-screen bg-gray-100 p-4 flex flex-col items-center print:bg-white print:p-0">
      
      {/* Print Button (Hidden in print) */}
      <div className="mb-4 print:hidden flex gap-4">
        <button 
          onClick={() => window.print()}
          className="px-6 py-2 bg-blue-600 text-white font-bold rounded shadow hover:bg-blue-700"
        >
          Print Label
        </button>
      </div>

      {/* Label Container: A4 or custom size. Added margin and print borders. */}
      <div className="bg-white text-black font-sans w-full max-w-3xl border-2 border-gray-500 print:border-black print:border-2 shadow-sm print:shadow-none relative print:m-4 p-5 print:p-5" id="print-label">
        {/* Inner Border Container */}
        <div className="border border-gray-500 print:border-black print:border h-full flex flex-col">
          
        {/* TOP SECTION */}
        <div className="flex flex-col sm:flex-row border-b border-gray-300">
          
          {/* Top Left Box */}
          <div className="w-full sm:w-1/4 border-b sm:border-b-0 sm:border-r border-gray-300 p-4 flex flex-col items-center justify-center text-center">
            <input name="trackingNoText" value={labelData.trackingNoText} onChange={handleChange} className={`${inputBase} font-semibold mb-2 text-center`} />
            <input name="trackingBarcode" value={labelData.trackingBarcode} onChange={handleChange} className={`${inputBase} mb-2 text-center`} />
            <textarea name="logisticName" value={labelData.logisticName} onChange={handleChange} rows="2" className={`${inputBase} font-bold text-lg tracking-wide uppercase text-center resize-none`} />
          </div>
          
          {/* Top Middle & Right Area */}
          <div className="w-full sm:w-3/4 flex flex-col">
            
            {/* Row 1 */}
            <div className="flex flex-col sm:flex-row border-b border-gray-300">
              <div className="w-full sm:w-2/3 border-b sm:border-b-0 sm:border-r border-gray-300 p-2 flex flex-col justify-center">
                <div className="text-gray-600 text-sm">LOGISTIC NAME:-</div>
                <input name="logisticName" value={labelData.logisticName} onChange={handleChange} className={`${inputBase} font-bold text-lg uppercase`} />
              </div>
              <div className="w-full sm:w-1/3 p-2 flex flex-col justify-center">
                <div className="text-gray-600 text-sm">Package:-</div>
                <input name="packageId" value={labelData.packageId} onChange={handleChange} className={`${inputBase} font-medium text-sm`} />
              </div>
            </div>

            {/* Row 2 */}
            <div className="flex flex-col sm:flex-row border-b border-gray-300">
              <div className="w-full sm:w-2/3 border-b sm:border-b-0 sm:border-r border-gray-300 p-2 flex flex-col justify-center">
                <div className="text-gray-600 text-sm">DELIVERY BRANCH:</div>
                <input name="deliveryBranch" value={labelData.deliveryBranch} onChange={handleChange} className={`${inputBase} font-semibold text-lg mt-1`} />
              </div>
              <div className="w-full sm:w-1/3 p-2 flex flex-col justify-center">
                <div className="text-gray-600 text-sm leading-tight">Expected Shipment<br/>Date:-</div>
                <input name="expectedShipmentDate" value={labelData.expectedShipmentDate} onChange={handleChange} className={`${inputBase} font-medium text-sm`} />
              </div>
            </div>

            {/* Row 3 */}
            <div className="flex flex-col sm:flex-row border-b border-gray-300">
              <div className="w-full sm:w-2/3 border-b sm:border-b-0 sm:border-r border-gray-300 p-2 flex flex-col justify-center">
                <div className="flex items-center text-sm">
                  <span className="whitespace-nowrap">H*W*L-<span className="font-bold text-base">cm</span>:-</span>
                  <input name="hwl" value={labelData.hwl} onChange={handleChange} className={`${inputBase} ml-1 flex-1`} />
                </div>
                <div className="flex items-center text-sm mt-1">
                  <span className="whitespace-nowrap">Weight-<span className="font-bold text-base">Kg</span>:-</span>
                  <input name="weight" value={labelData.weight} onChange={handleChange} className={`${inputBase} ml-1 flex-1`} />
                </div>
              </div>
              <div className="w-full sm:w-1/3 p-2">
                <div className="font-bold text-[11px] leading-tight">Parcel Ready for<br/>Shipment ? <span className="border-b border-gray-400 inline-block w-8"></span></div>
                <div className="font-bold text-[11px] leading-tight mt-1">All Details Verified<br/>By: <span className="border-b border-gray-400 inline-block w-8"></span></div>
              </div>
            </div>

            {/* Row 4 */}
            <div className="flex flex-col sm:flex-row">
              <div className="w-full sm:w-2/3 border-b sm:border-b-0 sm:border-r border-gray-300 p-2 flex items-center">
                <span className="text-sm whitespace-nowrap">Packing By:-</span>
                <input name="packingBy" value={labelData.packingBy} onChange={handleChange} className={`${inputBase} ml-1 text-sm flex-1`} />
              </div>
              <div className="w-full sm:w-1/3 p-2 flex items-center">
                <span className="text-sm whitespace-nowrap">Order By:- </span>
                <input name="orderBy" value={labelData.orderBy} onChange={handleChange} className={`${inputBase} ml-1 text-sm flex-1 uppercase`} />
              </div>
            </div>
            
          </div>
        </div>

        {/* STATS STRIP */}
        <div className="flex border-b border-gray-300 text-sm">
          <div className="flex-1 p-2 border-r border-gray-300">
            <div className="text-xs text-gray-600 mb-1">Order Date</div>
            <input name="orderDate" value={labelData.orderDate} onChange={handleChange} className={`${inputBase} text-sm`} />
          </div>
          <div className="flex-1 p-2 border-r border-gray-300">
            <div className="text-xs text-gray-600 mb-1">Package Date</div>
            <input name="packageDate" value={labelData.packageDate} onChange={handleChange} className={`${inputBase} text-sm`} />
          </div>
          <div className="w-12 p-1 border-r border-gray-300 flex flex-col items-center justify-center text-[10px] text-gray-400 font-bold">
            <div>FB</div>
            <div>DC</div>
          </div>
          <div className="flex-1 p-2 border-r border-gray-300">
            <div className="text-xs text-gray-600 mb-1">Sales Order</div>
            <input name="salesOrder" value={labelData.salesOrder} onChange={handleChange} className={`${inputBase} text-sm`} />
          </div>
          <div className="flex-1 p-2">
            <div className="text-xs text-gray-600 mb-1">Total Qty</div>
            <input name="totalQty" value={labelData.totalQty} onChange={handleChange} className={`${inputBase} text-sm`} />
          </div>
        </div>

        {/* ADDRESS & BILL INFO */}
        <div className="flex flex-col sm:flex-row border-b border-gray-300">
          {/* Address */}
          <div className="w-full sm:w-[60%] border-b sm:border-b-0 sm:border-r border-gray-300 p-4">
            <h2 className="font-bold text-lg mb-1">Shipping Address</h2>
            <textarea 
              name="shippingAddress" 
              value={labelData.shippingAddress} 
              onChange={handleChange} 
              rows="8"
              className={`${inputBase} font-bold text-base leading-tight uppercase w-full resize-none`} 
            />
          </div>
          {/* Bill info */}
          <div className="w-full sm:w-[40%] p-4 flex flex-col items-center justify-center text-gray-500 text-sm font-semibold">
            <div className="flex items-center gap-1">Bill:- <input name="bill" value={labelData.bill} onChange={handleChange} className={`${inputBase} w-10 text-center uppercase`} /></div>
            <div className="flex items-center gap-1 mt-1">E Way :- <input name="eWay" value={labelData.eWay} onChange={handleChange} className={`${inputBase} w-10 text-center uppercase`} /></div>
          </div>
        </div>

        {/* ITEMS TABLE */}
        <div className="border-b border-gray-300 w-full">
          <table className="w-full text-sm text-left">
            <thead className="border-b border-gray-300 text-[11px] text-center font-bold bg-gray-50 print:bg-white">
              <tr>
                <th className="p-2 border-r border-gray-300 w-10">No</th>
                <th className="p-2 border-r border-gray-300 text-left">Item Name</th>
                <th className="p-2 border-r border-gray-300 w-28">SKU</th>
                <th className="p-2 border-r border-gray-300 w-20">Verify By</th>
                <th className="p-2 w-16">QTY</th>
              </tr>
            </thead>
            <tbody className="text-center text-[12px]">
              {labelData.items.map((item, index) => (
                <tr key={index} className="border-b border-gray-200 last:border-0">
                  <td className="p-1 border-r border-gray-300">
                    <input value={item.no} onChange={(e) => handleItemChange(index, 'no', e.target.value)} className={`${inputBase} text-center w-full`} />
                  </td>
                  <td className="p-1 border-r border-gray-300 text-left">
                    <textarea value={item.name} onChange={(e) => handleItemChange(index, 'name', e.target.value)} rows="2" className={`${inputBase} w-full uppercase resize-none leading-tight`} />
                  </td>
                  <td className="p-1 border-r border-gray-300">
                    <input value={item.sku} onChange={(e) => handleItemChange(index, 'sku', e.target.value)} className={`${inputBase} text-center w-full`} />
                  </td>
                  <td className="p-1 border-r border-gray-300">
                    <input value={item.verifyBy} onChange={(e) => handleItemChange(index, 'verifyBy', e.target.value)} className={`${inputBase} text-center w-full`} />
                  </td>
                  <td className="p-1">
                    <input value={item.qty} onChange={(e) => handleItemChange(index, 'qty', e.target.value)} className={`${inputBase} text-center w-full`} />
                  </td>
                </tr>
              ))}
              {labelData.items.length === 0 && (
                <tr><td colSpan="5" className="p-4 text-center text-gray-500">No items found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER */}
        <div className="p-4">
          <div className="mb-4 text-sm flex items-center">
            <span className="whitespace-nowrap">Package Create By:-</span>
            <input name="packageCreateBy" value={labelData.packageCreateBy} onChange={handleChange} className={`${inputBase} ml-1 font-semibold uppercase flex-1`} />
          </div>
          <div className="font-bold text-sm mb-2">Term & Condition:</div>
          <div className="text-[12px] leading-tight space-y-2 text-gray-800">
            <p>
              <span className="font-bold">1. Parcel Queries:</span><br/>
              For any inquiries related to the contents, condition, or delivery of your parcel, please<br/>
              contact the customer service team for assistance.
            </p>
            <p>
              <span className="font-bold">2. Parcel Tracking Queries:</span><br/>
              If you have any questions or need assistance with tracking your parcel, please reach out<br/>
              to the tracking support team for updates and support.
            </p>
          </div>
        </div>
        
        </div> {/* End of Inner Border Container */}
      </div>

      {/* Tailwind utility classes for printing */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: auto; margin: 0mm; }
          body {
            margin: 0;
            padding: 0;
            background-color: white;
            -webkit-print-color-adjust: exact;
          }
          /* Hide everything outside of print area */
          body * {
            visibility: hidden;
          }
          #print-label, #print-label * {
            visibility: visible;
          }
          #print-label {
            position: relative;
            width: calc(100% - 32px);
            margin: 16px;
            box-sizing: border-box;
          }
          input, textarea {
            border: none !important;
            resize: none !important;
            overflow: hidden !important;
          }
        }
      `}} />
    </div>
  );
};

export default PrintableLabel;

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { getApiUrl } from '../../utils/api';

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));

const numberToWords = (num) => {
  if (num === 0) return "Zero";
  const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  
  const inWords = (n) => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " and " + inWords(n % 100) : "");
    if (n < 100000) return inWords(Math.floor(n / 1000)) + " Thousand" + (n % 1000 !== 0 ? " " + inWords(n % 1000) : "");
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + " Lakh" + (n % 100000 !== 0 ? " " + inWords(n % 100000) : "");
    return inWords(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 !== 0 ? " " + inWords(n % 10000000) : "");
  };

  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  
  let text = "Indian Rupee " + inWords(rupees);
  if (paise > 0) {
    text += " and " + inWords(paise) + " Paise";
  }
  return text + " Only";
};

const PrintablePackDocs = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [invoiceData, setInvoiceData] = useState(null);
  const [labelData, setLabelData] = useState(null);

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
        const API_URL = typeof getApiUrl === 'function' ? getApiUrl() : 'https://sonani-backend.onrender.com/api';
        
        const res = await axios.get(`${API_URL}/admin/orders/${id}`, config);
        
        if (res.data.success) {
          const order = res.data.order;
          
          // --- Setup Invoice Data ---
          const displayId = order.orderCode || `SE/26-27/00${order.orderNumber || '097'}`;
          const formattedDate = new Date(order.createdAt).toLocaleDateString("en-GB");
          
          const igstRate = 18;
          let baseSubtotal = 0;
          let totalIgstAmt = 0;

          const processedInvoiceItems = (order.items?.length ? order.items : []).map(item => {
            const qty = item.quantity || 1;
            const inclusiveRate = item.price || 0;
            const baseRate = inclusiveRate / (1 + (igstRate / 100));
            const itemIgstAmt = (inclusiveRate - baseRate) * qty;
            const itemAmount = inclusiveRate * qty;
            
            baseSubtotal += (baseRate * qty);
            totalIgstAmt += itemIgstAmt;
            
            return {
              name: item.productName || item.name,
              hsn: item.hsnCode || '85340000',
              qty: String(qty),
              rate: formatCurrency(baseRate),
              igstPct: '18%',
              igstAmt: formatCurrency(itemIgstAmt),
              amount: formatCurrency(itemAmount)
            };
          });

          const totalItemsInclusive = baseSubtotal + totalIgstAmt;
          const inclusiveShipping = order.totalAmount > totalItemsInclusive ? order.totalAmount - totalItemsInclusive : (order.shippingAmount || 0);
          const baseShipping = inclusiveShipping / (1 + (igstRate / 100));
          const shippingIgst = inclusiveShipping - baseShipping;

          totalIgstAmt += shippingIgst;
          const grandTotal = baseSubtotal + baseShipping + totalIgstAmt;

          setInvoiceData({
            invoiceId: displayId,
            invoiceDate: formattedDate,
            dueDate: formattedDate,
            poNumber: order.poNumber || '-',
            placeOfSupply: `${order.shippingInfo?.state || "Maharashtra"} (27)`,
            logistic: order.courierPartner || order.shippingMethod || "TIRUPATI SURFACE",
            
            billToName: order.billingInfo?.fullName || order.shippingInfo?.fullName || "Guest",
            billToCompany: order.billingInfo?.companyName || order.shippingInfo?.companyName || "",
            billToAddress: order.billingInfo?.address || order.shippingInfo?.address || "",
            billToCityState: `${order.billingInfo?.city || order.shippingInfo?.city || ""}, ${order.billingInfo?.state || order.shippingInfo?.state || ""}`,
            billToZipCountry: `${order.billingInfo?.pincode || order.shippingInfo?.pincode || ""} ${order.billingInfo?.country || order.shippingInfo?.country || "India"}`,
            billToPhone: `Phone: ${order.billingInfo?.phone || order.shippingInfo?.phone || "N/A"}`,

            shipToName: order.shippingInfo?.fullName || "Guest",
            shipToCompany: order.shippingInfo?.companyName || "",
            shipToAddress: order.shippingInfo?.address || "",
            shipToCityState: `${order.shippingInfo?.city || ""}, ${order.shippingInfo?.state || ""}`,
            shipToZipCountry: `${order.shippingInfo?.pincode || order.shippingInfo?.zipCode || ""} ${order.shippingInfo?.country || "India"}`,
            shipToPhone: `Phone: ${order.shippingInfo?.phone || "N/A"}`,

            items: processedInvoiceItems,
            subTotal: formatCurrency(baseSubtotal),
            shippingCharge: formatCurrency(baseShipping),
            igstAmount: formatCurrency(totalIgstAmt),
            total: formatCurrency(grandTotal).replace('₹', ''),
            totalWords: numberToWords(grandTotal)
          });

          // --- Setup Label Data ---
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

          let totalQ = 0;
          const processedLabelItems = (order.items || []).map((item, index) => {
            totalQ += Number(item.quantity || 0);
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
            expectedShipmentDate: formatDate(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)),
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
            items: processedLabelItems
          });
        }
      } catch (error) {
        console.error("Error fetching order pack documents:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrder();
    }
  }, [id]);

  // Trigger print dialog once loaded
  useEffect(() => {
    if (!loading && invoiceData && labelData) {
      const timer = setTimeout(() => {
        window.print();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [loading, invoiceData, labelData]);

  if (loading || !invoiceData || !labelData) {
    return <div className="p-10 text-center font-semibold text-gray-500">Loading invoice and shipping labels for packing...</div>;
  }

  const inputBase = "bg-transparent border border-transparent outline-none p-0 m-0 w-full font-inherit text-inherit resize-none";

  return (
    <div className="w-full min-h-screen bg-gray-100 p-6 flex flex-col items-center print:bg-white print:p-0">
      
      {/* Header controls (Hidden in print) */}
      <div className="mb-6 print:hidden flex gap-4 bg-white p-4 rounded-2xl shadow-sm w-full max-w-4xl justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Print Documents Queue</h2>
          <p className="text-xs text-slate-500">Order: {invoiceData.invoiceId} | Shipping Label & GST Invoice combined</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => window.print()} 
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-sm"
          >
            Re-print Documents
          </button>
          <button 
            onClick={() => window.close()} 
            className="px-5 py-2 bg-slate-200 hover:bg-slate-350 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Close Tab
          </button>
        </div>
      </div>

      <div id="print-pack-docs" className="w-full max-w-4xl flex flex-col items-center">
        
        {/* =======================================================
            PAGE 1: GST TAX INVOICE
            ======================================================= */}
        <div className="bg-white text-black font-sans w-full border border-gray-300 print:border-none shadow-sm print:shadow-none p-6 text-[10px] leading-[1.3] relative print-page mb-8">
          
          <div className="border border-black flex flex-col h-full min-h-[1000px]">
            
            {/* Header Section */}
            <div className="flex p-3 items-center">
              <div className="w-[30%] flex items-center">
                <img src="/logo.png" alt="Tez Tech Logo" className="w-48 h-auto object-contain" />
              </div>
              
              <div className="w-[45%] text-[10px]">
                <h2 className="font-bold text-[14px] uppercase tracking-wider mb-1">SONANI ELECTRONICS</h2>
                <p>E - Basement, Silver Stone Arcade</p>
                <p>Nr. D-Mart , Singanpore Causeway Road, Katargam</p>
                <p>Surat Gujarat 395004</p>
                <p>India</p>
                <p className="mt-2 font-semibold">GSTIN: 24FBIPS5304F1ZP</p>
              </div>
              
              <div className="w-[25%] text-right self-end">
                <h1 className="text-2xl tracking-wide uppercase font-semibold">TAX INVOICE</h1>
              </div>
            </div>

            {/* Invoice Info Section */}
            <div className="flex border-t border-black">
              <div className="w-1/2 flex">
                <div className="w-[30%] p-2 pl-3 text-[10px]">
                  <p>#</p>
                  <p>Invoice Date</p>
                  <p>Terms</p>
                  <p>Due Date</p>
                  <p>P.O.#</p>
                </div>
                <div className="w-[70%] p-2 text-[10px] font-bold flex flex-col gap-[2px]">
                  <div className="flex items-center gap-1">:<span className="pl-1">{invoiceData.invoiceId}</span></div>
                  <div className="flex items-center gap-1">:<span className="pl-1">{invoiceData.invoiceDate}</span></div>
                  <div className="flex items-center gap-1">:<span className="pl-1">Due On Receipt</span></div>
                  <div className="flex items-center gap-1">:<span className="pl-1">{invoiceData.dueDate}</span></div>
                  <div className="flex items-center gap-1">:<span className="pl-1">{invoiceData.poNumber}</span></div>
                </div>
              </div>
              
              <div className="w-1/2 border-l border-black flex">
                <div className="w-[30%] p-2 pl-3 text-[10px]">
                  <p>Place Of Supply</p>
                  <p>LOGISTIC</p>
                </div>
                <div className="w-[70%] p-2 text-[10px] font-bold flex flex-col gap-[2px]">
                  <div className="flex items-center gap-1">:<span className="pl-1">{invoiceData.placeOfSupply}</span></div>
                  <div className="flex items-center gap-1">:<span className="pl-1">{invoiceData.logistic}</span></div>
                </div>
              </div>
            </div>

            {/* Bill To / Ship To Header */}
            <div className="flex border-t border-black bg-[#f0f0f0] font-bold text-[10px]">
              <div className="w-1/2 p-2 pl-3 border-r border-black">Bill To</div>
              <div className="w-1/2 p-2 pl-3">Ship To</div>
            </div>

            {/* Addresses Section */}
            <div className="flex border-t border-black text-[10px]">
              <div className="w-1/2 p-3 uppercase border-r border-black flex flex-col gap-0.5">
                <p className="font-bold mb-0.5">{invoiceData.billToName}</p>
                {invoiceData.billToCompany && <p>{invoiceData.billToCompany}</p>}
                <p>{invoiceData.billToAddress}</p>
                <p>{invoiceData.billToCityState}</p>
                <p>{invoiceData.billToZipCountry}</p>
                <p>{invoiceData.billToPhone}</p>
              </div>
              <div className="w-1/2 p-3 uppercase flex flex-col gap-0.5">
                <p className="font-bold mb-0.5">{invoiceData.shipToName}</p>
                {invoiceData.shipToCompany && <p>{invoiceData.shipToCompany}</p>}
                <p>{invoiceData.shipToAddress}</p>
                <p>{invoiceData.shipToCityState}</p>
                <p>{invoiceData.shipToZipCountry}</p>
                <p>{invoiceData.shipToPhone}</p>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full border-t border-black text-[10px] border-collapse flex-1">
              <thead>
                <tr className="bg-[#f0f0f0] font-bold border-b border-black text-center">
                  <th className="p-2 border-r border-black w-[5%]">#</th>
                  <th className="p-2 border-r border-black text-left w-[35%]">Item & Description</th>
                  <th className="p-2 border-r border-black w-[10%]">HSN/SAC</th>
                  <th className="p-2 border-r border-black w-[10%]">Qty</th>
                  <th className="p-2 border-r border-black w-[10%] text-right">Rate</th>
                  <th className="p-0 border-r border-black w-[20%]">
                    <div className="border-b border-black w-full text-center py-1">IGST</div>
                    <div className="flex w-full">
                      <div className="w-1/2 border-r border-black text-center py-1">%</div>
                      <div className="w-1/2 text-center py-1">Amt</div>
                    </div>
                  </th>
                  <th className="p-2 w-[10%] text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoiceData.items.map((item, index) => (
                  <tr key={index} className="border-b border-gray-350 last:border-b-0">
                    <td className="p-2 border-r border-black text-center align-top">{index + 1}</td>
                    <td className="p-2 border-r border-black align-top font-semibold uppercase">{item.name}</td>
                    <td className="p-2 border-r border-black text-center align-top">{item.hsn}</td>
                    <td className="p-2 border-r border-black text-center align-top font-bold">{item.qty}</td>
                    <td className="p-2 border-r border-black text-right align-top">{item.rate}</td>
                    <td className="p-0 border-r border-black align-top">
                      <div className="flex h-full min-h-[30px]">
                        <div className="w-1/2 border-r border-black text-center p-2">{item.igstPct}</div>
                        <div className="w-1/2 text-right p-2">{item.igstAmt}</div>
                      </div>
                    </td>
                    <td className="p-2 text-right align-top font-semibold">{item.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Footer Section */}
            <div className="flex border-t border-black mt-auto">
              {/* Left Footer */}
              <div className="w-[60%] p-3 border-r border-black text-[9px] space-y-1">
                <p className="font-semibold text-gray-600">Total In Words</p>
                <p className="font-bold italic text-slate-800 text-[10px] mb-2">{invoiceData.totalWords}</p>
                
                <p className="font-semibold text-gray-600">Notes</p>
                <p className="mb-2 font-medium">Thanks for your business.</p>
                
                <div className="text-[8.5px] space-y-0.5 border-t border-gray-250 pt-2">
                  <p className="uppercase"><span className="font-bold">BANK NAME:</span> ICICI BANK</p>
                  <p className="uppercase"><span className="font-bold">ACC NAME:</span> SONANI ELECTRONICS</p>
                  <p className="uppercase"><span className="font-bold">ACC. NO.:</span> 340005500964</p>
                  <p className="uppercase mb-2"><span className="font-bold">IFSC CODE:</span> ICIC0003400</p>
                </div>
                
                <div className="text-[8px] leading-tight text-gray-700 space-y-0.5 border-t border-gray-200 pt-2">
                  <p className="font-bold text-[9px]">Terms & Conditions:</p>
                  <p>1. Parcel Queries: Contact customer service at 87992 66571 (10:00 to 6:00)</p>
                  <p>2. Parcel Tracking: Reach tracking support team at 88496 26867. (10:00 to 6:00)</p>
                  <p>3. Interest @36% per annum will be charged after due of the Bill.</p>
                  <p>4. Subject to SURAT Jurisdiction.</p>
                </div>
              </div>

              {/* Right Footer */}
              <div className="w-[40%] flex flex-col justify-between">
                <div className="p-3 border-b border-black text-[10px] space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Sub Total</span>
                    <span className="font-bold">Rs. {invoiceData.subTotal}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Shipping charge</span>
                    <span className="font-bold">Rs. {invoiceData.shippingCharge}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">IGST18 (18%)</span>
                    <span className="font-bold">Rs. {invoiceData.igstAmount}</span>
                  </div>
                  <div className="flex justify-between items-center font-bold text-[12px] border-t border-dashed border-gray-350 pt-2">
                    <span>Total</span>
                    <span>Rs. {invoiceData.total}</span>
                  </div>
                  <div className="flex justify-between items-center font-bold text-[12px] text-blue-800">
                    <span>Balance Due</span>
                    <span>Rs. {invoiceData.total}</span>
                  </div>
                </div>

                {/* Signature Box */}
                <div className="p-3 pt-6 flex-1 flex flex-col items-center justify-end">
                  <div className="mb-1 w-full flex justify-center">
                    <img src="/signature.png" alt="Signature" className="h-10 object-contain mx-auto" />
                  </div>
                  <div className="w-[80%] border-t border-black text-center pt-1 text-[8.5px] uppercase font-bold tracking-wider">
                    Authorized Signature
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>

        {/* Page Break for printing */}
        <div className="page-break" />

        {/* =======================================================
            PAGE 2: SHIPPING LABEL
            ======================================================= */}
        <div className="bg-white text-black font-sans w-full border border-gray-300 print:border-none shadow-sm print:shadow-none p-6 relative print-page">
          
          <div className="border-2 border-black h-full flex flex-col p-4">
            <div className="border border-black flex flex-col h-full">
              
              {/* TOP SECTION */}
              <div className="flex flex-col sm:flex-row border-b border-black">
                
                {/* Top Left Box */}
                <div className="w-full sm:w-1/4 border-b sm:border-b-0 sm:border-r border-black p-4 flex flex-col items-center justify-center text-center">
                  <span className="font-semibold text-xs mb-2 tracking-wider">{labelData.trackingNoText}</span>
                  <span className="font-mono text-sm font-bold border border-dashed border-gray-400 p-2 mb-2 w-full">{labelData.trackingBarcode}</span>
                  <span className="font-bold text-sm tracking-wide uppercase text-slate-800 leading-tight">{labelData.logisticName}</span>
                </div>
                
                {/* Top Middle & Right Area */}
                <div className="w-full sm:w-3/4 flex flex-col text-[10px]">
                  
                  {/* Row 1 */}
                  <div className="flex flex-col sm:flex-row border-b border-black">
                    <div className="w-full sm:w-2/3 border-b sm:border-b-0 sm:border-r border-black p-2 flex flex-col justify-center">
                      <div className="text-gray-500 font-bold uppercase text-[9px]">LOGISTIC NAME:</div>
                      <div className="font-bold text-sm uppercase text-slate-800">{labelData.logisticName}</div>
                    </div>
                    <div className="w-full sm:w-1/3 p-2 flex flex-col justify-center">
                      <div className="text-gray-500 font-bold text-[9px]">Package ID:</div>
                      <div className="font-semibold text-[11px]">{labelData.packageId}</div>
                    </div>
                  </div>

                  {/* Row 2 */}
                  <div className="flex flex-col sm:flex-row border-b border-black">
                    <div className="w-full sm:w-2/3 border-b sm:border-b-0 sm:border-r border-black p-2 flex flex-col justify-center">
                      <div className="text-gray-500 font-bold text-[9px]">DELIVERY BRANCH:</div>
                      <div className="font-semibold text-sm mt-1">{labelData.deliveryBranch || 'PRIMARY MAIN'}</div>
                    </div>
                    <div className="w-full sm:w-1/3 p-2 flex flex-col justify-center">
                      <div className="text-gray-500 font-bold text-[9px] leading-tight">Expected Shipment Date:</div>
                      <div className="font-medium text-xs mt-0.5">{labelData.expectedShipmentDate}</div>
                    </div>
                  </div>

                  {/* Row 3 */}
                  <div className="flex flex-col sm:flex-row border-b border-black">
                    <div className="w-full sm:w-2/3 border-b sm:border-b-0 sm:border-r border-black p-2 flex flex-col justify-center">
                      <div className="flex items-center">
                        <span className="whitespace-nowrap font-bold text-gray-500">H*W*L - cm:</span>
                        <span className="ml-2 font-semibold">{labelData.hwl || 'N/A'}</span>
                      </div>
                      <div className="flex items-center mt-1">
                        <span className="whitespace-nowrap font-bold text-gray-500">Weight - Kg:</span>
                        <span className="ml-2 font-bold">{labelData.weight || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="w-full sm:w-1/3 p-2 text-[9px] leading-tight space-y-1 font-semibold">
                      <div>Parcel Ready: <span className="border-b border-black w-8 inline-block">YES</span></div>
                      <div>Details Verified By: <span className="border-b border-black w-8 inline-block">QC-1</span></div>
                    </div>
                  </div>

                  {/* Row 4 */}
                  <div className="flex flex-col sm:flex-row">
                    <div className="w-full sm:w-2/3 border-b sm:border-b-0 sm:border-r border-black p-2 flex items-center">
                      <span className="font-bold text-gray-500 uppercase text-[9px]">Packing By:</span>
                      <span className="ml-2 font-semibold">TezTech Packing Unit</span>
                    </div>
                    <div className="w-full sm:w-1/3 p-2 flex items-center">
                      <span className="font-bold text-gray-500 uppercase text-[9px]">Order By:</span>
                      <span className="ml-2 font-bold uppercase text-slate-800">{labelData.orderBy}</span>
                    </div>
                  </div>
                  
                </div>
              </div>

              {/* STATS STRIP */}
              <div className="flex border-b border-black text-[10px]">
                <div className="flex-1 p-2 border-r border-black">
                  <div className="text-gray-500 font-semibold mb-0.5">Order Date</div>
                  <div className="font-bold">{labelData.orderDate}</div>
                </div>
                <div className="flex-1 p-2 border-r border-black">
                  <div className="text-gray-500 font-semibold mb-0.5">Package Date</div>
                  <div className="font-bold">{labelData.packageDate}</div>
                </div>
                <div className="w-12 p-1 border-r border-black flex flex-col items-center justify-center text-[9px] text-gray-400 font-bold leading-tight">
                  <div>FB</div>
                  <div>DC</div>
                </div>
                <div className="flex-1 p-2 border-r border-black">
                  <div className="text-gray-500 font-semibold mb-0.5">Sales Order</div>
                  <div className="font-bold">{labelData.salesOrder}</div>
                </div>
                <div className="flex-1 p-2">
                  <div className="text-gray-500 font-semibold mb-0.5">Total Qty</div>
                  <div className="font-bold text-sm text-blue-900">{labelData.totalQty} Units</div>
                </div>
              </div>

              {/* ADDRESS & BILL INFO */}
              <div className="flex flex-col sm:flex-row border-b border-black">
                {/* Address */}
                <div className="w-full sm:w-[65%] border-b sm:border-b-0 sm:border-r border-black p-4">
                  <h2 className="font-extrabold text-sm uppercase text-gray-500 tracking-wider mb-2">Shipping Address</h2>
                  <div className="font-bold text-base leading-tight uppercase text-slate-900 whitespace-pre-wrap">
                    {labelData.shippingAddress}
                  </div>
                </div>
                {/* Bill info */}
                <div className="w-full sm:w-[35%] p-4 flex flex-col items-center justify-center text-gray-600 text-xs font-bold space-y-1">
                  <div>Bill: <span className="text-slate-800 text-sm font-black pl-1">{labelData.bill}</span></div>
                  <div>E Way Bill: <span className="text-slate-800 text-sm font-black pl-1">{labelData.eWay}</span></div>
                </div>
              </div>

              {/* ITEMS TABLE */}
              <div className="border-b border-black w-full">
                <table className="w-full text-[10px] text-left">
                  <thead className="border-b border-black text-[9px] text-center font-bold bg-gray-55">
                    <tr>
                      <th className="p-1.5 border-r border-black w-10">No</th>
                      <th className="p-1.5 border-r border-black text-left">Item Name</th>
                      <th className="p-1.5 border-r border-black w-32">SKU</th>
                      <th className="p-1.5 border-r border-black w-24">Verify By</th>
                      <th className="p-1.5 w-20">QTY</th>
                    </tr>
                  </thead>
                  <tbody className="text-center text-[10px]">
                    {labelData.items.map((item, index) => (
                      <tr key={index} className="border-b border-gray-300 last:border-0">
                        <td className="p-1.5 border-r border-black font-semibold">{item.no}</td>
                        <td className="p-1.5 border-r border-black text-left font-bold uppercase">{item.name}</td>
                        <td className="p-1.5 border-r border-black font-mono">{item.sku}</td>
                        <td className="p-1.5 border-r border-black text-slate-400 font-semibold">{item.verifyBy || 'Verified'}</td>
                        <td className="p-1.5 font-bold text-blue-900">{item.qty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* FOOTER */}
              <div className="p-4 flex flex-col justify-between flex-1">
                <div className="mb-4 text-xs">
                  <span className="font-bold text-gray-500 uppercase text-[9px]">Package Create By:</span>
                  <span className="ml-2 font-bold uppercase text-slate-800">{labelData.packageCreateBy}</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="font-bold text-[9px] text-gray-500 uppercase mb-1">Terms & Conditions:</div>
                  <div className="text-[8.5px] leading-tight space-y-1 text-gray-600">
                    <p>1. Parcel Queries: Contact customer service for item condition or delivery support.</p>
                    <p>2. Parcel Tracking: Reach out with your package ID for carrier transit updates.</p>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .print-page {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .page-break {
          page-break-after: always;
          break-after: page;
          display: none;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            background-color: white;
            -webkit-print-color-adjust: exact;
          }
          .print-page {
            width: 100%;
            height: 100vh;
            box-sizing: border-box;
            padding: 1.5cm;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
          .page-break {
            display: block;
          }
          body * {
            visibility: hidden;
          }
          #print-pack-docs, #print-pack-docs * {
            visibility: visible;
          }
          #print-pack-docs {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}} />
    </div>
  );
};

export default PrintablePackDocs;

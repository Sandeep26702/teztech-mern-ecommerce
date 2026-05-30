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

const PrintableTaxInvoice = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [invoiceData, setInvoiceData] = useState(null);

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
          
          const displayId = order.orderCode || `SE/26-27/00${order.orderNumber || '097'}`;
          const formattedDate = new Date(order.createdAt).toLocaleDateString("en-GB");
          
          const igstRate = 18;
          let baseSubtotal = 0;
          let totalIgstAmt = 0;

          const processedItems = (order.items?.length ? order.items : []).map(item => {
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
              amount: formatCurrency(itemAmount),
              rawBaseRate: baseRate,
              rawIgstAmt: itemIgstAmt,
              rawAmount: itemAmount
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

            items: processedItems,
            
            subTotal: formatCurrency(baseSubtotal),
            shippingCharge: formatCurrency(baseShipping),
            igstAmount: formatCurrency(totalIgstAmt),
            total: formatCurrency(grandTotal).replace('₹', ''),
            totalWords: numberToWords(grandTotal)
          });
        }
      } catch (error) {
        console.error("Error fetching order for invoice:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchOrder();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInvoiceData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...invoiceData.items];
    newItems[index][field] = value;
    setInvoiceData(prev => ({ ...prev, items: newItems }));
  };

  if (loading || !invoiceData) return <div className="p-10 text-center">Loading Invoice...</div>;

  const inputBase = "bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 outline-none p-0 m-0 w-full transition-colors font-inherit text-inherit resize-none";

  return (
    <div className="w-full min-h-screen bg-gray-100 p-4 flex flex-col items-center print:bg-white print:p-0">
      
      <div className="mb-4 print:hidden flex gap-4">
        <button onClick={() => window.print()} className="px-6 py-2 bg-blue-600 text-white font-bold rounded shadow hover:bg-blue-700">
          Print Invoice
        </button>
      </div>

      <div className="bg-white text-black font-sans w-full max-w-4xl border border-gray-300 print:border-none shadow-sm print:shadow-none p-4 print:pt-16 print:px-12 text-[10px] leading-[1.3] relative" id="print-invoice">
        
        <div className="border border-black flex flex-col h-full max-h-[1050px]">
          
          {/* Header Section */}
          <div className="flex p-2 items-center">
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
              <h1 className="text-2xl tracking-wide uppercase">TAX INVOICE</h1>
            </div>
          </div>

          {/* Invoice Info Section */}
          <div className="flex border-t border-black">
            <div className="w-1/2 flex">
              <div className="w-[30%] p-1 pl-2 text-[10px]">
                <p>#</p>
                <p>Invoice Date</p>
                <p>Terms</p>
                <p>Due Date</p>
                <p>P.O.#</p>
              </div>
              <div className="w-[70%] p-1 text-[10px] font-bold flex flex-col gap-[2px]">
                <div className="flex items-center gap-1">:<input name="invoiceId" value={invoiceData.invoiceId} onChange={handleChange} className={inputBase} /></div>
                <div className="flex items-center gap-1">:<input name="invoiceDate" value={invoiceData.invoiceDate} onChange={handleChange} className={inputBase} /></div>
                <div className="flex items-center gap-1">: <span className="w-full">Due On Receipt</span></div>
                <div className="flex items-center gap-1">:<input name="dueDate" value={invoiceData.dueDate} onChange={handleChange} className={inputBase} /></div>
                <div className="flex items-center gap-1">:<input name="poNumber" value={invoiceData.poNumber} onChange={handleChange} className={inputBase} /></div>
              </div>
            </div>
            
            <div className="w-1/2 border-l border-black flex">
              <div className="w-[30%] p-1 pl-2 text-[10px]">
                <p>Place Of Supply</p>
                <p>LOGISTIC</p>
              </div>
              <div className="w-[70%] p-1 text-[10px] font-bold flex flex-col gap-[2px]">
                <div className="flex items-center gap-1">:<input name="placeOfSupply" value={invoiceData.placeOfSupply} onChange={handleChange} className={inputBase} /></div>
                <div className="flex items-center gap-1">:<input name="logistic" value={invoiceData.logistic} onChange={handleChange} className={inputBase} /></div>
              </div>
            </div>
          </div>

          {/* Bill To / Ship To Header */}
          <div className="flex border-t border-black bg-[#f0f0f0] font-bold text-[10px]" style={{ backgroundColor: '#f0f0f0' }}>
            <div className="w-1/2 p-1 pl-2 border-r border-black">Bill To</div>
            <div className="w-1/2 p-1 pl-2">Ship To</div>
          </div>

          {/* Addresses Section */}
          <div className="flex border-t border-black text-[10px]">
            <div className="w-1/2 p-2 uppercase border-r border-black flex flex-col gap-0.5">
              <input name="billToName" value={invoiceData.billToName} onChange={handleChange} className={`${inputBase} font-bold mb-0.5`} />
              <input name="billToCompany" value={invoiceData.billToCompany} onChange={handleChange} className={inputBase} />
              <input name="billToAddress" value={invoiceData.billToAddress} onChange={handleChange} className={inputBase} />
              <input name="billToCityState" value={invoiceData.billToCityState} onChange={handleChange} className={inputBase} />
              <input name="billToZipCountry" value={invoiceData.billToZipCountry} onChange={handleChange} className={inputBase} />
              <input name="billToPhone" value={invoiceData.billToPhone} onChange={handleChange} className={inputBase} />
            </div>
            <div className="w-1/2 p-2 uppercase flex flex-col gap-0.5">
              <input name="shipToName" value={invoiceData.shipToName} onChange={handleChange} className={`${inputBase} font-bold mb-0.5`} />
              <input name="shipToCompany" value={invoiceData.shipToCompany} onChange={handleChange} className={inputBase} />
              <input name="shipToAddress" value={invoiceData.shipToAddress} onChange={handleChange} className={inputBase} />
              <input name="shipToCityState" value={invoiceData.shipToCityState} onChange={handleChange} className={inputBase} />
              <input name="shipToZipCountry" value={invoiceData.shipToZipCountry} onChange={handleChange} className={inputBase} />
              <input name="shipToPhone" value={invoiceData.shipToPhone} onChange={handleChange} className={inputBase} />
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full border-t border-black text-[10px] border-collapse flex-1">
            <thead>
              <tr className="bg-[#f0f0f0] font-bold border-b border-black text-center" style={{ backgroundColor: '#f0f0f0' }}>
                <th className="p-1 border-r border-black w-[5%]">#</th>
                <th className="p-1 border-r border-black text-left w-[35%]">Item & Description</th>
                <th className="p-1 border-r border-black w-[10%]">HSN/SAC</th>
                <th className="p-1 border-r border-black w-[10%]">Qty</th>
                <th className="p-1 border-r border-black w-[10%] text-right">Rate</th>
                <th className="p-0 border-r border-black w-[20%]">
                  <div className="border-b border-black w-full text-center">IGST</div>
                  <div className="flex w-full">
                    <div className="w-1/2 border-r border-black text-center">%</div>
                    <div className="w-1/2 text-center">Amt</div>
                  </div>
                </th>
                <th className="p-1 w-[10%] text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoiceData.items.map((item, index) => (
                <tr key={index} className="border-b border-gray-300">
                  <td className="p-1 border-r border-black text-center align-top">{index + 1}</td>
                  <td className="p-1 border-r border-black align-top">
                    <textarea value={item.name} onChange={(e) => handleItemChange(index, 'name', e.target.value)} rows="2" className={`${inputBase} uppercase`} />
                  </td>
                  <td className="p-1 border-r border-black text-center align-top">
                    <input value={item.hsn} onChange={(e) => handleItemChange(index, 'hsn', e.target.value)} className={`${inputBase} text-center`} />
                  </td>
                  <td className="p-1 border-r border-black text-center align-top">
                    <input value={item.qty} onChange={(e) => handleItemChange(index, 'qty', e.target.value)} className={`${inputBase} text-center`} />
                  </td>
                  <td className="p-1 border-r border-black text-right align-top">
                    <input value={item.rate} onChange={(e) => handleItemChange(index, 'rate', e.target.value)} className={`${inputBase} text-right`} />
                  </td>
                  <td className="p-0 border-r border-black align-top">
                    <div className="flex h-full">
                      <div className="w-1/2 border-r border-black text-center p-1">
                        <input value={item.igstPct} onChange={(e) => handleItemChange(index, 'igstPct', e.target.value)} className={`${inputBase} text-center`} />
                      </div>
                      <div className="w-1/2 text-right p-1">
                        <input value={item.igstAmt} onChange={(e) => handleItemChange(index, 'igstAmt', e.target.value)} className={`${inputBase} text-right`} />
                      </div>
                    </div>
                  </td>
                  <td className="p-1 text-right align-top">
                    <input value={item.amount} onChange={(e) => handleItemChange(index, 'amount', e.target.value)} className={`${inputBase} text-right`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer Section */}
          <div className="flex border-t border-black mt-auto">
            {/* Left Footer */}
            <div className="w-[60%] p-2 border-r border-black text-[9px]">
              <p className="mb-0.5">Total In Words</p>
              <textarea name="totalWords" value={invoiceData.totalWords} onChange={handleChange} rows="2" className={`${inputBase} font-bold italic mb-2 w-full`} />
              
              <p className="mb-0.5">Notes</p>
              <p className="mb-2">Thanks for your business.</p>
              
              <p className="uppercase">BANK NAME : ICICI BANK</p>
              <p className="uppercase">ACC NAME : SONANI ELECTRONICS</p>
              <p className="uppercase">ACC. NO. : 340005500964</p>
              <p className="uppercase mb-2">IFSC CODE : ICIC0003400</p>
              
              <p className="mb-0.5">Terms & Conditions</p>
              <p>1.Parcel Queries:</p>
              <p className="mb-1">For any inquiries related to the contents, condition, or delivery of your parcel, please contact our customer service team at 87992 66571 ( 10:00 to 6:00 )</p>
              <p>2.Parcel Tracking Queries:</p>
              <p className="mb-1">If you have any questions or need assistance with tracking your parcel, please reach out to our dedicated tracking support team at 8849626867. ( 10:00 to 6:00 )</p>
              <p className="mb-1">4.Interest @36% pr annume will be charged after due of the Bill.</p>
              <p className="mb-1">5.Subject to SURAT Jurisdiction.</p>
              <p>6.Bank Detail :</p>
              <p>The varccha bank dabholi</p>
              <p>Acc name : Bisero</p>
              <p>Acc no = 01630110206463</p>
              <p>Ifsc coode : VARA0289016</p>
              <p>Ved road , dabholi branch</p>
              <p className="mb-1">Gpay no. : 8156079607</p>
              <p className="mb-1 leading-tight">Please ensure that you have your parcel order number and relevant details handy when contacting us to facilitate a quicker resolution to your query.</p>
              <p>Thank you for choosing our services.</p>
            </div>

            {/* Right Footer */}
            <div className="w-[40%] flex flex-col">
              <div className="p-2 border-b border-black text-[10px]">
                <div className="flex justify-between items-center mb-1">
                  <span>Sub Total</span>
                  <input name="subTotal" value={invoiceData.subTotal} onChange={handleChange} className={`${inputBase} text-right w-24`} />
                </div>
                <div className="flex justify-between items-center mb-1">
                  <span>Shipping charge</span>
                  <input name="shippingCharge" value={invoiceData.shippingCharge} onChange={handleChange} className={`${inputBase} text-right w-24`} />
                </div>
                <div className="flex justify-between mb-1 text-[#666] text-[8px] italic">
                  <span>(IGST18 (18%) )</span>
                  <span></span>
                </div>
                <div className="flex justify-between mb-1 text-[#666] text-[8px]">
                  <span>SAC: 996812</span>
                  <span></span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span>IGST18 (18%)</span>
                  <input name="igstAmount" value={invoiceData.igstAmount} onChange={handleChange} className={`${inputBase} text-right w-24`} />
                </div>
                <div className="flex justify-between items-center font-bold mb-1">
                  <span>Total</span>
                  <div className="flex items-center justify-end w-24">Rs.<input name="total" value={invoiceData.total} onChange={handleChange} className={`${inputBase} text-right`} /></div>
                </div>
                <div className="flex justify-between items-center font-bold text-[11px]">
                  <span>Balance Due</span>
                  <div className="flex items-center justify-end w-24">Rs.<input name="total" value={invoiceData.total} onChange={handleChange} className={`${inputBase} text-right`} /></div>
                </div>
              </div>

              {/* Signature Box */}
              <div className="p-2 pt-6 flex-1 flex flex-col items-center justify-end mt-2">
                <div className="mb-1 w-full flex justify-center">
                  <img src="/signature.png" alt="Signature" className="h-10 object-contain mx-auto" />
                </div>
                <div className="w-[60%] border-t border-black text-center pt-1 text-[9px]">
                  Authorized Signature
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { margin: 0; }
          body {
            padding: 0.5cm 1.5cm;
            background-color: white;
            -webkit-print-color-adjust: exact;
          }
          body * { visibility: hidden; }
          #print-invoice, #print-invoice * { visibility: visible; }
          #print-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            border: none;
            box-shadow: none;
          }
          input, textarea {
            border: none !important;
            resize: none !important;
            overflow: visible !important;
          }
        }
      `}} />
    </div>
  );
};

export default PrintableTaxInvoice;

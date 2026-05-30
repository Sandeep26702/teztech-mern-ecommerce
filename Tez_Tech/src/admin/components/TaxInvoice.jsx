import React from 'react';

// Basic helper to format currency
const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));

// Basic Number to Words converter for Indian Rupees
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

const TaxInvoice = React.forwardRef(({ order }, ref) => {
  if (!order) return <div ref={ref} />;

  const { shippingInfo, items, orderCode, orderNumber, createdAt, totalAmount } = order;
  const displayId = orderCode || `SE/26-27/00${orderNumber || '097'}`;
  
  const orderDateObj = new Date(createdAt);
  const formattedDate = orderDateObj.toLocaleDateString("en-GB"); // DD/MM/YYYY

  // Calculate base amounts from inclusive prices
  const igstRate = 18;
  
  let baseSubtotal = 0;
  let totalIgstAmt = 0;

  const processedItems = (items?.length ? items : [{ name: '(TTCFM526) 100 LED BELT CONTROLLER', price: 700, quantity: 1 }]).map(item => {
    const qty = item.quantity || 1;
    const inclusiveRate = item.price || 0;
    const baseRate = inclusiveRate / (1 + (igstRate / 100));
    const itemIgstAmt = (inclusiveRate - baseRate) * qty;
    const itemAmount = inclusiveRate * qty;
    
    baseSubtotal += (baseRate * qty);
    totalIgstAmt += itemIgstAmt;
    
    return { ...item, qty, inclusiveRate, baseRate, itemIgstAmt, itemAmount };
  });

  const totalItemsInclusive = baseSubtotal + totalIgstAmt;
  const inclusiveShipping = totalAmount > totalItemsInclusive ? totalAmount - totalItemsInclusive : (order.shippingAmount || 0);
  const baseShipping = inclusiveShipping / (1 + (igstRate / 100));
  const shippingIgst = inclusiveShipping - baseShipping;

  totalIgstAmt += shippingIgst;

  const grandTotal = baseSubtotal + baseShipping + totalIgstAmt; // Equals totalAmount

  return (
    <div ref={ref} className="bg-white text-black font-sans w-full max-w-4xl mx-auto p-4 print:pt-16 print:px-12 text-[10px] leading-[1.3] print-exact" style={{ fontFamily: 'Arial, sans-serif', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
      <style>
        {`
          @media print {
            @page {
              margin: 0; /* Removes default browser header (date) and footer (url) */
            }
            body {
              padding: 0.5cm 1.5cm; /* 0.5cm top/bottom, 1.5cm left/right for safe area */
            }
          }
        `}
      </style>
      
      {/* Outer Border Box */}
      <div className="border border-black flex flex-col h-full max-h-[1050px]">
        
        {/* Header Section */}
        <div className="flex p-2 items-center">
          <div className="w-[30%]">
            {/* Logo area using PNG from public folder */}
            <div className="flex items-center">
              <img src="/logo.png" alt="Tez Tech Logo" className="w-48 h-auto object-contain" />
            </div>
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
            <div className="w-[70%] p-1 text-[10px] font-bold">
              <p>: {displayId}</p>
              <p>: {formattedDate}</p>
              <p>: Due On Receipt</p>
              <p>: {formattedDate}</p>
              <p>: {order.poNumber || '-'}</p>
            </div>
          </div>
          
          <div className="w-1/2 border-l border-black flex">
            <div className="w-[30%] p-1 pl-2 text-[10px]">
              <p>Place Of Supply</p>
              <p>LOGISTIC</p>
            </div>
            <div className="w-[70%] p-1 text-[10px] font-bold">
              <p>: {shippingInfo?.state || "Maharashtra"} (27)</p>
              <p>: {order.courierPartner || order.shippingMethod || "TIRUPATI SURFACE"}</p>
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
          <div className="w-1/2 p-2 uppercase border-r border-black">
            <p className="font-bold mb-1">{shippingInfo?.fullName || "Guest"}</p>
            {shippingInfo?.companyName && <p>{shippingInfo.companyName}</p>}
            <p>{shippingInfo?.address || ""}</p>
            <p>{shippingInfo?.city || ""}, {shippingInfo?.state || ""}</p>
            <p>{shippingInfo?.zipCode || ""} {shippingInfo?.country || "India"}</p>
            <p>Phone: {shippingInfo?.phone || "N/A"}</p>
          </div>
          <div className="w-1/2 p-2 uppercase">
            <p className="font-bold mb-1">{shippingInfo?.fullName || "Guest"}</p>
            {shippingInfo?.companyName && <p>{shippingInfo.companyName}</p>}
            <p>{shippingInfo?.address || ""}</p>
            <p>{shippingInfo?.city || ""}, {shippingInfo?.state || ""}</p>
            <p>{shippingInfo?.zipCode || ""} {shippingInfo?.country || "India"}</p>
            <p>Phone: {shippingInfo?.phone || "N/A"}</p>
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
            {processedItems.map((item, index) => {
              return (
                <tr key={index} className="border-b border-gray-300">
                  <td className="p-1 border-r border-black text-center align-top">{index + 1}</td>
                  <td className="p-1 border-r border-black align-top">{item.productName || item.name}</td>
                  <td className="p-1 border-r border-black text-center align-top">{item.hsnCode || '85340000'}</td>
                  <td className="p-1 border-r border-black text-center align-top">{item.qty}.00<br/>pcs</td>
                  <td className="p-1 border-r border-black text-right align-top">{formatCurrency(item.baseRate)}</td>
                  <td className="p-0 border-r border-black align-top">
                    <div className="flex h-full">
                      <div className="w-1/2 border-r border-black text-center p-1">18%</div>
                      <div className="w-1/2 text-right p-1">{formatCurrency(item.itemIgstAmt)}</div>
                    </div>
                  </td>
                  <td className="p-1 text-right align-top">{formatCurrency(item.itemAmount)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Footer Section */}
        <div className="flex border-t border-black mt-auto">
          {/* Left Footer */}
          <div className="w-[60%] p-2 border-r border-black text-[9px]">
            <p className="mb-0.5">Total In Words</p>
            <p className="font-bold italic mb-2">{numberToWords(grandTotal)}</p>
            
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
              <div className="flex justify-between mb-1">
                <span>Sub Total</span>
                <span>{formatCurrency(baseSubtotal)}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Shipping charge</span>
                <span>{formatCurrency(baseShipping)}</span>
              </div>
              <div className="flex justify-between mb-1 text-[#666] text-[8px] italic">
                <span>(IGST18 (18%) )</span>
                <span></span>
              </div>
              <div className="flex justify-between mb-1 text-[#666] text-[8px]">
                <span>SAC: 996812</span>
                <span></span>
              </div>
              <div className="flex justify-between mb-2">
                <span>IGST18 (18%)</span>
                <span>{formatCurrency(totalIgstAmt)}</span>
              </div>
              <div className="flex justify-between font-bold mb-1">
                <span>Total</span>
                <span>Rs.{formatCurrency(grandTotal).replace('₹', '')}</span>
              </div>
              <div className="flex justify-between font-bold text-[11px]">
                <span>Balance Due</span>
                <span>Rs.{formatCurrency(grandTotal).replace('₹', '')}</span>
              </div>
            </div>

            {/* Signature Box */}
            <div className="p-2 pt-6 flex-1 flex flex-col items-center justify-end mt-2">
              <div className="mb-1 w-full flex justify-center">
                {/* Signature using PNG from public folder */}
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
  );
});

export default TaxInvoice;

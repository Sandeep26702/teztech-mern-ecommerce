import React from 'react';

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));

const TaxInvoice = React.forwardRef(({ order }, ref) => {
  if (!order) return <div ref={ref} />;

  const { shippingInfo, items, orderCode, orderNumber, createdAt, totalAmount } = order;
  const displayId = orderCode || `#${orderNumber}`;
  
  const orderDateObj = new Date(createdAt);
  const formattedDate = orderDateObj.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });

  const getItemAttributes = (item) => {
    let attrs = item.attributes || item.selectedAttributes || item.selectedCustomFields || item.customFields;
    if (!attrs) return [];
    
    if (Array.isArray(attrs)) {
      return attrs
        .filter(attr => {
          const name = attr.name || attr.label || '';
          const lowerName = name.toLowerCase();
          return lowerName !== 'final price' && lowerName !== '_finalprice';
        })
        .map(attr => [
          attr.name || attr.label || 'Attribute', 
          attr.value || attr.options?.[0] || String(attr)
        ]);
    }
    
    return Object.entries(attrs)
      .filter(([k]) => {
        const lowerK = k.toLowerCase();
        return lowerK !== 'final price' && lowerK !== '_finalprice';
      })
      .map(([k, v]) => {
        let displayValue = v;
        if (typeof v === 'object' && v !== null) {
          displayValue = v.value || v.label || JSON.stringify(v);
        }
        return [k, displayValue];
      });
  };

  const subtotal = items?.reduce((acc, item) => acc + (item.price * item.quantity), 0) || totalAmount;
  const shipping = totalAmount > subtotal ? totalAmount - subtotal : 0;

  return (
    <div ref={ref} className="bg-white text-black font-sans w-full max-w-4xl mx-auto p-12 text-[12px] leading-[1.6]" style={{ fontFamily: 'Arial, sans-serif' }}>
      
      {/* Header Row: Logo/Company Details and Customer Service */}
      <div className="flex justify-between items-start mb-8">
        <div>
          {/* Logo Placeholder (Replace src with actual logo if available) */}
          <div className="mb-4 text-3xl font-bold text-[#0070c0] flex items-center">
            {/* Using a stylized text to simulate the logo if image not available */}
            <span className="text-[#ff9900] mr-1 text-4xl">/\</span> Tez Tech
          </div>
          
          <h2 className="font-bold text-[14px] uppercase tracking-wider mb-2">SONANI ELECTRONICS</h2>
          <div className="text-[11px] text-[#333]">
            <p>www.teztech.in</p>
            <p>GSTIN : 24FBIPS5304F1ZP</p>
            <p>Sonani Electronics</p>
            <p>Singapore Causeway Road</p>
            <p>Surat, Gujarat 395004</p>
            <p>India</p>
          </div>
        </div>
        
        <div className="text-[11px] text-[#333]">
          <p className="font-bold mb-1">Customer service</p>
          <p>+91 78018 91805</p>
          <p>sonani.electro@gmail.com</p>
        </div>
      </div>

      <hr className="border-t-[1.5px] border-black mb-4" />

      {/* Date */}
      <div className="font-bold text-[12px] mb-4 text-[#000]">
        {formattedDate}
      </div>

      {/* Billed To / Shipping Info */}
      <div className="flex justify-between mb-8">
        <div className="w-1/2 pr-4 text-[11px] text-[#333]">
          <p>{shippingInfo?.fullName}</p>
          {shippingInfo?.companyName && <p>{shippingInfo?.companyName}</p>}
          <p>{shippingInfo?.address}</p>
          <p>{shippingInfo?.city}, {shippingInfo?.zipCode}, {shippingInfo?.state}</p>
          <p>India</p>
          <p>+{shippingInfo?.phone}</p>
          <p>{shippingInfo?.email}</p>
        </div>
        
        <div className="w-1/2 pl-4 text-[11px] text-[#333]">
          <p className="mb-4">
            Shipped via {order.courierPartner || order.shippingMethod || 'TPC ARI (THE PROFESSIONAL COURIER AIR)'}
          </p>
          <p>
            Payment method {order.paymentMethod || 'MANUALLY TRANSFER ( UPI, NEFT, ETC.. )'}
          </p>
        </div>
      </div>

      {/* Order Comments */}
      {(order.customerComments || order.notes) && (
        <div className="mb-8 text-[11px] text-[#333]">
          <p className="font-bold mb-1">Order comments</p>
          <p>{order.customerComments || order.notes}</p>
        </div>
      )}

      {/* Order Number Header */}
      <div className="font-bold text-[12px] mb-4 text-[#000]">
        Order {displayId}
      </div>
      <hr className="border-t border-[#ccc] mb-4" />

      {/* Items List (No Table Headers) */}
      <div className="mb-8">
        {items?.map((item, index) => (
          <div key={index} className="flex justify-between items-start mb-6 text-[11px] text-[#000]">
            <div className="w-[60%]">
              <p className="font-bold">{item.productName || item.name}</p>
              <p className="text-[#333]">SKU : {item.sku || item.variant?.sku || item.productId?.sku || item.productId?.baseSku || 'N/A'}</p>
              {getItemAttributes(item).map(([key, value], idx) => (
                <p key={idx} className="text-[#333]"><span className="uppercase">{key}:</span> {value}</p>
              ))}
            </div>
            <div className="w-[15%] text-center">
              {item.quantity}
            </div>
            <div className="w-[25%] text-right font-semibold">
              {formatCurrency(item.price * item.quantity)}
            </div>
          </div>
        ))}
      </div>

      <hr className="border-t border-[#ccc] mb-4" />

      {/* Totals Section */}
      <div className="flex justify-end">
        <div className="w-[50%]">
          <div className="flex justify-between text-[11px] mb-1">
            <span>Items</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-[11px] mb-1">
            <span>Shipping</span>
            <span>{formatCurrency(shipping)}</span>
          </div>
          {/* Mocking IGST as per screenshot, if no tax logic exists just placeholder */}
          <div className="flex justify-between text-[11px] mb-2">
            <span>IGST</span>
            <span>{formatCurrency(0)}</span>
          </div>
          <div className="flex justify-between font-bold text-[12px]">
            <span>Total</span>
            <span>{formatCurrency(totalAmount)}</span>
          </div>
        </div>
      </div>

    </div>
  );
});

export default TaxInvoice;

import React from 'react';

const PaymentSection = ({ paymentMethod, setPaymentMethod, orderNotes, setOrderNotes }) => {
  return (
    <div className="p-6 bg-white border border-gray-100 rounded-lg shadow-sm">
      <h2 className="mb-4 text-xl font-semibold text-gray-800">Payment information</h2>
      <p className="mb-4 text-sm text-gray-500">Choose a way to pay for your order:</p>
      
      <div className="space-y-0 overflow-hidden border border-gray-200 rounded-md">
        {/* Option 1: Manual Transfer */}
        <label className={`flex items-center gap-3 p-4 cursor-pointer border-b transition-colors duration-150 ${paymentMethod === "MANUAL" ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
          <input 
            type="radio" 
            value="MANUAL" 
            checked={paymentMethod === "MANUAL"} 
            onChange={(e) => setPaymentMethod(e.target.value)} 
            className="w-4 h-4 text-gray-900 cursor-pointer focus:ring-gray-900" 
          />
          <span className="text-sm font-medium text-gray-800 uppercase">MANUALLY TRANSFER ( UPI, NEFT, ETC.. )</span>
        </label>
        
        {/* Option 2: Store Pick-up */}
        <label className={`flex items-center gap-3 p-4 cursor-pointer transition-colors duration-150 ${paymentMethod === "STORE_PICKUP" ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
          <input 
            type="radio" 
            value="STORE_PICKUP" 
            checked={paymentMethod === "STORE_PICKUP"} 
            onChange={(e) => setPaymentMethod(e.target.value)} 
            className="w-4 h-4 text-gray-900 cursor-pointer focus:ring-gray-900" 
          />
          <span className="text-sm font-medium text-gray-800 uppercase">STORE PICK-UP (THIS IS NOT CASH ON DELIVERY OPTION)</span>
        </label>
      </div>

      {/* Manual Payment Instructions (Sirf tab dikhega jab Manual Transfer select hoga) */}
      {paymentMethod === "MANUAL" && (
         <div className="mt-6">
             <h3 className="mb-2 font-semibold text-gray-800 text-md">Payment instruction</h3>
             
             <div className="mb-6 text-sm leading-relaxed text-gray-600">
                <p>After Payment</p>
                <p>Please send payment Photo</p>
                <p>and</p>
                <p>GST number ( only if available )</p>
                <p>on</p>
                <p>WhatsApp no 78018 91805 / 73593 59384</p>
                <p>with order details.</p>
             </div>

             {/* QR Code and Bank Details Section */}
             <div className="flex flex-col items-start gap-4">
                <div className="w-full text-center sm:w-auto">
                    <div className="flex items-center justify-center gap-2 mb-2">
                       <span className="flex items-center justify-center w-8 h-8 text-gray-500 bg-gray-200 rounded-full">
                         <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path></svg>
                       </span>
                       <span className="text-xs font-bold text-blue-500">Patel Purvit Ghanshyambhai</span>
                       <span className="w-4 h-4 text-blue-500"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path></svg></span>
                    </div>
                    
                    {/* IMP: Yahan `src` mein apne asli QR code image ka path daal dijiye */}
                    <img src="Screenshot 2026-04-07 120605.png" alt="Paytm UPI QR Code" className="w-48 h-auto mx-auto mb-4 border border-gray-200 rounded-md shadow-sm" />
                </div>

                <div className="w-full p-4 text-xs font-bold leading-relaxed text-gray-800 uppercase border border-gray-200 rounded-md bg-gray-50">
                    <p className="mb-2 text-gray-900">PAYMENT TRANSFER DETAIL :</p>
                    <p>ACCOUNT HOLDER : SONANI ELECTRONICS</p>
                    <p>NAME : KOTAK MAHINDRA BANK LIMITED, KATARGAM BRANCH</p>
                    <p>AccOUNT NO. : 5845054249</p>
                    <p>IFSC CODE : KKBK0002849</p>
                </div>
             </div>
         </div>
      )}

      {/* Notes / Comments Box */}
      <div className="mt-8">
          <label className="block mb-2 text-sm font-semibold text-gray-800 uppercase">ADD YOUR NOTES/COMMENTS HERE</label>
          <textarea
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              placeholder="Leave us a note about your order"
              rows="3"
              className="w-full p-3 text-sm border border-gray-300 rounded-md outline-none resize-y focus:ring-2 focus:ring-gray-900"
          ></textarea>
      </div>
    </div>
  );
};

export default PaymentSection;
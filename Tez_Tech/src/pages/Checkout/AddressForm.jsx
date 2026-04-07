import React from 'react';

const AddressForm = ({ 
  shippingInfo, setShippingInfo, 
  useNewAddress, setUseNewAddress, 
  savedAddresses, 
  selectedAddressId, setSelectedAddressId, 
  saveAddressForNext, setSaveAddressForNext, 
  addressesLoading,
  deliveryType, setDeliveryType // Naye props: 'ship' or 'pickup'
}) => {
  
  const handleInputChange = (e) => {
    setShippingInfo((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="p-0"> {/* Main wrapper me padding zero rakhi hai taaki cards upar aa sakein */}
      
      {/* --- STEP 1: Delivery Type Cards --- */}
      <h2 className="mb-4 text-xl font-semibold text-gray-800">Shipping & Delivery</h2>
      <p className="mb-4 text-sm text-gray-500">Select how you would like to receive your order:</p>
      
      <div className="grid grid-cols-1 gap-4 mb-8 md:grid-cols-2">
        {/* Card 1: Ship to address */}
        <label 
          className={`flex flex-col items-center justify-center p-6 border-2 rounded-md cursor-pointer transition-all duration-200 ${
            deliveryType === 'ship' ? 'border-blue-600 bg-blue-50/30' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <input 
            type="radio" 
            name="deliveryType" 
            value="ship" 
            checked={deliveryType === 'ship'} 
            onChange={() => setDeliveryType('ship')} 
            className="sr-only" // Hidden radio button
          />
          <svg className={`w-8 h-8 mb-2 ${deliveryType === 'ship' ? 'text-blue-600' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            <rect x="2" y="10" width="14" height="10" rx="2" strokeWidth={1.5} />
            <circle cx="6" cy="20" r="2" strokeWidth={1.5} fill="white" />
            <circle cx="12" cy="20" r="2" strokeWidth={1.5} fill="white" />
          </svg>
          <span className={`font-medium ${deliveryType === 'ship' ? 'text-blue-700' : 'text-gray-700'}`}>Ship to address</span>
        </label>

        {/* Card 2: I'll pick it up myself */}
        <label 
          className={`flex flex-col items-center justify-center p-6 border-2 rounded-md cursor-pointer transition-all duration-200 ${
            deliveryType === 'pickup' ? 'border-blue-600 bg-blue-50/30' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <input 
            type="radio" 
            name="deliveryType" 
            value="pickup" 
            checked={deliveryType === 'pickup'} 
            onChange={() => setDeliveryType('pickup')} 
            className="sr-only" // Hidden radio button
          />
          <svg className={`w-8 h-8 mb-2 ${deliveryType === 'pickup' ? 'text-blue-600' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <span className={`font-medium ${deliveryType === 'pickup' ? 'text-blue-700' : 'text-gray-700'}`}>I'll pick it up myself</span>
        </label>
      </div>

      <p className="mb-6 text-sm text-gray-500">All fields are required unless they're explicitly marked as optional.</p>


      {/* --- STEP 2: Logic Based Forms --- */}
      
      {/* A. If SHIP TO ADDRESS is selected */}
      {deliveryType === 'ship' && (
        <div className="p-6 bg-white border border-gray-100 rounded-lg shadow-sm">
          {addressesLoading ? (
            <p className="text-sm text-gray-500">Loading saved addresses...</p>
          ) : savedAddresses.length > 0 ? (
            <div className="mb-5 space-y-3">
              {savedAddresses.map((addr) => (
                <label key={addr._id} className={`block p-4 border rounded-md cursor-pointer transition ${!useNewAddress && selectedAddressId === addr._id ? "border-gray-900 bg-gray-50" : "border-gray-200"}`}>
                  <div className="flex items-start gap-3">
                    <input type="radio" checked={!useNewAddress && selectedAddressId === addr._id} onChange={() => { setUseNewAddress(false); setSelectedAddressId(addr._id); }} className="mt-1 text-gray-900 focus:ring-gray-900" />
                    <div>
                      <p className="font-semibold text-gray-800">{addr.fullName} - {addr.phone}</p>
                      <p className="text-sm text-gray-600">{addr.address}, {addr.city}, {addr.state} - {addr.pincode}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          ) : null}

          <label className="flex items-center gap-2 mb-4 text-sm font-semibold text-gray-800 cursor-pointer">
            <input type="radio" checked={useNewAddress} onChange={() => setUseNewAddress(true)} className="text-gray-900 focus:ring-gray-900" />
            Use a new address
          </label>

          {useNewAddress && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <input name="fullName" value={shippingInfo.fullName} onChange={handleInputChange} placeholder="First and last name" className="p-3 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-gray-900" required />
                <input name="phone" value={shippingInfo.phone} onChange={handleInputChange} placeholder="Phone" className="p-3 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-gray-900" required pattern="[0-9]{10}" />
              </div>
              <input name="companyName" value={shippingInfo.companyName || ''} onChange={handleInputChange} placeholder="Company name (optional)" className="w-full p-3 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-gray-900" />
              <textarea name="address" value={shippingInfo.address} onChange={handleInputChange} placeholder="Address (Street, apartment, suite, etc)" className="w-full p-3 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-gray-900" rows={2} required />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <input name="city" value={shippingInfo.city} onChange={handleInputChange} placeholder="City" className="p-3 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-gray-900" required />
                <input name="state" value={shippingInfo.state} onChange={handleInputChange} placeholder="State" className="p-3 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-gray-900" required />
                <input name="pincode" value={shippingInfo.pincode} onChange={handleInputChange} placeholder="Postal code" className="p-3 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-gray-900" required pattern="[0-9]{6}" />
              </div>
              <label className="flex items-center gap-2 mt-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={saveAddressForNext} onChange={(e) => setSaveAddressForNext(e.target.checked)} className="text-gray-900 rounded focus:ring-gray-900" />
                Save this address for next time
              </label>
            </div>
          )}
        </div>
      )}

      {/* B. If I'LL PICK IT UP MYSELF is selected */}
      {deliveryType === 'pickup' && (
        <div className="p-6 space-y-6 bg-white border border-gray-100 rounded-lg shadow-sm">
          
          <div>
             <h3 className="mb-4 text-lg font-semibold text-gray-800">Pickup Contact Details</h3>
             <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <input name="fullName" value={shippingInfo.fullName} onChange={handleInputChange} placeholder="First and last name" className="p-3 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-gray-900" required />
                <input name="phone" value={shippingInfo.phone} onChange={handleInputChange} placeholder="Phone number" className="p-3 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-gray-900" required pattern="[0-9]{10}" />
             </div>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-800">Select Pickup Date & Time</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Notice: Make sure to add pickupDate and pickupTime to your shippingInfo state in CheckoutPage */}
                <input type="date" name="pickupDate" value={shippingInfo.pickupDate || ''} onChange={handleInputChange} className="p-3 text-gray-700 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-gray-900" required />
                <input type="time" name="pickupTime" value={shippingInfo.pickupTime || ''} onChange={handleInputChange} className="p-3 text-gray-700 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-gray-900" required />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
             <h3 className="mb-2 text-sm font-semibold text-gray-800 uppercase">Pickup Location</h3>
             <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
                {/* UPDATE THIS WITH YOUR ACTUAL COMPANY ADDRESS */}
                <p className="font-bold text-gray-900">Sonani Electronics</p>
                <p className="mt-1 text-sm text-gray-600">bhandawwad , Morabhagal </p>
                
                <p className="text-sm text--600">Surat, Gujarat - 395004</p>
                <p className="mt-2 text-sm font-medium text-gray-600">Timings: 10:00 AM to 7:00 PM (Mon-Sat)</p>
             </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default AddressForm;
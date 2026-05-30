import React from 'react';

const AddressForm = ({ 
  shippingInfo, setShippingInfo, 
  useNewAddress, setUseNewAddress, 
  savedAddresses, 
  selectedAddressId, setSelectedAddressId, 
  saveAddressForNext, setSaveAddressForNext, 
  addressesLoading,
  deliveryType, setDeliveryType,
  isBillingSameAsShipping, setIsBillingSameAsShipping,
  billingInfo, setBillingInfo
}) => {
  
  const handleInputChange = (e) => {
    setShippingInfo((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="p-0"> 
      
      {/* --- STEP 1: Delivery Type Cards --- */}
      <h2 className="mb-4 text-xl font-semibold text-gray-800">Shipping & Delivery</h2>
      <p className="mb-4 text-sm text-gray-500">Select how you would like to receive your order:</p>
      
      <div className="grid grid-cols-1 gap-4 mb-8 md:grid-cols-2">
        {/* Card 1: Ship to address */}
        <label 
          className={`flex flex-col items-center justify-center p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
            deliveryType === 'ship' ? 'border-blue-600 bg-blue-50/30 shadow-sm' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <input 
            type="radio" 
            name="deliveryType" 
            value="ship" 
            checked={deliveryType === 'ship'} 
            onChange={() => setDeliveryType('ship')} 
            className="sr-only" 
          />
          <svg className={`w-8 h-8 mb-2 ${deliveryType === 'ship' ? 'text-blue-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            <rect x="2" y="10" width="14" height="10" rx="2" strokeWidth={1.5} />
            <circle cx="6" cy="20" r="2" strokeWidth={1.5} fill="white" />
            <circle cx="12" cy="20" r="2" strokeWidth={1.5} fill="white" />
          </svg>
          <span className={`font-semibold ${deliveryType === 'ship' ? 'text-blue-700' : 'text-gray-600'}`}>Ship to address</span>
        </label>

        {/* Card 2: I'll pick it up myself */}
        <label 
          className={`flex flex-col items-center justify-center p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
            deliveryType === 'pickup' ? 'border-blue-600 bg-blue-50/30 shadow-sm' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <input 
            type="radio" 
            name="deliveryType" 
            value="pickup" 
            checked={deliveryType === 'pickup'} 
            onChange={() => setDeliveryType('pickup')} 
            className="sr-only" 
          />
          <svg className={`w-8 h-8 mb-2 ${deliveryType === 'pickup' ? 'text-blue-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <span className={`font-semibold ${deliveryType === 'pickup' ? 'text-blue-700' : 'text-gray-600'}`}>I'll pick it up myself</span>
        </label>
      </div>

      <p className="mb-6 text-sm text-gray-500">All fields are required unless they're explicitly marked as optional.</p>

      {/* --- STEP 2: Logic Based Forms --- */}
      
      {/* A. If SHIP TO ADDRESS is selected */}
      {deliveryType === 'ship' && (
        <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
          {addressesLoading ? (
            <div className="py-4 text-center">
              <p className="text-sm font-medium text-gray-500 animate-pulse">Loading your addresses...</p>
            </div>
          ) : (
            <>
              {/* 🔥 NEW LOGIC: Clear Two-Option Toggle (Only show if saved addresses exist) */}
              {savedAddresses.length > 0 && (
                <div className="flex flex-col gap-4 pb-6 mb-6 border-b border-gray-100 sm:flex-row sm:gap-8">
                  <label className={`flex items-center gap-3 cursor-pointer ${!useNewAddress ? 'text-blue-700' : 'text-gray-600'}`}>
                    <input 
                      type="radio" 
                      name="addressMode" 
                      checked={!useNewAddress} 
                      onChange={() => setUseNewAddress(false)} 
                      className="w-5 h-5 text-blue-600 border-gray-300 cursor-pointer focus:ring-blue-500" 
                    />
                    <span className="font-semibold">Use Saved Address</span>
                  </label>
                  
                  <label className={`flex items-center gap-3 cursor-pointer ${useNewAddress ? 'text-blue-700' : 'text-gray-600'}`}>
                    <input 
                      type="radio" 
                      name="addressMode" 
                      checked={useNewAddress} 
                      onChange={() => setUseNewAddress(true)} 
                      className="w-5 h-5 text-blue-600 border-gray-300 cursor-pointer focus:ring-blue-500" 
                    />
                    <span className="font-semibold">Add New Address</span>
                  </label>
                </div>
              )}

              {/* Display Logic Based on Toggle */}
              {!useNewAddress && savedAddresses.length > 0 ? (
                // 1. SAVED ADDRESSES LIST
                <div className="space-y-4">
                  {savedAddresses.map((addr) => (
                    <label key={addr._id} className={`block p-5 border-2 rounded-xl cursor-pointer transition-all ${!useNewAddress && selectedAddressId === addr._id ? "border-blue-600 bg-blue-50/50" : "border-gray-200 hover:border-gray-300"}`}>
                      <div className="flex items-start gap-4">
                        <input 
                          type="radio" 
                          name="selectedSavedAddress"
                          checked={!useNewAddress && selectedAddressId === addr._id} 
                          onChange={() => setSelectedAddressId(addr._id)} 
                          className="w-4 h-4 mt-1 text-blue-600 cursor-pointer focus:ring-blue-500" 
                        />
                        <div>
                          <p className="font-bold text-gray-900">{addr.fullName} <span className="mx-2 text-gray-300">|</span> {addr.phone}</p>
                          <p className="mt-1 text-sm leading-relaxed text-gray-600">{addr.address}, {addr.city}, {addr.state} - <span className="font-semibold">{addr.pincode}</span></p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                // 2. ADD NEW ADDRESS FORM
                <div className="space-y-5 animate-fade-in">
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <input name="fullName" value={shippingInfo.fullName} onChange={handleInputChange} placeholder="First and last name" className="p-3.5 border border-gray-300 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow" required />
                    <input name="phone" value={shippingInfo.phone} onChange={handleInputChange} placeholder="Phone number" className="p-3.5 border border-gray-300 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow" required pattern="[0-9]{10}" />
                  </div>
                  <input name="companyName" value={shippingInfo.companyName || ''} onChange={handleInputChange} placeholder="Company name (optional)" className="w-full p-3.5 border border-gray-300 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow" />
                  <textarea name="address" value={shippingInfo.address} onChange={handleInputChange} placeholder="Address (Street, apartment, suite, etc)" className="w-full p-3.5 border border-gray-300 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow resize-none" rows={3} required />
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                    <input name="city" value={shippingInfo.city} onChange={handleInputChange} placeholder="City" className="p-3.5 border border-gray-300 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow" required />
                    <input name="state" value={shippingInfo.state} onChange={handleInputChange} placeholder="State" className="p-3.5 border border-gray-300 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow" required />
                    <input name="pincode" value={shippingInfo.pincode} onChange={handleInputChange} placeholder="Postal code" className="p-3.5 border border-gray-300 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow" required pattern="[0-9]{6}" />
                  </div>
                  <label className="flex items-center gap-3 mt-4 cursor-pointer group">
                    <input type="checkbox" checked={saveAddressForNext} onChange={(e) => setSaveAddressForNext(e.target.checked)} className="w-5 h-5 text-blue-600 border-gray-300 rounded cursor-pointer focus:ring-blue-500" />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Save this address to my account for next time</span>
                  </label>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* B. If I'LL PICK IT UP MYSELF is selected */}
      {deliveryType === 'pickup' && (
        <div className="p-8 space-y-8 bg-white border border-gray-100 shadow-sm rounded-2xl">
          
          <div>
             <h3 className="mb-5 text-lg font-bold text-gray-900">Pickup Contact Details</h3>
             <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <input name="fullName" value={shippingInfo.fullName} onChange={handleInputChange} placeholder="First and last name" className="p-3.5 border border-gray-300 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow" required />
                <input name="phone" value={shippingInfo.phone} onChange={handleInputChange} placeholder="Phone number" className="p-3.5 border border-gray-300 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow" required pattern="[0-9]{10}" />
             </div>
          </div>

          <div>
            <h3 className="mb-5 text-lg font-bold text-gray-900">Select Pickup Date & Time</h3>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <input type="date" name="pickupDate" value={shippingInfo.pickupDate || ''} onChange={handleInputChange} className="p-3.5 text-gray-700 border border-gray-300 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow" required />
                <input type="time" name="pickupTime" value={shippingInfo.pickupTime || ''} onChange={handleInputChange} className="p-3.5 text-gray-700 border border-gray-300 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow" required />
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100">
             <h3 className="mb-3 text-sm font-bold tracking-wider text-gray-500 uppercase">Store Location</h3>
             <div className="p-5 border-2 border-blue-100 rounded-xl bg-blue-50/30">
                <p className="text-lg font-black text-gray-900">Sonani Electronics</p>
                <p className="mt-2 text-gray-700">Bhandawwad, Morabhagal</p>
                <p className="text-gray-700">Surat, Gujarat - <span className="font-bold text-gray-900">395004</span></p>
                <div className="flex items-center gap-2 mt-4 text-sm font-bold text-emerald-700">
                  <span className="relative flex w-2.5 h-2.5">
                    <span className="absolute inline-flex w-full h-full rounded-full opacity-75 animate-ping bg-emerald-400"></span>
                    <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  </span>
                  Timings: 10:00 AM to 7:00 PM (Mon-Sat)
                </div>
             </div>
          </div>

        </div>
      )}

      {/* --- STEP 3: Billing Address --- */}
      <div className="mt-8 pt-8 border-t border-gray-200">
        <h2 className="mb-4 text-xl font-semibold text-gray-800">Billing Address</h2>
        <label className="flex items-center gap-3 cursor-pointer group mb-6">
          <input 
            type="checkbox" 
            checked={isBillingSameAsShipping} 
            onChange={(e) => setIsBillingSameAsShipping(e.target.checked)} 
            className="w-5 h-5 text-blue-600 border-gray-300 rounded cursor-pointer focus:ring-blue-500" 
          />
          <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Billing address same as shipping address</span>
        </label>

        {!isBillingSameAsShipping && (
          <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl animate-fade-in space-y-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <input name="fullName" value={billingInfo.fullName} onChange={(e) => setBillingInfo(prev => ({...prev, fullName: e.target.value}))} placeholder="First and last name" className="p-3.5 border border-gray-300 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow" required={!isBillingSameAsShipping} />
              <input name="phone" value={billingInfo.phone} onChange={(e) => setBillingInfo(prev => ({...prev, phone: e.target.value}))} placeholder="Phone number" className="p-3.5 border border-gray-300 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow" required={!isBillingSameAsShipping} pattern="[0-9]{10}" />
            </div>
            <input name="companyName" value={billingInfo.companyName || ''} onChange={(e) => setBillingInfo(prev => ({...prev, companyName: e.target.value}))} placeholder="Company name (optional)" className="w-full p-3.5 border border-gray-300 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow" />
            <textarea name="address" value={billingInfo.address} onChange={(e) => setBillingInfo(prev => ({...prev, address: e.target.value}))} placeholder="Address (Street, apartment, suite, etc)" className="w-full p-3.5 border border-gray-300 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow resize-none" rows={3} required={!isBillingSameAsShipping} />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <input name="city" value={billingInfo.city} onChange={(e) => setBillingInfo(prev => ({...prev, city: e.target.value}))} placeholder="City" className="p-3.5 border border-gray-300 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow" required={!isBillingSameAsShipping} />
              <input name="state" value={billingInfo.state} onChange={(e) => setBillingInfo(prev => ({...prev, state: e.target.value}))} placeholder="State" className="p-3.5 border border-gray-300 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow" required={!isBillingSameAsShipping} />
              <input name="pincode" value={billingInfo.pincode} onChange={(e) => setBillingInfo(prev => ({...prev, pincode: e.target.value}))} placeholder="Postal code" className="p-3.5 border border-gray-300 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow" required={!isBillingSameAsShipping} pattern="[0-9]{6}" />
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default AddressForm;
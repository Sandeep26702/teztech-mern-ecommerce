import React from 'react';

const ShippingMethod = ({ selectedCourier, setSelectedCourier }) => {
  // Aapke diye gaye options aur unke prices
  const courierOptions = [
    { 
      id: 1, 
      name: "COURIER", 
      description: "We will charge rs 140/- shipping charge per kg. Please get confirmation of shipping charges from our whatsapp number 7801891805", 
      price: 1350.00 
    },
    { id: 2, name: "TPC (THE PROFESSIONAL COURIER SURFACE)", price: 1080.00 },
    { id: 3, name: "TPC ARI (THE PROFESSIONAL COURIER AIR )", price: 1350.00 },
    { id: 4, name: "TIRUPATI SURAFCE", price: 1080.00 },
    { id: 5, name: "TIRUPATI AIR", price: 1350.00 },
    { id: 6, name: "DTDC SURFACE", price: 1080.00 },
    { id: 7, name: "DTDC AIR", price: 1350.00 },
    { id: 8, name: "DELHIVERY SURFACE", price: 945.00 },
    { id: 9, name: "( rs 200 Internal Packing and Forwarding Charges ) ( Transport Charge To Pay To Transport Company )", price: 200.00 },
    { id: 10, name: "IndianPost", price: 1350.00 },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <h2 className="mb-4 text-xl font-semibold text-gray-800">Shipping method</h2>
      <p className="text-sm text-gray-500 mb-4">Please choose a shipping method:</p>
      
      <div className="space-y-0 border border-gray-200 rounded-md overflow-hidden max-h-[350px] overflow-y-auto custom-scrollbar">
        {courierOptions.map((courier) => (
          <label 
            key={courier.id} 
            className={`flex justify-between items-start p-4 cursor-pointer border-b border-gray-200 last:border-b-0 transition-colors duration-150 ${selectedCourier?.name === courier.name ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
          >
            <div className="flex items-start gap-3 flex-1 pr-4">
              <input 
                type="radio" 
                name="shipping_courier" 
                checked={selectedCourier?.name === courier.name} 
                onChange={() => setSelectedCourier(courier)} 
                className="mt-1 text-gray-900 focus:ring-gray-900 w-4 h-4 cursor-pointer" 
              />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-800">{courier.name}</span>
                {/* Agar description hai toh yahan show hoga */}
                {courier.description && (
                  <span className="text-xs text-gray-500 mt-1 leading-relaxed">
                    {courier.description}
                  </span>
                )}
              </div>
            </div>
            {/* Price section */}
            <span className="text-sm font-semibold text-gray-900 mt-0.5 whitespace-nowrap">
              ₹{courier.price.toFixed(2)}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default ShippingMethod;
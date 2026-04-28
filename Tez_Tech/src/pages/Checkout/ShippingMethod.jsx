import React from 'react';

const ShippingMethod = ({ selectedCourier, setSelectedCourier, courierOptions, loading }) => {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="space-y-4">
          <div className="h-12 bg-gray-100 rounded"></div>
          <div className="h-12 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (!courierOptions || courierOptions.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
        <h2 className="mb-2 text-xl font-semibold text-gray-800">Shipping method</h2>
        <p className="text-gray-500">No shipping methods available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <h2 className="mb-4 text-xl font-semibold text-gray-800">Shipping method</h2>
      <p className="text-sm text-gray-500 mb-4">Please choose a shipping method:</p>
      
      <div className="space-y-0 border border-gray-200 rounded-md overflow-hidden max-h-[350px] overflow-y-auto custom-scrollbar">
        {courierOptions.map((courier) => (
          <label 
            key={courier.name} 
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
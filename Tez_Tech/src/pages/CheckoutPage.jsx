import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import api from "../utils/api";

// Import your components
import AddressForm from "./Checkout/AddressForm";
import ShippingMethod from "./Checkout/ShippingMethod";
import PaymentSection from "./Checkout/PaymentSection";
import OrderSummary from "./Checkout/OrderSummary";

const getItemKey = (item) => item._id || item.localItemId || item.productId?._id || item.productId;

const getUnitPrice = (item) => Number(
  item?.unitPrice || 
  item?.price || 
  item?.productId?.price || 
  item?.pricing?.unitPrice || 
  0
);

const cleanPrefilledValue = (val, fieldName) => {
  if (!val) return "";
  
  // Format address object to string
  if (typeof val === "object") {
    const { street, city, state, zipCode } = val;
    const parts = [street, city, state, zipCode].map(p => String(p || "").trim()).filter(p => p !== "");
    val = parts.join(", ");
  }

  const s = String(val).trim();
  const lower = s.toLowerCase();

  if (
    lower === "john doe" ||
    lower === "test user" ||
    lower === "test otp user" ||
    lower === "super admin" ||
    lower.includes("example") ||
    lower.includes("e.g.") ||
    lower.includes("[object object]") ||
    (fieldName === "phone" && (s === "9876543210" || s === "9999999999" || s === "1234567890" || s === "0123456789" || s.startsWith("00000")))
  ) {
    return "";
  }

  return s;
};

const CheckoutPage = () => {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [useNewAddress, setUseNewAddress] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [saveAddressForNext, setSaveAddressForNext] = useState(true);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [deliveryType, setDeliveryType] = useState('ship'); 

  // Shipping Providers State
  const [providersLoading, setProvidersLoading] = useState(true);
  const [baseProviders, setBaseProviders] = useState([]);
  const [courierOptions, setCourierOptions] = useState([]);

  // Payment States
  const [paymentMethod, setPaymentMethod] = useState("MANUAL");
  const [orderNotes, setOrderNotes] = useState("");
  const [paymentDetails, setPaymentDetails] = useState({
    utrNumber: "",
    screenshot: null
  });

  const [shippingInfo, setShippingInfo] = useState({
    fullName: cleanPrefilledValue(user?.name, "name"),
    companyName: "",
    phone: cleanPrefilledValue(user?.phone, "phone"),
    address: "",
    city: "",
    state: "",
    pincode: "",
    pickupDate: "", 
    pickupTime: "", 
  });

  const [isBillingSameAsShipping, setIsBillingSameAsShipping] = useState(true);
  const [billingInfo, setBillingInfo] = useState({
    fullName: cleanPrefilledValue(user?.name, "name"),
    companyName: "",
    phone: cleanPrefilledValue(user?.phone, "phone"),
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [selectedCourier, setSelectedCourier] = useState(null);

  // 🔥 DOUBLE TAX FIX & DYNAMIC SHIPPING FIX
  const cartTotal = getCartTotal();
  const totalWeight = useMemo(() => {
    const rawWeight = cartItems.reduce((acc, item) => {
      const w = Number(item?.productId?.weightKg) || Number(item?.weightKg) || 0;
      const q = Number(item?.quantity) || 1;
      return acc + (w * q);
    }, 0);
    return rawWeight === 0 && cartItems.length > 0 ? 1 : rawWeight;
  }, [cartItems]);
  
  useEffect(() => {
    if (baseProviders.length > 0) {
      const options = baseProviders.map(p => {
        const rate = p.ratePerKg ?? p.baseRate ?? 0; // Migration fallback
        const rawCost = totalWeight * rate;
        const cost = Math.round(rawCost); // Round to nearest integer to avoid decimals like 197.399999999
        return {
          id: p._id,
          name: p.name,
          description: `₹${rate}/KG. Total Weight: ${totalWeight.toFixed(2)} KG.`,
          price: cost,
          isDefault: p.isDefault
        };
      });
      setCourierOptions(options);
      
      // Auto-select default if none selected
      if (!selectedCourier) {
        const defaultOption = options.find(o => o.isDefault) || options[0];
        if (defaultOption) setSelectedCourier(defaultOption);
      } else {
        // Update price of already selected courier if weight changed
        const updatedSelected = options.find(o => o.name === selectedCourier.name);
        if (updatedSelected) setSelectedCourier(updatedSelected);
      }
    }
  }, [baseProviders, totalWeight]);

  const shippingTotal = deliveryType === 'pickup' ? 0 : (selectedCourier?.price || 0); 
  
  const grandTotal = Math.round((cartTotal + shippingTotal) * 100) / 100;

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  useEffect(() => {
    const loadAddresses = async () => {
      if (!user) return;
      try {
        setAddressesLoading(true);
        const { data } = await api.get("/users/addresses");
        const list = data.addresses || [];
        setSavedAddresses(list);
        if (list.length > 0) {
          const defaultAddress = list.find((addr) => addr.isDefault) || list[0];
          setSelectedAddressId(defaultAddress._id);
          setUseNewAddress(false);
        }
      } catch (error) {
        console.error("Failed to load addresses:", error);
      } finally {
        setAddressesLoading(false);
      }
    };
    loadAddresses();

    const fetchProviders = async () => {
      try {
        const { data } = await api.get("/shipping/active");
        if (data.success) {
          setBaseProviders(data.providers);
        }
      } catch (error) {
        console.error("Failed to fetch shipping providers:", error);
      } finally {
        setProvidersLoading(false);
      }
    };
    fetchProviders();
  }, [user]);

  const summaryRows = useMemo(() => cartItems.map((item) => ({
      key: getItemKey(item),
      name: item.productId?.name || item.name || "Product",
      image: item.productId?.image || item.productId?.images?.[0]?.url || item.image || "https://placehold.co/100x100",
      qty: Number(item.quantity || 0),
      unitPrice: getUnitPrice(item),
  })), [cartItems]);

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (deliveryType === 'ship') {
        if (useNewAddress) {
          const { fullName, phone, address, city, state, pincode } = shippingInfo;
          if (!fullName || !phone || !address || !city || !state || !pincode) {
            return alert("Please fill all required address fields.");
          }
        } else if (!selectedAddressId) {
          return alert("Please select a delivery address.");
        }
      } else if (deliveryType === 'pickup') {
        const { fullName, phone, pickupDate, pickupTime } = shippingInfo;
        if (!fullName || !phone || !pickupDate || !pickupTime) {
          return alert("Please select pickup date & time.");
        }
      }

      if (!isBillingSameAsShipping) {
        const { fullName, phone, address, city, state, pincode } = billingInfo;
        if (!fullName || !phone || !address || !city || !state || !pincode) {
          return alert("Please fill all required billing address fields.");
        }
      }
    }
    setCurrentStep((prev) => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return alert("Your cart is empty.");
    
    // UTR and screenshot are optional for manual transfer/payment

    setLoading(true);

    try {
      const formData = new FormData();
      
      const orderPayload = {
        items: cartItems.map((item) => ({
          ...item, 
          productId: item.productId?._id || item.productId || item._id,
          quantity: Number(item.quantity || 0),
          selectedOptions: item.selectedOptions || [],
          selectedCustomFields: item.selectedCustomFields || {},
          variant: item.variant,
          attributes: item.attributes,
          size: item.size,
          color: item.color
        })),
        shippingInfo: (deliveryType === 'ship' && useNewAddress) || deliveryType === 'pickup' ? shippingInfo : null,
        addressId: deliveryType === 'ship' && !useNewAddress ? selectedAddressId : null,
        billingInfo: isBillingSameAsShipping ? null : billingInfo,
        saveNewAddress: deliveryType === 'ship' && useNewAddress ? saveAddressForNext : false,
        paymentMethod,
        deliveryType,
        utrNumber: paymentDetails.utrNumber,
        orderNotes: orderNotes,
        
        // 🔥 FIX 2: Solid Courier Name passing
        courierPartner: deliveryType === 'pickup' ? 'Self Pickup' : (selectedCourier?.name || 'Standard Courier'),
        selectedCourier: selectedCourier, // Backup just in case
        
        shippingCost: shippingTotal,
        totalAmount: grandTotal
      };

      formData.append("orderData", JSON.stringify(orderPayload));
      if (paymentDetails.screenshot) {
        formData.append("paymentScreenshot", paymentDetails.screenshot);
      }

      const res = await api.post("/orders/create", formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        clearCart();
        navigate("/order-success", { state: { orderId: res.data.orderId || 'TZ-SUCCESS' } });
      }
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Order failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, name: "Address" },
    { id: 2, name: "Shipping" },
    { id: 3, name: "Payment" }
  ];

  return (
    <div className="min-h-screen px-4 pt-24 pb-24 font-sans bg-slate-50 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        
        {/* Header & Stepper */}
        <div className="mb-10">
          <h1 className="mb-8 text-3xl font-black tracking-tight text-center text-slate-900 md:text-left">Secure Checkout</h1>
          <div className="relative max-w-2xl mx-auto md:mx-0">
            <div className="absolute left-0 w-full h-1 -translate-y-1/2 rounded-full top-1/2 bg-slate-200"></div>
            <div 
              className="absolute left-0 h-1 transition-all duration-500 -translate-y-1/2 bg-blue-600 rounded-full top-1/2"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            ></div>
            <div className="relative flex justify-between">
              {steps.map((step) => (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 transition-all duration-500 ${
                    currentStep >= step.id ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-400'
                  }`}>
                    {currentStep > step.id ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg> : <span className="text-sm font-bold">{step.id}</span>}
                  </div>
                  <span className={`mt-2 text-[10px] font-bold tracking-widest uppercase ${currentStep >= step.id ? 'text-blue-600' : 'text-slate-400'}`}>{step.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
          {/* LEFT: Forms */}
          <div className="lg:col-span-7 xl:col-span-8">
            <div className="p-6 bg-white border shadow-sm sm:p-8 border-slate-200/60 rounded-[2rem]">
              <form id="checkout-form" onSubmit={handlePlaceOrder}>
                
                {/* Step 1: Address */}
                {currentStep === 1 && (
                  <div className="animate-fade-in">
                    <h2 className="mb-6 text-xl font-bold text-slate-900">1. Delivery Details</h2>
                    <AddressForm 
                      shippingInfo={shippingInfo} setShippingInfo={setShippingInfo}
                      useNewAddress={useNewAddress} setUseNewAddress={setUseNewAddress}
                      savedAddresses={savedAddresses} selectedAddressId={selectedAddressId}
                      setSelectedAddressId={setSelectedAddressId} saveAddressForNext={saveAddressForNext}
                      setSaveAddressForNext={setSaveAddressForNext} addressesLoading={addressesLoading}
                      deliveryType={deliveryType} setDeliveryType={setDeliveryType}
                      isBillingSameAsShipping={isBillingSameAsShipping}
                      setIsBillingSameAsShipping={setIsBillingSameAsShipping}
                      billingInfo={billingInfo}
                      setBillingInfo={setBillingInfo}
                    />
                    <div className="hidden lg:flex justify-end pt-8 mt-10 border-t border-slate-100">
                      <button type="button" onClick={handleNextStep} className="w-full px-10 py-4 font-bold text-white transition-all bg-blue-600 shadow-lg sm:w-auto rounded-2xl hover:bg-blue-700 shadow-blue-100 active:scale-95">
                        Deliver to this Address
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Shipping */}
                {currentStep === 2 && (
                  <div className="animate-fade-in">
                    <h2 className="mb-6 text-xl font-bold text-slate-900">2. Shipping Method</h2>
                    {deliveryType === 'ship' ? (
                      <ShippingMethod 
                        selectedCourier={selectedCourier} 
                        setSelectedCourier={setSelectedCourier} 
                        courierOptions={courierOptions}
                        loading={providersLoading}
                      />
                    ) : (
                      <div className="p-10 text-center border-2 border-dashed border-blue-100 bg-blue-50/30 rounded-[2rem]">
                        <h3 className="text-lg font-bold text-blue-900 uppercase">Store Pickup Selected</h3>
                        <p className="mt-1 text-sm font-medium text-blue-600">No shipping charges applied. Proceed to payment.</p>
                      </div>
                    )}
                    <div className="hidden lg:flex justify-end gap-4 pt-8 mt-10 border-t border-slate-100">
                      <button type="button" onClick={handleNextStep} className="flex-1 px-10 py-4 font-bold text-white transition-all bg-blue-600 shadow-lg sm:flex-none rounded-2xl hover:bg-blue-700 active:scale-95">Proceed to Payment</button>
                    </div>
                  </div>
                )}

                {/* Step 3: Payment */}
                {currentStep === 3 && (
                  <div className="animate-fade-in">
                    <h2 className="mb-6 text-xl font-bold tracking-tight text-slate-900">3. Payment & Verification</h2>
                    <PaymentSection 
                      paymentMethod={paymentMethod} 
                      setPaymentMethod={setPaymentMethod} 
                      orderNotes={orderNotes}
                      setOrderNotes={setOrderNotes}
                      paymentDetails={paymentDetails}
                      setPaymentDetails={setPaymentDetails}
                    />
                    <div className="hidden lg:flex justify-end gap-4 pt-8 mt-10 border-t border-slate-100">
                      <button 
                        type="submit" 
                        disabled={loading} 
                        className="flex-1 px-10 py-4 font-bold text-white transition-all shadow-xl sm:flex-none bg-slate-900 rounded-2xl hover:bg-black disabled:bg-slate-300 active:scale-95"
                      >
                        {loading ? "Processing..." : `Place Order (₹${grandTotal.toLocaleString("en-IN")})`}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* RIGHT: Order Summary */}
          <div className="lg:col-span-5 xl:col-span-4">
            <OrderSummary 
              summaryRows={summaryRows} cartTotal={cartTotal} 
              shippingTotal={shippingTotal} igstTotal={0} 
              grandTotal={grandTotal} loading={loading} cartItems={cartItems}
              selectedCourierName={selectedCourier?.name}
              currentStep={currentStep} handleNextStep={handleNextStep}
            />
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}} />
    </div>
  );
};

export default CheckoutPage;
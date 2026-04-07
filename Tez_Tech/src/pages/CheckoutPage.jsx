import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { placeNewOrder } from "../services/orderService";
import api from "../utils/api";

// Import your components
import AddressForm from "./Checkout/AddressForm";
import ShippingMethod from "./Checkout/ShippingMethod";
import PaymentSection from "./Checkout/PaymentSection";
import OrderSummary from "./Checkout/OrderSummary";

const getItemKey = (item) => item._id || item.localItemId || item.productId?._id || item.productId;
const getUnitPrice = (item) => Number(item?.pricing?.unitPrice ?? item?.unitPrice ?? item?.productId?.price ?? item?.price ?? 0);

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
  
  // Stepper State (1: Address, 2: Shipping, 3: Payment)
  const [currentStep, setCurrentStep] = useState(1);

  // 🚀 NAYA: Delivery Type State
  const [deliveryType, setDeliveryType] = useState('ship'); // 'ship' or 'pickup'

  const [paymentMethod, setPaymentMethod] = useState("ONLINE");
  const [shippingInfo, setShippingInfo] = useState({
    fullName: user?.name || "",
    companyName: "",
    phone: user?.phone || "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    pickupDate: "", // 🚀 NAYA
    pickupTime: "", // 🚀 NAYA
  });

  const [selectedCourier, setSelectedCourier] = useState({
    name: "COURIER (Whatsapp Confirmation)",
    price: 1350
  });

  const cartTotal = getCartTotal();
  
  // 🚀 NAYA: Logic to make shipping 0 if pickup is selected
  const shippingTotal = deliveryType === 'pickup' ? 0 : selectedCourier.price; 
  
  const igstTotal = Math.round((cartTotal * 0.18) * 100) / 100;
  const grandTotal = Math.round((cartTotal + shippingTotal + igstTotal) * 100) / 100;

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
  }, [user]);

  const summaryRows = useMemo(() => cartItems.map((item) => ({
      key: getItemKey(item),
      name: item.productId?.name || item.name || "Product",
      image: item.productId?.image || item.productId?.images?.[0]?.url || item.image || "https://placehold.co/100x100",
      qty: Number(item.quantity || 0),
      unitPrice: getUnitPrice(item),
  })), [cartItems]);

  // Step Validation & Navigation Logic
  const handleNextStep = () => {
    if (currentStep === 1) {
      // 🚀 NAYA: Validation based on Delivery Type
      if (deliveryType === 'ship') {
        if (useNewAddress) {
          const { fullName, phone, address, city, state, pincode } = shippingInfo;
          if (!fullName || !phone || !address || !city || !state || !pincode) {
            return alert("Please fill all required address fields to continue.");
          }
        } else if (!selectedAddressId) {
          return alert("Please select a delivery address.");
        }
      } else if (deliveryType === 'pickup') {
        const { fullName, phone, pickupDate, pickupTime } = shippingInfo;
        if (!fullName || !phone || !pickupDate || !pickupTime) {
          return alert("Please fill your contact details and select pickup date & time.");
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
    
    if (paymentMethod === "ONLINE") {
       alert("Razorpay/Cashfree Gateway Pop-up will open here!");
       return; 
    }

    setLoading(true);
    try {
      const orderData = {
        items: cartItems.map((item) => ({
          cartItemId: getItemKey(item),
          productId: item.productId?._id || item.productId || item._id,
          quantity: Number(item.quantity || 0),
        })),
        shippingInfo: (deliveryType === 'ship' && useNewAddress) || deliveryType === 'pickup' ? shippingInfo : null,
        addressId: deliveryType === 'ship' && !useNewAddress ? selectedAddressId : null,
        saveNewAddress: deliveryType === 'ship' && useNewAddress ? saveAddressForNext : false,
        paymentMethod,
        deliveryType, // 🚀 NAYA: Backend ko batane ke liye ki ship hai ya pickup
        courierPartner: deliveryType === 'pickup' ? 'Self Pickup' : selectedCourier.name,
        shippingCost: shippingTotal
      };

      const res = await placeNewOrder(orderData);
      if (res.success) {
        clearCart();
        navigate("/order-success", { state: { orderId: res.orderId || 'TZ-SUCCESS' } });
      }
    } catch (error) {
      alert("Order failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Stepper UI Configuration
  const steps = [
    { id: 1, name: "Address" },
    { id: 2, name: "Shipping" },
    { id: 3, name: "Payment" }
  ];

  return (
    <div className="min-h-screen px-4 pt-24 pb-12 font-sans bg-slate-50 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        
        {/* Header & Stepper */}
        <div className="mb-10 text-center md:text-left">
          <h1 className="mb-8 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Secure Checkout</h1>
          
          <div className="relative max-w-2xl mx-auto md:mx-0">
            <div className="absolute left-0 w-full h-1 -translate-y-1/2 rounded-full top-1/2 bg-slate-200"></div>
            <div 
              className="absolute left-0 h-1 transition-all duration-500 ease-in-out -translate-y-1/2 bg-blue-600 rounded-full top-1/2"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            ></div>

            <div className="relative flex justify-between">
              {steps.map((step) => {
                const isCompleted = currentStep > step.id;
                const isActive = currentStep === step.id;

                return (
                  <div key={step.id} className="flex flex-col items-center">
                    <div className={`flex items-center justify-center w-10 h-10 transition-all duration-500 rounded-full border-4 ${
                      isCompleted 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                        : isActive 
                        ? 'bg-white border-blue-600 text-blue-600 shadow-md' 
                        : 'bg-white border-slate-200 text-slate-400'
                    }`}>
                      {isCompleted ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                      ) : (
                        <span className="text-sm font-bold">{step.id}</span>
                      )}
                    </div>
                    <span className={`mt-2 text-xs font-bold tracking-widest uppercase transition-colors ${
                      isActive ? 'text-blue-600' : isCompleted ? 'text-slate-700' : 'text-slate-400'
                    }`}>
                      {step.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
          
          {/* Left Column */}
          <div className="lg:col-span-7 xl:col-span-8">
            <div className="p-6 transition-all duration-500 bg-white border shadow-sm sm:p-8 border-slate-200/60 rounded-[2rem]">
              
              <form id="checkout-form" onSubmit={handlePlaceOrder}>
                
                {/* Step 1: Address */}
                <div className={`${currentStep === 1 ? 'block animate-fade-in' : 'hidden'}`}>
                  <h2 className="mb-6 text-xl font-bold text-slate-900">1. Delivery Details</h2>
                  
                  {/* 🚀 NAYA: Pass deliveryType props */}
                  <AddressForm 
                    shippingInfo={shippingInfo} 
                    setShippingInfo={setShippingInfo}
                    useNewAddress={useNewAddress}
                    setUseNewAddress={setUseNewAddress}
                    savedAddresses={savedAddresses}
                    selectedAddressId={selectedAddressId}
                    setSelectedAddressId={setSelectedAddressId}
                    saveAddressForNext={saveAddressForNext}
                    setSaveAddressForNext={setSaveAddressForNext}
                    addressesLoading={addressesLoading}
                    deliveryType={deliveryType} 
                    setDeliveryType={setDeliveryType}
                  />
                  
                  <div className="flex justify-end pt-6 mt-8 border-t border-slate-100">
                    <button type="button" onClick={handleNextStep} className="px-8 py-3.5 font-bold text-white transition-all bg-blue-600 rounded-xl hover:bg-blue-700 shadow-md hover:shadow-blue-200 active:scale-95">
                      Continue
                    </button>
                  </div>
                </div>

                {/* Step 2: Shipping */}
                <div className={`${currentStep === 2 ? 'block animate-fade-in' : 'hidden'}`}>
                  <h2 className="mb-6 text-xl font-bold text-slate-900">2. Shipping Method</h2>
                  
                  {/* 🚀 NAYA: If Pickup is selected, show message instead of couriers */}
                  {deliveryType === 'ship' ? (
                    <ShippingMethod 
                      selectedCourier={selectedCourier} 
                      setSelectedCourier={setSelectedCourier} 
                    />
                  ) : (
                    <div className="p-8 text-center border border-blue-100 bg-blue-50/50 rounded-xl">
                      <svg className="w-16 h-16 mx-auto mb-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                      <h3 className="text-xl font-bold text-blue-900">Store Pickup Selected</h3>
                      <p className="mt-2 text-sm text-blue-700">No shipping charges apply. You can proceed directly to payment.</p>
                    </div>
                  )}

                  <div className="flex justify-between pt-6 mt-8 border-t border-slate-100">
                    <button type="button" onClick={handlePrevStep} className="px-6 py-3.5 font-bold text-slate-600 transition-all bg-slate-100 rounded-xl hover:bg-slate-200 active:scale-95">
                      Back
                    </button>
                    <button type="button" onClick={handleNextStep} className="px-8 py-3.5 font-bold text-white transition-all bg-blue-600 rounded-xl hover:bg-blue-700 shadow-md hover:shadow-blue-200 active:scale-95">
                      Continue to Payment
                    </button>
                  </div>
                </div>

                {/* Step 3: Payment */}
                <div className={`${currentStep === 3 ? 'block animate-fade-in' : 'hidden'}`}>
                  <h2 className="mb-6 text-xl font-bold text-slate-900">3. Payment Options</h2>
                  <PaymentSection 
                    paymentMethod={paymentMethod} 
                    setPaymentMethod={setPaymentMethod} 
                  />
                  <div className="flex justify-between pt-6 mt-8 border-t border-slate-100">
                    <button type="button" onClick={handlePrevStep} className="px-6 py-3.5 font-bold text-slate-600 transition-all bg-slate-100 rounded-xl hover:bg-slate-200 active:scale-95">
                      Back
                    </button>
                    <button type="submit" disabled={loading} className="px-8 py-3.5 font-bold text-white transition-all bg-slate-900 rounded-xl hover:bg-blue-600 shadow-lg hover:shadow-blue-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                      {loading ? "Processing..." : "Place Order Now"}
                    </button>
                  </div>
                </div>

              </form>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="sticky top-28">
              <div className="overflow-hidden bg-white border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem]">
                <OrderSummary 
                  summaryRows={summaryRows} 
                  cartTotal={cartTotal} 
                  shippingTotal={shippingTotal} 
                  igstTotal={igstTotal} 
                  grandTotal={grandTotal}
                  loading={loading}
                  cartItems={cartItems}
                />
              </div>
              
              <div className="flex items-center justify-center gap-4 mt-6 text-xs font-semibold tracking-wide uppercase text-slate-400">
                <span className="flex items-center gap-1.5"><svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg> SSL Secured</span>
                <span className="flex items-center gap-1.5"><svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg> Verified</span>
              </div>
            </div>
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
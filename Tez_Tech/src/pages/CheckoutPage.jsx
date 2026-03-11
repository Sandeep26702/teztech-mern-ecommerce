import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { placeNewOrder } from "../services/orderService";
import api from "../utils/api";

const getItemKey = (item) => item._id || item.localItemId || item.productId?._id || item.productId;
const getUnitPrice = (item) =>
  Number(item?.pricing?.unitPrice ?? item?.pricingSnapshot?.unitPrice ?? item?.unitPrice ?? item?.productId?.price ?? item?.price ?? 0);
const getItemShippingCharge = (item) =>
  Number(item?.productId?.shippingCharge ?? item?.shippingCharge ?? 0);

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
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [shippingInfo, setShippingInfo] = useState({
    fullName: user?.name || "",
    phone: user?.phone || "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const cartTotal = getCartTotal();
  const shippingTotal = cartItems.reduce(
    (sum, item) => sum + getItemShippingCharge(item) * Number(item.quantity || 0),
    0
  );
  const grandTotal = Math.round((cartTotal + shippingTotal) * 100) / 100;

  useEffect(() => {
    if (!user) {
      alert("Please login to continue");
      navigate("/login");
    }
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

  const summaryRows = useMemo(
    () =>
      cartItems.map((item) => ({
        key: getItemKey(item),
        name: item.productId?.name || item.name || "Product",
        image:
          item.productId?.image ||
          item.productId?.images?.[0]?.url ||
          item.productId?.images?.[0] ||
          item.image ||
          "https://placehold.co/100x100/f3f4f6/a1a1aa?text=No+Image",
        qty: Number(item.quantity || 0),
        unitPrice: getUnitPrice(item),
      })),
    [cartItems]
  );

  const addressSuggestions = useMemo(() => {
    const q = shippingInfo.address.trim().toLowerCase();
    if (!q) return [];
    return savedAddresses
      .map((addr) => [addr.address, addr.locality, addr.city, addr.state, addr.pincode].filter(Boolean).join(", "))
      .filter((value) => value.toLowerCase().includes(q))
      .slice(0, 4);
  }, [savedAddresses, shippingInfo.address]);

  const handleInputChange = (e) => {
    setShippingInfo((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      alert("Your cart is empty.");
      navigate("/");
      return;
    }
    if (useNewAddress && (!shippingInfo.fullName || !shippingInfo.phone || !shippingInfo.address || !shippingInfo.city || !shippingInfo.pincode)) {
      alert("Please fill complete shipping details.");
      return;
    }
    if (!useNewAddress && !selectedAddressId) {
      alert("Please select a saved address or choose new address.");
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        items: cartItems.map((item) => ({
          cartItemId: getItemKey(item),
          productId: item.productId?._id || item.productId || item._id,
          quantity: Number(item.quantity || 0),
          selectedCustomFields: item.selectedCustomFields || {},
          pricingSnapshot: item.pricing || item.pricingSnapshot || null,
        })),
        shippingInfo: useNewAddress ? shippingInfo : null,
        addressId: useNewAddress ? null : selectedAddressId,
        saveNewAddress: useNewAddress ? saveAddressForNext : false,
        paymentMethod,
      };

      const res = await placeNewOrder(orderData);
      if (res.success) {
        alert(`Order success. Order ID: ${res.order.orderCode || res.order.orderNumber || res.order._id}`);
        clearCart();
        navigate("/orders");
      }
    } catch (error) {
      const errorMsg = error?.response?.data?.message || error?.message || "Order failed. Please try again.";
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 pt-24 pb-12 bg-gray-50 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="mb-8 text-2xl font-extrabold text-gray-900 md:text-3xl">Secure Checkout</h1>
        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="w-full p-6 bg-white border border-gray-100 shadow-sm lg:w-2/3 md:p-8 rounded-2xl">
            <h2 className="mb-6 text-xl font-bold text-gray-800">Delivery Address</h2>
            <form onSubmit={handlePlaceOrder} className="space-y-5">
              {addressesLoading ? (
                <p className="text-sm text-gray-500">Loading saved addresses...</p>
              ) : savedAddresses.length > 0 ? (
                <div className="space-y-2">
                  {savedAddresses.map((addr) => (
                    <label key={addr._id} className={`block p-3 border rounded-xl cursor-pointer ${!useNewAddress && selectedAddressId === addr._id ? "border-orange-500 bg-orange-50" : "border-gray-200"}`}>
                      <div className="flex items-start gap-2">
                        <input
                          type="radio"
                          checked={!useNewAddress && selectedAddressId === addr._id}
                          onChange={() => {
                            setUseNewAddress(false);
                            setSelectedAddressId(addr._id);
                          }}
                          className="mt-1 accent-orange-600"
                        />
                        <div>
                          <p className="font-semibold text-gray-800">{addr.fullName} - {addr.phone}</p>
                          <p className="text-sm text-gray-600">{addr.address}, {addr.locality ? `${addr.locality}, ` : ""}{addr.city}, {addr.state} - {addr.pincode}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              ) : null}

              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
                <input type="radio" checked={useNewAddress} onChange={() => setUseNewAddress(true)} className="accent-orange-600" />
                Use a New Address
              </label>

              {useNewAddress && (
                <>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <input name="fullName" value={shippingInfo.fullName} onChange={handleInputChange} placeholder="Full Name" className="p-3 border rounded-xl" required />
                    <input name="phone" value={shippingInfo.phone} onChange={handleInputChange} placeholder="Phone" className="p-3 border rounded-xl" required pattern="[0-9]{10}" />
                  </div>
                  <textarea name="address" value={shippingInfo.address} onChange={handleInputChange} placeholder="Street, House no, Landmark" className="w-full p-3 border rounded-xl" rows={3} required />
                  {addressSuggestions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {addressSuggestions.map((item) => (
                        <button
                          type="button"
                          key={item}
                          onClick={() => setShippingInfo((prev) => ({ ...prev, address: item }))}
                          className="px-2 py-1 text-xs text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <input name="city" value={shippingInfo.city} onChange={handleInputChange} placeholder="City" className="p-3 border rounded-xl" required />
                    <input name="state" value={shippingInfo.state} onChange={handleInputChange} placeholder="State" className="p-3 border rounded-xl" />
                    <input name="pincode" value={shippingInfo.pincode} onChange={handleInputChange} placeholder="Pincode" className="p-3 border rounded-xl" required pattern="[0-9]{6}" />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={saveAddressForNext} onChange={(e) => setSaveAddressForNext(e.target.checked)} className="accent-orange-600" />
                    Save this address for next orders
                  </label>
                </>
              )}

              <h2 className="mt-6 text-xl font-bold text-gray-800">Payment Options</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer ${paymentMethod === "COD" ? "border-orange-600 bg-orange-50" : "border-gray-200"}`}>
                  <input type="radio" value="COD" checked={paymentMethod === "COD"} onChange={(e) => setPaymentMethod(e.target.value)} className="accent-orange-600" />
                  Cash on Delivery
                </label>
                <label className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer ${paymentMethod === "ONLINE" ? "border-orange-600 bg-orange-50" : "border-gray-200"}`}>
                  <input type="radio" value="ONLINE" checked={paymentMethod === "ONLINE"} onChange={(e) => setPaymentMethod(e.target.value)} className="accent-orange-600" />
                  Pay Online
                </label>
              </div>
              <button type="submit" disabled={loading || cartItems.length === 0} className="w-full py-3 font-black text-white uppercase bg-orange-600 rounded-xl disabled:bg-gray-400">
                {loading ? "Processing..." : `Place Order - Rs ${grandTotal}`}
              </button>
            </form>
          </div>

          <div className="w-full lg:w-1/3">
            <div className="sticky p-6 bg-white border border-gray-100 shadow-sm rounded-2xl top-28">
              <h2 className="pb-3 mb-5 text-lg font-bold text-gray-800 border-b">Your Order Summary</h2>
              <div className="max-h-[350px] overflow-y-auto space-y-4 mb-5 pr-2">
                {summaryRows.map((item) => (
                  <div key={item.key} className="flex items-center gap-4 p-2 rounded-lg bg-gray-50">
                    <img src={item.image} alt="product" className="object-cover border rounded-md w-14 h-14" />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-gray-800 uppercase line-clamp-1">{item.name}</p>
                      <p className="text-[11px] text-gray-500">QTY: {item.qty} x Rs {item.unitPrice}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t">
                <div className="flex justify-between mb-2 text-sm font-semibold text-gray-600">
                  <span>Shipping</span>
                  {shippingTotal > 0 ? (
                    <span>Rs {shippingTotal}</span>
                  ) : (
                    <span className="text-green-600">FREE</span>
                  )}
                </div>
                <div className="flex justify-between text-xl font-black text-orange-600">
                  <span>Total</span>
                  <span>Rs {grandTotal}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;

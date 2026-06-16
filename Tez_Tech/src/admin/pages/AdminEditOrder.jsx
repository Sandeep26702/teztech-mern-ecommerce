/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  FaArrowLeft, FaTrash, FaTimes, FaSearch, FaPlus, FaCamera, FaImage, FaUndo, FaLock, FaUserAlt, FaMapMarkerAlt, FaTruck, FaFileInvoice
} from "react-icons/fa";
import api, { getApiUrl } from "../../utils/api";
import { toast } from "react-hot-toast";

// 💰 Currency Formatter Helper
const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));

// 🖼️ Image URL Fixer
const getImageUrl = (path) => {
  if (!path) return "https://placehold.co/100x100?text=No+Image";
  if (path.startsWith("http")) return path;
  const cleanPath = path.replace(/\\/g, "/");
  const backendOrigin = getApiUrl().replace("/api", "");
  return `${backendOrigin}${cleanPath.startsWith("/") ? "" : "/"}${cleanPath}`;
};

// 🏷️ Variations Parser (For displaying customer custom inputs)
const getVariations = (item) => {
  let vars = [];
  if (item?.selectedCustomFields && typeof item.selectedCustomFields === 'object') {
    Object.entries(item.selectedCustomFields).forEach(([key, val]) => {
      if (key.startsWith("_")) return; // Hide internal tags
      if (val && !Array.isArray(val)) vars.push(`${key}: ${val}`);
      if (val && Array.isArray(val) && val.length > 0) vars.push(`${key}: ${val.join(", ")}`);
    });
  }
  if (item?.size) vars.push(`Size: ${item.size}`);
  if (item?.color) vars.push(`Color: ${item.color}`);
  if (item?.selectedVariantInfo) vars.push(item.selectedVariantInfo);
  if (item?.variant) vars.push(item.variant);
  return vars;
};

// Dummy MongoDB ObjectId generator for custom items
const generateObjectId = () => {
  const chars = "0123456789abcdef";
  let id = "";
  for (let i = 0; i < 24; i++) {
    id += chars[Math.floor(Math.random() * 16)];
  }
  return id;
};

// ==========================================
// 👕 PRODUCT ROW COMPONENT FOR CATALOG MODAL
// ==========================================
const ProductRow = ({ product, onAdd }) => {
    const [selectedVariants, setSelectedVariants] = useState({});

    useEffect(() => {
        if (product.attributes && product.attributes.length > 0) {
            const initial = {};
            product.attributes.forEach(attr => {
                if (attr.options && attr.options.length > 0) {
                    initial[attr.name] = attr.options[0]; 
                }
            });
            setSelectedVariants(initial);
        }
    }, [product]);

    const handleVariantChange = (attrName, optionValue) => {
        const attr = product.attributes.find(a => a.name === attrName);
        const selectedOption = attr.options.find(o => o.value === optionValue);
        setSelectedVariants(prev => ({ ...prev, [attrName]: selectedOption }));
    };

    let finalPrice = product.price || 0;
    let variantString = "";
    
    if (product.attributes && product.attributes.length > 0) {
        const variantParts = [];
        Object.keys(selectedVariants).forEach(attrName => {
            const opt = selectedVariants[attrName];
            if (opt) {
                finalPrice += (opt.priceAdjustment || 0);
                variantParts.push(`${attrName}: ${opt.value}`);
            }
        });
        variantString = variantParts.join(", ");
    }

    return (
        <div className="flex flex-col p-3 bg-white border border-[#d5dce4] rounded hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <img src={getImageUrl(product.image || product.images?.[0]?.url)} alt={product.name} className="object-cover w-12 h-12 border border-gray-200 rounded" />
                    <div>
                        <p className="text-sm font-semibold text-gray-800">{product.name}</p>
                        <p className="text-[11px] text-gray-500">Base Price: ₹{product.price} | Stock: {product.stock}</p>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <span className="font-bold text-sm text-[#202223]">₹{finalPrice}</span>
                    <button 
                        type="button"
                        onClick={() => onAdd(product, finalPrice, variantString)} 
                        className="px-4 py-1.5 bg-[#2463d1] hover:bg-[#1c51b0] text-white text-[13px] font-medium rounded transition-colors shadow-sm"
                    >
                        Add to Order
                    </button>
                </div>
            </div>

            {product.attributes && product.attributes.length > 0 && (
                <div className="flex flex-wrap gap-4 pt-3 mt-3 border-t border-gray-100">
                    {product.attributes.map((attr, i) => (
                        <div key={i} className="flex flex-col w-full gap-1 sm:w-auto">
                            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{attr.name}</label>
                            <select 
                                className="border border-gray-300 rounded px-2 py-1 text-xs outline-none focus:border-[#2463d1] bg-white min-w-[120px]"
                                value={selectedVariants[attr.name]?.value || ""}
                                onChange={(e) => handleVariantChange(attr.name, e.target.value)}
                            >
                                {attr.options.map((opt, j) => (
                                    <option key={j} value={opt.value}>
                                        {opt.value} {opt.priceAdjustment > 0 ? `(+₹${opt.priceAdjustment})` : ""}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ==========================================
// 🚀 EDIT PAGE COMPONENT
// ==========================================
const AdminEditOrder = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // 1. Core States
  const [originalOrder, setOriginalOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  // 2. Form Editable States
  const [customer, setCustomer] = useState({ name: "", email: "", phone: "", companyName: "" });
  const [isTaxExempt, setIsTaxExempt] = useState(false);
  const [generateTaxInvoice, setGenerateTaxInvoice] = useState(true);
  
  const [items, setItems] = useState([]);
  const [editingItemIndex, setEditingItemIndex] = useState(null);
  
  // Shipping States
  const [shippingProviders, setShippingProviders] = useState([]);
  const [shippingMethod, setShippingMethod] = useState("");
  const [ratePerKg, setRatePerKg] = useState(0);
  const [shippingCostOverride, setShippingCostOverride] = useState("");
  const [shippingAddress, setShippingAddress] = useState({
    fullName: "", phone: "", companyName: "", addressLine1: "", addressLine2: "", city: "", state: "", postalCode: "", country: "India"
  });

  // Billing address states
  const [billingAddress, setBillingAddress] = useState({
    fullName: "", phone: "", companyName: "", addressLine1: "", addressLine2: "", city: "", state: "", postalCode: "", country: "India"
  });
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);

  // Discount / Surcharge States
  const [discountValue, setDiscountValue] = useState("");
  const [discountType, setDiscountType] = useState("FLAT"); // FLAT (₹) or PERCENTAGE (%)
  const [gstPercentage, setGstPercentage] = useState(18);
  const [showDiscountRow, setShowDiscountRow] = useState(false);

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState("MANUAL TRANSFER");
  const [utrNumber, setUtrNumber] = useState("");
  const [paymentScreenshot, setPaymentScreenshot] = useState("");
  const [orderNotes, setOrderNotes] = useState("");

  // Status & Panel States
  const [orderStatus, setOrderStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [updateStock, setUpdateStock] = useState(false);

  // Real-time financial summary state
  const [summary, setSummary] = useState({ subtotal: 0, discount: 0, tax: 0, shipping: 0, total: 0 });

  // Catalog Product Modal States
  const [showProductModal, setShowProductModal] = useState(false);
  const [dbProducts, setDbProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Zoom Payment Screenshot
  const [zoomScreenshot, setZoomScreenshot] = useState(false);

  // Helper: check if two addresses are similar
  const isAddressEqual = (s, b) => {
    if (!s || !b) return false;
    return (
      (s.address || "").trim() === (b.address || "").trim() &&
      (s.city || "").trim() === (b.city || "").trim() &&
      (s.state || "").trim() === (b.state || "").trim() &&
      (s.pincode || "").trim() === (b.pincode || "").trim()
    );
  };

  // ==========================================
  // 3. FETCH ORDER DETAILS
  // ==========================================
  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError("");
      
      const res = await api.get(`/admin/orders/${id}`);
      if (res.data.success) {
        const orderData = res.data.order;
        setOriginalOrder(orderData);
        
        // Initialize States
        setCustomer({
          name: orderData.shippingInfo?.fullName || "",
          email: orderData.user?.email || "",
          phone: orderData.shippingInfo?.phone || "",
          companyName: orderData.billingInfo?.companyName || ""
        });
        
        setIsTaxExempt(orderData.isTaxExempt || false);
        setGenerateTaxInvoice(orderData.generateTaxInvoice !== false);
        setOrderStatus(orderData.orderStatus || "Awaiting Processing");
        setPaymentStatus(orderData.paymentStatus || "Awaiting Payment");
        setGstPercentage(orderData.gstPercentage !== undefined ? orderData.gstPercentage : 18);

        // Format items
        const formattedItems = (orderData.items || []).map(itm => ({
          productId: itm.productId?._id || itm.productId,
          sku: itm.sku || "N/A",
          name: itm.name,
          image: itm.image || "",
          unitPrice: itm.unitPrice || itm.price || 0,
          quantity: itm.quantity || 1,
          weightKg: Number(itm.weightKg) || 0,
          variant: itm.variant || ""
        }));
        setItems(formattedItems);

        // Shipping Methods
        setShippingMethod(orderData.selectedShippingProvider || orderData.courierPartner || "");
        setRatePerKg(orderData.ratePerKg || 0);
        setShippingCostOverride(orderData.shippingAmount !== undefined ? String(orderData.shippingAmount) : "");

        // Addresses
        const sInfo = orderData.shippingInfo || {};
        const bInfo = orderData.billingInfo || {};
        
        setShippingAddress({
          fullName: sInfo.fullName || "",
          phone: sInfo.phone || "",
          companyName: bInfo.companyName || "",
          addressLine1: sInfo.address || "",
          addressLine2: "",
          city: sInfo.city || "",
          state: sInfo.state || "",
          postalCode: sInfo.pincode || "",
          country: "India"
        });

        setBillingAddress({
          fullName: bInfo.fullName || "",
          phone: bInfo.phone || "",
          companyName: bInfo.companyName || "",
          addressLine1: bInfo.address || "",
          addressLine2: "",
          city: bInfo.city || "",
          state: bInfo.state || "",
          postalCode: bInfo.pincode || "",
          country: bInfo.country || "India"
        });

        // Determine if Billing Same as Shipping
        const isSame = isAddressEqual(sInfo, bInfo) || !bInfo.fullName;
        setBillingSameAsShipping(isSame);

        // Discounts
        setDiscountValue(orderData.discount ? String(orderData.discount) : "");
        setDiscountType(orderData.discountType === "PERCENTAGE" ? "PERCENTAGE" : "FLAT");
        setShowDiscountRow(!!orderData.discount);

        // Payment info
        setPaymentMethod(orderData.paymentMethod || "MANUAL TRANSFER");
        setUtrNumber(orderData.utrNumber || "");
        setPaymentScreenshot(orderData.paymentScreenshot || "");
        setOrderNotes(orderData.orderNotes || "");
      }
    } catch (err) {
      console.error("Fetch Order Details Error:", err);
      setError("Failed to load order details.");
      toast.error("Failed to load order details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  // Load Shipping Providers list
  useEffect(() => {
    const fetchShipping = async () => {
      try {
        const { data } = await api.get('/shipping');
        if (data.success && data.providers) {
          setShippingProviders(data.providers.filter(p => p.isActive));
        }
      } catch (error) {
        console.error("Error fetching shipping providers", error);
      }
    };
    fetchShipping();
  }, []);

  // Fetch dbProducts when catalog modal opens
  useEffect(() => {
    if (showProductModal && dbProducts.length === 0) {
      console.log("Fetching products for Edit Order from local backend API...");
      api.get('/products?limit=500') 
          .then(({ data }) => {
              const list = data.products || data.data || [];
              console.log("Edit Order Products API Response data:", data);
              console.log("Successfully loaded products count:", list.length);
              setDbProducts(list);
          })
          .catch(err => {
              console.error("Fetch Products Error:", err);
              toast.error("Failed to load products from catalog.");
          });
    }
  }, [showProductModal]);

  // ==========================================
  // 4. SYNC BILLING TO SHIPPING ADDRESS LOGIC
  // ==========================================
  useEffect(() => {
    if (billingSameAsShipping) {
      setBillingAddress({
        fullName: shippingAddress.fullName,
        phone: shippingAddress.phone,
        companyName: shippingAddress.companyName,
        addressLine1: shippingAddress.addressLine1,
        addressLine2: shippingAddress.addressLine2,
        city: shippingAddress.city,
        state: shippingAddress.state,
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country || "India"
      });
    }
  }, [shippingAddress, billingSameAsShipping]);

  // ==========================================
  // 5. REAL-TIME CALCULATION ENGINE
  // ==========================================
  useEffect(() => {
    let calcSubtotal = 0;
    let totalWeight = 0;

    items.forEach(item => {
      calcSubtotal += Number(item.unitPrice || 0) * Number(item.quantity || 1);
      totalWeight += Number(item.weightKg || 0) * Number(item.quantity || 1);
    });

    let calcDiscount = 0;
    const discountValNum = Number(discountValue) || 0;
    if (discountValNum > 0) {
      calcDiscount = discountType === "PERCENTAGE" ? (calcSubtotal * discountValNum) / 100 : discountValNum;
    }
    let discountedSubtotal = Math.max(0, calcSubtotal - calcDiscount);

    let calcShipping = 0;
    if (paymentMethod.includes('STORE_PICKUP') || paymentMethod.includes('STORE PICK-UP')) {
      calcShipping = 0;
    } else if (shippingCostOverride !== "") {
      calcShipping = Number(shippingCostOverride) || 0;
    } else {
      const effectiveWeight = Math.max(0.5, totalWeight);
      calcShipping = effectiveWeight * (Number(ratePerKg) || 0);
    }

    let calcTax = 0;
    if (!isTaxExempt) {
      calcTax = (discountedSubtotal + calcShipping) * (Number(gstPercentage || 18) / 100); 
    }

    setSummary({
      subtotal: calcSubtotal,
      discount: calcDiscount,
      tax: calcTax,
      shipping: calcShipping,
      total: discountedSubtotal + calcTax + calcShipping
    });
  }, [items, discountValue, discountType, isTaxExempt, gstPercentage, paymentMethod, shippingCostOverride, ratePerKg]);


  // ==========================================
  // 6. FORM MUTATION FUNCTIONS
  // ==========================================
  const handleUpdateItem = (index, field, value) => {
    const updated = [...items];
    if (field === 'quantity') {
      updated[index][field] = Number(value) > 0 ? Number(value) : 1;
    } else if (field === 'unitPrice' || field === 'weightKg') {
      updated[index][field] = Number(value) >= 0 ? Number(value) : 0;
    } else {
      updated[index][field] = value;
    }
    setItems(updated);
  };

  const handleRemoveItem = (index) => {
    const removedName = items[index].name;
    setItems(items.filter((_, idx) => idx !== index));
    toast.success(`Removed ${removedName}`);
    if (editingItemIndex === index) setEditingItemIndex(null);
  };

  const handleAddCatalogItem = (product, finalPrice, variantString) => {
    const itemName = variantString ? `${product.name} (${variantString})` : product.name;
    const newItem = {
      productId: product._id,
      name: itemName,
      sku: product.baseSku || product.sku || "N/A",
      image: product.image || product.images?.[0]?.url || "",
      unitPrice: finalPrice,
      quantity: 1,
      weightKg: product.weightKg || 0,
      variant: variantString
    };
    setItems([...items, newItem]);
    toast.success(`Added ${itemName} to list.`);
    setShowProductModal(false);
  };

  const handleAddCustomItem = () => {
    const newItem = {
      productId: generateObjectId(),
      name: "Custom Item",
      sku: "CUSTOM-" + Math.floor(Math.random() * 1000),
      image: "",
      unitPrice: 0,
      quantity: 1,
      weightKg: 1,
      variant: ""
    };
    setItems([...items, newItem]);
    setEditingItemIndex(items.length); // auto open edit fields for custom item
    toast.success("Custom item added. You can now edit its details.");
  };

  const handleShippingMethodDropdown = (e) => {
    const val = e.target.value;
    setShippingMethod(val);
    const provider = shippingProviders.find(p => p.name === val);
    if (provider) {
      setRatePerKg(provider.ratePerKg || 0);
    } else {
      setRatePerKg(0);
    }
  };

  const handleUndoChanges = (e) => {
    e.preventDefault();
    if (!originalOrder) return;
    fetchOrderDetails();
    toast.success("All edits reverted to saved version.");
  };

  // ==========================================
  // 7. SUBMIT EDITS TO DATABASE
  // ==========================================
  const handleSaveChanges = async () => {
    if (items.length === 0) {
      toast.error("Please add at least one item.");
      return;
    }
    if (!customer.name || !customer.phone) {
      toast.error("Customer name and phone number are required.");
      return;
    }

    const totalWeight = items.reduce((acc, itm) => acc + (Number(itm.weightKg || 0) * Number(itm.quantity || 1)), 0);

    const payload = {
      items: items.map(itm => ({
        productId: itm.productId?._id || itm.productId,
        name: itm.name,
        sku: itm.sku,
        image: itm.image,
        unitPrice: Number(itm.unitPrice) || 0,
        quantity: Number(itm.quantity) || 1,
        weightKg: Number(itm.weightKg) || 0,
        variant: itm.variant || ""
      })),
      shippingInfo: {
        fullName: customer.name,
        phone: customer.phone,
        address: `${shippingAddress.addressLine1} ${shippingAddress.addressLine2}`.trim(),
        city: shippingAddress.city,
        state: shippingAddress.state,
        pincode: shippingAddress.postalCode,
      },
      billingInfo: {
        fullName: billingSameAsShipping ? customer.name : billingAddress.fullName,
        phone: billingSameAsShipping ? customer.phone : billingAddress.phone,
        companyName: billingSameAsShipping ? customer.companyName : billingAddress.companyName,
        address: billingSameAsShipping 
          ? `${shippingAddress.addressLine1} ${shippingAddress.addressLine2}`.trim() 
          : `${billingAddress.addressLine1} ${billingAddress.addressLine2}`.trim(),
        city: billingSameAsShipping ? shippingAddress.city : billingAddress.city,
        state: billingSameAsShipping ? shippingAddress.state : billingAddress.state,
        pincode: billingSameAsShipping ? shippingAddress.postalCode : billingAddress.postalCode,
        country: billingSameAsShipping ? "India" : billingAddress.country,
      },
      paymentMethod,
      paymentStatus,
      orderStatus,
      deliveryType: (paymentMethod.includes("STORE PICK-UP") || paymentMethod.includes("STORE_PICKUP")) ? "pickup" : "ship",
      selectedShippingProvider: shippingMethod,
      ratePerKg: Number(ratePerKg) || 0,
      shippingWeightKg: totalWeight,
      shippingAmount: summary.shipping,
      discount: Number(discountValue) || 0,
      discountType: discountType,
      isTaxExempt,
      generateTaxInvoice,
      gstPercentage: isTaxExempt ? 0 : Number(gstPercentage) || 18,
      orderNotes,
      utrNumber,
      updateStock
    };

    try {
      setIsSaving(true);
      const res = await api.put(`/orders/admin/edit/${id}`, payload);
      if (res.data.success) {
        toast.success("Order updated successfully!");
        setUpdateStock(false); // Reset updateStock toggle after saving
        navigate(`/admin/orders/${id}`); // Redirect back to OrderDetails (View) page
      }
    } catch (err) {
      console.error("Save Order Error:", err);
      toast.error(err.response?.data?.message || "Failed to update order.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (error || !originalOrder) {
    return (
      <div className="max-w-xl p-10 mx-auto mt-10 text-center bg-white rounded-lg shadow border border-red-100">
        <h2 className="text-xl font-bold text-red-500 mb-2">Error Occurred</h2>
        <p className="text-gray-600 mb-6">{error || "Order not found."}</p>
        <button onClick={() => navigate("/admin/orders")} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-500">
          Back to Orders
        </button>
      </div>
    );
  }

  const displayId = originalOrder.orderCode || (originalOrder.orderNumber ? `#${originalOrder.orderNumber}` : `#${id.slice(-6)}`);
  const currentWeight = items.reduce((acc, itm) => acc + (Number(itm.weightKg || 0) * Number(itm.quantity || 1)), 0);
  const autoCalcShippingCost = Math.max(0.5, currentWeight) * ratePerKg;

  // Split taxes for Gujarat supply state
  const taxState = (billingSameAsShipping ? shippingAddress.state : billingAddress.state) || "";
  const isGujarat = taxState.toLowerCase().trim() === "gujarat" || taxState.toLowerCase().trim() === "gj";

  return (
    <div className="min-h-screen bg-[#f4f6f8] px-4 py-8 mx-auto font-sans sm:px-6 lg:px-8 max-w-7xl sm:py-10 text-[#202223] relative">
      
      {/* 1. HEADER ROW */}
      <div className="flex flex-col gap-4 mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button 
            type="button"
            onClick={() => navigate(`/admin/orders/${id}`)} 
            className="flex items-center gap-2 mb-2 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors"
          >
            <FaArrowLeft /> Back to Order Details
          </button>
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl text-slate-900">
            Edit Order {displayId}
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Placed on {new Date(originalOrder.createdAt).toLocaleString("en-IN", { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg border ${
            paymentStatus === "Paid" ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"
          }`}>
            Payment: {paymentStatus}
          </span>
          <span className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
            Status: {orderStatus}
          </span>
        </div>
      </div>

      {/* 2. MAIN 2-COLUMN GRID */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        
        {/* LEFT COLUMN: EDIT CARDS */}
        <div className="space-y-8 lg:col-span-2">

          {/* CARD A: CUSTOMER DETAILS */}
          <div className="bg-white border border-[#d5dce4] rounded shadow-sm p-6">
            <h3 className="text-[16px] font-semibold text-[#1a1a1a] mb-4">Customer</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Customer Name</label>
                <input 
                  type="text" 
                  value={customer.name} 
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  placeholder="Recipient Full Name" 
                  className="w-full h-10 px-3 py-2 border border-[#c4cdd5] rounded text-[14px] focus:outline-none focus:border-[#2463d1] bg-white text-gray-800"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Email address</label>
                  <input 
                    type="email" 
                    value={customer.email} 
                    onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                    placeholder="kshahil189@gmail.com" 
                    className="w-full h-10 px-3 py-2 border border-[#c4cdd5] rounded text-[14px] focus:outline-none focus:border-[#2463d1] bg-white text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Phone number</label>
                  <input 
                    type="text" 
                    value={customer.phone} 
                    onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                    placeholder="Customer contact number" 
                    className="w-full h-10 px-3 py-2 border border-[#c4cdd5] rounded text-[14px] focus:outline-none focus:border-[#2463d1] bg-white text-gray-800"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Company name</label>
                <input 
                  type="text" 
                  value={customer.companyName} 
                  onChange={(e) => setCustomer({ ...customer, companyName: e.target.value })}
                  placeholder="Optional Company Name" 
                  className="w-full h-10 px-3 py-2 border border-[#c4cdd5] rounded text-[14px] focus:outline-none focus:border-[#2463d1] bg-white text-gray-800"
                />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <span className="text-[14px] font-medium text-gray-700">Mark customer's order as tax-exempt</span>
                <ToggleSwitch isOn={isTaxExempt} handleToggle={() => setIsTaxExempt(!isTaxExempt)} />
              </div>
            </div>
          </div>

          {/* CARD B: ORDER ITEMS */}
          <div className="bg-white border border-[#d5dce4] rounded shadow-sm p-6">
            <h3 className="text-[16px] font-semibold text-[#1a1a1a] mb-4">Order items</h3>
            
            {items.length === 0 ? (
              <div className="py-6 text-center text-gray-500 border border-dashed rounded-lg mb-4">
                No items in this order. Add items from catalog or add a custom item.
              </div>
            ) : (
              <div className="space-y-4 mb-4">
                {items.map((item, index) => {
                  const variations = getVariations(item);
                  const isEditingThisItem = editingItemIndex === index;

                  return (
                    <div key={index} className="flex flex-col p-4 border border-gray-200 rounded-xl bg-gray-50 relative group">
                      
                      {/* Flex content */}
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                        {/* Thumbnail */}
                        <div className="flex-shrink-0 w-16 h-16 p-1 overflow-hidden border bg-white border-slate-200 rounded-lg">
                          <img src={getImageUrl(item.image)} alt={item.name} className="object-contain w-full h-full" />
                        </div>
                        
                        {/* Item Info / Inline Inputs */}
                        <div className="flex-1 space-y-1">
                          {isEditingThisItem ? (
                            <div className="space-y-2">
                              <input 
                                type="text" 
                                value={item.name} 
                                onChange={(e) => handleUpdateItem(index, 'name', e.target.value)} 
                                className="w-full h-8 px-2 py-1 text-sm border rounded focus:outline-none focus:border-blue-500 bg-white text-slate-800"
                                placeholder="Item name"
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <input 
                                  type="text" 
                                  value={item.sku} 
                                  onChange={(e) => handleUpdateItem(index, 'sku', e.target.value)} 
                                  className="w-full h-8 px-2 py-1 text-xs border rounded focus:outline-none focus:border-blue-500 bg-white text-slate-800"
                                  placeholder="SKU"
                                />
                                <input 
                                  type="number" 
                                  value={item.weightKg} 
                                  onChange={(e) => handleUpdateItem(index, 'weightKg', e.target.value)} 
                                  className="w-full h-8 px-2 py-1 text-xs border rounded focus:outline-none focus:border-blue-500 bg-white text-slate-800"
                                  placeholder="Weight (kg)"
                                />
                              </div>
                            </div>
                          ) : (
                            <>
                              <h4 className="text-sm font-bold leading-tight text-slate-900">{item.name}</h4>
                              <p className="text-xs text-slate-500">SKU: <span className="font-semibold">{item.sku}</span>{Number(item.weightKg) > 0 ? ` | Weight: ${item.weightKg}kg` : ""}</p>
                              
                              {variations.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {variations.map((v, i) => (
                                    <span key={i} className="px-2 py-0.5 text-[10px] font-bold text-slate-600 bg-white border border-slate-200 rounded">
                                      {v}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                          
                          {/* Toggle Edit Button */}
                          <button 
                            type="button"
                            onClick={() => setEditingItemIndex(isEditingThisItem ? null : index)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-semibold block pt-1"
                          >
                            {isEditingThisItem ? "Done Editing" : "Edit Name/SKU"}
                          </button>
                        </div>

                        {/* Quantity and Price Inputs */}
                        <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
                          {/* Unit Price */}
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Unit Price</span>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-semibold">₹</span>
                              <input 
                                type="number" 
                                value={item.unitPrice} 
                                onChange={(e) => handleUpdateItem(index, 'unitPrice', e.target.value)} 
                                className="w-24 h-9 pl-5 pr-2 text-center text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 bg-white font-semibold text-slate-800"
                              />
                            </div>
                          </div>

                          {/* Qty */}
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Qty</span>
                            <input 
                              type="number" 
                              value={item.quantity} 
                              onChange={(e) => handleUpdateItem(index, 'quantity', e.target.value)} 
                              className="w-16 h-9 px-1 text-center text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 bg-white font-semibold text-slate-800"
                            />
                          </div>

                          {/* Total */}
                          <div className="flex flex-col items-end min-w-[70px]">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total</span>
                            <span className="text-sm font-bold text-slate-800 pt-2">{formatCurrency(Number(item.unitPrice) * Number(item.quantity))}</span>
                          </div>

                          {/* Delete Trash */}
                          <button 
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="p-2 text-gray-400 hover:text-red-600 rounded transition-colors self-end sm:self-center"
                          >
                            <FaTrash size={14} />
                          </button>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Buttons Row */}
            <div className="flex flex-wrap gap-4 items-center">
              <button 
                type="button"
                onClick={() => setShowProductModal(true)} 
                className="flex items-center gap-1.5 px-4 py-2 border border-[#2463d1] hover:bg-blue-50 text-[#2463d1] text-xs font-semibold rounded-lg transition-colors"
              >
                <FaPlus size={10} /> Add Item from Catalog
              </button>
              <button 
                type="button"
                onClick={handleAddCustomItem} 
                className="text-[#2463d1] hover:text-blue-800 text-xs font-bold transition-colors"
              >
                Add custom item
              </button>
            </div>
          </div>

          {/* CARD C: SHIPPING AND DELIVERY */}
          <div className="bg-white border border-[#d5dce4] rounded shadow-sm p-6">
            <h3 className="text-[16px] font-semibold text-[#1a1a1a] mb-4">Shipping and delivery</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 font-sans">Method:</label>
                  <select 
                    value={shippingMethod} 
                    onChange={handleShippingMethodDropdown} 
                    className="w-full h-10 px-3 py-2 border border-[#c4cdd5] rounded text-[14px] text-gray-700 bg-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select Shipping Provider</option>
                    {shippingProviders.map(p => (
                      <option key={p._id} value={p.name}>
                        {p.name} (₹{p.ratePerKg}/kg)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 font-sans">
                    Shipping CostOverride (₹)
                  </label>
                  <input 
                    type="number" 
                    value={shippingCostOverride} 
                    onChange={(e) => setShippingCostOverride(e.target.value)} 
                    placeholder={shippingMethod ? `Auto: ₹${autoCalcShippingCost}` : "Enter custom amount"}
                    className="w-full h-10 px-3 py-2 border border-[#c4cdd5] rounded text-[14px] focus:outline-none focus:border-[#2463d1] bg-white text-gray-800"
                  />
                  {shippingCostOverride === "" && shippingMethod && (
                    <p className="mt-1 text-xs text-green-600">Auto calculated: {currentWeight <= 0.5 ? '0.5kg (Minimum)' : `${currentWeight}kg`} × ₹{ratePerKg} = ₹{autoCalcShippingCost}</p>
                  )}
                </div>
              </div>

              {/* Shipping Address Forms */}
              <div className="pt-4 border-t border-gray-100">
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-1.5">
                  <FaMapMarkerAlt className="text-slate-400 text-xs" /> Shipping Address Details
                </h4>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">Recipient Name</label>
                    <input 
                      type="text" 
                      value={shippingAddress.fullName} 
                      onChange={(e) => setShippingAddress({ ...shippingAddress, fullName: e.target.value })}
                      placeholder="Name" 
                      className="w-full h-10 px-3 py-2 border border-[#c4cdd5] rounded text-[14px] focus:outline-none focus:border-[#2463d1] bg-white text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">Phone</label>
                    <input 
                      type="text" 
                      value={shippingAddress.phone} 
                      onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                      placeholder="Phone Number" 
                      className="w-full h-10 px-3 py-2 border border-[#c4cdd5] rounded text-[14px] focus:outline-none focus:border-[#2463d1] bg-white text-gray-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">Company name</label>
                    <input 
                      type="text" 
                      value={shippingAddress.companyName} 
                      onChange={(e) => setShippingAddress({ ...shippingAddress, companyName: e.target.value })}
                      placeholder="Company" 
                      className="w-full h-10 px-3 py-2 border border-[#c4cdd5] rounded text-[14px] focus:outline-none focus:border-[#2463d1] bg-white text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">Country</label>
                    <input 
                      type="text" 
                      value={shippingAddress.country} 
                      disabled
                      placeholder="India" 
                      className="w-full h-10 px-3 py-2 border border-[#c4cdd5] rounded text-[14px] bg-slate-100 text-gray-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">Address Line 1</label>
                    <input 
                      type="text" 
                      value={shippingAddress.addressLine1} 
                      onChange={(e) => setShippingAddress({ ...shippingAddress, addressLine1: e.target.value })}
                      placeholder="Address line 1" 
                      className="w-full h-10 px-3 py-2 border border-[#c4cdd5] rounded text-[14px] focus:outline-none focus:border-[#2463d1] bg-white text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">Address Line 2 (Optional)</label>
                    <input 
                      type="text" 
                      value={shippingAddress.addressLine2} 
                      onChange={(e) => setShippingAddress({ ...shippingAddress, addressLine2: e.target.value })}
                      placeholder="Address line 2" 
                      className="w-full h-10 px-3 py-2 border border-[#c4cdd5] rounded text-[14px] focus:outline-none focus:border-[#2463d1] bg-white text-gray-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-gray-400 mb-1">City</label>
                    <input 
                      type="text" 
                      value={shippingAddress.city} 
                      onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                      placeholder="City" 
                      className="w-full h-10 px-3 py-2 border border-[#c4cdd5] rounded text-[14px] focus:outline-none focus:border-[#2463d1] bg-white text-gray-800"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-gray-400 mb-1">State</label>
                    <input 
                      type="text" 
                      value={shippingAddress.state} 
                      onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                      placeholder="State (e.g. Gujarat)" 
                      className="w-full h-10 px-3 py-2 border border-[#c4cdd5] rounded text-[14px] focus:outline-none focus:border-[#2463d1] bg-white text-gray-800"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-gray-400 mb-1">Postal Code</label>
                    <input 
                      type="text" 
                      value={shippingAddress.postalCode} 
                      onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })}
                      placeholder="Pincode" 
                      className="w-full h-10 px-3 py-2 border border-[#c4cdd5] rounded text-[14px] focus:outline-none focus:border-[#2463d1] bg-white text-gray-800"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CARD D: DISCOUNTS AND SURCHARGES */}
          <div className="bg-white border border-[#d5dce4] rounded shadow-sm p-6">
            <h3 className="text-[16px] font-semibold text-[#1a1a1a] mb-4">Discounts and surcharges</h3>
            
            {showDiscountRow ? (
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Description</label>
                  <input 
                    type="text" 
                    placeholder="Discount Reason" 
                    defaultValue="Discount"
                    className="w-full h-10 px-3 py-2 border border-[#c4cdd5] rounded text-[14px] focus:outline-none focus:border-blue-500 bg-white text-[#202223]"
                  />
                </div>
                <div className="w-2/5">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Value</label>
                  <div className="flex border border-[#c4cdd5] rounded overflow-hidden bg-white">
                    <input 
                      type="number" 
                      placeholder="Amount" 
                      value={discountValue} 
                      onChange={(e) => setDiscountValue(e.target.value)} 
                      className="w-full px-3 py-2 text-[14px] focus:outline-none bg-white text-[#202223]" 
                    />
                    <select 
                      value={discountType} 
                      onChange={(e) => setDiscountType(e.target.value)} 
                      className="border-l border-[#c4cdd5] h-10 px-2 py-1 text-[13px] text-[#2463d1] font-semibold bg-[#f9fafb] outline-none"
                    >
                      <option value="FLAT">₹</option>
                      <option value="PERCENTAGE">%</option>
                    </select>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    setDiscountValue("");
                    setShowDiscountRow(false);
                  }} 
                  className="p-2 text-red-500 hover:bg-red-50 rounded mt-5"
                >
                  <FaTrash className="text-[14px]" />
                </button>
              </div>
            ) : (
              <button 
                type="button"
                onClick={() => setShowDiscountRow(true)} 
                 className="flex items-center gap-1.5 px-4 py-2 border border-[#2463d1] hover:bg-blue-50 text-[#2463d1] text-xs font-semibold rounded-lg transition-colors"
              >
                <FaPlus size={10} /> Add discount or surcharge
              </button>
            )}
          </div>

          {/* CARD: GST RATE */}
          <div className="bg-white border border-[#d5dce4] rounded shadow-sm p-6">
            <h3 className="text-[16px] font-semibold text-[#1a1a1a] mb-4">GST Rate (%)</h3>
            <input 
              type="number" 
              value={gstPercentage} 
              disabled={isTaxExempt}
              onChange={(e) => setGstPercentage(e.target.value)} 
              placeholder="GST Rate (%)" 
              className="w-full h-10 px-3 py-2 border border-[#c4cdd5] rounded text-[14px] focus:outline-none focus:border-[#2463d1] bg-white text-gray-800 disabled:bg-gray-100 disabled:text-gray-400"
            />
          </div>

          {/* CARD E: PAYMENT & BILLING DETAILS */}
          <div className="bg-white border border-[#d5dce4] rounded shadow-sm p-6">
            <h3 className="text-[16px] font-semibold text-[#1a1a1a] mb-4">Payment</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Payment Method:</label>
                <select 
                  value={paymentMethod} 
                  onChange={(e) => setPaymentMethod(e.target.value)} 
                  className="w-full h-10 px-3 py-2 border border-[#c4cdd5] rounded text-[14px] bg-white text-gray-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="MANUAL TRANSFER">MANUAL TRANSFER</option>
                  <option value="COD">Cash on Delivery</option>
                  <option value="ONLINE">Online Payment</option>
                  <option value="STORE_PICKUP">STORE PICK-UP (THIS IS NOT CASH ON DELIVERY OPTION)</option>
                </select>
              </div>

              {/* 💸 UTR / SCREENSHOT PAYMENT VERIFICATION SECTION (Manual Transfer only) */}
              {(paymentMethod === "MANUAL TRANSFER" || paymentMethod === "MANUAL") && (
                <div className="p-4 border border-blue-100 bg-blue-50/30 rounded-xl space-y-4">
                  <h4 className="text-sm font-bold text-blue-700 flex items-center gap-1.5">
                    <FaFileInvoice /> Payment Verification
                  </h4>
                  
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">UTR / Reference Number</label>
                      <input 
                        type="text" 
                        value={utrNumber} 
                        onChange={(e) => setUtrNumber(e.target.value)}
                        placeholder="Not Provided" 
                        className="w-full h-10 px-3 py-2 border border-blue-200 rounded text-[14px] font-mono focus:outline-none focus:border-[#2463d1] bg-white text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-2">Payment Screenshot</label>
                      {paymentScreenshot ? (
                        <div className="relative w-36 h-36 overflow-hidden rounded-xl border border-slate-200 group">
                          <img 
                            src={getImageUrl(paymentScreenshot)} 
                            alt="UPI Screenshot" 
                            className="object-cover w-full h-full"
                          />
                          <button 
                            type="button"
                            onClick={() => setZoomScreenshot(true)}
                            className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold"
                          >
                            Click to Zoom
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center w-36 h-36 border-2 border-dashed bg-slate-50 border-slate-200 rounded-xl text-slate-400 text-xs font-semibold">
                          No Screenshot
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Billing Address with UX sync logic */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                    <FaUserAlt className="text-slate-400 text-xs" /> Billing Address
                  </h4>
                  
                  {/* UX "Same as Shipping" Checkbox */}
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-blue-600">
                    <input 
                      type="checkbox" 
                      checked={billingSameAsShipping} 
                      onChange={(e) => setBillingSameAsShipping(e.target.checked)} 
                      className="rounded text-blue-600 focus:ring-0 w-3.5 h-3.5 border-gray-300 cursor-pointer"
                    />
                    Same as shipping address
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">Billing Name</label>
                    <input 
                      type="text" 
                      value={billingAddress.fullName} 
                      onChange={(e) => setBillingAddress({ ...billingAddress, fullName: e.target.value })}
                      disabled={billingSameAsShipping}
                      placeholder="Name" 
                      className="w-full h-10 px-3 py-2 border border-[#c4cdd5] rounded text-[14px] focus:outline-none focus:border-[#2463d1] bg-white text-gray-800 disabled:bg-gray-100 disabled:text-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">Billing Phone</label>
                    <input 
                      type="text" 
                      value={billingAddress.phone} 
                      onChange={(e) => setBillingAddress({ ...billingAddress, phone: e.target.value })}
                      disabled={billingSameAsShipping}
                      placeholder="Phone Number" 
                      className="w-full h-10 px-3 py-2 border border-[#c4cdd5] rounded text-[14px] focus:outline-none focus:border-[#2463d1] bg-white text-gray-800 disabled:bg-gray-100 disabled:text-gray-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">Company name</label>
                    <input 
                      type="text" 
                      value={billingAddress.companyName} 
                      onChange={(e) => setBillingAddress({ ...billingAddress, companyName: e.target.value })}
                      disabled={billingSameAsShipping}
                      placeholder="Company" 
                      className="w-full h-10 px-3 py-2 border border-[#c4cdd5] rounded text-[14px] focus:outline-none focus:border-[#2463d1] bg-white text-gray-800 disabled:bg-gray-100 disabled:text-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">Country</label>
                    <input 
                      type="text" 
                      value={billingAddress.country} 
                      disabled
                      placeholder="Country" 
                      className="w-full h-10 px-3 py-2 border border-[#c4cdd5] rounded text-[14px] bg-slate-100 text-gray-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">Address Line 1</label>
                    <input 
                      type="text" 
                      value={billingAddress.addressLine1} 
                      onChange={(e) => setBillingAddress({ ...billingAddress, addressLine1: e.target.value })}
                      disabled={billingSameAsShipping}
                      placeholder="Address line 1" 
                      className="w-full h-10 px-3 py-2 border border-[#c4cdd5] rounded text-[14px] focus:outline-none focus:border-[#2463d1] bg-white text-gray-800 disabled:bg-gray-100 disabled:text-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">Address Line 2</label>
                    <input 
                      type="text" 
                      value={billingAddress.addressLine2} 
                      onChange={(e) => setBillingAddress({ ...billingAddress, addressLine2: e.target.value })}
                      disabled={billingSameAsShipping}
                      placeholder="Address line 2" 
                      className="w-full h-10 px-3 py-2 border border-[#c4cdd5] rounded text-[14px] focus:outline-none focus:border-[#2463d1] bg-white text-gray-800 disabled:bg-gray-100 disabled:text-gray-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-gray-400 mb-1">City</label>
                    <input 
                      type="text" 
                      value={billingAddress.city} 
                      onChange={(e) => setBillingAddress({ ...billingAddress, city: e.target.value })}
                      disabled={billingSameAsShipping}
                      placeholder="City" 
                      className="w-full h-10 px-3 py-2 border border-[#c4cdd5] rounded text-[14px] focus:outline-none focus:border-[#2463d1] bg-white text-gray-800 disabled:bg-gray-100 disabled:text-gray-400"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-gray-400 mb-1">State</label>
                    <input 
                      type="text" 
                      value={billingAddress.state} 
                      onChange={(e) => setBillingAddress({ ...billingAddress, state: e.target.value })}
                      disabled={billingSameAsShipping}
                      placeholder="State (e.g. Gujarat) - Required for GST" 
                      className="w-full h-10 px-3 py-2 border border-[#c4cdd5] rounded text-[14px] focus:outline-none focus:border-[#2463d1] bg-white text-gray-800 disabled:bg-gray-100 disabled:text-gray-400"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-gray-400 mb-1">Postal Code</label>
                    <input 
                      type="text" 
                      value={billingAddress.postalCode} 
                      onChange={(e) => setBillingAddress({ ...billingAddress, postalCode: e.target.value })}
                      disabled={billingSameAsShipping}
                      placeholder="Pincode" 
                      className="w-full h-10 px-3 py-2 border border-[#c4cdd5] rounded text-[14px] focus:outline-none focus:border-[#2463d1] bg-white text-gray-800 disabled:bg-gray-100 disabled:text-gray-400"
                    />
                  </div>
                </div>
              </div>

              {/* Customer Notes */}
              <div className="pt-4 border-t border-gray-100">
                <label className="block text-xs font-bold text-gray-500 mb-1">Customer Notes / Special Instructions</label>
                <textarea 
                  value={orderNotes} 
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="No special instructions provided by buyer" 
                  className="w-full h-20 px-3 py-2 border border-[#c4cdd5] rounded text-[14px] focus:outline-none focus:border-[#2463d1] bg-white text-gray-800 resize-none"
                />
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: SUMMARY & ACTION CONTROLS */}
        <div className="space-y-8 lg:col-span-1">
          
          {/* STICKY CONTAINER WRAPPER */}
          <div className="sticky top-6 space-y-6">

            {/* CARD 1: FINANCIAL SUMMARY */}
            <div className="bg-white border border-[#d5dce4] rounded shadow-sm">
              <div className="p-5 border-b border-[#d5dce4]">
                <h3 className="text-[16px] font-semibold text-[#1a1a1a] mb-4">Summary</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-[14px] text-[#6d7175]">
                    <span>
                      Subtotal<br />
                      <span className="text-[12px]">{items.length} items</span>
                    </span>
                    <span className="text-[#202223] font-semibold">{formatCurrency(summary.subtotal)}</span>
                  </div>

                  {summary.discount > 0 && (
                    <div className="flex justify-between text-[14px] text-red-500">
                      <span>Discount</span>
                      <span className="font-semibold">- {formatCurrency(summary.discount)}</span>
                    </div>
                  )}

                  {/* Splits taxes into CGST & SGST or IGST based on State */}
                  {isTaxExempt ? (
                    <div className="flex justify-between text-[14px] text-[#6d7175]">
                      <span>Tax (GST)</span>
                      <span className="font-semibold text-green-600">Exempted</span>
                    </div>
                  ) : isGujarat ? (
                    <>
                      <div className="flex justify-between text-[14px] text-[#6d7175]">
                        <span>CGST (9%)</span>
                        <span className="text-[#202223] font-semibold">{formatCurrency(summary.tax / 2)}</span>
                      </div>
                      <div className="flex justify-between text-[14px] text-[#6d7175]">
                        <span>SGST (9%)</span>
                        <span className="text-[#202223] font-semibold">{formatCurrency(summary.tax / 2)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-[14px] text-[#6d7175]">
                      <span>IGST (18%)</span>
                      <span className="text-[#202223] font-semibold">{formatCurrency(summary.tax)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-[14px] text-[#6d7175]">
                    <span>Shipping {shippingCostOverride !== "" ? "(Custom)" : "(Auto)"}</span>
                    <span className="text-[#202223] font-semibold">{formatCurrency(summary.shipping)}</span>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-gray-50/50 rounded-b-lg">
                <div className="flex justify-between items-center text-[16px] font-bold text-[#202223] mb-1">
                  <span>Total</span>
                  <span className="text-lg text-blue-600 font-extrabold">{formatCurrency(summary.total)}</span>
                </div>
                {!isTaxExempt && summary.tax > 0 && (
                  <p className="text-right text-[11px] text-gray-500 font-medium italic">
                    Incl. tax {formatCurrency(summary.tax)}
                  </p>
                )}
              </div>
            </div>

            {/* CARD 2: ACTION CONTROLS PANEL */}
            <div className="bg-[#1a202c] border border-slate-800 rounded-xl p-6 text-white shadow-xl">
              <h3 className="text-base font-bold mb-4 tracking-wide text-white border-b border-slate-700 pb-2">
                Action Panel
              </h3>

              <div className="space-y-4">
                {/* Order Status */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Order Pipeline Stage
                  </label>
                  <select 
                    value={orderStatus} 
                    onChange={(e) => setOrderStatus(e.target.value)} 
                    className="w-full h-10 px-3 py-2 border border-slate-700 rounded-xl text-[13px] bg-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Awaiting Processing">Awaiting Processing (Confirmed)</option>
                    <option value="Processing">Processing (Manufacturing/Packing)</option>
                    <option value="Shipped">Shipped (Handed to courier)</option>
                    <option value="Delivered">Delivered (Completed)</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Ready For Pickup">Ready For Pickup</option>
                    <option value="Out for Delivery">Out for Delivery</option>
                    <option value="Returned">Returned</option>
                  </select>
                </div>

                {/* Payment Status */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Payment Status
                  </label>
                  <select 
                    value={paymentStatus} 
                    onChange={(e) => setPaymentStatus(e.target.value)} 
                    className="w-full h-10 px-3 py-2 border border-slate-700 rounded-xl text-[13px] bg-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Awaiting Payment">Awaiting Payment</option>
                    <option value="Paid">Paid (Verified successfully)</option>
                    <option value="Failed">Failed / Rejected</option>
                    <option value="Cancel">Canceled</option>
                    <option value="Refunded">Refunded</option>
                    <option value="Partially Refunded">Partially Refunded</option>
                  </select>
                </div>

                {/* Stock update checkbox */}
                <div className="pt-2">
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-300 font-semibold select-none">
                    <input 
                      type="checkbox" 
                      checked={updateStock}
                      onChange={(e) => setUpdateStock(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-0 mt-0.5 cursor-pointer w-4 h-4"
                    />
                    <div>
                      <span>Update stock</span>
                      <p className="text-[10px] text-slate-400 font-normal leading-tight mt-0.5">
                        Edit order items to see how stock will be updated
                      </p>
                    </div>
                  </label>
                </div>

                {/* Tax invoice checkbox */}
                <div className="pb-2">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300 font-semibold select-none">
                    <input 
                      type="checkbox" 
                      checked={generateTaxInvoice}
                      onChange={(e) => setGenerateTaxInvoice(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-0 cursor-pointer w-4 h-4"
                    />
                    <span>Create tax invoice</span>
                  </label>
                </div>

                {/* Submit button */}
                <button 
                  type="button"
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className="w-full h-11 bg-blue-500 hover:bg-blue-400 text-slate-900 font-black text-sm rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:pointer-events-none mt-2"
                >
                  {isSaving ? "Saving changes..." : "Save Changes"}
                </button>

                {/* Undo Link */}
                <button 
                  type="button"
                  onClick={handleUndoChanges}
                  className="w-full text-center text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center justify-center gap-1 mt-3"
                >
                  <FaUndo size={10} /> Undo changes
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* ==========================================
      // 8. POPUP MODAL: CATALOG PRODUCT SEARCH
      // ========================================== */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-slate-200">
            <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-lg">
              <h3 className="text-base font-bold text-gray-800">Add Item from Catalog</h3>
              <button 
                type="button"
                onClick={() => setShowProductModal(false)} 
                className="text-gray-500 hover:text-black p-1 hover:bg-gray-100 rounded"
              >
                <FaTimes size={18} />
              </button>
            </div>
            
            <div className="relative p-4 border-b">
              <FaSearch className="absolute text-gray-400 transform -translate-y-1/2 top-1/2 left-7" />
              <input 
                type="text" 
                placeholder="Search catalog products by name..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 py-2 border border-[#c4cdd5] rounded focus:outline-none focus:border-blue-500 text-sm bg-white"
              />
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50 max-h-[50vh]">
              {dbProducts.length === 0 ? (
                <p className="py-8 text-center text-gray-500 text-sm">Loading catalog items...</p>
              ) : (
                <div className="space-y-4">
                  {dbProducts
                    .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((product) => (
                      <ProductRow key={product._id} product={product} onAdd={handleAddCatalogItem} />
                  ))}
                  {dbProducts.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                    <p className="py-8 text-center text-gray-500 text-sm">No matching catalog products found.</p>
                  )}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t bg-gray-50 text-right rounded-b-lg">
              <button 
                type="button"
                onClick={() => setShowProductModal(false)} 
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 text-xs font-semibold rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
      // 9. LIGHTBOX MODAL: PAYMENT SCREENSHOT ZOOM
      // ========================================== */}
      {zoomScreenshot && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 cursor-zoom-out"
          onClick={() => setZoomScreenshot(false)}
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <img 
              src={getImageUrl(paymentScreenshot)} 
              alt="UPI Screenshot Zoomed" 
              className="object-contain max-w-full max-h-[85vh] rounded shadow-2xl border border-white/10" 
            />
            <button 
              type="button"
              onClick={() => setZoomScreenshot(false)} 
              className="absolute -top-10 right-0 text-white hover:text-gray-300 text-sm font-bold flex items-center gap-1.5"
            >
              <FaTimes size={16} /> Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

const ToggleSwitch = ({ isOn, handleToggle }) => {
  return (
    <div className="flex items-center cursor-pointer select-none" onClick={handleToggle}>
      <div className={`w-9 h-5 flex items-center rounded-full p-1 transition-colors duration-300 ease-in-out ${isOn ? "bg-[#008060]" : "bg-gray-300"}`}>
        <div className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${isOn ? "translate-x-4" : "translate-x-0"}`}></div>
      </div>
      <span className={`ml-2 text-sm font-medium ${isOn ? "text-[#008060]" : "text-gray-500"}`}>{isOn ? "On" : "Off"}</span>
    </div>
  );
};

export default AdminEditOrder;
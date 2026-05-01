import React, { useState, useEffect } from "react";
import { FaPlus, FaTrash, FaTimes, FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api"; 
import { toast } from "react-hot-toast"; 

// ==========================================
// 🛠️ REUSABLE COMPONENTS
// ==========================================
const ToggleSwitch = ({ isOn, handleToggle }) => {
    return (
        <div className="flex items-center cursor-pointer" onClick={handleToggle}>
            <div className={`w-9 h-5 flex items-center rounded-full p-1 transition-colors duration-300 ease-in-out ${isOn ? "bg-[#008060]" : "bg-gray-300"}`}>
                <div className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${isOn ? "translate-x-4" : "translate-x-0"}`}></div>
            </div>
            <span className={`ml-2 text-sm font-medium ${isOn ? "text-[#008060]" : "text-gray-500"}`}>{isOn ? "On" : "Off"}</span>
        </div>
    );
};

const FormInput = ({ placeholder, value, onChange, className = "", type = "text" }) => (
    <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full h-10 px-3 py-2 border border-[#c4cdd5] rounded text-[14px] focus:outline-none focus:border-[#2463d1] bg-white ${className}`}
    />
);

// ==========================================
// 👕 PRODUCT ROW WITH VARIATION SELECTOR
// ==========================================
const ProductRow = ({ product, onAdd }) => {
    const [selectedVariants, setSelectedVariants] = useState({});

    // Initialize default variants (First option of each attribute)
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

    // Calculate Dynamic Price
    let finalPrice = product.price || 0;
    let variantString = "";
    
    if (product.attributes && product.attributes.length > 0) {
        const variantParts = [];
        Object.keys(selectedVariants).forEach(attrName => {
            const opt = selectedVariants[attrName];
            if (opt) {
                finalPrice += (opt.priceAdjustment || 0); // Add extra cost if any
                variantParts.push(`${attrName}: ${opt.value}`);
            }
        });
        variantString = variantParts.join(", ");
    }

    return (
        <div className="flex flex-col p-3 bg-white border rounded hover:bg-gray-50">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <img src={product.image || product.images?.[0]?.url || "https://placehold.co/100"} alt={product.name} className="object-cover w-12 h-12 border border-gray-200 rounded" />
                    <div>
                        <p className="text-sm font-semibold text-gray-800">{product.name}</p>
                        <p className="text-[11px] text-gray-500">Base Price: ₹{product.price} | Stock: {product.stock}</p>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <span className="font-bold text-sm text-[#202223]">₹{finalPrice}</span>
                    <button 
                        onClick={() => onAdd(product, finalPrice, variantString)} 
                        className="px-4 py-1.5 bg-[#2463d1] hover:bg-[#1c51b0] text-white text-[13px] font-medium rounded transition-colors shadow-sm"
                    >
                        Add to Order
                    </button>
                </div>
            </div>

            {/* Render Variation Selectors if Product has attributes */}
            {product.attributes && product.attributes.length > 0 && (
                <div className="flex flex-wrap gap-4 pt-3 mt-3 border-t border-gray-100">
                    {product.attributes.map((attr, i) => (
                        <div key={i} className="flex flex-col w-full gap-1 sm:w-auto">
                            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{attr.name}</label>
                            <select 
                                className="border border-gray-300 rounded px-2 py-1.5 text-sm outline-none focus:border-[#2463d1] bg-white min-w-[120px]"
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
// 🚀 MAIN COMPONENT
// ==========================================
const AdminCreateOrder = () => {
    const navigate = useNavigate();

    // 1. STATE MANAGEMENT
    const [isTaxExempt, setIsTaxExempt] = useState(false);
    const [createTaxInvoice, setCreateTaxInvoice] = useState(true);

    const [customer, setCustomer] = useState({ name: "", email: "", phone: "", companyName: "" });
    const [billingAddress, setBillingAddress] = useState({ 
        addressLine1: "", addressLine2: "", city: "", postalCode: "", state: "Gujarat", country: "India" 
    });
    
    const [items, setItems] = useState([]); 
    const [paymentMethod, setPaymentMethod] = useState("MANUAL TRANSFER");
    const [discountValue, setDiscountValue] = useState("");
    const [discountType, setDiscountType] = useState("FLAT");

    // 🔥 Shipping States
    const [shippingProviders, setShippingProviders] = useState([]); 
    const [shippingMethod, setShippingMethod] = useState(""); 
    const [ratePerKg, setRatePerKg] = useState(0); 
    const [shippingCostOverride, setShippingCostOverride] = useState(""); 
    
    // Summary
    const [summary, setSummary] = useState({ subtotal: 0, discount: 0, tax: 0, shipping: 0, total: 0 });

    // Modals
    const [showProductModal, setShowProductModal] = useState(false);
    const [dbProducts, setDbProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");

    // ==========================================
    // 2. FETCH DATA FROM DATABASE 
    // ==========================================
    useEffect(() => {
        const fetchShipping = async () => {
            try {
                const { data } = await api.get('/shipping');
                if (data.success && data.providers) {
                    const activeProviders = data.providers.filter(p => p.isActive);
                    setShippingProviders(activeProviders);
                    
                    const defaultProv = activeProviders.find(p => p.isDefault);
                    if(defaultProv) {
                        setShippingMethod(defaultProv.name);
                        setRatePerKg(defaultProv.ratePerKg);
                    }
                }
            } catch (error) {
                console.error("Error fetching shipping providers", error);
            }
        };
        fetchShipping();
    }, []);

    useEffect(() => {
        if (showProductModal && dbProducts.length === 0) {
            api.get('/products?limit=500') 
                .then(({ data }) => setDbProducts(data.products || data.data))
                .catch(err => {
                    console.error("Fetch Products Error:", err);
                    toast.error("Failed to load products");
                });
        }
    }, [showProductModal, dbProducts.length]);


    // ==========================================
    // 3. REAL-TIME CALCULATION
    // ==========================================
    useEffect(() => {
        let calcSubtotal = 0;
        let totalWeight = 0;

        items.forEach(item => {
            calcSubtotal += item.unitPrice * item.quantity;
            totalWeight += (item.weightKg || 1) * item.quantity; 
        });

        let calcDiscount = 0;
        const distValNum = Number(discountValue) || 0;
        if (distValNum > 0) {
            calcDiscount = discountType === "%" ? (calcSubtotal * distValNum) / 100 : distValNum;
        }
        let discountedSubtotal = Math.max(0, calcSubtotal - calcDiscount);

        let calcTax = 0;
        if (!isTaxExempt) {
            calcTax = discountedSubtotal * 0.18; 
        }

        let calcShipping = 0;
        if (paymentMethod.includes('STORE PICK-UP')) {
            calcShipping = 0; 
        } else if (shippingCostOverride !== "") {
            calcShipping = Number(shippingCostOverride); 
        } else {
            calcShipping = totalWeight * ratePerKg; 
        }

        setSummary({
            subtotal: calcSubtotal,
            discount: calcDiscount,
            tax: calcTax,
            shipping: calcShipping,
            total: discountedSubtotal + calcTax + calcShipping
        });
    }, [items, discountValue, discountType, isTaxExempt, paymentMethod, shippingCostOverride, ratePerKg]);


    // ==========================================
    // 4. SUBMIT TO BACKEND
    // ==========================================
    const handleCreateOrder = async () => {
        if (items.length === 0) return toast.error("Please add at least one item.");
        if (!customer.name || !customer.phone) return toast.error("Customer Name and Phone are required.");

        let totalWeight = 0;
        items.forEach(itm => totalWeight += (itm.weightKg || 1) * itm.quantity);

        const payload = {
            items,
            shippingInfo: { 
                fullName: customer.name, phone: customer.phone, 
                address: `${billingAddress.addressLine1} ${billingAddress.addressLine2}`.trim(), 
                city: billingAddress.city, state: billingAddress.state, pincode: billingAddress.postalCode 
            },
            billingInfo: { ...billingAddress, fullName: customer.name, phone: customer.phone, companyName: customer.companyName },
            paymentMethod: paymentMethod.includes("STORE PICK-UP") ? "STORE_PICKUP" : paymentMethod === "Cash on Delivery" ? "COD" : "ONLINE",
            deliveryType: paymentMethod.includes("STORE PICK-UP") ? 'pickup' : 'ship',
            selectedShippingProvider: shippingMethod,
            ratePerKg: ratePerKg, 
            shippingWeightKg: totalWeight, 
            shippingAmount: summary.shipping, 
            discount: Number(discountValue) || 0,
            discountType: discountType === "%" ? "PERCENTAGE" : "FLAT",
            isTaxExempt,
            generateTaxInvoice: createTaxInvoice,
        };

        try {
            const res = await api.post('/orders/admin/create', payload);
            if (res.data.success) {
                toast.success("Order Created Successfully!");
                navigate('/admin/orders');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to create order");
        }
    };

    // ==========================================
    // 5. HELPER FUNCTIONS
    // ==========================================
    const handleShippingDropdown = (e) => {
        const val = e.target.value;
        setShippingMethod(val);
        const provider = shippingProviders.find(p => p.name === val);
        if (provider) {
            setRatePerKg(provider.ratePerKg);
        } else {
            setRatePerKg(0);
        }
    };

    // 🔥 MODIFIED: Ab finalPrice aur variant string bhi aayega
    const addProductToOrder = (product, finalPrice, variantString) => {
        const itemName = variantString ? `${product.name} (${variantString})` : product.name;
        
        const newItem = {
            productId: product._id,
            name: itemName, // E.g., "T-Shirt (Size: L, Color: Red)"
            sku: product.sku || "N/A",
            image: product.image || product.images?.[0]?.url || "https://placehold.co/100",
            unitPrice: finalPrice, 
            quantity: 1,
            weightKg: product.weightKg || 1,
            selectedVariantInfo: variantString // Backend save ke liye
        };
        setItems([...items, newItem]);
        toast.success(`${itemName} added to order`);
        setShowProductModal(false);
    };

    const updateItem = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = Number(value) > 0 ? Number(value) : 1;
        setItems(newItems);
    };

    const currentWeight = items.reduce((acc, itm) => acc + ((itm.weightKg || 1) * itm.quantity), 0);
    const autoCalcShippingCost = currentWeight * ratePerKg;

    return (
        <div className="min-h-screen bg-[#f4f6f8] p-4 sm:p-6 lg:p-8 font-sans text-[#202223] relative">
            <div className="max-w-6xl mx-auto mb-6">
                <h2 className="text-[24px] font-bold text-[#1a1a1a]">Create Order</h2>
            </div>

            <div className="grid max-w-6xl grid-cols-1 gap-6 mx-auto lg:grid-cols-12">
                
                {/* LEFT COLUMN */}
                <div className="flex flex-col gap-6 lg:col-span-8">
                    
                    {/* Customer Section */}
                    <div className="bg-white border border-[#d5dce4] rounded shadow-sm p-5">
                        <h3 className="text-[16px] font-semibold mb-4">Customer Details</h3>
                        <div className="flex flex-col gap-4">
                            <FormInput placeholder="Full Name" value={customer.name} onChange={(e) => setCustomer({...customer, name: e.target.value})} />
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <FormInput placeholder="Email address (Optional)" value={customer.email} onChange={(e) => setCustomer({...customer, email: e.target.value})} />
                                <FormInput placeholder="Phone number (Required)" value={customer.phone} onChange={(e) => setCustomer({...customer, phone: e.target.value})} />
                            </div>
                            <FormInput placeholder="Company name (Optional)" value={customer.companyName} onChange={(e) => setCustomer({...customer, companyName: e.target.value})} />
                            <div className="flex items-center gap-3 mt-2">
                                <span className="text-[14px] font-medium text-[#202223]">Mark order as tax-exempt</span>
                                <ToggleSwitch isOn={isTaxExempt} handleToggle={() => setIsTaxExempt(!isTaxExempt)} />
                            </div>
                        </div>
                    </div>

                    {/* Order Items Section */}
                    <div className="bg-white border border-[#d5dce4] rounded shadow-sm p-5">
                        <h3 className="text-[16px] font-semibold mb-4">Order Items</h3>
                        
                        {items.length > 0 && (
                            <div className="mb-4 space-y-3">
                                {items.map((itm, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 border border-gray-200 rounded bg-gray-50">
                                        <div className="flex items-center gap-3">
                                            <img src={itm.image} alt={itm.name} className="object-cover w-12 h-12 border rounded" />
                                            <div>
                                                <p className="text-sm font-semibold text-gray-800">{itm.name}</p>
                                                <p className="text-xs text-gray-500">Weight: {itm.weightKg || 1}kg | SKU: {itm.sku}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col items-center">
                                                <span className="mb-1 text-xs text-gray-500">Unit Price (₹)</span>
                                                <input type="number" className="w-20 px-2 py-1 text-sm text-center border rounded" value={itm.unitPrice} onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)} />
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <span className="mb-1 text-xs text-gray-500">Qty</span>
                                                <input type="number" className="w-16 px-2 py-1 text-sm text-center border rounded" value={itm.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} />
                                            </div>
                                            <div className="flex flex-col items-end w-20">
                                                <span className="mb-1 text-xs text-gray-500">Total</span>
                                                <span className="text-sm font-semibold">₹{(itm.unitPrice * itm.quantity).toFixed(2)}</span>
                                            </div>
                                            <button onClick={() => setItems(items.filter((_, i) => i !== idx))} className="mt-4 text-red-500 hover:text-red-700"><FaTrash size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <button onClick={() => setShowProductModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[#2463d1] text-white text-[14px] font-medium rounded hover:bg-[#1c51b0]">
                            <FaPlus className="text-[12px]" /> Add Item from Catalog
                        </button>
                    </div>

                    {/* Shipping Section */}
                    <div className="bg-white border border-[#d5dce4] rounded shadow-sm p-5">
                        <h3 className="text-[16px] font-semibold mb-4">Shipping and delivery (Total Weight: {currentWeight} kg)</h3>
                        <div className="flex gap-4 mb-4">
                            <select value={shippingMethod} onChange={handleShippingDropdown} className="w-full h-10 px-3 py-2 border border-[#c4cdd5] rounded text-[14px] text-gray-700 bg-white">
                                <option value="">Select Delivery Partner</option>
                                {shippingProviders.map(provider => (
                                    <option key={provider._id} value={provider.name}>
                                        {provider.name} (₹{provider.ratePerKg}/kg)
                                    </option>
                                ))}
                            </select>
                            <input 
                                type="number" 
                                placeholder={shippingMethod ? `Auto: ₹${autoCalcShippingCost}` : "Cost (₹)"} 
                                value={shippingCostOverride} 
                                onChange={(e) => setShippingCostOverride(e.target.value)} 
                                className="w-1/2 h-10 px-3 py-2 border border-[#c4cdd5] rounded text-[14px]" 
                                title="Leave blank for auto-calculation. Type a number to override."
                            />
                        </div>
                        {shippingCostOverride === "" && shippingMethod !== "" && (
                            <p className="mt-1 text-xs text-green-600">Auto calculated: {currentWeight}kg × ₹{ratePerKg} = ₹{autoCalcShippingCost}</p>
                        )}
                    </div>

                    {/* Discounts Section */}
                    <div className="bg-white border border-[#d5dce4] rounded shadow-sm p-5">
                        <h3 className="text-[16px] font-semibold mb-4">Discounts</h3>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="flex flex-1 border border-[#c4cdd5] rounded overflow-hidden bg-white">
                                <input type="number" placeholder="Discount Amount" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} className="flex-1 px-3 py-2 text-[14px] focus:outline-none" />
                                <div className="border-l border-[#c4cdd5] bg-gray-50">
                                    <select value={discountType} onChange={(e) => setDiscountType(e.target.value)} className="h-full px-3 py-2 text-[14px] text-[#2463d1] font-medium bg-transparent outline-none">
                                        <option value="FLAT">₹</option>
                                        <option value="%">%</option>
                                    </select>
                                </div>
                            </div>
                            <button onClick={() => setDiscountValue("")} className="p-2 text-[#2463d1] hover:bg-blue-50 rounded">
                                <FaTrash className="text-[14px]" />
                            </button>
                        </div>
                    </div>

                    {/* Payment & Billing Section */}
                    <div className="bg-white border border-[#d5dce4] rounded shadow-sm p-6">
                        <h3 className="text-[18px] font-bold mb-4">Payment & Address</h3>
                        <div className="mb-6">
                            <label className="block text-[12px] text-gray-500 mb-1 ml-1">Payment Method:</label>
                            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full h-10 px-3 py-2 border border-[#c4cdd5] rounded text-[13px] bg-white">
                                <option>MANUAL TRANSFER</option>
                                <option>Cash on Delivery</option>
                                <option>Online Payment</option>
                                <option>STORE PICK-UP (THIS IS NOT CASH ON DELIVERY OPTION)</option>
                            </select>
                        </div>
                        <h4 className="text-[14px] font-bold mb-3">Address</h4>
                        <div className="flex flex-col gap-3">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <FormInput placeholder="State (e.g. Gujarat) - Required for GST" value={billingAddress.state} onChange={(e) => setBillingAddress({...billingAddress, state: e.target.value})} />
                                <FormInput placeholder="City" value={billingAddress.city} onChange={(e) => setBillingAddress({...billingAddress, city: e.target.value})} />
                            </div>
                            <FormInput placeholder="Address line 1" value={billingAddress.addressLine1} onChange={(e) => setBillingAddress({...billingAddress, addressLine1: e.target.value})} />
                            <FormInput placeholder="Postal code" value={billingAddress.postalCode} onChange={(e) => setBillingAddress({...billingAddress, postalCode: e.target.value})} />
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN - SUMMARY */}
                <div className="lg:col-span-4">
                    <div className="bg-white border border-[#d5dce4] rounded shadow-sm sticky top-6">
                        <div className="p-5 border-b border-[#d5dce4]">
                            <h3 className="text-[16px] font-semibold mb-4">Summary</h3>
                            <div className="flex justify-between text-[14px] text-[#6d7175] mb-2">
                                <span>Subtotal<br /><span className="text-[12px]">{items.length} items</span></span>
                                <span>₹{summary.subtotal.toFixed(2)}</span>
                            </div>
                            {summary.discount > 0 && (
                                <div className="flex justify-between text-[14px] text-red-500 mb-2">
                                    <span>Discount</span>
                                    <span>- ₹{summary.discount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-[14px] text-[#6d7175] mb-2">
                                <span>Shipping {shippingCostOverride ? '(Custom)' : '(Auto)'}</span>
                                <span>₹{summary.shipping.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-[14px] text-[#6d7175] mb-2">
                                <span>Tax (GST) {isTaxExempt && <span className="font-semibold text-green-500">(Exempt)</span>}</span>
                                <span>₹{summary.tax.toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="p-5">
                            <div className="flex justify-between items-center text-[16px] font-bold text-[#202223] mb-6">
                                <span>Total</span>
                                <span>₹{summary.total.toFixed(2)}</span>
                            </div>
                            <button onClick={handleCreateOrder} className="w-full bg-[#008060] hover:bg-[#006e52] text-white font-medium py-2.5 px-4 rounded mb-6 transition-colors shadow-sm">
                                Create Order
                            </button>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-[14px] font-medium text-[#202223]">Create tax invoice</span>
                                <ToggleSwitch isOn={createTaxInvoice} handleToggle={() => setCreateTaxInvoice(!createTaxInvoice)} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* PRODUCT SEARCH MODAL */}
            {showProductModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                            <h3 className="text-lg font-bold">Select Product</h3>
                            <button onClick={() => setShowProductModal(false)} className="text-gray-500 hover:text-black">
                                <FaTimes size={20} />
                            </button>
                        </div>
                        <div className="relative p-4 border-b">
                            <FaSearch className="absolute text-gray-400 transform -translate-y-1/2 top-1/2 left-7" />
                            <input 
                                type="text" 
                                placeholder="Search by product name..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:border-[#2463d1]"
                            />
                        </div>
                        <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                            {dbProducts.length === 0 ? (
                                <p className="py-8 text-center text-gray-500">Loading products...</p>
                            ) : (
                                <div className="space-y-4">
                                    {dbProducts
                                        .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                        .map((product) => (
                                            /* 🔥 AB YAHAN NAYA VARIATION COMPONENT USE HOGA */
                                            <ProductRow key={product._id} product={product} onAdd={addProductToOrder} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCreateOrder;
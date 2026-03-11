import { useEffect, useMemo, useState } from "react";
import { FaFileAlt, FaShoppingCart } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useQuote } from "../context/QuoteContext";
import { getProductById } from "../services/productService";

const round2 = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;
const toText = (value) => String(value || "").trim();

const optionToConfig = (option) => {
  if (option && typeof option === "object" && !Array.isArray(option)) {
    const label = String(option.label || "").trim();
    return {
      label,
      priceAdjustment: Number.isFinite(Number(option.priceAdjustment)) ? Number(option.priceAdjustment) : 0,
    };
  }
  return {
    label: String(option || "").trim(),
    priceAdjustment: 0,
  };
};

const getFieldOptions = (field) => (field?.options || []).map(optionToConfig);

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToQuote } = useQuote();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCustomFields, setSelectedCustomFields] = useState({});
  const [customFieldError, setCustomFieldError] = useState("");

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        const { data } = await getProductById(id);
        setProduct(data.product);
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [id]);

  useEffect(() => {
    if (!product) return;
    const initialSelections = {};
    (product.customFields || []).forEach((field) => {
      const fieldKey = String(field._id || field.label || "");
      if (!fieldKey) return;
      if (field.type === "checkbox") {
        initialSelections[fieldKey] = [];
      } else if (field.type === "radio") {
        const firstOption = getFieldOptions(field)[0];
        initialSelections[fieldKey] = firstOption?.label || "";
      } else {
        initialSelections[fieldKey] = "";
      }
    });
    setSelectedCustomFields(initialSelections);
    setCustomFieldError("");
  }, [product]);

  const pricing = useMemo(() => {
    const basePrice = Number(product?.price || 0);
    const gstRate = Number(product?.gstRate || 0);
    let optionAdjustment = 0;

    (product?.customFields || []).forEach((field) => {
      const fieldKey = String(field._id || field.label || "");
      const selectedValue = selectedCustomFields[fieldKey];
      if (!selectedValue || (Array.isArray(selectedValue) && selectedValue.length === 0)) return;

      const options = (field.options || []).map(optionToConfig);
      const selectedValues = Array.isArray(selectedValue) ? selectedValue : [selectedValue];
      selectedValues.forEach((value) => {
        const safeValue = String(value || "").trim();
        const matchedOption = options.find((opt) => opt.label === safeValue);
        optionAdjustment += matchedOption?.priceAdjustment || 0;
      });
    });

    const taxableUnit = round2(Math.max(0, basePrice + optionAdjustment));
    const gstAmount = round2((taxableUnit * gstRate) / 100);
    const unitPrice = round2(taxableUnit + gstAmount);

    return {
      basePrice: round2(basePrice),
      optionAdjustment: round2(optionAdjustment),
      gstRate: round2(gstRate),
      gstAmount,
      unitPrice,
    };
  }, [product, selectedCustomFields]);

  const hasMissingRequiredCustomFields = () => {
    for (const field of product?.customFields || []) {
      if (!field.required) continue;
      const fieldKey = String(field._id || field.label || "");
      const value = selectedCustomFields[fieldKey];
      if (field.type === "checkbox") {
        if (!Array.isArray(value) || value.length === 0) return true;
      } else if (!value || String(value).trim() === "") {
        return true;
      }
    }
    return false;
  };

  const buildProductWithSelections = () => {
    const resolvedImage =
      product.images?.[0]?.url ||
      product.images?.[0] ||
      product.image ||
      "https://placehold.co/600x400/f3f4f6/a1a1aa?text=No+Image";

    return {
      ...product,
      image: resolvedImage,
      price: pricing.unitPrice,
      originalBasePrice: product.price,
      selectedCustomFields,
      pricingSnapshot: pricing,
    };
  };

  const handleRadioChange = (fieldKey, value) => {
    setSelectedCustomFields((prev) => ({ ...prev, [fieldKey]: value }));
    setCustomFieldError("");
  };

  const handleCheckboxChange = (fieldKey, value, checked) => {
    setSelectedCustomFields((prev) => {
      const current = Array.isArray(prev[fieldKey]) ? prev[fieldKey] : [];
      const updated = checked ? [...current, value] : current.filter((item) => item !== value);
      return { ...prev, [fieldKey]: updated };
    });
    setCustomFieldError("");
  };

  const handleTextChange = (fieldKey, value) => {
    setSelectedCustomFields((prev) => ({ ...prev, [fieldKey]: value }));
    setCustomFieldError("");
  };

  const handleAddToCart = () => {
    if (hasMissingRequiredCustomFields()) {
      setCustomFieldError("Please select all required options before adding to cart.");
      return;
    }
    addToCart(buildProductWithSelections(), 1);
    alert("Added to Cart successfully!");
  };

  const handleAddToQuote = () => {
    if (hasMissingRequiredCustomFields()) {
      setCustomFieldError("Please select all required options before requesting quote.");
      return;
    }
    addToQuote(buildProductWithSelections(), 1);
    navigate("/quotation");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-orange-500 rounded-full border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center mt-20 text-center">
        <p className="text-2xl font-semibold text-gray-800">Product not found.</p>
        <button
          onClick={() => navigate("/products")}
          className="px-6 py-3 mt-6 text-white transition-all shadow-md bg-orange-600 rounded-xl hover:bg-orange-700 hover:shadow-lg"
        >
          Go Back to Store
        </button>
      </div>
    );
  }

  const isOutOfStock = product.stock === 0;
  const categoryTrail = toText(product.category)
    .split("/")
    .map((part) => toText(part))
    .filter(Boolean);
  const shippingCharge = Number(product.shippingCharge || 0);

  const productDetails = Array.isArray(product.details) ? product.details : [];
  const resolvedLength =
    productDetails.find((item) => toText(item.key).includes("LENGTH"))?.value || "--";
  const resolvedWidth =
    productDetails.find((item) => toText(item.key) === "WIDTH" || toText(item.key).includes("WIDTH"))
      ?.value || "--";
  const resolvedHoles =
    productDetails.find((item) => toText(item.key).includes("TOTAL HOLES"))?.value ||
    productDetails.find((item) => toText(item.key).includes("HOLES"))?.value ||
    "--";
  const detailList = productDetails.reduce((acc, item) => {
    const key = toText(item.key).toUpperCase();
    if (!key) return acc;
    if (key.includes("TOTAL HOLES")) return acc;
    if (key === "WIDTH" || key.includes("WIDTH")) return acc;
    if (key.includes("LENGTH")) return acc;
    const signature = `${key}::${toText(item.value)}`.toLowerCase();
    if (acc._seen.has(signature)) return acc;
    acc._seen.add(signature);
    acc.items.push(item);
    return acc;
  }, { items: [], _seen: new Set() }).items;

  return (
    <div className="max-w-7xl px-4 py-10 mx-auto sm:px-6 lg:px-8">
      {/* MAIN GRID CONTAINER 
        'items-start' is crucial here. It prevents the left column from stretching 
        to the height of the right column, allowing 'sticky' to work. 
      */}
      <div className="grid gap-10 md:grid-cols-2 items-start lg:gap-16">
        
        {/* ================= LEFT COLUMN: STICKY IMAGE ================= */}
        <div className="sticky top-24 z-10 flex flex-col items-center justify-center p-6 bg-white border border-gray-100 shadow-xl rounded-3xl">
          <img
            src={product.images?.[0]?.url || product.image || "https://placehold.co/600x400/f3f4f6/a1a1aa?text=No+Image"}
            alt={product.name}
            className={`object-contain w-full h-auto max-h-[600px] transition-transform duration-500 hover:scale-105 ${isOutOfStock ? "grayscale opacity-70" : ""}`}
          />
        </div>

        {/* ================= RIGHT COLUMN: SCROLLABLE DETAILS ================= */}
        <div className="flex flex-col px-2 py-4 md:px-6">
          
          {/* Header Section */}
          <div className="mb-6">
            <p className="mb-2 text-xs font-semibold tracking-widest text-orange-600 uppercase">
              {categoryTrail.join(" / ") || "Store / Product"}
            </p>
            <h1 className="text-3xl font-bold leading-tight text-gray-900 md:text-4xl uppercase">{product.name}</h1>
            <p className="mt-2 text-sm text-gray-500">SKU: <span className="font-mono text-gray-800">{toText(product.sku) || "DEMO"}</span></p>
          </div>

          {/* Pricing Box */}
          <div className="p-6 mb-8 border border-orange-200 bg-orange-50/50 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between text-sm font-medium text-gray-600">
              <span>Base price</span>
              <span>Rs. {pricing.basePrice.toLocaleString("en-IN")}</span>
            </div>
            {pricing.optionAdjustment !== 0 && (
              <div className="flex items-center justify-between mt-2 text-sm font-medium text-gray-600">
                <span>Option adjustment</span>
                <span>
                  {pricing.optionAdjustment >= 0 ? "+" : "-"} Rs. {Math.abs(pricing.optionAdjustment).toLocaleString("en-IN")}
                </span>
              </div>
            )}
            {pricing.gstRate > 0 && (
              <div className="flex items-center justify-between mt-2 text-sm font-medium text-gray-600">
                <span>GST ({pricing.gstRate}%)</span>
                <span>Rs. {pricing.gstAmount.toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="flex items-center justify-between mt-2 text-sm font-medium text-gray-600">
              <span>Shipping Charge</span>
              {shippingCharge > 0 ? (
                <span>Rs. {shippingCharge.toLocaleString("en-IN")}</span>
              ) : (
                <span className="px-2 py-0.5 text-xs font-bold text-green-700 bg-green-100 rounded-full">FREE</span>
              )}
            </div>
            
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-orange-200">
              <h2 className="text-lg font-bold text-gray-800">Total Price</h2>
              <h2 className="text-3xl font-black text-orange-600">Rs. {pricing.unitPrice.toLocaleString("en-IN")}</h2>
            </div>
          </div>

          {/* Custom Fields (Options) */}
          {(product.customFields || []).length > 0 && (
            <div className="mb-8 space-y-6">
              {(product.customFields || []).map((field) => {
                const fieldKey = String(field._id || field.label || "");
                const selectedValue = selectedCustomFields[fieldKey];
                const options = getFieldOptions(field);

                return (
                  <div key={fieldKey} className="space-y-3">
                    <p className="text-sm font-bold tracking-wide text-gray-800 uppercase">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </p>

                    {/* Radio Options */}
                    {field.type === "radio" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {options.map((option) => (
                          <label
                            key={`${fieldKey}-${option.label}`}
                            className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-all ${
                              selectedValue === option.label 
                                ? "border-orange-500 bg-orange-50 ring-1 ring-orange-500" 
                                : "border-gray-200 hover:border-orange-300 hover:bg-gray-50"
                            }`}
                          >
                            <span className="flex items-center gap-3 text-sm font-medium text-gray-700">
                              <input
                                type="radio"
                                name={fieldKey}
                                value={option.label}
                                checked={selectedValue === option.label}
                                onChange={(e) => handleRadioChange(fieldKey, e.target.value)}
                                className="w-4 h-4 text-orange-600 accent-orange-600 focus:ring-orange-500"
                              />
                              {option.label}
                            </span>
                            {option.priceAdjustment !== 0 && (
                              <span className="text-xs font-bold text-gray-500">
                                {option.priceAdjustment >= 0 ? "+" : "-"}₹{Math.abs(option.priceAdjustment)}
                              </span>
                            )}
                          </label>
                        ))}
                      </div>
                    )}

                    {/* Checkbox Options */}
                    {field.type === "checkbox" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {options.map((option) => {
                          const isChecked = Array.isArray(selectedValue) ? selectedValue.includes(option.label) : false;
                          return (
                            <label
                              key={`${fieldKey}-${option.label}`}
                              className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-all ${
                                isChecked 
                                  ? "border-orange-500 bg-orange-50 ring-1 ring-orange-500" 
                                  : "border-gray-200 hover:border-orange-300 hover:bg-gray-50"
                              }`}
                            >
                              <span className="flex items-center gap-3 text-sm font-medium text-gray-700">
                                <input
                                  type="checkbox"
                                  value={option.label}
                                  checked={isChecked}
                                  onChange={(e) => handleCheckboxChange(fieldKey, option.label, e.target.checked)}
                                  className="w-4 h-4 text-orange-600 rounded accent-orange-600 focus:ring-orange-500"
                                />
                                {option.label}
                              </span>
                              {option.priceAdjustment !== 0 && (
                                <span className="text-xs font-bold text-gray-500">
                                  {option.priceAdjustment >= 0 ? "+" : "-"}₹{Math.abs(option.priceAdjustment)}
                               </span>
                              )}
                            </label>
                          )
                        })}
                      </div>
                    )}

                    {/* Text Options */}
                    {field.type === "text" && (
                      <input
                        type="text"
                        value={typeof selectedValue === "string" ? selectedValue : ""}
                        onChange={(e) => handleTextChange(fieldKey, e.target.value)}
                        placeholder={`Enter ${String(field.label || "").toLowerCase()}`}
                        className="w-full px-4 py-3 text-sm transition-all border border-gray-300 rounded-xl outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Description */}
          <div className="mb-8">
             <h3 className="mb-3 text-lg font-bold text-gray-900">Description</h3>
             <p className="text-sm leading-relaxed text-gray-600">{product.description}</p>
          </div>

          {/* Error & Stock Status */}
          {customFieldError && (
            <div className="p-4 mb-4 text-sm font-semibold text-red-700 border border-red-200 rounded-xl bg-red-50 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              {customFieldError}
            </div>
          )}

          <div className="mb-6">
            <span className={`inline-flex items-center px-3 py-1 text-sm font-bold rounded-full ${isOutOfStock ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
              {isOutOfStock ? "Out of stock" : "In stock"}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-4 sm:flex-row pb-8 border-b border-gray-200">
            <button
              disabled={isOutOfStock}
              onClick={handleAddToCart}
              className="flex items-center justify-center flex-1 gap-3 py-4 text-lg font-bold text-white transition-all duration-300 shadow-md bg-orange-600 rounded-2xl hover:bg-orange-700 hover:shadow-lg active:scale-95 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:shadow-none"
            >
              <FaShoppingCart className="text-xl" /> {isOutOfStock ? "Out of Stock" : "Add to Cart"}
            </button>

            <button
              onClick={handleAddToQuote}
              className="flex items-center justify-center flex-1 gap-3 py-4 text-lg font-bold text-gray-800 transition-all duration-300 bg-white border-2 border-gray-200 shadow-sm rounded-2xl hover:bg-gray-50 hover:border-gray-300 hover:shadow active:scale-95"
            >
              <FaFileAlt className="text-xl text-gray-600" /> Request Quote
            </button>
          </div>

          {/* Additional Product Details */}
          <div className="pt-8">
            <h3 className="mb-4 text-lg font-bold text-gray-900">Specifications</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs font-semibold text-gray-500 uppercase">Length</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{resolvedLength}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs font-semibold text-gray-500 uppercase">Width</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{resolvedWidth}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs font-semibold text-gray-500 uppercase">Total Holes</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{resolvedHoles}</p>
              </div>
            </div>

            {detailList.length > 0 && (
              <div className="mt-6">
                <p className="mb-3 text-sm font-bold text-gray-700">Other Details</p>
                <ul className="space-y-2">
                  {detailList.slice(0, 10).map((item) => (
                    <li key={`${item.key}-${item.value}`} className="flex justify-between py-2 text-sm border-b border-gray-100 last:border-0">
                      <span className="text-gray-500">{item.key}</span>
                      <span className="font-medium text-gray-900">{item.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
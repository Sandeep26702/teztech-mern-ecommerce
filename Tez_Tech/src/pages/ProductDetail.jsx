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
        const firstOption = optionToConfig(field.options?.[0]);
        initialSelections[fieldKey] = firstOption.label || "";
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
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-orange-500 rounded-full border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mt-10 text-center">
        <p className="text-xl text-red-500">Product not found.</p>
        <button
          onClick={() => navigate("/products")}
          className="px-4 py-2 mt-4 text-white transition bg-orange-600 rounded-lg hover:bg-orange-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  const isOutOfStock = product.stock === 0;
  const categoryTrail = toText(product.category)
    .split("/")
    .map((part) => toText(part))
    .filter(Boolean);

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
    <div className="max-w-6xl px-4 py-8 mx-auto sm:px-6 lg:px-8">
      <div className="grid gap-8 p-4 bg-gray-100 md:grid-cols-2 rounded-2xl">
        <div className="flex items-center justify-center p-3 bg-white border border-gray-200 rounded-xl">
          <img
            src={product.images?.[0]?.url || product.image || "https://placehold.co/600x400/f3f4f6/a1a1aa?text=No+Image"}
            alt={product.name}
            className={`object-contain w-full h-auto max-h-[700px] ${isOutOfStock ? "grayscale opacity-70" : ""}`}
          />
        </div>

        <div className="flex flex-col">
          <h1 className="text-3xl font-semibold leading-tight text-gray-900 uppercase">{product.name}</h1>
          <p className="mt-2 text-xs tracking-wide text-gray-600 uppercase">
            {categoryTrail.join(" / ") || "Store / Product"}
          </p>
          <p className="mt-3 text-sm text-gray-700">SKU {toText(product.sku) || "DEMO"}</p>

          <div className="p-4 mt-5 border border-orange-100 bg-orange-50 rounded-xl">
            <div className="flex items-center justify-between text-sm font-medium text-gray-700">
              <span>Base price</span>
              <span>Rs. {pricing.basePrice.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex items-center justify-between mt-1 text-sm font-medium text-gray-700">
              <span>Option adjustment</span>
              <span>
                {pricing.optionAdjustment >= 0 ? "+" : "-"} Rs. {Math.abs(pricing.optionAdjustment).toLocaleString("en-IN")}
              </span>
            </div>
            {pricing.gstRate > 0 && (
              <div className="flex items-center justify-between mt-1 text-sm font-medium text-gray-700">
                <span>GST ({pricing.gstRate}%)</span>
                <span>Rs. {pricing.gstAmount.toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-orange-200">
              <h2 className="text-xl font-black text-gray-900">Total Price</h2>
              <h2 className="text-2xl font-black text-orange-600">Rs. {pricing.unitPrice.toLocaleString("en-IN")}</h2>
            </div>
          </div>

          {(product.customFields || []).length > 0 && (
            <div className="mt-6 space-y-5">
              {(product.customFields || []).map((field) => {
                const fieldKey = String(field._id || field.label || "");
                const selectedValue = selectedCustomFields[fieldKey];
                const options = (field.options || []).map(optionToConfig);

                return (
                  <div key={fieldKey} className="space-y-2">
                    <p className="text-sm font-bold tracking-wide text-gray-900 uppercase">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </p>

                    {field.type === "radio" && (
                      <div className="space-y-2">
                        {options.map((option) => (
                          <label
                            key={`${fieldKey}-${option.label}`}
                            className="flex items-center justify-between gap-3 p-1.5 text-sm text-gray-700 transition rounded-md cursor-pointer hover:bg-gray-50"
                          >
                            <span className="flex items-center gap-2">
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
                            <span className="text-xs font-semibold text-gray-500">
                              {option.priceAdjustment >= 0 ? "+" : "-"}Rs. {Math.abs(option.priceAdjustment)}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}

                    {field.type === "checkbox" && (
                      <div className="space-y-2">
                        {options.map((option) => (
                          <label
                            key={`${fieldKey}-${option.label}`}
                            className="flex items-center justify-between gap-3 p-1.5 text-sm text-gray-700 transition rounded-md cursor-pointer hover:bg-gray-50"
                          >
                            <span className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                value={option.label}
                                checked={Array.isArray(selectedValue) ? selectedValue.includes(option.label) : false}
                                onChange={(e) => handleCheckboxChange(fieldKey, option.label, e.target.checked)}
                                className="w-4 h-4 text-orange-600 rounded accent-orange-600 focus:ring-orange-500"
                              />
                              {option.label}
                            </span>
                            <span className="text-xs font-semibold text-gray-500">
                              {option.priceAdjustment >= 0 ? "+" : "-"}Rs. {Math.abs(option.priceAdjustment)}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}

                    {field.type === "text" && (
                      <input
                        type="text"
                        value={typeof selectedValue === "string" ? selectedValue : ""}
                        onChange={(e) => handleTextChange(fieldKey, e.target.value)}
                        placeholder={`Enter ${String(field.label || "").toLowerCase()}`}
                        className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <p className="mt-5 text-sm leading-relaxed text-gray-600">{product.description}</p>

          {customFieldError && (
            <p className="p-3 mt-4 mb-2 text-sm font-medium text-red-600 border border-red-100 rounded-lg bg-red-50">
              {customFieldError}
            </p>
          )}

          <p className={`mt-4 font-medium ${isOutOfStock ? "text-red-600" : "text-green-700"}`}>
            {isOutOfStock ? "Out of stock" : "In stock"}
          </p>

          <div className="flex gap-4 pt-5 mt-5 border-t border-gray-200">
            <button
              disabled={isOutOfStock}
              onClick={handleAddToCart}
              className="flex items-center justify-center flex-1 gap-2 py-4 text-base font-bold text-white transition-all duration-300 bg-orange-600 rounded-xl hover:bg-orange-700 active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <FaShoppingCart /> {isOutOfStock ? "Out of Stock" : "Add to Cart"}
            </button>

            <button
              onClick={handleAddToQuote}
              className="flex items-center justify-center flex-1 gap-2 py-4 text-base font-bold text-gray-700 transition-all duration-300 bg-gray-100 border border-gray-200 rounded-xl hover:bg-gray-200 hover:text-gray-900 active:scale-95"
            >
              <FaFileAlt /> Request Quote
            </button>
          </div>

          <div className="pt-4 mt-5 border-t border-gray-200">
            <p className="text-base font-semibold text-gray-900">Product Details</p>
            <p className="mt-1 text-sm text-gray-700">LENGTH: {resolvedLength}</p>
            <p className="text-sm text-gray-700">WIDTH: {resolvedWidth}</p>
            <p className="text-sm text-gray-700">TOTAL HOLES: {resolvedHoles}</p>
            {detailList.length > 0 && (
              <div className="mt-3 space-y-1">
                {detailList.slice(0, 10).map((item) => (
                  <p key={`${item.key}-${item.value}`} className="text-xs text-gray-600">
                    {item.key}: {item.value}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;

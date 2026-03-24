import { useEffect, useMemo, useState } from "react";
import { FaFileAlt, FaShoppingCart, FaShareAlt } from "react-icons/fa";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useQuote } from "../context/QuoteContext";
import { getProductById } from "../services/productService";

const round2 = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;
const toText = (value) => String(value || "").trim();
const hasMeaningfulValue = (value) => {
  if (value === undefined || value === null) return false;
  const raw = String(value).trim();
  if (!raw) return false;
  const parsed = Number(raw);
  if (Number.isFinite(parsed) && parsed === 0) return false;
  return true;
};

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
  const location = useLocation();
  const { addToCart } = useCart();
  const { addToQuote } = useQuote();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCustomFields, setSelectedCustomFields] = useState({});
  const [customFieldError, setCustomFieldError] = useState("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);

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

    const preselected = location.state?.selectedCustomFields || null;
    if (preselected && typeof preselected === "object") {
      (product.customFields || []).forEach((field) => {
        const fieldKey = String(field._id || field.label || "");
        if (!fieldKey) return;
        const labelKey = String(field.label || "");
        let selectedValue =
          preselected[fieldKey] ?? (labelKey ? preselected[labelKey] : undefined);
        if (selectedValue === undefined || selectedValue === null) return;

        if (field.type === "checkbox") {
          const rawValues = Array.isArray(selectedValue) ? selectedValue : [selectedValue];
          const options = getFieldOptions(field).map((opt) => opt.label);
          const normalized = rawValues
            .map((val) => String(val || "").trim())
            .filter(Boolean);
          initialSelections[fieldKey] = options.length
            ? normalized.filter((val) => options.includes(val))
            : normalized;
        } else if (field.type === "radio") {
          const value = String(selectedValue || "").trim();
          if (!value) return;
          const options = getFieldOptions(field).map((opt) => opt.label);
          if (options.length === 0 || options.includes(value)) {
            initialSelections[fieldKey] = value;
          }
        } else {
          initialSelections[fieldKey] = String(selectedValue ?? "");
        }
      });
    }

    setSelectedCustomFields(initialSelections);
    setCustomFieldError("");
    setActiveImageIndex(0);
  }, [product, location.state]);

  const pricing = useMemo(() => {
    const basePrice = Number(product?.sellingPrice ?? product?.price ?? 0);
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
    const basePrice = Number(product?.sellingPrice ?? product?.price ?? 0);

    return {
      ...product,
      image: resolvedImage,
      price: pricing.unitPrice,
      originalBasePrice: basePrice,
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
      setCustomFieldError("Please select all required options.");
      window.scrollBy({ top: -100, behavior: "smooth" });
      return;
    }
    addToCart(buildProductWithSelections(), 1);
    alert("Added to Cart successfully!");
  };

  const handleAddToQuote = () => {
    if (hasMissingRequiredCustomFields()) {
      setCustomFieldError("Please select all required options.");
      window.scrollBy({ top: -100, behavior: "smooth" });
      return;
    }
    addToQuote(buildProductWithSelections(), 1);
    navigate("/quotation");
  };

  const handleShare = async () => {
    const shareData = {
      title: product?.name || "Product",
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const imageList = useMemo(() => {
    if (!product) return [];
    const images = Array.isArray(product.images) ? product.images : [];
    const normalized = images.map((img) => (typeof img === "string" ? img : img?.url)).filter(Boolean);
    if (normalized.length) return normalized;
    if (product.image) return [product.image];
    return [];
  }, [product]);

  const activeImage = imageList[activeImageIndex] || "https://placehold.co/600x400/f3f4f6/a1a1aa?text=No+Image";

  const goPrevImage = () => {
    if (!imageList.length) return;
    setActiveImageIndex((prev) => (prev - 1 + imageList.length) % imageList.length);
  };

  const goNextImage = () => {
    if (!imageList.length) return;
    setActiveImageIndex((prev) => (prev + 1) % imageList.length);
  };

  const handleTouchStart = (event) => {
    const touch = event.touches?.[0];
    if (touch) setTouchStartX(touch.clientX);
  };

  const handleTouchEnd = (event) => {
    if (touchStartX === null) return;
    const touch = event.changedTouches?.[0];
    if (!touch) return;
    const delta = touch.clientX - touchStartX;
    if (Math.abs(delta) > 40) {
      if (delta > 0) goPrevImage();
      else goNextImage();
    }
    setTouchStartX(null);
  };

  const specFallback = [
    { key: "LENGTH", value: product?.heightFt || product?.length },
    { key: "WIDTH", value: product?.widthFt || product?.width },
    { key: "MATERIAL ", value: product?.materialType },
  ];

  const specRows = (product?.details?.length ? product.details : specFallback)
    .map((item) => ({ key: toText(item.key), value: toText(item.value) }))
    .filter((item) => item.key && hasMeaningfulValue(item.value));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-6 h-6 border-2 border-gray-600 rounded-full border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
        <p className="text-lg font-medium text-gray-800">Product not found.</p>
        <button onClick={() => navigate("/products")} className="px-4 py-2 mt-4 text-sm text-white bg-gray-800 rounded hover:bg-black">Go Back</button>
      </div>
    );
  }

  const isOutOfStock = Number(product.stock) === 0;
  const categoryTrail = toText(product.categoryPath || product.category).split("/").map(toText).filter(Boolean);

  return (
    <div className="max-w-6xl px-4 py-8 mx-auto font-sans text-gray-900 bg-white sm:px-6 lg:px-8">
      <div className="grid gap-10 md:grid-cols-12 md:items-start">
        
        {/* === LEFT: IMAGE SECTION === */}
        <div className="relative flex flex-col md:col-span-7 group">
          {/* Simple Share Button */}
          <button 
            onClick={handleShare}
            className="absolute z-10 flex items-center justify-center w-10 h-10 text-gray-600 transition-colors rounded-full shadow top-4 right-4 bg-white/90 hover:bg-white hover:text-gray-900"
            title="Share this product"
          >
            <FaShareAlt size={16} />
          </button>

          <div
            className="relative flex items-center justify-center w-full overflow-hidden border border-gray-100 rounded-lg bg-gray-50 group"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={activeImage}
              alt={product.name}
              className={`object-contain w-full h-auto min-h-[350px] max-h-[550px] transition-transform duration-500 group-hover:scale-105 ${isOutOfStock ? "grayscale opacity-70" : ""}`}
            />
            {imageList.length > 1 && (
              <>
                <button onClick={goPrevImage} className="absolute flex items-center justify-center w-8 h-8 text-xl text-gray-500 -translate-y-1/2 rounded-full shadow left-4 top-1/2 hover:text-gray-900 bg-white/80">‹</button>
                <button onClick={goNextImage} className="absolute flex items-center justify-center w-8 h-8 text-xl text-gray-500 -translate-y-1/2 rounded-full shadow right-4 top-1/2 hover:text-gray-900 bg-white/80">›</button>
              </>
            )}
          </div>

          {imageList.length > 1 && (
            <div className="flex gap-2 pb-2 mt-4 overflow-x-auto scrollbar-hide">
              {imageList.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImageIndex(index)}
                  className={`flex-shrink-0 w-16 h-16 border p-1 rounded-md transition-all ${
                    index === activeImageIndex ? "border-gray-800" : "border-gray-200 hover:border-gray-400"
                  }`}
                >
                  <img src={img} alt="Thumb" className="object-cover w-full h-full mix-blend-multiply" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* === RIGHT: DETAILS SECTION === */}
        <div className="flex flex-col px-1 md:col-span-5 md:px-0">
          
          <div className="flex flex-col gap-1 mb-4">
            <p className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">{categoryTrail.join(" / ") || "STORE"}</p>
            <h1 className="text-xl font-extrabold leading-snug text-gray-900 uppercase sm:text-2xl">
              {product.name}
            </h1>
            <p className="text-[11px] text-gray-500 uppercase mt-1">
              SKU: <span className="font-mono text-gray-600">{toText(product.sku) || "DEMO"}</span>
            </p>
          </div>

          <div className="flex items-center justify-between p-4 mb-6 border border-gray-100 rounded-lg bg-gray-50/50">
            <h2 className="text-3xl font-black text-gray-900">₹{pricing.unitPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</h2>
            <p className="text-[11px] text-right font-medium text-gray-500">
              Incl. GST ({pricing.gstRate}%)<br/>₹{pricing.gstAmount.toFixed(2)}
            </p>
          </div>

          {(product.customFields || []).length > 0 && (
            <div className="mb-6 space-y-5">
              {(product.customFields || []).map((field) => {
                const fieldKey = String(field._id || field.label || "");
                const selectedValue = selectedCustomFields[fieldKey];
                const options = getFieldOptions(field);

                return (
                  <div key={fieldKey} className="space-y-2">
                    <p className="text-[11px] font-semibold text-gray-800 uppercase tracking-wide flex items-center gap-1">
                      {field.label} {field.required && <span className="text-lg leading-none text-red-500">*</span>}
                    </p>

                    {(field.type === "radio" || field.type === "checkbox") && (
                      <div className="flex flex-col space-y-2">
                        {options.map((option) => {
                          const isChecked = field.type === "radio" 
                            ? selectedValue === option.label 
                            : (Array.isArray(selectedValue) && selectedValue.includes(option.label));

                          return (
                            <label key={option.label} className="flex items-center cursor-pointer group p-1.5 rounded-md hover:bg-gray-50 transition-colors">
                              <input
                                type={field.type}
                                name={fieldKey}
                                value={option.label}
                                checked={isChecked}
                                onChange={(e) => field.type === "radio" ? handleRadioChange(fieldKey, e.target.value) : handleCheckboxChange(fieldKey, option.label, e.target.checked)}
                                className="w-4 h-4 text-gray-900 bg-white border-gray-300 cursor-pointer focus:ring-gray-900"
                              />
                              <span className={`ml-3 text-sm transition-colors ${isChecked ? "text-gray-900 font-semibold" : "text-gray-700"}`}>
                                {option.label}
                                {option.priceAdjustment !== 0 && (
                                  <span className={`text-[11px] font-medium ml-1.5 ${isChecked ? "text-gray-900" : "text-gray-400"}`}>
                                    ({option.priceAdjustment >= 0 ? "+" : "-"} ₹{Math.abs(option.priceAdjustment).toFixed(2)})
                                  </span>
                                )}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {field.type === "text" && (
                      <input
                        type="text"
                        value={typeof selectedValue === "string" ? selectedValue : ""}
                        onChange={(e) => handleTextChange(fieldKey, e.target.value)}
                        placeholder="Type here..."
                        className="w-full max-w-sm px-3 py-2.5 text-sm border border-gray-300 rounded-md outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-all"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className={`mb-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold tracking-wide ${
              isOutOfStock ? "bg-red-50 text-red-700 border border-red-100" : "bg-green-50 text-green-700 border border-green-100"
            }`}>
              <span className={`relative inline-flex rounded-full w-2 h-2 ${isOutOfStock ? 'bg-red-500' : 'bg-green-500'}`}></span>
              {isOutOfStock ? "Out of stock" : "In stock & Ready to Ship"}
          </div>

          {customFieldError && (
            <div className="p-3 mb-4 text-xs font-semibold text-red-700 border border-red-200 rounded-md bg-red-50">{customFieldError}</div>
          )}

          {/* Screenshot ke hisaab se exact buttons */}
          <div className="flex flex-col gap-3 pb-6 mb-2 border-b border-gray-100 sm:flex-row">
            {!isOutOfStock ? (
              <button 
                onClick={handleAddToCart} 
                className="flex-1 py-3 px-5 text-sm font-semibold text-white bg-gray-900 hover:bg-black rounded-md transition-colors flex items-center justify-center gap-2.5 shadow-sm"
              >
                <FaShoppingCart size={15} /> Add to Cart
              </button>
            ) : (
              <div className="flex-1 px-5 py-3 text-sm font-semibold text-center text-gray-500 bg-gray-100 border border-gray-200 rounded-md">Available in store</div>
            )}
            
            <button 
              onClick={handleAddToQuote} 
              className="flex-1 py-3 px-5 text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 rounded-md transition-colors flex items-center justify-center gap-2.5 shadow-sm"
            >
              <FaFileAlt size={15} /> Request Custom Quote
            </button>
          </div>

          <div className="pt-2">
            <h3 className="mb-3 text-[12px] font-bold text-gray-900 uppercase tracking-wide">Details</h3>
            
            {product.description && (
              <p className="mb-4 text-sm leading-relaxed text-gray-600 whitespace-pre-line">{product.description}</p>
            )}

            {specRows.length > 0 && (
              <ul className="text-[12px] text-gray-700 space-y-1.5 uppercase tracking-wide">
                {specRows.map((item) => (
                  <li key={item.key}>
                    {item.key}: {item.value}
                  </li>
                ))}
              </ul>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProductDetail;

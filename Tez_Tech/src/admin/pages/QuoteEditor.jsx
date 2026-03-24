import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { 
  FaArrowLeft, FaPaperPlane, FaCopy, FaCheck, 
  FaLink, FaClipboardList, FaWhatsapp, FaEnvelope, FaTrash, FaPlus 
} from "react-icons/fa";
import api from "../../utils/api"; // Axios instance with interceptors for seamless API calls and error handling

const QuoteEditor = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const location = useLocation();
  const viewOldVersion = new URLSearchParams(location.search).get("view") === "1";
  
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [copied, setCopied] = useState(false);

  const [adminNotes, setAdminNotes] = useState("");
  const [extraDiscountType, setExtraDiscountType] = useState("flat");
  const [extraDiscountValue, setExtraDiscountValue] = useState("");
  const [shippingCharge, setShippingCharge] = useState("");
  const [gstPercentage, setGstPercentage] = useState("");
  const [additionalChargeName, setAdditionalChargeName] = useState("");
  const [additionalChargeAmount, setAdditionalChargeAmount] = useState("");
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productSelections, setProductSelections] = useState({});
  const [expandedRequirements, setExpandedRequirements] = useState({});
  const [isLatest, setIsLatest] = useState(true);
  const [latestQuoteId, setLatestQuoteId] = useState(null);
  const [latestVersion, setLatestVersion] = useState(null);
  const [versionOptions, setVersionOptions] = useState([]);
  const [showTimeline, setShowTimeline] = useState(false);

  const renderSelectedOptions = (item) => {
    const options = Array.isArray(item?.selectedOptions) ? item.selectedOptions : [];
    if (options.length > 0) {
      return (
        <div className="mt-1 space-y-1">
          {options.map((option, idx) => {
            const label = String(option.fieldLabel || "Option").trim();
            const value = String(option.value || "").trim();
            const adj = Number(option.priceAdjustment || 0);
            const adjText = adj ? ` (${adj >= 0 ? "+" : "-"}Rs ${Math.abs(adj)})` : "";
            return (
              <p key={`${item._id || "item"}-${label}-${value}-${idx}`} className="text-[11px] text-gray-500">
                {label}: {value}{adjText}
              </p>
            );
          })}
        </div>
      );
    }

    const selected = item?.selectedCustomFields;
    if (!selected || typeof selected !== "object") return null;
    const product = item.productId && typeof item.productId === "object" ? item.productId : null;
    if (product) {
      const resolved = resolveSelections(product, selected);
      if (resolved.selectedOptions.length > 0) {
        return (
          <div className="mt-1 space-y-1">
            {resolved.selectedOptions.map((option, idx) => {
              const label = String(option.fieldLabel || "Option").trim();
              const value = String(option.value || "").trim();
              const adj = Number(option.priceAdjustment || 0);
              const adjText = adj ? ` (${adj >= 0 ? "+" : "-"}Rs ${Math.abs(adj)})` : "";
              return (
                <p key={`${item._id || "item"}-resolved-${label}-${value}-${idx}`} className="text-[11px] text-gray-500">
                  {label}: {value}{adjText}
                </p>
              );
            })}
          </div>
        );
      }
    }
    const fields = Array.isArray(item?.productId?.customFields) ? item.productId.customFields : [];
    const getLabel = (key) => {
      const match = fields.find(
        (field) =>
          String(field?._id || "") === String(key) ||
          String(field?.label || "").toLowerCase() === String(key || "").toLowerCase()
      );
      return String(match?.label || key || "").trim();
    };
    const lines = Object.entries(selected)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          if (!value.length) return null;
          return `${getLabel(key)}: ${value.join(", ")}`;
        }
        if (!String(value || "").trim()) return null;
        return `${getLabel(key)}: ${value}`;
      })
      .filter(Boolean);
    if (lines.length === 0) return null;

    return (
      <div className="mt-1 space-y-1">
        {lines.map((line, idx) => (
          <p key={`${item._id || "item"}-cf-${idx}`} className="text-[11px] text-gray-500">
            {line}
          </p>
        ))}
      </div>
    );
  };

  const getSelectionValue = (item, field) => {
    const key = String(field?._id || field?.label || "");
    if (!key) return field?.type === "checkbox" ? [] : "";
    const selected = item?.selectedCustomFields || {};
    return selected[key] ?? selected[field?.label] ?? (field?.type === "checkbox" ? [] : "");
  };

  const updateItemSelection = (itemId, field, value, checked) => {
    const key = String(field?._id || field?.label || "");
    if (!key) return;
    setQuote((prev) => {
      if (!prev?.requestedItems) return prev;
      const updatedItems = prev.requestedItems.map((item) => {
        if (item._id !== itemId) return item;
        const current = item.selectedCustomFields || {};
        let nextValue = value;
        if (field.type === "checkbox") {
          const currentArr = Array.isArray(current[key]) ? current[key] : [];
          nextValue = checked
            ? [...currentArr, value]
            : currentArr.filter((entry) => String(entry) !== String(value));
        }
        const nextSelections = {
          ...current,
          [key]: nextValue,
        };
        const product = item.productId && typeof item.productId === "object" ? item.productId : null;
        const { selectedOptions, optionAdjustment } = resolveSelections(product, nextSelections);
        const basePrice = Number(product?.price || item.basePrice || 0);
        const rawOriginal = item.originalPrice;
        const originalPrice =
          rawOriginal === "" || rawOriginal === null || rawOriginal === undefined
            ? basePrice + optionAdjustment
            : Number(rawOriginal);
        const rawOffered = item.offeredPrice;
        const offeredPrice =
          rawOffered === "" || rawOffered === null || rawOffered === undefined
            ? originalPrice
            : Number(rawOffered);
        return {
          ...item,
          basePrice,
          optionAdjustment,
          originalPrice: Number.isFinite(originalPrice) ? originalPrice : basePrice + optionAdjustment,
          offeredPrice: Number.isFinite(offeredPrice) ? offeredPrice : basePrice + optionAdjustment,
          selectedCustomFields: nextSelections,
          selectedOptions,
        };
      });
      return { ...prev, requestedItems: updatedItems };
    });
  };

  const renderEditableSelections = (item) => {
    const fields = Array.isArray(item?.productId?.customFields) ? item.productId.customFields : [];
    if (fields.length === 0) return null;

    return (
      <div className="mt-2 space-y-2">
        {fields.map((field) => {
          const fieldKey = String(field?._id || field?.label || "");
          if (!fieldKey) return null;
          const selectedValue = getSelectionValue(item, field);
          const options = Array.isArray(field.options) ? field.options : [];

          return (
            <div key={`${item._id}-${fieldKey}`} className="text-[11px] text-gray-600">
              <div className="font-semibold text-gray-700">{field.label || "Option"}</div>
              {field.type === "radio" && (
                <div className="mt-1 flex flex-wrap gap-2">
                  {options.map((opt) => {
                    const label = String(opt?.label || "").trim();
                    if (!label) return null;
                    return (
                      <label key={`${fieldKey}-${label}`} className="flex items-center gap-1.5">
                        <input
                          type="radio"
                          name={`${item._id}-${fieldKey}`}
                          value={label}
                          checked={String(selectedValue) === label}
                          onChange={() => updateItemSelection(item._id, field, label)}
                          className="accent-blue-600"
                        />
                        <span>{label}</span>
                      </label>
                    );
                  })}
                </div>
              )}
              {field.type === "checkbox" && (
                <div className="mt-1 flex flex-wrap gap-2">
                  {options.map((opt) => {
                    const label = String(opt?.label || "").trim();
                    if (!label) return null;
                    const isChecked = Array.isArray(selectedValue)
                      ? selectedValue.map(String).includes(label)
                      : false;
                    return (
                      <label key={`${fieldKey}-${label}`} className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => updateItemSelection(item._id, field, label, e.target.checked)}
                          className="accent-blue-600"
                        />
                        <span>{label}</span>
                      </label>
                    );
                  })}
                </div>
              )}
              {field.type === "text" && (
                <input
                  type="text"
                  value={typeof selectedValue === "string" ? selectedValue : ""}
                  onChange={(e) => updateItemSelection(item._id, field, e.target.value)}
                  className="mt-1 w-full max-w-xs rounded border border-gray-200 px-2 py-1 text-[11px] focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const toggleRequirementView = (itemId) => {
    setExpandedRequirements((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const fetchProducts = async (keyword = "") => {
    try {
      setProductsLoading(true);
      const res = await api.get("/products", { params: { keyword, limit: 12 } });
      setProducts(res.data.products || []);
    } catch (error) {
      console.error("Product fetch error:", error);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  const openProductPicker = async () => {
    setShowProductPicker(true);
    setSelectedProduct(null);
    setProductSelections({});
    await fetchProducts(productSearch);
  };

  const closeProductPicker = () => {
    setShowProductPicker(false);
    setSelectedProduct(null);
    setProductSelections({});
  };

  const handlePickProduct = (product) => {
    setSelectedProduct(product);
    const initialSelections = {};
    (product.customFields || []).forEach((field) => {
      const key = String(field._id || field.label || "");
      if (!key) return;
      if (field.type === "checkbox") {
        initialSelections[key] = [];
      } else if (field.type === "radio") {
        const first = (field.options || [])[0];
        initialSelections[key] = String(first?.label || "");
      } else {
        initialSelections[key] = "";
      }
    });
    setProductSelections(initialSelections);
  };

  const handleProductSelectionChange = (field, value, checked) => {
    const key = String(field?._id || field?.label || "");
    if (!key) return;
    setProductSelections((prev) => {
      let nextValue = value;
      if (field.type === "checkbox") {
        const currentArr = Array.isArray(prev[key]) ? prev[key] : [];
        nextValue = checked
          ? [...currentArr, value]
          : currentArr.filter((entry) => String(entry) !== String(value));
      }
      return { ...prev, [key]: nextValue };
    });
  };

  const addSelectedProductToQuote = () => {
    if (!selectedProduct) return;
    const hasMissingRequired = (selectedProduct.customFields || []).some((field) => {
      if (!field.required) return false;
      const key = String(field._id || field.label || "");
      const value = productSelections[key] ?? productSelections[field.label];
      if (field.type === "checkbox") {
        return !Array.isArray(value) || value.length === 0;
      }
      return !value || String(value).trim() === "";
    });
    if (hasMissingRequired) {
      alert("Please select all required options.");
      return;
    }
    const { selectedOptions, optionAdjustment } = resolveSelections(selectedProduct, productSelections);
    const basePrice = Number(selectedProduct.price || 0);
    const originalPrice = basePrice + optionAdjustment;
    const newItem = {
      _id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      productId: selectedProduct,
      name: selectedProduct.name || "Product",
      quantity: 1,
      basePrice,
      optionAdjustment,
      originalPrice,
      offeredPrice: originalPrice,
      selectedCustomFields: productSelections,
      selectedOptions,
    };

    setQuote((prev) => ({
      ...prev,
      requestedItems: [...(prev?.requestedItems || []), newItem],
    }));
    closeProductPicker();
  };

  useEffect(() => {
    fetchQuoteDetails();
  }, [id, viewOldVersion]);

  const fetchQuoteDetails = async () => {
    try {
      const response = await api.get(`/admin/quote/${id}`);
      if (
        !viewOldVersion &&
        response.data.isLatest === false &&
        response.data.latestQuoteId &&
        String(response.data.latestQuoteId) !== String(id)
      ) {
        navigate(`/admin/quotes/${response.data.latestQuoteId}`, { replace: true });
        return;
      }
      setQuote(response.data.quote);
      setAdminNotes(response.data.quote.adminNotes || "");
      setExtraDiscountType(response.data.quote.extraDiscountType || "flat");
      const discountValue =
        response.data.quote.extraDiscountValue ?? response.data.quote.totalDiscount ?? "";
      setExtraDiscountValue(discountValue === null || discountValue === undefined ? "" : discountValue);
      setShippingCharge(response.data.quote.shippingCharge ?? "");
      setGstPercentage(response.data.quote.gstPercentage ?? "");
      setAdditionalChargeName(response.data.quote.additionalChargeName || "");
      setAdditionalChargeAmount(response.data.quote.additionalChargeAmount ?? "");
      setIsLatest(response.data.isLatest !== false);
      setLatestQuoteId(response.data.latestQuoteId || null);
      setLatestVersion(response.data.latestVersion || null);
      setVersionOptions(response.data.versions || []);
      
      if (response.data.quote.quoteToken && response.data.quote.status !== "Pending") {
         const generatedLink = `${window.location.origin}/quote/${response.data.quote.quoteToken}`;
         setShareLink(generatedLink);
      }
    } catch (error) {
      console.error("Error fetching quote:", error);
      alert("Failed to load quote details.");
    } finally {
      setLoading(false);
    }
  };

  const handleItemChange = (itemId, field, value) => {
    let parsedValue = value;
    if (field !== "name") {
      parsedValue = value === "" ? "" : Number(value);
    }
    
    const updatedItems = quote.requestedItems.map(item => 
      item._id === itemId ? { ...item, [field]: parsedValue } : item
    );
    setQuote({ ...quote, requestedItems: updatedItems });
  };

  const resolveSelections = (product, selections) => {
    if (!product || !Array.isArray(product.customFields)) {
      return { selectedOptions: [], optionAdjustment: 0 };
    }
    const selectedOptions = [];
    let optionAdjustment = 0;

    product.customFields.forEach((field) => {
      const fieldKey = String(field._id || field.label || "");
      const selectedValue = selections[fieldKey] ?? selections[field.label];
      if (!selectedValue || (Array.isArray(selectedValue) && !selectedValue.length)) return;

      const options = Array.isArray(field.options) ? field.options : [];
      const selectedValues = Array.isArray(selectedValue) ? selectedValue : [selectedValue];
      selectedValues.forEach((value) => {
        const safeValue = String(value || "").trim();
        if (!safeValue) return;
        const matched = options.find((opt) => String(opt.label || "").trim() === safeValue);
        const adj = Number(matched?.priceAdjustment || 0);
        optionAdjustment += Number.isFinite(adj) ? adj : 0;
        selectedOptions.push({
          fieldLabel: String(field.label || fieldKey || "Option").trim(),
          value: safeValue,
          priceAdjustment: Number.isFinite(adj) ? adj : 0,
        });
      });
    });

    return { selectedOptions, optionAdjustment };
  };

  const getLineId = (item) =>
    String(item?._id || item?.productId?._id || item?.productId || "");

  const handleRemoveItem = (itemId) => {
    if (!window.confirm("Are you sure you want to remove this item?")) return;
    const targetId = String(itemId || "");
    setQuote((prev) => {
      if (!prev?.requestedItems) return prev;
      const updatedItems = prev.requestedItems.filter(
        (item) => getLineId(item) !== targetId
      );
      return { ...prev, requestedItems: updatedItems };
    });
  };

  // Add product into the quote editor (admin flow)
  const handleAddItem = () => {
    openProductPicker();
  };

  const calculateSubTotal = () => {
    if (!quote || !quote.requestedItems) return 0;
    return quote.requestedItems.reduce((acc, item) => {
      const quantity = Number(item.quantity || 0);
      const offered = Number(item.offeredPrice);
      const base = Number(item.originalPrice || item.price || 0);
      const unit = Number.isFinite(offered) ? offered : base;
      return acc + quantity * unit;
    }, 0);
  };

  const round2 = (value) => Math.round(Number(value || 0) * 100) / 100;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitResponse = async (e) => {
    e.preventDefault();

    if (!isLatest) {
      alert("You are viewing an older version. Please open the latest version to update this quote.");
      return;
    }
    
    if (quote.requestedItems.length === 0) {
      alert("⚠️ You must have at least one item in the quotation before submitting.");
      return;
    }

    const hasEmptyNames = quote.requestedItems.some(item => !item.name || item.name.trim() === "");
    if(hasEmptyNames) {
      alert("⚠️ Please enter a product name for all items.");
      return;
    }

    setSubmitting(true);

    const subTotal = calculateSubTotal();
    const safeDiscountType = extraDiscountType === "percent" ? "percent" : "flat";
    const rawDiscountValue = Number(extraDiscountValue || 0);
    const safeDiscountValue =
      safeDiscountType === "percent"
        ? Math.min(100, Math.max(0, rawDiscountValue))
        : Math.max(0, rawDiscountValue);
    const discountAmount =
      safeDiscountType === "percent" ? round2(subTotal * (safeDiscountValue / 100)) : safeDiscountValue;
    const safeShipping = Math.max(0, Number(shippingCharge || 0));
    const safeGst = Math.min(100, Math.max(0, Number(gstPercentage || 0)));
    const gstAmount = round2(subTotal * (safeGst / 100));
    const safeAdditional = Math.max(0, Number(additionalChargeAmount || 0));
    const finalTotal = Math.max(0, subTotal - discountAmount + safeShipping + gstAmount + safeAdditional);

    const itemsToSubmit = quote.requestedItems.map(item => {
      const productId = item.productId?._id || item.productId || null;
      const originalFallback = item.originalPrice === "" || item.originalPrice === null || item.originalPrice === undefined
        ? Number(item.price || 0)
        : Number(item.originalPrice);
      const originalPrice = Number.isFinite(originalFallback) ? originalFallback : 0;
      const offeredFallback = item.offeredPrice === "" || item.offeredPrice === null || item.offeredPrice === undefined
        ? originalPrice
        : Number(item.offeredPrice);
      const offeredPrice = Number.isFinite(offeredFallback) ? offeredFallback : originalPrice;
      const qtyFallback = item.quantity === "" || item.quantity === null || item.quantity === undefined
        ? 1
        : Number(item.quantity);
      const quantity = Number.isFinite(qtyFallback) ? Math.max(1, Math.floor(qtyFallback)) : 1;

      const normalizedItem = {
        ...item,
        productId,
        name: String(item.name || "").trim(),
        quantity,
        originalPrice,
        offeredPrice,
      };

      if (item._id.startsWith("custom-")) {
        const { _id, ...rest } = item;
        return { ...rest, ...normalizedItem, _id: undefined }; 
      }
      return normalizedItem;
    });

    const updateData = {
      requestedItems: itemsToSubmit, 
      adminNotes,
      totalDiscount: discountAmount,
      extraDiscountType: safeDiscountType,
      extraDiscountValue: safeDiscountValue,
      shippingCharge: safeShipping,
      gstPercentage: safeGst,
      additionalChargeName: String(additionalChargeName || "").trim(),
      additionalChargeAmount: safeAdditional,
      finalTotal,
      validUntil: new Date(new Date().setDate(new Date().getDate() + 7)) 
    };

    try {
      const response = await api.put(`/admin/quote/${id}`, updateData);
      alert("✅ Quote updated successfully!");
      
      setQuote(response.data.quote); 
      
      const newLink = response.data.link || `${window.location.origin}/quote/${response.data.quote.quoteToken}`;
      setShareLink(newLink);
      navigate(`/quote/${response.data.quote.quoteToken}`);
      
    } catch (error) {
      console.error("Error sending response:", error);
      if (error.response?.status === 409 && error.response?.data?.latestQuoteId) {
        alert("A newer version exists. Opening the latest version now.");
        navigate(`/admin/quotes/${error.response.data.latestQuoteId}`);
      } else {
        alert("❌ Failed to process quote. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-10 font-medium text-center text-gray-500">Loading quote details...</div>;
  if (!quote) return <div className="p-10 font-medium text-center text-red-500">Quote not found!</div>;

  const subTotal = calculateSubTotal();
  const safeDiscountType = extraDiscountType === "percent" ? "percent" : "flat";
  const rawDiscountValue = Number(extraDiscountValue || 0);
  const safeDiscountValue =
    safeDiscountType === "percent"
      ? Math.min(100, Math.max(0, rawDiscountValue))
      : Math.max(0, rawDiscountValue);
  const discountAmount =
    safeDiscountType === "percent" ? round2(subTotal * (safeDiscountValue / 100)) : safeDiscountValue;
  const safeShipping = Math.max(0, Number(shippingCharge || 0));
  const safeGst = Math.min(100, Math.max(0, Number(gstPercentage || 0)));
  const gstAmount = round2(subTotal * (safeGst / 100));
  const safeAdditional = Math.max(0, Number(additionalChargeAmount || 0));
  const finalTotal = Math.max(0, subTotal - discountAmount + safeShipping + gstAmount + safeAdditional);
  const timelineEntries = Array.isArray(quote.quoteLogs)
    ? [...quote.quoteLogs].sort((a, b) => new Date(a.at) - new Date(b.at))
    : [];
  const versionsList = versionOptions.length
    ? versionOptions
    : [
        {
          _id: quote._id,
          version: quote.version || 1,
          status: quote.status,
          updatedAt: quote.updatedAt,
        },
      ];

  const getItemKey = (item) => item?.productId?._id || item?.productId || String(item?.name || "");

  const buildVersionChangeMap = (versions) => {
    if (!Array.isArray(versions) || versions.length === 0) return {};
    const sorted = [...versions].sort((a, b) => (a.version || 0) - (b.version || 0));
    const changes = {};

    for (let i = 0; i < sorted.length; i += 1) {
      const current = sorted[i];
      const prev = sorted[i - 1];
      if (!prev) {
        changes[current._id] = [{ label: "Created", className: "bg-gray-100 text-gray-700" }];
        continue;
      }

      const prevItems = Array.isArray(prev.requestedItems) ? prev.requestedItems : [];
      const currItems = Array.isArray(current.requestedItems) ? current.requestedItems : [];
      const prevMap = new Map(prevItems.map((item) => [String(getItemKey(item)), item]));
      const currMap = new Map(currItems.map((item) => [String(getItemKey(item)), item]));

      const added = currItems.filter((item) => !prevMap.has(String(getItemKey(item))));
      const removed = prevItems.filter((item) => !currMap.has(String(getItemKey(item))));

      let qtyChanged = false;
      let priceDown = false;
      let priceUp = false;
      currItems.forEach((item) => {
        const key = String(getItemKey(item));
        const prevItem = prevMap.get(key);
        if (!prevItem) return;
        if (Number(prevItem.quantity || 0) !== Number(item.quantity || 0)) qtyChanged = true;
        const prevPrice = Number(prevItem.offeredPrice || 0);
        const nextPrice = Number(item.offeredPrice || 0);
        if (nextPrice < prevPrice) priceDown = true;
        if (nextPrice > prevPrice) priceUp = true;
      });

      const discountChanged =
        Number(prev.totalDiscount || 0) !== Number(current.totalDiscount || 0) ||
        String(prev.extraDiscountType || "") !== String(current.extraDiscountType || "") ||
        Number(prev.extraDiscountValue || 0) !== Number(current.extraDiscountValue || 0);

      const chargesChanged =
        Number(prev.shippingCharge || 0) !== Number(current.shippingCharge || 0) ||
        Number(prev.gstPercentage || 0) !== Number(current.gstPercentage || 0) ||
        Number(prev.additionalChargeAmount || 0) !== Number(current.additionalChargeAmount || 0) ||
        String(prev.additionalChargeName || "") !== String(current.additionalChargeName || "");

      const notesChanged = String(prev.adminNotes || "") !== String(current.adminNotes || "");

      const labels = [];
      if (added.length || removed.length) labels.push({ label: "Items", className: "text-purple-700" });
      if (qtyChanged) labels.push({ label: "Qty", className: "text-amber-700" });
      if (priceDown) labels.push({ label: "Price ↓", className: "text-emerald-700" });
      if (!priceDown && priceUp) labels.push({ label: "Price ↑", className: "text-rose-600" });
      if (discountChanged) labels.push({ label: "Discount", className: "text-blue-700" });
      if (chargesChanged) labels.push({ label: "Charges", className: "text-indigo-700" });
      if (notesChanged) labels.push({ label: "Notes", className: "text-slate-600" });

      changes[current._id] =
        labels.length > 0 ? labels : [{ label: "No change", className: "text-gray-500" }];
    }

    return changes;
  };

  const versionChangeMap = buildVersionChangeMap(versionsList);
  const currentVersionChanges = versionChangeMap[quote._id] || [];
  const previousVersionEntry = (() => {
    if (!versionsList || versionsList.length < 2) return null;
    const currentVersion = Number(quote.version || 1);
    const sorted = [...versionsList].sort((a, b) => (a.version || 0) - (b.version || 0));
    let prev = null;
    sorted.forEach((entry) => {
      if (Number(entry.version || 0) < currentVersion) {
        prev = entry;
      }
    });
    return prev;
  })();

  const findPreviousItem = (item) => {
    if (!previousVersionEntry || !Array.isArray(previousVersionEntry.requestedItems)) return null;
    const currentId = item?.productId?._id || item?.productId || null;
    const currentName = String(item?.name || "").trim();
    return previousVersionEntry.requestedItems.find((prevItem) => {
      const prevId = prevItem?.productId?._id || prevItem?.productId || null;
      if (currentId && prevId && String(prevId) === String(currentId)) return true;
      if (currentName && String(prevItem?.name || "").trim() === currentName) return true;
      return false;
    });
  };

  const getHighlightClass = (changed) =>
    changed ? "bg-amber-50 border-amber-300 text-amber-800" : "";

  const discountChanged =
    previousVersionEntry &&
    (String(previousVersionEntry.extraDiscountType || "") !== String(extraDiscountType || "") ||
      Number(previousVersionEntry.extraDiscountValue || 0) !== Number(extraDiscountValue || 0));
  const shippingChanged =
    previousVersionEntry &&
    Number(previousVersionEntry.shippingCharge || 0) !== Number(shippingCharge || 0);
  const gstChanged =
    previousVersionEntry &&
    Number(previousVersionEntry.gstPercentage || 0) !== Number(gstPercentage || 0);
  const additionalChanged =
    previousVersionEntry &&
    (Number(previousVersionEntry.additionalChargeAmount || 0) !== Number(additionalChargeAmount || 0) ||
      String(previousVersionEntry.additionalChargeName || "") !== String(additionalChargeName || ""));
  const formDisabled = !isLatest;

  return (
    <div className="p-4 mx-auto font-sans max-w-7xl sm:p-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 mb-6 font-medium text-gray-500 transition-colors hover:text-blue-600">
        <FaArrowLeft /> Back to Quotes
      </button>
      {!isLatest && latestQuoteId && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">You are viewing an older version of this quote.</p>
              {latestVersion && (
                <p className="text-xs text-amber-700">Latest version: V{latestVersion}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => navigate(`/admin/quotes/${latestQuoteId}`)}
              className="inline-flex items-center justify-center rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-amber-700"
            >
              Open Latest Version
            </button>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* TOP SECTION: Client Info & Sharing        */}
      {/* ========================================= */}
      <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-2">
        
        {/* Client Details Box */}
        <div className="h-full p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
          <h3 className="pb-2 mb-4 text-lg font-bold text-gray-800 border-b">Client Details</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <p><strong className="text-gray-900">Name:</strong> {quote.userDetails.name}</p>
            <p><strong className="text-gray-900">Email:</strong> {quote.userDetails.email || "N/A"}</p>
            <p><strong className="text-gray-900">Phone:</strong> {quote.userDetails.phone || "N/A"}</p>
            <p><strong className="text-gray-900">Company:</strong> {quote.userDetails.company || "N/A"}</p>
            <p><strong className="text-gray-900">Version:</strong> V{quote.version || 1}</p>
            {versionsList.length > 1 && (
              <div className="pt-3 mt-3 border-t border-gray-100">
                <label className="block mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">Switch Version</label>
                <select
                  value={quote._id}
                    onChange={(e) => navigate(`/admin/quotes/${e.target.value}?view=1`)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  {versionsList.map((entry) => (
                    <option key={entry._id} value={entry._id}>
                      {`V${entry.version} • ${entry.status} • ${new Date(entry.updatedAt || Date.now()).toLocaleDateString()}`}
                    </option>
                  ))}
                </select>
                {currentVersionChanges.length > 0 && (
                  <div className="mt-2 text-xs font-semibold text-gray-500">
                    Changes in this version:
                    <div className="mt-1 flex flex-wrap gap-2">
                      {currentVersionChanges.map((badge) => (
                        <span key={`${quote._id}-${badge.label}`} className={badge.className}>
                          {badge.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="p-3 mt-2 border border-gray-100 rounded-lg bg-gray-50">
              <strong className="block mb-1 text-gray-900">Message:</strong> 
              <p className="italic text-gray-600">{quote.userDetails.message || "No notes provided by client."}</p>
            </div>
            <p className="flex items-center pt-4 mt-4 border-t border-gray-100">
              <strong className="mr-2 text-gray-900">Status:</strong> 
              <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide ${
                quote.status === "Pending" ? "bg-yellow-100 text-yellow-800" : 
                quote.status === "Accepted" ? "bg-green-100 text-green-800" :
                quote.status === "Rejected" ? "bg-red-100 text-red-800" :
                quote.status === "Updated" ? "bg-indigo-100 text-indigo-800" :
                quote.status === "Offered" ? "bg-blue-100 text-blue-800" :
                "bg-slate-100 text-slate-800"
              }`}>
                {quote.status}
              </span>
            </p>
          </div>
        </div>

        {/* 🔗 DIRECT LINK & SHARE BOX */}
        <div className="h-full">
          {shareLink ? (
            <div className={`flex flex-col justify-center h-full p-6 border border-green-200 shadow-sm bg-green-50 rounded-2xl ${!isLatest ? "opacity-60 pointer-events-none" : ""}`}>
              <h3 className="flex items-center gap-2 mb-2 text-lg font-bold text-green-900">
                <FaLink /> Shareable Quote Link
              </h3>
              <p className="mb-4 text-xs text-green-700">Link is ready! Send it to the client directly.</p>
              
              <div className="flex mb-4 overflow-hidden transition-all bg-white border border-green-200 rounded-lg focus-within:ring-2 focus-within:ring-green-400">
                <input type="text" value={shareLink} readOnly className="w-full p-3 text-xs text-gray-600 outline-none" />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  disabled={!isLatest}
                  className="flex items-center justify-center gap-2 px-4 text-sm font-medium text-white transition-colors bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed"
                >
                  {copied ? <><FaCheck /> Copied</> : <><FaCopy /> Copy</>}
                </button>
              </div>

              {/* 📲 WhatsApp & Email Buttons */}
              <div className="grid grid-cols-2 gap-3 mt-auto">
                <a 
                  href={
                    !isLatest
                      ? undefined
                      : `https://api.whatsapp.com/send?phone=${quote.userDetails.phone || ""}&text=Hello ${quote.userDetails.name},%0A%0AHere is the custom quotation you requested from Sonani:%0A${shareLink}%0A%0AThank you!`
                  }
                  target={isLatest ? "_blank" : undefined}
                  rel={isLatest ? "noopener noreferrer" : undefined}
                  onClick={(e) => {
                    if (!isLatest) e.preventDefault();
                  }}
                  className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe57] text-white py-2 rounded-lg font-bold text-sm transition-colors"
                >
                  <FaWhatsapp size={16} /> WhatsApp
                </a>
                
                <a 
                  href={
                    !isLatest
                      ? undefined
                      : `mailto:${quote.userDetails.email}?subject=Your Custom Quotation from Sonani&body=Hello ${quote.userDetails.name},%0D%0A%0D%0AHere is the link to view and accept your custom quotation:%0D%0A${shareLink}%0D%0A%0D%0AThank you!`
                  }
                  onClick={(e) => {
                    if (!isLatest) e.preventDefault();
                  }}
                  className="flex items-center justify-center gap-2 py-2 text-sm font-bold text-white transition-colors bg-gray-800 rounded-lg hover:bg-gray-900"
                >
                  <FaEnvelope size={16} /> Email
                </a>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center text-gray-400 border border-gray-200 border-dashed shadow-sm bg-gray-50 rounded-2xl">
               <FaLink size={32} className="mb-3 text-gray-300" />
               <p className="text-sm">Submit the quote setup below<br/>to generate a shareable link.</p>
            </div>
          )}
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="mb-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <button
          type="button"
          onClick={() => setShowTimeline((prev) => !prev)}
          className="flex w-full items-center justify-between text-left text-lg font-bold text-gray-800"
        >
          <span>Activity Timeline</span>
          <span className="text-sm font-semibold text-blue-600">
            {showTimeline ? "Hide" : "Show"}
          </span>
        </button>
        {showTimeline && (
          <div className="mt-4">
            {timelineEntries.length === 0 ? (
              <p className="text-sm text-gray-500">No activity logs yet.</p>
            ) : (
              <div className="space-y-4">
                {timelineEntries.map((entry, idx) => (
                  <div key={`${entry.action}-${entry.at}-${idx}`} className="flex items-start gap-3">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {entry.action}
                        {entry.actor ? ` • ${entry.actor}` : ""}
                      </p>
                      {entry.note && <p className="text-xs text-gray-500">{entry.note}</p>}
                      <p className="text-xs text-gray-400">
                        {new Date(entry.at || entry.createdAt || Date.now()).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================= */}
      {/* BOTTOM SECTION: Full Width Pricing Setup  */}
      {/* ========================================= */}
      <form onSubmit={handleSubmitResponse} className="w-full p-6 bg-white border border-gray-100 shadow-sm md:p-8 rounded-2xl">
        <fieldset disabled={formDisabled} className={formDisabled ? "opacity-60" : ""}>
          <div className="flex items-center justify-between gap-2 mb-6">
          <h3 className="flex items-center gap-2 text-xl font-bold text-gray-800">
            <span className="p-2 text-blue-600 bg-blue-100 rounded-lg"><FaClipboardList size={18} /></span> 
            Pricing Setup
          </h3>
          <button 
            type="button" 
            onClick={handleAddItem}
            disabled={!isLatest}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-bold text-blue-700 transition-colors border border-blue-200 rounded-lg bg-blue-50 hover:bg-blue-100 ${!isLatest ? "opacity-50 cursor-not-allowed hover:bg-blue-50" : ""}`}
          >
            <FaPlus /> Add Item
          </button>
        </div>

        {/* 🛒 Full Width Items Table */}
        <div className="mb-8 overflow-hidden border border-gray-200 rounded-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="text-xs tracking-wider uppercase bg-slate-50 text-slate-600">
                  <th className="p-4 font-semibold min-w-[250px]">Product Name</th>
                  <th className="w-32 p-4 font-semibold text-center min-w-[120px]">Qty</th>
                  <th className="p-4 font-semibold text-right bg-yellow-50/50 min-w-[150px]">Original Price</th>
                  <th className="p-4 font-semibold text-right text-blue-700 min-w-[160px]">Offered Price (₹)</th>
                  <th className="p-4 font-semibold text-right min-w-[140px]">Total (₹)</th>
                  <th className="w-12 p-4 text-center"></th> 
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {quote.requestedItems.length > 0 ? (
                  quote.requestedItems.map((item) => {
                    const basePrice = item.originalPrice !== undefined ? item.originalPrice : (item.price || 0); 
                    const isDiscounted = item.offeredPrice < basePrice;
                    const discountPercent = basePrice > 0 ? Math.round(((basePrice - item.offeredPrice) / basePrice) * 100) : 0;
                    const isRequirementsOpen = Boolean(expandedRequirements[item._id]);
                    const prevItem = findPreviousItem(item);
                    const prevOffered = Number(prevItem?.offeredPrice || 0);
                    const currentOffered = Number(item.offeredPrice || 0);
                    const priceTrend =
                      prevItem && currentOffered < prevOffered
                        ? "down"
                        : prevItem && currentOffered > prevOffered
                          ? "up"
                          : "same";
                    const isNewItem = Boolean(previousVersionEntry) && !prevItem;
                    const nameChanged =
                      isNewItem ||
                      (prevItem && String(prevItem.name || "").trim() !== String(item.name || "").trim());
                    const qtyChanged =
                      isNewItem ||
                      (prevItem && Number(prevItem.quantity || 0) !== Number(item.quantity || 0));
                    const originalChanged =
                      isNewItem ||
                      (prevItem && Number(prevItem.originalPrice || 0) !== Number(item.originalPrice || 0));
                    const offeredChanged =
                      isNewItem ||
                      (prevItem && Number(prevItem.offeredPrice || 0) !== Number(item.offeredPrice || 0));
                    const totalChanged =
                      isNewItem ||
                      (prevItem &&
                        Number(prevItem.offeredPrice || 0) * Number(prevItem.quantity || 0) !==
                          Number(item.offeredPrice || 0) * Number(item.quantity || 0));

                    return (
                      <tr key={item._id} className="transition-colors hover:bg-slate-50/50 group">
                        
                        {/* 📌 Product Name + Requirements */}
                        <td className="p-4 align-middle">
                          <button
                            type="button"
                            onClick={() => toggleRequirementView(item._id)}
                            className={`w-full text-left px-2 py-1 rounded transition-all hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 ${
                              nameChanged ? "bg-amber-50 text-amber-900" : "text-gray-800"
                            }`}
                            title="Click to view requirements"
                          >
                            <div className="font-medium">{item.name || "Unnamed Product"}</div>
                            <div className="text-[11px] text-gray-500">
                              {isRequirementsOpen ? "Hide requirements" : "View requirements"}
                            </div>
                          </button>
                          {isRequirementsOpen && (
                            <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50/70 p-2">
                              {renderSelectedOptions(item) || (
                                <p className="text-[11px] text-gray-500">No requirements selected.</p>
                              )}
                            </div>
                          )}
                          {isDiscounted && item.offeredPrice > 0 && (
                            <div className="text-[10px] font-bold text-green-600 mt-1 ml-2 bg-green-50 inline-block px-1.5 py-0.5 rounded border border-green-200">
                              {discountPercent}% OFF
                            </div>
                          )}
                        </td>
                        
                        {/* ✏️ Editable Quantity */}
                        <td className="p-4 text-center align-middle">
                          <input 
                            type="number" 
                            min="1"
                            value={item.quantity === 0 ? "" : item.quantity}
                            onChange={(e) => handleItemChange(item._id, "quantity", e.target.value)}
                            className={`w-full px-3 py-2 text-sm text-center font-medium transition-all bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                              qtyChanged ? "border-amber-300 bg-amber-50 text-amber-900" : "text-gray-800"
                            }`}
                          />
                        </td>
                        
                        {/* Original Price */}
                        <td className="p-4 align-middle bg-yellow-50/30">
                          <div
                            className={`w-full rounded-lg border border-transparent px-3 py-2 text-sm text-right font-semibold ${
                              isDiscounted ? "text-gray-400 line-through" : originalChanged ? "text-amber-900" : "text-gray-800"
                            } ${originalChanged ? "border-amber-300 bg-amber-50" : ""}`}
                          >
                            ₹ {Number(basePrice || 0).toLocaleString("en-IN")}
                          </div>
                        </td>

                        {/* 💰 Editable Offered Price Field */}
                        <td className="p-4 align-middle">
                          <div className="relative flex items-center">
                            <span className="absolute font-medium text-blue-400 left-3">₹</span>
                            <input 
                              type="number" 
                              min="0"
                              required
                              value={item.offeredPrice === 0 ? "" : item.offeredPrice}
                              onChange={(e) => handleItemChange(item._id, "offeredPrice", e.target.value)}
                              placeholder="0"
                              className={`w-full py-2 pl-7 pr-3 font-bold text-right transition-all border border-blue-200 rounded-lg outline-none bg-blue-50/50 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                priceTrend === "down"
                                  ? "text-emerald-700"
                                  : priceTrend === "up"
                                    ? "text-rose-600"
                                    : "text-blue-900"
                              } ${offeredChanged ? "border-amber-300 bg-amber-50" : ""}`}
                            />
                          </div>
                        </td>

                        {/* Total */}
                        <td className={`p-4 font-bold text-right align-middle whitespace-nowrap ${
                          priceTrend === "down"
                            ? "text-emerald-700"
                            : priceTrend === "up"
                              ? "text-rose-600"
                              : "text-gray-800"
                        } ${totalChanged ? "bg-amber-50 text-amber-900" : ""}`}>
                          {((item.offeredPrice || 0) * (item.quantity || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        {/* 🗑️ Remove Button */}
                        <td className="p-4 text-center align-middle">
                          <button 
                            type="button"
                            onClick={() => handleRemoveItem(getLineId(item))}
                            className="p-2 transition-colors rounded text-slate-400 hover:text-red-500 hover:bg-red-50"
                            title="Remove Item"
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="p-8 font-medium text-center text-gray-500">
                      No items currently in quote. Click "Add Item" to add products.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 📝 BARABAR BOXES: Calculation & Notes Section */}
        <div className="grid items-stretch grid-cols-1 gap-6 mb-8 lg:grid-cols-2">
          
          {/* Notes Box */}
          <div className="flex flex-col h-full">
            <label className="block mb-2 text-sm font-semibold text-gray-700">Message/Terms for Client</label>
            <textarea 
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="E.g., Prices are inclusive of GST. Free delivery within 5 days. Valid for 7 days."
              className="flex-1 w-full p-4 text-sm text-gray-700 transition-all bg-white border border-gray-200 shadow-sm outline-none resize-none rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 💵 Professional Invoice Totals Box - SOFT THEME */}
          <div className="flex flex-col justify-between h-full p-6 transition-all border shadow-sm bg-slate-50 border-slate-200 rounded-xl">
            <div className="flex-1 space-y-4">
              <div className="flex justify-between text-sm text-slate-600">
                <span className="font-medium">Items Subtotal:</span>
                <span className="font-bold text-slate-800">₹ {subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              
              <div className={`flex flex-col gap-2 p-3 bg-white border rounded-lg shadow-sm border-slate-200 ${getHighlightClass(discountChanged)}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Extra Discount:</span>
                  <div className="flex items-center gap-2">
                    <select
                      value={extraDiscountType}
                      onChange={(e) => setExtraDiscountType(e.target.value)}
                      className={`rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 ${discountChanged ? "border-amber-300 bg-amber-50 text-amber-800" : ""}`}
                    >
                      <option value="flat">Flat</option>
                      <option value="percent">Percent</option>
                    </select>
                    <div className="relative flex items-center w-28">
                      <span className="absolute text-sm font-medium left-3 text-slate-400">
                        {extraDiscountType === "percent" ? "%" : "₹"}
                      </span>
                      <input
                        type="number"
                        min="0"
                        max={extraDiscountType === "percent" ? 100 : undefined}
                        step="0.01"
                        value={extraDiscountValue === "" ? "" : extraDiscountValue}
                        onChange={(e) => setExtraDiscountValue(e.target.value === "" ? "" : Number(e.target.value))}
                        className={`w-full py-1.5 pl-7 pr-3 text-sm font-bold text-right text-slate-800 transition-all bg-slate-50 border border-slate-200 rounded outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white focus:border-blue-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${discountChanged ? "border-amber-300 bg-amber-50 text-amber-800" : ""}`}
                      />
                    </div>
                  </div>
                </div>
                {discountAmount > 0 && (
                  <div className="text-xs font-semibold text-slate-500">
                    Discount Applied: ₹ {discountAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                )}
              </div>

              <div className={`flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm border-slate-200 ${getHighlightClass(shippingChanged)}`}>
                <span className="text-sm font-medium text-slate-600">Shipping Charge (Rs):</span>
                <div className="relative flex items-center w-36">
                  <span className="absolute text-sm font-medium left-3 text-slate-400">Rs</span>
                  <input
                    type="number"
                    min="0"
                    value={shippingCharge === "" ? "" : shippingCharge}
                    onChange={(e) => setShippingCharge(e.target.value === "" ? "" : Number(e.target.value))}
                    className={`w-full py-1.5 pl-8 pr-3 text-sm font-bold text-right text-slate-800 transition-all bg-slate-50 border border-slate-200 rounded outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white focus:border-blue-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${shippingChanged ? "border-amber-300 bg-amber-50 text-amber-800" : ""}`}
                  />
                </div>
              </div>

              <div className={`flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm border-slate-200 ${getHighlightClass(gstChanged)}`}>
                <span className="text-sm font-medium text-slate-600">GST (%):</span>
                <div className="relative flex items-center w-36">
                  <span className="absolute text-sm font-medium left-3 text-slate-400">%</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={gstPercentage === "" ? "" : gstPercentage}
                    onChange={(e) => setGstPercentage(e.target.value === "" ? "" : Number(e.target.value))}
                    className={`w-full py-1.5 pl-7 pr-3 text-sm font-bold text-right text-slate-800 transition-all bg-slate-50 border border-slate-200 rounded outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white focus:border-blue-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${gstChanged ? "border-amber-300 bg-amber-50 text-amber-800" : ""}`}
                  />
                </div>
              </div>

              <div className={`flex flex-col gap-3 p-3 bg-white border rounded-lg shadow-sm border-slate-200 ${getHighlightClass(additionalChanged)}`}>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-slate-600">Additional Charge:</span>
                  <input
                    type="text"
                    value={additionalChargeName}
                    onChange={(e) => setAdditionalChargeName(e.target.value)}
                    placeholder="Name (e.g. Installation)"
                    className={`flex-1 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 ${additionalChanged ? "border-amber-300 bg-amber-50 text-amber-800" : ""}`}
                  />
                </div>
                <div className="flex items-center justify-end">
                  <div className="relative flex items-center w-36">
                    <span className="absolute text-sm font-medium left-3 text-slate-400">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={additionalChargeAmount === "" ? "" : additionalChargeAmount}
                      onChange={(e) => setAdditionalChargeAmount(e.target.value === "" ? "" : Number(e.target.value))}
                      className={`w-full py-1.5 pl-7 pr-3 text-sm font-bold text-right text-slate-800 transition-all bg-slate-50 border border-slate-200 rounded outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white focus:border-blue-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${additionalChanged ? "border-amber-300 bg-amber-50 text-amber-800" : ""}`}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-6 border-t border-slate-200">
              <div className="flex items-end justify-between">
                <div>
                  <p className="mb-1 text-xs font-bold tracking-wider uppercase text-slate-500">Final Total</p>
                  <p className="text-3xl font-extrabold leading-none text-blue-700 whitespace-nowrap">
                    ₹ {finalTotal > 0 ? finalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : "0.00"}
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        </fieldset>

        {/* 🚀 Action Buttons */}
        <div className="flex flex-col justify-end gap-4 pt-6 border-t border-gray-100 sm:flex-row">
          <button 
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-3 font-bold text-gray-700 transition border border-gray-300 rounded-xl hover:bg-gray-50"
          >
            Back
          </button>
          <button 
            type="submit"
            disabled={submitting || finalTotal <= 0 || quote.requestedItems.length === 0 || !isLatest}
            className="flex items-center justify-center w-full gap-2 px-8 py-3 font-bold text-white transition-all bg-blue-600 rounded-xl hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
          >
            {submitting ? "Saving..." : (
              <>
                <FaPaperPlane /> {quote.status === "Pending" ? "Save & Generate Link" : "Update Quote"}
              </>
            )}
          </button>
        </div>
      </form>

      {showProductPicker && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 md:items-center">
          <div className="w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-lg font-bold text-gray-900">Add Product to Quote</h3>
              <button
                onClick={closeProductPicker}
                className="rounded-lg px-3 py-1.5 text-sm font-semibold text-gray-600 hover:bg-gray-100"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-1 gap-0 md:grid-cols-[1fr_1.2fr]">
              <div className="border-r">
                <div className="p-4">
                  <input
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search product name..."
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => fetchProducts(productSearch)}
                    className="mt-3 w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Search
                  </button>
                </div>
                <div className="max-h-[520px] overflow-y-auto">
                  {productsLoading ? (
                    <p className="p-4 text-sm text-gray-500">Loading products...</p>
                  ) : products.length === 0 ? (
                    <p className="p-4 text-sm text-gray-500">No products found.</p>
                  ) : (
                    products.map((product) => (
                      <button
                        key={product._id}
                        type="button"
                        onClick={() => handlePickProduct(product)}
                        className={`flex w-full items-center gap-3 border-b px-4 py-3 text-left text-sm transition ${
                          selectedProduct?._id === product._id ? "bg-blue-50" : "hover:bg-gray-50"
                        }`}
                      >
                        <img
                          src={product.image || "https://placehold.co/60x60?text=Img"}
                          alt={product.name}
                          className="h-12 w-12 rounded-md border object-contain"
                        />
                        <div>
                          <p className="font-semibold text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-500">Rs {Number(product.price || 0).toLocaleString("en-IN")}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="p-6">
                {!selectedProduct ? (
                  <p className="text-sm text-gray-500">Select a product to configure options.</p>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={selectedProduct.image || "https://placehold.co/100x100?text=Img"}
                        alt={selectedProduct.name}
                        className="h-16 w-16 rounded-lg border object-contain"
                      />
                      <div>
                        <p className="text-base font-bold text-gray-900">{selectedProduct.name}</p>
                        <p className="text-sm text-gray-600">
                          Base Price: Rs {Number(selectedProduct.price || 0).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>

                    {(selectedProduct.customFields || []).map((field) => {
                      const fieldKey = String(field._id || field.label || "");
                      if (!fieldKey) return null;
                      const selectedValue =
                        productSelections[fieldKey] ?? productSelections[field.label] ?? (field.type === "checkbox" ? [] : "");
                      const options = Array.isArray(field.options) ? field.options : [];

                      return (
                        <div key={`picker-${fieldKey}`} className="rounded-lg border border-gray-200 p-3">
                          <p className="text-xs font-bold uppercase text-gray-600">{field.label || "Option"}</p>
                          {field.type === "radio" && (
                            <div className="mt-2 flex flex-wrap gap-3 text-sm">
                              {options.map((opt) => {
                                const label = String(opt?.label || "").trim();
                                if (!label) return null;
                                return (
                                  <label key={`${fieldKey}-${label}`} className="flex items-center gap-2">
                                    <input
                                      type="radio"
                                      name={`picker-${fieldKey}`}
                                      checked={String(selectedValue) === label}
                                      onChange={() => handleProductSelectionChange(field, label)}
                                      className="accent-blue-600"
                                    />
                                    <span>{label}</span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                          {field.type === "checkbox" && (
                            <div className="mt-2 flex flex-wrap gap-3 text-sm">
                              {options.map((opt) => {
                                const label = String(opt?.label || "").trim();
                                if (!label) return null;
                                const isChecked = Array.isArray(selectedValue)
                                  ? selectedValue.map(String).includes(label)
                                  : false;
                                return (
                                  <label key={`${fieldKey}-${label}`} className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => handleProductSelectionChange(field, label, e.target.checked)}
                                      className="accent-blue-600"
                                    />
                                    <span>{label}</span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                          {field.type === "text" && (
                            <input
                              type="text"
                              value={typeof selectedValue === "string" ? selectedValue : ""}
                              onChange={(e) => handleProductSelectionChange(field, e.target.value)}
                              className="mt-2 w-full rounded border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                          )}
                        </div>
                      );
                    })}

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-sm font-semibold text-gray-700">
                        Option Adjustment:
                        {" "}
                        Rs{" "}
                        {resolveSelections(selectedProduct, productSelections).optionAdjustment.toLocaleString("en-IN")}
                      </span>
                      <button
                        type="button"
                        onClick={addSelectedProductToQuote}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                      >
                        Add to Quote
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default QuoteEditor;

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { FaSearch, FaSyncAlt, FaTimes, FaBoxOpen } from "react-icons/fa";
import { getApiUrl, optimizeCloudinaryUrl } from "../../utils/api.js";
import { getProducts } from "../../services/productService";

const API_URL = getApiUrl();

const AdminCatalog = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const itemsPerPage = 12;

  // Selected product details modal states
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Load Categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await axios.get(`${API_URL}/categories`);
        if (res.data.success) {
          setCategories(res.data.categories || []);
        }
      } catch (error) {
        console.error("Failed to load categories", error);
      }
    };
    loadCategories();
  }, []);

  // Fetch Products when filters or page changes
  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data } = await getProducts({
        keyword: debouncedSearch || undefined,
        category: selectedCategory || undefined,
        page,
        limit: itemsPerPage,
      });
      setProducts(data.products || []);
      setTotalPages(data.totalPages || 1);
      setTotalProducts(data.totalProducts || 0);
    } catch (error) {
      console.error("Failed to fetch catalog products", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedCategory]);

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, selectedCategory]);

  const categoryOptions = useMemo(() => {
    return [...new Set(categories.map((item) => item.name))];
  }, [categories]);

  const openDetailsModal = (product) => {
    setSelectedProduct(product);
    setActiveImageIndex(0);

    if (product.variants?.length) {
      setSelectedVariant(product.variants[0]);
    } else {
      setSelectedVariant(null);
    }

    if (product.attributes?.length) {
      const initialAttrs = {};
      product.attributes.forEach((attr) => {
        if (attr.options && attr.options.length > 0) initialAttrs[attr.name] = attr.options[0];
      });
      setSelectedAttributes(initialAttrs);
    } else {
      setSelectedAttributes({});
    }
  };

  const closeDetailsModal = () => {
    setSelectedProduct(null);
  };

  // Selected variant / attribute pricing calculations for the modal
  const modalPricing = useMemo(() => {
    if (!selectedProduct) return { displayPrice: 0, displayMrp: 0, discountPercent: 0, displaySku: "N/A", stock: 0, gstRate: 18, imagesList: [], options: {} };

    let extra = 0;
    Object.values(selectedAttributes).forEach((opt) => {
      if (opt && opt.priceAdjustment) extra += Number(opt.priceAdjustment) || 0;
    });

    let attributeSku = "";
    let attributeMrp = 0;
    let attributeStock = null;

    Object.values(selectedAttributes).forEach((opt) => {
      if (opt && opt.meta) {
        if (opt.meta.sku) attributeSku = opt.meta.sku;
        if (opt.meta.mrp && Number(opt.meta.mrp) > 0) attributeMrp = Number(opt.meta.mrp);
        if (opt.meta.stock !== undefined && opt.meta.stock !== null && opt.meta.stock !== "") {
          attributeStock = Number(opt.meta.stock);
        }
      }
    });

    const safeBasePrice = Number(selectedVariant?.sellingPrice || selectedVariant?.price || selectedProduct.sellingPrice || selectedProduct.price) || 0;
    const safeBaseMrp = Number(selectedVariant?.mrp || attributeMrp || selectedProduct.mrp) || 0;
    const safeGstRate = Number(selectedProduct.gstRate || selectedProduct.GST) || 18;

    const rawTotal = safeBasePrice + extra;
    const displayPrice = Math.round(rawTotal * (1 + (safeGstRate / 100))) || 0;

    const rawTotalMrp = safeBaseMrp > 0 ? safeBaseMrp + extra : 0;
    const displayMrp = rawTotalMrp > 0 ? Math.round(rawTotalMrp * (1 + (safeGstRate / 100))) : 0;
    const discountPercent = displayMrp > displayPrice ? Math.round(((displayMrp - displayPrice) / displayMrp) * 100) : 0;

    const stock = selectedVariant?.stock ?? attributeStock ?? selectedProduct.stock ?? 0;
    const displaySku = selectedVariant?.sku || attributeSku || selectedProduct.baseSku || "N/A";

    // Images list
    let imagesList = [];
    if (selectedVariant?.image) {
      imagesList = [selectedVariant.image];
    } else if (selectedProduct.images?.length) {
      imagesList = selectedProduct.images;
    } else if (selectedProduct.image) {
      imagesList = [selectedProduct.image];
    } else {
      imagesList = ["https://placehold.co/600x400?text=No+Image"];
    }

    // Variants options
    const options = {};
    if (selectedProduct.variants) {
      selectedProduct.variants.forEach((v) => {
        Object.entries(v.combination || {}).forEach(([k, val]) => {
          if (!options[k]) options[k] = new Set();
          options[k].add(val);
        });
      });
    }

    return {
      displayPrice,
      displayMrp,
      discountPercent,
      displaySku,
      stock,
      gstRate: safeGstRate,
      imagesList,
      options
    };
  }, [selectedProduct, selectedVariant, selectedAttributes]);

  const handleVariantSelect = (key, value) => {
    const found = selectedProduct.variants.find((v) => v.combination?.[key] === value);
    if (found) {
      setSelectedVariant(found);
    }
  };

  const handleAttributeSelect = (attrName, optionObj) => {
    const newAttrs = { ...selectedAttributes, [attrName]: optionObj };
    setSelectedAttributes(newAttrs);
  };

  return (
    <div className="w-full space-y-6 font-sans">
      
      {/* Header Block */}
      <div className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-2xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <FaBoxOpen className="text-blue-500" /> Store Product Catalog
            </h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Staff-wide catalog access. Browse store products, stock levels, SKUs, and design specs.
            </p>
          </div>
          <div>
            <button
              onClick={loadProducts}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/80 bg-blue-50 dark:bg-blue-950/30 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
            >
              <FaSyncAlt /> Reload Catalog
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {/* Search bar */}
          <div className="relative col-span-2">
            <FaSearch className="absolute text-slate-400 -translate-y-1/2 left-4 top-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products by title, SKU, or tags..."
              className="w-full py-2.5 pl-11 pr-4 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/25 text-slate-800 dark:text-slate-100 placeholder-slate-400 transition"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full py-2.5 px-4 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/25 text-slate-800 dark:text-slate-100 font-bold cursor-pointer transition"
            >
              <option value="">All Categories</option>
              {categoryOptions.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Catalog Cards Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400 dark:text-slate-500">
          <div className="w-10 h-10 mb-4 border-4 rounded-full border-blue-500 border-t-transparent animate-spin" />
          <p className="text-xs font-bold uppercase tracking-wider">Loading Store Products...</p>
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => {
            const imageUrl = optimizeCloudinaryUrl(product.image || product.images?.[0]?.url || product.images?.[0] || "https://placehold.co/400x300/f3f4f6/a1a1aa?text=No+Image", 400);
            const productId = product._id || product.id;

            const length = product.details?.find((d) => d.key === "LENGTH_ft" || d.name === "LENGTH_ft")?.value;
            const width = product.details?.find((d) => d.key === "WIDTH_ft" || d.name === "WIDTH_ft")?.value;

            const defaultVariant = product.variants?.length > 0 ? product.variants[0] : null;
            let variationExtraPrice = 0;

            if (product.attributes?.length > 0) {
              product.attributes.forEach((attr) => {
                if (attr.options && attr.options.length > 0) {
                  const firstOption = attr.options[0];
                  if (firstOption.priceAdjustment) {
                    variationExtraPrice += Number(firstOption.priceAdjustment);
                  }
                }
              });
            }

            const rawBasePrice = Number(defaultVariant?.sellingPrice ?? defaultVariant?.price ?? product.sellingPrice ?? product.price ?? 0);
            const rawBaseMrp = Number(defaultVariant?.mrp ?? product.mrp ?? 0);
            const gstRate = Number(product.gstRate ?? product.GST ?? 18);

            const rawTotalSelling = rawBasePrice + variationExtraPrice;
            const rawTotalMrp = rawBaseMrp + variationExtraPrice;

            const displayPrice = Math.round(rawTotalSelling * (1 + (gstRate / 100)));
            const displayMrp = Math.round(rawTotalMrp * (1 + (gstRate / 100)));
            const discountPercent = displayMrp > displayPrice ? Math.round(((displayMrp - displayPrice) / displayMrp) * 100) : 0;
            const isOutOfStock = Number(product.stock || 0) === 0;

            return (
              <div 
                key={productId}
                onClick={() => openDetailsModal(product)} 
                className="flex flex-col h-full overflow-hidden transition-all duration-300 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-sm cursor-pointer group rounded-2xl hover:shadow-xl relative"
              >
                {/* Image Gallery area */}
                <div className="relative flex items-center justify-center w-full h-48 p-4 overflow-hidden sm:h-56 bg-gray-50 dark:bg-slate-900/60 border-b border-gray-100 dark:border-slate-700">
                  <img 
                    src={imageUrl} 
                    alt={product.name} 
                    className="object-contain w-full h-full transition-transform duration-500 ease-in-out group-hover:scale-110 mix-blend-multiply dark:mix-blend-normal"
                  />
                  {isOutOfStock && (
                    <span className="absolute top-2.5 right-2.5 px-2 py-0.5 text-[9px] font-black text-red-600 bg-red-50 dark:bg-red-950/80 border border-red-200 dark:border-red-900 rounded-md uppercase tracking-wider">
                      Out of Stock
                    </span>
                  )}
                </div>

                {/* Card details body */}
                <div className="flex flex-col flex-grow p-4 sm:p-5">
                  <h5 className="mb-1 text-sm sm:text-base font-bold text-gray-900 dark:text-white transition-colors line-clamp-2">
                    {product.name}
                  </h5>
                  
                  {/* SKU code */}
                  <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                    SKU: {product.sku || product.baseSku || "N/A"}
                  </p>

                  {length && width && (
                    <div className="mt-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-lg">
                        📐 {length} × {width} ft
                      </span>
                    </div>
                  )}

                  <div className="flex flex-col pt-4 mt-auto border-t border-gray-100 dark:border-slate-700">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-lg sm:text-xl font-extrabold text-blue-600 dark:text-blue-400">
                          ₹{displayPrice.toLocaleString("en-IN")}
                        </span>
                        {displayMrp > displayPrice && (
                          <>
                            <span className="text-xs text-gray-400 line-through">₹{displayMrp.toLocaleString("en-IN")}</span>
                            {discountPercent > 0 && (
                              <span className="text-xs font-bold text-green-600">({discountPercent}% OFF)</span>
                            )}
                          </>
                        )}
                      </div>
                      <span className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                        Incl. {gstRate}% GST
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-16 text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-2xl">
          <FaBoxOpen size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">No products found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Try adjusting the search criteria or selected category.</p>
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && totalProducts > 0 && (
        <div className="flex flex-col items-center justify-between gap-4 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-2xl sm:flex-row">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Showing <span className="font-bold text-slate-800 dark:text-white">{Math.min((page - 1) * itemsPerPage + 1, totalProducts)}</span> to{" "}
            <span className="font-bold text-slate-800 dark:text-white">{Math.min(page * itemsPerPage, totalProducts)}</span> of{" "}
            <span className="font-bold text-slate-800 dark:text-white">{totalProducts}</span> catalog items
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-905 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-3 py-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 rounded-lg">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-905 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Product Details Modal (Replicates Client ProductDetail.jsx but without Buy buttons) */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 p-6 md:p-8 w-screen h-screen shadow-2xl flex flex-col overflow-hidden animate-scale-up">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-4 flex-shrink-0">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Product Details View (Catalog)
              </span>
              <button
                onClick={closeDetailsModal}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white bg-slate-100 dark:bg-slate-700 rounded-full transition cursor-pointer"
              >
                <FaTimes size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto py-6">
              <div className="grid gap-12 md:grid-cols-2 items-start">
                
                {/* Left Column: Image Slider */}
                <div>
                  <div className="relative bg-[#f8f8f8] dark:bg-slate-900/60 p-4 rounded-md group">
                    <img
                      src={
                        optimizeCloudinaryUrl(modalPricing.imagesList[activeImageIndex], 800) ||
                        "https://placehold.co/600x400?text=No+Image"
                      }
                      alt={selectedProduct.name}
                      className="w-full object-contain max-h-[600px] mix-blend-multiply dark:mix-blend-normal transition-transform duration-500 ease-in-out group-hover:scale-105"
                    />
                  </div>

                  {/* Thumbnail Row */}
                  {modalPricing.imagesList.length > 1 && (
                    <div className="flex gap-2 mt-4 overflow-x-auto pb-1.5">
                      {modalPricing.imagesList.map((img, i) => (
                        <img
                          key={i}
                          src={optimizeCloudinaryUrl(img, 150)}
                          onClick={() => setActiveImageIndex(i)}
                          alt="thumbnail"
                          className={`w-20 h-20 border cursor-pointer object-cover rounded-sm transition-all ${
                            activeImageIndex === i
                              ? "border-gray-800 dark:border-white border-2"
                              : "border-gray-200 dark:border-slate-700 hover:border-gray-400"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Column: Options & Pricing */}
                <div className="flex flex-col">
                  <h1 className="text-[26px] leading-tight font-normal text-gray-900 dark:text-white uppercase">
                    {selectedProduct.name}
                  </h1>

                  <div className="mt-3 text-[13px] text-gray-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-2">
                    <span>Store</span>
                    {selectedProduct.category && (
                      <>
                        <span>/</span>
                        <span>{selectedProduct.category}</span>
                      </>
                    )}
                    {selectedProduct.brand && (
                      <>
                        <span>/</span>
                        <span>{selectedProduct.brand}</span>
                      </>
                    )}
                  </div>
                  <p className="mt-2 text-[13px] text-gray-500 dark:text-slate-400 uppercase">
                    SKU: {modalPricing.displaySku}
                  </p>
                  
                  {/* Stock Level status */}
                  <div className="mt-2">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-sm text-[11px] font-bold uppercase tracking-wide ${
                        modalPricing.stock === 0
                          ? "bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-400"
                          : "bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:text-emerald-400"
                      }`}
                    >
                      {modalPricing.stock === 0 ? "Out of Stock" : `${modalPricing.stock} Units Available`}
                    </span>
                  </div>

                  {/* Pricing Block */}
                  <div className="mt-6 flex flex-col gap-1">
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <h2 className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">
                        ₹{modalPricing.displayPrice.toLocaleString("en-IN")}
                      </h2>
                      {modalPricing.displayMrp > modalPricing.displayPrice && (
                        <>
                          <span className="text-lg text-gray-400 dark:text-slate-500 line-through">
                            ₹{modalPricing.displayMrp.toLocaleString("en-IN")}
                          </span>
                          {modalPricing.discountPercent > 0 && (
                            <span className="text-sm font-bold text-green-600">
                              ({modalPricing.discountPercent}% OFF)
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    <p className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                      Incl. {modalPricing.gstRate}% GST
                    </p>
                  </div>

                  <div className="w-full h-px my-6 bg-gray-200 dark:bg-slate-700"></div>

                  {/* Variations Selector */}
                  {Object.entries(modalPricing.options).length > 0 &&
                    Object.entries(modalPricing.options).map(([key, values]) => (
                      <div key={key} className="mb-6">
                        <h4 className="mb-3 text-[13px] font-semibold tracking-wider text-gray-900 dark:text-slate-300 uppercase">
                          {key}
                        </h4>
                        <div className="flex flex-col gap-2.5">
                          {[...values].map((v) => {
                            const isSelected = selectedVariant?.combination?.[key] === v;
                            return (
                              <label key={v} className="flex items-start gap-3 cursor-pointer group">
                                <input
                                  type="radio"
                                  name={`variant-${key}`}
                                  checked={isSelected}
                                  onChange={() => handleVariantSelect(key, v)}
                                  className="w-4 h-4 mt-0.5 text-blue-600 bg-white dark:bg-slate-900 border-gray-350 dark:border-slate-600 focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="text-[14.5px] text-gray-800 dark:text-slate-200 group-hover:text-black dark:group-hover:text-white transition-colors">
                                  {v}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                  {/* Attributes Selector */}
                  {selectedProduct.attributes?.length > 0 &&
                    selectedProduct.attributes.map((attr) => (
                      <div key={attr.name} className="mb-6">
                        <h4 className="mb-3 text-[13px] font-semibold tracking-wider text-gray-905 dark:text-slate-300 uppercase">
                          {attr.name}
                        </h4>
                        <div className="flex flex-col gap-2.5">
                          {attr.options.map((opt) => {
                            const isSelected = selectedAttributes[attr.name]?.value === opt.value;
                            const adjustment = Number(opt.priceAdjustment) || 0;
                            const hasAdjustment = adjustment !== 0;
                            const sign = adjustment > 0 ? "+" : "-";
                            const absoluteValueWithGst = Math.round(
                              Math.abs(adjustment) * (1 + (modalPricing.gstRate / 100))
                            );

                            return (
                              <label key={opt.value} className="flex items-start gap-3 cursor-pointer group">
                                <input
                                  type="radio"
                                  name={`attr-${attr.name}`}
                                  checked={isSelected}
                                  onChange={() => handleAttributeSelect(attr.name, opt)}
                                  className="w-4 h-4 mt-0.5 text-[#1e73be] bg-white dark:bg-slate-900 border-gray-400 dark:border-slate-600 focus:ring-[#1e73be] cursor-pointer"
                                />
                                <span className="text-[14.5px] text-gray-800 dark:text-slate-200 group-hover:text-black dark:group-hover:text-white transition-colors leading-tight">
                                  {opt.value}
                                  {hasAdjustment
                                    ? ` (${sign} ₹${absoluteValueWithGst} Incl. GST)`
                                    : ""}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Bottom Specifications Details & Description */}
              {(selectedProduct.description || selectedProduct.details) && (
                <div className="pt-10 mt-12 border-t border-gray-200 dark:border-slate-700 lg:mt-16">
                  <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
                    
                    {/* Specifications table */}
                    {selectedProduct.details && (
                      <div>
                        <h3 className="mb-5 text-lg font-bold text-gray-900 dark:text-white uppercase">
                          Product Details
                        </h3>
                        {Array.isArray(selectedProduct.details) ? (
                          <div className="border border-gray-200 dark:border-slate-700 rounded-sm">
                            {selectedProduct.details.map((detail, index) => (
                              <div key={index} className={`flex px-4 py-3 text-sm ${index !== selectedProduct.details.length - 1 ? 'border-b border-gray-200 dark:border-slate-700' : ''}`}>
                                <span className="w-2/5 font-semibold text-gray-700 dark:text-slate-400">
                                  {detail.name || detail.key || "Feature"}
                                </span>
                                <span className="w-3/5 text-gray-900 dark:text-white font-bold">
                                  {detail.value}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[14.5px] text-gray-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                            {selectedProduct.details}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Description text */}
                    {selectedProduct.description && (
                      <div className={!selectedProduct.details ? "md:col-span-2 max-w-4xl" : ""}>
                        <h3 className="mb-5 text-lg font-bold text-gray-900 dark:text-white uppercase">
                          Description
                        </h3>
                        <p className="text-[14.5px] text-gray-700 dark:text-slate-350 whitespace-pre-line leading-relaxed">
                          {selectedProduct.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminCatalog;

import { useEffect, useMemo, useState } from "react";
// 🔥 NEW: Imported FaShareAlt icon for the share button
import { FaRegHeart, FaShareAlt } from "react-icons/fa"; 
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useQuote } from "../context/QuoteContext";
import { getProductById } from "../services/productService";
// 🔥 NEW: For displaying a message when the link is copied
import toast from 'react-hot-toast';
import { optimizeCloudinaryUrl } from "../utils/api.js";
import ProductDetailSkeleton from "../components/skeletons/ProductDetailSkeleton";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams(); 
  
  const { addToCart } = useCart();
  const { addToQuote } = useQuote();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [defaultAttributes, setDefaultAttributes] = useState({}); 
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getProductById(id);
        const fetchedProduct = data.product;
        setProduct(fetchedProduct);

        const urlVariantId = searchParams.get("variant");
        const urlAttrs = searchParams.get("attrs");

        if (urlVariantId && fetchedProduct?.variants?.length) {
          setSelectedVariant(fetchedProduct.variants.find(v => v._id === urlVariantId) || fetchedProduct.variants[0]);
        } else if (fetchedProduct?.variants?.length) {
          setSelectedVariant(fetchedProduct.variants[0]);
        }
        
        if (urlAttrs) {
          try { setSelectedAttributes(JSON.parse(decodeURIComponent(urlAttrs))); } catch (e) {}
        } 
        
        if (fetchedProduct?.attributes?.length) {
          const initialAttrs = {};
          fetchedProduct.attributes.forEach(attr => {
            if (attr.options && attr.options.length > 0) initialAttrs[attr.name] = attr.options[0]; 
          });
          setDefaultAttributes(initialAttrs); 
          if (!urlAttrs) setSelectedAttributes(initialAttrs);
        }
      } catch (err) {
        console.error("Error loading product", err);
      } finally { setLoading(false); }
    };
    load();
  }, [id, searchParams]); 

  const images = useMemo(() => {
    if (!product) return [];
    if (selectedVariant?.image) return [selectedVariant.image];
    if (product.images?.length) return product.images;
    if (product.image) return [product.image];
    return ["https://placehold.co/600x400?text=No+Image"];
  }, [product, selectedVariant]);

  const options = useMemo(() => {
    if (!product?.variants) return {};
    const opt = {};
    product.variants.forEach((v) => {
      Object.entries(v.combination || {}).forEach(([k, val]) => {
        if (!opt[k]) opt[k] = new Set();
        opt[k].add(val);
      });
    });
    return opt;
  }, [product]);

  const handleVariantSelect = (key, value) => {
    const found = product.variants.find((v) => v.combination?.[key] === value);
    if (found) {
      setSelectedVariant(found);
      searchParams.set("variant", found._id);
      setSearchParams(searchParams, { replace: true }); 
    }
  };

  const handleAttributeSelect = (attrName, optionObj) => {
    const newAttrs = { ...selectedAttributes, [attrName]: optionObj };
    setSelectedAttributes(newAttrs);
    searchParams.set("attrs", encodeURIComponent(JSON.stringify(newAttrs)));
    setSearchParams(searchParams, { replace: true });
  };

  // 🔥 NEW: Share Functionality (Native share on mobile, copy link on PC)
  const handleShare = async () => {
    const shareData = {
      title: product.name,
      text: `Hey! Check out this awesome product: ${product.name} at Sonani Electronics`,
      url: window.location.href,
    };

    try {
      // If the browser supports the Web Share API (mostly mobiles)
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // If on PC/Laptop, copy the link to the clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Product link copied to clipboard!", {
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        });
      }
    } catch (err) {
      console.log("Error sharing product:", err);
    }
  };

  const attributesExtraPrice = useMemo(() => {
    let extra = 0;
    Object.values(selectedAttributes).forEach((opt) => {
      if (opt && opt.priceAdjustment) extra += Number(opt.priceAdjustment) || 0;
    });
    return extra;
  }, [selectedAttributes]);

  // Get variant SKU, stock and MRP from selected attributes if present
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

  const safeBasePrice = Number(selectedVariant?.sellingPrice || selectedVariant?.price || product?.sellingPrice || product?.price) || 0;
  const safeBaseMrp = Number(selectedVariant?.mrp || attributeMrp || product?.mrp) || 0;
  const safeGstRate = Number(product?.gstRate || product?.GST) || 18;
  
  const rawTotal = safeBasePrice + attributesExtraPrice; 
  const displayPrice = Math.round(rawTotal * (1 + (safeGstRate / 100))) || 0; 

  const rawTotalMrp = safeBaseMrp > 0 ? safeBaseMrp + attributesExtraPrice : 0;
  const displayMrp = rawTotalMrp > 0 ? Math.round(rawTotalMrp * (1 + (safeGstRate / 100))) : 0;
  const discountPercent = displayMrp > displayPrice ? Math.round(((displayMrp - displayPrice) / displayMrp) * 100) : 0; 

  const stock = selectedVariant?.stock ?? attributeStock ?? product?.stock ?? 0;
  const displaySku = selectedVariant?.sku || attributeSku || product?.baseSku || "N/A";

  if (loading) return <ProductDetailSkeleton />;
  if (!product) return <div className="p-10 text-center">Product not found</div>;

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-8 font-sans">
      {/* 📦 TOP SECTION: Image Gallery & Product Buy Options */}
      <div className="grid gap-12 md:grid-cols-2">
        
        {/* Left Side: Images */}
        <div>
          {/* 🔥 NEW: Added relative position so that share button is fixed at top-right */}
          <div className="relative bg-[#f8f8f8] p-4 rounded-md group">
            <img src={optimizeCloudinaryUrl(images[activeImageIndex], 800)} alt={product.name} className="w-full object-contain max-h-[600px] mix-blend-multiply transition-transform duration-500 ease-in-out group-hover:scale-105" />
            
            {/* 🔥 NEW: Premium Animated Share Button */}
            <button
              onClick={handleShare}
              title="Share this product"
              className="absolute top-4 right-4 p-3.5 bg-white text-gray-500 rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.08)] transition-all duration-300 hover:text-blue-600 hover:scale-110 hover:shadow-[0_6px_14px_rgba(0,0,0,0.15)] active:scale-95"
            >
              <FaShareAlt size={18} />
            </button>
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 mt-4 overflow-x-auto">
              {images.map((img, i) => (
                <img key={i} src={optimizeCloudinaryUrl(img, 150)} onClick={() => setActiveImageIndex(i)} alt="thumbnail" className={`w-20 h-20 border cursor-pointer object-cover rounded-sm transition-all ${activeImageIndex === i ? 'border-gray-800 border-2' : 'border-gray-200 hover:border-gray-400'}`} />
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Options, Price & Add to Cart */}
        <div className="flex flex-col">
          <h1 className="text-[26px] leading-tight font-normal text-gray-900 uppercase">{product.name}</h1>
          <div className="mt-3 text-[13px] text-gray-500 uppercase tracking-wide flex items-center gap-2">
            <span>Store</span>
            {product.category && <><span>/</span><span>{product.category}</span></>}
            {product.brand && <><span>/</span><span>{product.brand}</span></>}
          </div>
          <p className="mt-2 text-[13px] text-gray-500 uppercase">SKU: {displaySku}</p>

          <div className="mt-6 flex flex-col gap-1">
            <div className="flex items-baseline gap-3 flex-wrap">
              <h2 className="text-3xl font-extrabold text-blue-600">₹{displayPrice.toLocaleString("en-IN")}</h2>
              {displayMrp > displayPrice && (
                <>
                  <span className="text-lg text-gray-400 line-through">₹{displayMrp.toLocaleString("en-IN")}</span>
                  {discountPercent > 0 && (
                    <span className="text-sm font-bold text-green-600">({discountPercent}% OFF)</span>
                  )}
                </>
              )}
            </div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Incl. {safeGstRate}% GST</p>
          </div>

          <div className="w-full h-px my-6 bg-gray-200"></div>

          {Object.entries(options).length > 0 && Object.entries(options).map(([key, values]) => (
            <div key={key} className="mb-6">
              <h4 className="mb-3 text-[13px] font-semibold tracking-wider text-gray-900 uppercase">{key}</h4>
              <div className="flex flex-col gap-2.5">
                {[...values].map((v) => {
                  const isSelected = selectedVariant?.combination?.[key] === v;
                  return (
                    <label key={v} className="flex items-start gap-3 cursor-pointer group">
                      <input type="radio" name={`variant-${key}`} checked={isSelected} onChange={() => handleVariantSelect(key, v)} className="w-4 h-4 mt-0.5 text-blue-600 bg-white border-gray-300 focus:ring-blue-500 cursor-pointer" />
                      <span className="text-[14.5px] text-gray-800 group-hover:text-black">{v}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

          {product.attributes?.length > 0 && product.attributes.map((attr) => (
            <div key={attr.name} className="mb-6">
              <h4 className="mb-3 text-[13px] font-semibold tracking-wider text-gray-900 uppercase">{attr.name}</h4>
              <div className="flex flex-col gap-2.5">
                {attr.options.map((opt) => {
                  const isSelected = selectedAttributes[attr.name]?.value === opt.value;
                  const adjustment = Number(opt.priceAdjustment) || 0;
                  const hasAdjustment = adjustment !== 0; 
                  const sign = adjustment > 0 ? "+" : "-";
                  const absoluteValueWithGst = Math.round(Math.abs(adjustment) * (1 + (safeGstRate / 100)));

                  return (
                    <label key={opt.value} className="flex items-start gap-3 cursor-pointer group">
                      <input type="radio" name={`attr-${attr.name}`} checked={isSelected} onChange={() => handleAttributeSelect(attr.name, opt)} className="w-4 h-4 mt-0.5 text-[#1e73be] bg-white border-gray-400 focus:ring-[#1e73be] cursor-pointer" />
                      <span className="text-[14.5px] text-gray-800 group-hover:text-black leading-tight">
                        {opt.value} 
                        {hasAdjustment ? ` (${sign} ₹${absoluteValueWithGst} Incl. GST)` : ""}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="flex flex-col gap-3 mt-5">
            <button
              onClick={() => {
                if (product?.variants?.length > 0 && !selectedVariant) return alert("Please select a product variant before adding to cart.");
                const formattedCustomFields = {};
                Object.entries(selectedAttributes).forEach(([key, obj]) => { formattedCustomFields[key] = obj.value; });

                addToCart({
                  _id: product._id,
                  name: product.name,
                  category: product.category || "",
                  image: images[activeImageIndex],
                  sku: displaySku,
                  price: displayPrice, 
                  gstRate: safeGstRate, 
                  shippingCharge: product.shippingCharge || 0,
                  customFields: product.customFields || product.attributes || [],
                  variant: selectedVariant,
                  selectedCustomFields: {
                    ...formattedCustomFields,
                    _finalPrice: displayPrice
                  }
                });
              }}
              disabled={stock === 0}
              className="w-full py-3.5 text-[15px] font-medium text-white transition-colors bg-[#333333] hover:bg-black rounded-sm disabled:bg-gray-400"
            >
              Add to Bag
            </button>

            <button 
              onClick={() => addToQuote(product, 1, selectedVariant, selectedAttributes)} 
              className="w-full py-3.5 text-[15px] font-medium text-[#333] transition-colors bg-white border border-[#ccc] hover:bg-gray-50 rounded-sm"
            >
              Request Quote
            </button>
          </div>
          
          <div className="mt-8">
            <p className="text-[13px] text-gray-500 mb-2">Save this product for later</p>
            <button className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-sm hover:bg-gray-50">
              <FaRegHeart className="text-gray-500" /> Favorite
            </button>
          </div>
        </div>
      </div>

      {/* 🔥 BOTTOM SECTION: Product Details & Description */}
      {(product.description || product.details) && (
        <div className="pt-10 mt-12 border-t border-gray-200 lg:mt-16">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
            
            {/* 1. Product Details (Specifications) */}
            {product.details && (
              <div>
                <h3 className="mb-5 text-lg font-bold text-gray-900 uppercase">Product Details</h3>
                
                {Array.isArray(product.details) ? (
                  <div className="border border-gray-200 rounded-sm">
                    {product.details.map((detail, index) => (
                      <div key={index} className={`flex px-4 py-3 text-sm ${index !== product.details.length - 1 ? 'border-b border-gray-200' : ''}`}>
                        <span className="w-2/5 font-semibold text-gray-700">{detail.name || detail.key || "Feature"}</span>
                        <span className="w-3/5 text-gray-900">{detail.value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[14.5px] text-gray-700 whitespace-pre-line leading-relaxed">
                    {product.details}
                  </div>
                )}
              </div>
            )}

            {/* 2. Product Description */}
            {product.description && (
              <div className={!product.details ? "md:col-span-2 max-w-4xl" : ""}>
                <h3 className="mb-5 text-lg font-bold text-gray-900 uppercase">Description</h3>
                <p className="text-[14.5px] text-gray-700 whitespace-pre-line leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}
            
          </div>
        </div>
      )}

    </div>
  );
};
export default ProductDetail;
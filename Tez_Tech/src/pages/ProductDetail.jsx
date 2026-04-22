import { useEffect, useMemo, useState } from "react";
import { FaRegHeart } from "react-icons/fa"; 
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useQuote } from "../context/QuoteContext";
import { getProductById } from "../services/productService";

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

  const attributesExtraPrice = useMemo(() => {
    let extra = 0;
    Object.values(selectedAttributes).forEach((opt) => {
      if (opt && opt.priceAdjustment) extra += Number(opt.priceAdjustment) || 0;
    });
    return extra;
  }, [selectedAttributes]);

  const safeBasePrice = Number(selectedVariant?.sellingPrice || selectedVariant?.price || product?.sellingPrice || product?.price) || 0;
  const safeGstRate = Number(product?.gstRate || product?.GST) || 18;
  
  const rawTotal = safeBasePrice + attributesExtraPrice; 
  const displayPrice = Math.round(rawTotal * (1 + (safeGstRate / 100))) || 0; 

  const stock = selectedVariant?.stock ?? product?.stock ?? 0;
  const displaySku = selectedVariant?.sku || product?.baseSku || "N/A";

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!product) return <div className="p-10 text-center">Product not found</div>;

  return (
    <div className="max-w-6xl px-4 py-8 mx-auto font-sans">
      <div className="grid gap-12 md:grid-cols-2">
        <div>
          <div className="bg-[#f8f8f8] p-4 rounded-md">
            <img src={images[activeImageIndex]} alt={product.name} className="w-full object-contain max-h-[600px] mix-blend-multiply" />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 mt-4 overflow-x-auto">
              {images.map((img, i) => (
                <img key={i} src={img} onClick={() => setActiveImageIndex(i)} alt="thumbnail" className={`w-20 h-20 border cursor-pointer object-cover rounded-sm transition-all ${activeImageIndex === i ? 'border-gray-800 border-2' : 'border-gray-200 hover:border-gray-400'}`} />
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <h1 className="text-[26px] leading-tight font-normal text-gray-900 uppercase">{product.name}</h1>
          <div className="mt-3 text-[13px] text-gray-500 uppercase tracking-wide flex items-center gap-2">
            <span>Store</span>
            {product.category && <><span>/</span><span>{product.category}</span></>}
            {product.brand && <><span>/</span><span>{product.brand}</span></>}
          </div>
          <p className="mt-2 text-[13px] text-gray-500 uppercase">SKU: {displaySku}</p>

          <div className="mt-6">
            <h2 className="text-3xl font-light text-gray-900">₹{displayPrice.toLocaleString("en-IN")}</h2>
            <p className="mt-1 text-sm text-gray-500">Incl. {safeGstRate}% GST</p>
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
                  // 🔥 THE FIX: _finalPrice bhej diya jo DB me save ho jayega
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

          {product.description && (
            <div className="mt-8">
               <div className="w-full h-px mb-6 bg-gray-200"></div>
              <h3 className="mb-3 text-[15px] text-gray-900">Description</h3>
              <p className="text-[14px] text-gray-700 whitespace-pre-line leading-relaxed">{product.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default ProductDetail;
import { useEffect, useMemo, useState } from "react";
import { FaRegHeart } from "react-icons/fa"; 
import { useNavigate, useParams, useSearchParams } from "react-router-dom"; // 🔥 useSearchParams add kiya
import { useCart } from "../context/CartContext";
import { useQuote } from "../context/QuoteContext";
import { getProductById } from "../services/productService";

const round2 = (v) => Math.round((Number(v) + Number.EPSILON) * 100) / 100;

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams(); // 🔥 URL parameters ke liye
  
  const { addToCart } = useCart();
  const { addToQuote } = useQuote();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // States for Variations
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // ======================
  // FETCH PRODUCT & SET FROM URL
  // ======================
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getProductById(id);
        const fetchedProduct = data.product;
        setProduct(fetchedProduct);

        // 🔥 URL se data nikalna
        const urlVariantId = searchParams.get("variant");
        const urlAttrs = searchParams.get("attrs");

        // 1. Variant Setting
        if (urlVariantId && fetchedProduct?.variants?.length) {
          const foundVariant = fetchedProduct.variants.find(v => v._id === urlVariantId);
          setSelectedVariant(foundVariant || fetchedProduct.variants[0]);
        } else if (fetchedProduct?.variants?.length) {
          setSelectedVariant(fetchedProduct.variants[0]);
        }
        
        // 2. Attributes Setting
        if (urlAttrs) {
          try {
            const parsedAttrs = JSON.parse(decodeURIComponent(urlAttrs));
            setSelectedAttributes(parsedAttrs);
          } catch (e) {
            console.error("Failed to parse attributes from URL");
          }
        } else if (fetchedProduct?.attributes?.length) {
          const initialAttrs = {};
          fetchedProduct.attributes.forEach(attr => {
            if (attr.options && attr.options.length > 0) {
              initialAttrs[attr.name] = attr.options[0];
            }
          });
          setSelectedAttributes(initialAttrs);
        }

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]); // Sirf id dependecy rakhi hai taaki baar baar api call na ho

  // ======================
  // IMAGE LIST
  // ======================
  const images = useMemo(() => {
    if (!product) return [];
    if (selectedVariant?.image) return [selectedVariant.image];

    const imgs = product.images || [];
    if (imgs.length) return imgs;

    if (product.image) return [product.image];

    return ["https://placehold.co/600x400?text=No+Image"];
  }, [product, selectedVariant]);

  // ======================
  // STANDARD VARIANT OPTIONS
  // ======================
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

  // 🔥 Variant select hone pe state aur URL dono update honge
  const handleVariantSelect = (key, value) => {
    const found = product.variants.find(
      (v) => v.combination?.[key] === value
    );
    if (found) {
      setSelectedVariant(found);
      
      // Update URL real-time
      searchParams.set("variant", found._id);
      setSearchParams(searchParams, { replace: true }); // replace: true se browser history kachra nahi hogi
    }
  };

  // ======================
  // CSV ATTRIBUTE OPTIONS
  // ======================
  // 🔥 Attribute select hone pe state aur URL dono update honge
  const handleAttributeSelect = (attrName, optionObj) => {
    const newAttrs = {
      ...selectedAttributes,
      [attrName]: optionObj,
    };
    setSelectedAttributes(newAttrs);

    // Update URL real-time
    searchParams.set("attrs", encodeURIComponent(JSON.stringify(newAttrs)));
    setSearchParams(searchParams, { replace: true });
  };

  // Extra Price
  const attributesExtraPrice = useMemo(() => {
    let extra = 0;
    Object.values(selectedAttributes).forEach((opt) => {
      extra += opt?.priceAdjustment || 0;
    });
    return extra;
  }, [selectedAttributes]);

  // Final Price & Stock
  const basePrice = selectedVariant?.price || product?.price || 0;
  const finalPrice = basePrice + attributesExtraPrice;
  const stock = selectedVariant?.stock ?? product?.stock ?? 0;

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!product) return <div className="p-10 text-center">Product not found</div>;

  return (
    <div className="max-w-6xl px-4 py-8 mx-auto font-sans">
      <div className="grid gap-12 md:grid-cols-2">

        {/* ================= IMAGE SECTION ================= */}
        <div>
          <div className="bg-[#f8f8f8] p-4 rounded-md">
            <img
              src={images[activeImageIndex]}
              alt={product.name}
              className="w-full object-contain max-h-[600px] mix-blend-multiply"
            />
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 mt-4 overflow-x-auto">
              {images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  onClick={() => setActiveImageIndex(i)}
                  alt="thumbnail"
                  className={`w-20 h-20 border cursor-pointer object-cover rounded-sm transition-all ${activeImageIndex === i ? 'border-gray-800 border-2' : 'border-gray-200 hover:border-gray-400'}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* ================= DETAILS SECTION ================= */}
        <div className="flex flex-col">
          
          {/* Title & Meta */}
          <h1 className="text-[26px] leading-tight font-normal text-gray-900 uppercase">
            {product.name}
          </h1>
          
          <div className="mt-3 text-[13px] text-gray-500 uppercase tracking-wide flex items-center gap-2">
            <span>Store</span>
            {product.category && (
              <>
                <span>/</span>
                <span>{product.category}</span>
              </>
            )}
            {product.brand && (
              <>
                <span>/</span>
                <span>{product.brand}</span>
              </>
            )}
          </div>
          
          <p className="mt-2 text-[13px] text-gray-500 uppercase">
            SKU {product.baseSku || "N/A"}
          </p>

          {/* Price */}
          <div className="mt-6">
            <h2 className="text-3xl font-light text-gray-900">
              ₹{finalPrice.toFixed(2)}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Price incl. GST (18%)
            </p>
          </div>

          <div className="w-full h-px my-6 bg-gray-200"></div>

          {/* 🔥 1. STANDARD VARIANTS */}
          {Object.entries(options).length > 0 && Object.entries(options).map(([key, values]) => (
            <div key={key} className="mb-6">
              <h4 className="mb-3 text-[13px] font-semibold tracking-wider text-gray-900 uppercase">
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
                        className="w-4 h-4 mt-0.5 text-blue-600 bg-white border-gray-300 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-[14.5px] text-gray-800 group-hover:text-black">
                        {v}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

          {/* 🔥 2. CSV ATTRIBUTES */}
          {product.attributes?.length > 0 && product.attributes.map((attr) => (
            <div key={attr.name} className="mb-6">
              <h4 className="mb-3 text-[13px] font-semibold tracking-wider text-gray-900 uppercase">
                {attr.name}
              </h4>
              <div className="flex flex-col gap-2.5">
                {attr.options.map((opt) => {
                  const isSelected = selectedAttributes[attr.name]?.value === opt.value;
                  return (
                    <label key={opt.value} className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name={`attr-${attr.name}`}
                        checked={isSelected}
                        onChange={() => handleAttributeSelect(attr.name, opt)}
                        className="w-4 h-4 mt-0.5 text-[#1e73be] bg-white border-gray-400 focus:ring-[#1e73be] cursor-pointer"
                      />
                      <span className="text-[14.5px] text-gray-800 group-hover:text-black leading-tight">
                        {opt.value} 
                        {opt.priceAdjustment ? ` (+ ₹${opt.priceAdjustment.toFixed(2)})` : ""}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Stock Status */}
          <p className="mt-2 text-[15px] font-medium text-gray-900">
            {stock ? "In stock" : <span className="text-red-600">Out of stock</span>}
          </p>

          {/* 🔥 ACTIONS */}
          <div className="flex flex-col gap-3 mt-5">
           <button
  onClick={() => addToCart({
    ...product, 
    quantity: 1, 
    variant: selectedVariant, 
    attributes: selectedAttributes 
  })}
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

          {/* 🔥 4. PRODUCT DETAILS */}
          {product.details?.length > 0 && (
            <div className="mt-8">
              <h3 className="mb-3 text-[15px] text-gray-900">Product Details</h3>
              <div className="flex flex-col gap-1.5">
                {product.details.map((detail, idx) => (
                  <div key={idx} className="text-[14px] text-gray-800 uppercase flex gap-2">
                    <span className="font-medium">{detail.key.replace(/_/g, ' ')}:</span>
                    <span>{detail.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Favorite Action */}
          <div className="mt-8">
            <p className="text-[13px] text-gray-500 mb-2">Save this product for later</p>
            <button className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-sm hover:bg-gray-50">
              <FaRegHeart className="text-gray-500" /> Favorite
            </button>
          </div>

          {/* Description */}
          {product.description && (
            <div className="mt-8">
               <div className="w-full h-px mb-6 bg-gray-200"></div>
              <h3 className="mb-3 text-[15px] text-gray-900">Description</h3>
              <p className="text-[14px] text-gray-700 whitespace-pre-line leading-relaxed">
                {product.description}
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
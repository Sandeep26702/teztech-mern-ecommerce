import { useNavigate } from "react-router-dom";
import { FaShoppingCart, FaFileAlt } from "react-icons/fa";
import { useCart } from "../../context/CartContext";
import { useQuote } from "../../context/QuoteContext";
import { optimizeCloudinaryUrl } from "../../utils/api.js";

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToQuote } = useQuote();

  if (!product) return null;

  const imageUrl = optimizeCloudinaryUrl(product?.image || product?.images?.[0]?.url || product?.images?.[0] || "https://placehold.co/400x300/f3f4f6/a1a1aa?text=No+Image", 400);

  const productId = product?._id || product?.id;

  const length = product?.details?.find((d) => d.key === "LENGTH_ft")?.value;
  const width = product?.details?.find((d) => d.key === "WIDTH_ft")?.value;

  const defaultVariant = product?.variants?.length > 0 ? product.variants[0] : null;
  const defaultAttributes = {};
  const formattedCustomFields = {}; 
  
  let variationExtraPrice = 0; 

  if (product?.attributes?.length > 0) {
    product.attributes.forEach((attr) => {
      if (attr.options && attr.options.length > 0) {
        const firstOption = attr.options[0];
        defaultAttributes[attr.name] = firstOption; 
        formattedCustomFields[attr.name] = firstOption.value;
        if (firstOption.priceAdjustment) {
          variationExtraPrice += Number(firstOption.priceAdjustment);
        }
      }
    });
  }

  const rawBasePrice = Number(defaultVariant?.sellingPrice ?? defaultVariant?.price ?? product?.sellingPrice ?? product?.price ?? 0);
  const rawBaseMrp = Number(defaultVariant?.mrp ?? product?.mrp ?? 0);
  const gstRate = Number(product?.gstRate ?? product?.GST ?? 18);

  const rawTotalSelling = rawBasePrice + variationExtraPrice;
  const rawTotalMrp = rawBaseMrp + variationExtraPrice;

  const displayPrice = Math.round(rawTotalSelling * (1 + (gstRate / 100)));
  const displayMrp = Math.round(rawTotalMrp * (1 + (gstRate / 100)));

  const discountPercent = displayMrp > displayPrice ? Math.round(((displayMrp - displayPrice) / displayMrp) * 100) : 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation(); 

    addToCart({
      _id: product._id || product.id,
      name: product.name,
      category: product.category || "",
      image: imageUrl,
      sku: defaultVariant?.sku || product?.baseSku || "N/A",
      price: displayPrice, 
      gstRate: gstRate,
      shippingCharge: product.shippingCharge || 0,
      customFields: product.customFields || product.attributes || [],
      variant: defaultVariant,
      // 🔥 THE FIX: _finalPrice bhej diya jo DB me save ho jayega
      selectedCustomFields: {
        ...formattedCustomFields,
        _finalPrice: displayPrice
      }
    });
  };

  const handleAddQuote = (e) => {
    e.preventDefault();
    e.stopPropagation(); 
    addToQuote({ ...product, price: displayPrice }, 1, defaultVariant, defaultAttributes); 
  };

  return (
    <div onClick={() => navigate(`/products/${productId}`)} className="flex flex-col h-full overflow-hidden transition-all duration-300 bg-white border border-gray-100 shadow-sm cursor-pointer group rounded-2xl hover:shadow-xl">
      <div className="relative flex items-center justify-center w-full h-48 p-4 overflow-hidden sm:h-56 bg-gray-50">
        <img src={imageUrl} alt={product?.name || "Product"} className="object-contain w-full h-full transition-transform duration-500 ease-in-out group-hover:scale-110 mix-blend-multiply"/>
      </div>
      <div className="flex flex-col flex-grow p-4 sm:p-5">
        <h5 className="mb-1 text-sm sm:text-base font-bold text-gray-900 transition-colors">{product?.name || "Product Name"}</h5>
        {length && width && (
          <div className="mt-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded-lg">
              📐 {length} × {width} ft
            </span>
          </div>
        )}
        <div className="flex flex-col pt-4 mt-auto border-t border-gray-100">
          <div className="flex flex-col gap-1">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-lg sm:text-xl font-extrabold text-blue-600">₹{displayPrice.toLocaleString("en-IN")}</span>
              {displayMrp > displayPrice && (
                <>
                  <span className="text-xs text-gray-400 line-through">₹{displayMrp.toLocaleString("en-IN")}</span>
                  {discountPercent > 0 && (
                    <span className="text-xs font-bold text-green-600">{discountPercent}% OFF</span>
                  )}
                </>
              )}
            </div>
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Incl. {gstRate}% GST</span>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <button onClick={handleAddToCart} className="flex items-center justify-center flex-1 gap-2 py-2 text-sm font-bold text-white transition-all duration-300 bg-orange-600 rounded-lg shadow-sm hover:bg-orange-700"><FaShoppingCart className="text-sm" /> Cart</button>
            <button onClick={handleAddQuote} className="flex items-center justify-center flex-1 gap-2 py-2 text-sm font-bold text-gray-700 transition-all duration-300 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200"><FaFileAlt className="text-sm text-gray-500" /> Quote</button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ProductCard;
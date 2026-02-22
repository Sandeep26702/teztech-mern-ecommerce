import { useNavigate } from "react-router-dom";
import { FaShoppingCart, FaFileAlt } from "react-icons/fa";
import { useCart } from "../../context/CartContext";
import { useQuote } from "../../context/QuoteContext";

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  
  const { addToCart } = useCart();
  const { addToQuote } = useQuote();

  // 🛠️ FIX 1: Image ke liye solid logic. Backend kaise bhi bheje, yeh catch kar lega.
  const imageUrl = 
    product?.image || 
    product?.images?.[0]?.url || 
    product?.images?.[0] || 
    "https://placehold.co/400x300/f3f4f6/a1a1aa?text=No+Image";

  // 🛠️ FIX 2: ID format check. '_id' aur 'id' dono ko support karega.
  const productId = product?._id || product?.id;

  const handleAddToCart = (e) => {
    e.stopPropagation(); 
    addToCart(product);  
  };

  const handleAddQuote = (e) => {
    e.stopPropagation(); 
    addToQuote(product); 
  };

  // Safety check: Agar product data empty hai toh crash hone se bachayega
  if (!product) return null;

  return (
    <div
      // ⚠️ IMPORTANT: Agar aapke App.jsx me route "<Route path='/product/:id' ... />" hai (bina 's' ke), 
      // toh niche `/products/` ko change karke `/product/` kar dena!
      onClick={() => navigate(`/products/${productId}`)}
      className="flex flex-col h-full overflow-hidden transition-all duration-300 bg-white border border-gray-100 shadow-sm cursor-pointer group rounded-2xl hover:shadow-xl"
    >
      <div className="relative flex items-center justify-center w-full h-48 p-4 overflow-hidden sm:h-56 bg-gray-50">
        <img
          src={imageUrl}
          alt={product?.name || "Product"}
          className="object-contain w-full h-full transition-transform duration-500 ease-in-out group-hover:scale-110 mix-blend-multiply"
        />
        <div className="absolute px-3 py-1 text-xs font-bold text-gray-600 border border-gray-100 rounded-full shadow-sm top-3 right-3 bg-white/90 backdrop-blur-sm">
          {product?.category || "Electronics"}
        </div>
      </div>

      <div className="flex flex-col flex-grow p-4 sm:p-5">
        <h5 className="mb-1 text-lg font-bold text-gray-900 transition-colors line-clamp-2 group-hover:text-orange-600">
          {product?.name || "Product Name"}
        </h5>
        
        <p className="mb-4 text-sm text-gray-500 line-clamp-1">
          {product?.description || "High-quality component"}
        </p>

        <div className="flex flex-col pt-4 mt-auto border-t border-gray-100">
          <span className="mb-3 text-xl font-extrabold text-gray-900">
            ₹{product?.price ? product.price.toLocaleString('en-IN') : "0"}
          </span>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleAddToCart}
              className="flex items-center justify-center flex-1 gap-2 py-2 text-sm font-bold text-white transition-all duration-300 bg-orange-600 rounded-lg shadow-sm hover:bg-orange-700 active:scale-95"
              title="Add to Cart"
            >
              <FaShoppingCart className="text-sm" /> 
              <span>Cart</span>
            </button>

            <button 
              onClick={handleAddQuote}
              className="flex items-center justify-center flex-1 gap-2 py-2 text-sm font-bold text-gray-700 transition-all duration-300 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 hover:text-gray-900 active:scale-95"
              title="Add to Quotation"
            >
              <FaFileAlt className="text-sm text-gray-500" /> 
              <span>Quote</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
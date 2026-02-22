import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProductById } from "../services/productService";
import { useCart } from "../context/CartContext";
import { useQuote } from "../context/QuoteContext"; // 🚀 Quote Context
import { FaShoppingCart, FaFileAlt } from "react-icons/fa";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToQuote } = useQuote(); 
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProduct();
  }, [id]);

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

  if (loading) return <p className="mt-10 text-xl font-bold text-center text-gray-500">Loading Product Details...</p>;
  
  if (!product) return (
    <div className="mt-10 text-center">
      <p className="text-xl text-red-500">Product not found!</p>
      <button onClick={() => navigate('/products')} className="px-4 py-2 mt-4 text-white bg-blue-600 rounded-lg">Go Back</button>
    </div>
  );

  return (
    <div className="max-w-6xl px-4 py-10 mx-auto sm:px-6 lg:px-8">
      <div className="flex flex-col gap-10 md:flex-row">
        
        {/* IMAGE SECTION */}
        <div className="flex items-center justify-center p-6 border border-gray-100 bg-gray-50 rounded-2xl md:w-1/2">
          <img
            src={product.images?.[0]?.url || product.image || "https://placehold.co/600x400/f3f4f6/a1a1aa?text=No+Image"}
            alt={product.name}
            className="object-contain w-full h-auto max-h-96 mix-blend-multiply"
          />
        </div>

        {/* DETAILS SECTION */}
        <div className="flex flex-col justify-center md:w-1/2">
          <span className="inline-block px-3 py-1 mb-3 text-xs font-bold text-blue-600 bg-blue-100 rounded-full w-max">
            {product.category || "Electronics"}
          </span>
          
          <h1 className="mb-4 text-3xl font-extrabold text-gray-900 lg:text-4xl">{product.name}</h1>
          <p className="mb-6 text-lg text-gray-600">{product.description}</p>

          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-3xl font-black text-gray-900">
              ₹ {product.price ? product.price.toLocaleString('en-IN') : "0"}
            </h2>
            <span className={`px-3 py-1 text-sm font-bold rounded-full ${product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {product.stock > 0 ? "In Stock" : "Out of Stock"}
            </span>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex gap-4 mt-auto border-t border-gray-100 pt-7">
            <button
              disabled={product.stock === 0}
              onClick={() => addToCart(product)}
              className="flex items-center justify-center flex-1 gap-2 py-4 text-base font-bold text-white transition-all duration-300 bg-orange-600 rounded-xl hover:bg-orange-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaShoppingCart /> Add to Cart
            </button>

            <button
              onClick={() => addToQuote(product)}
              className="flex items-center justify-center flex-1 gap-2 py-4 text-base font-bold text-gray-700 transition-all duration-300 bg-gray-100 border border-gray-200 rounded-xl hover:bg-gray-200 hover:text-gray-900 active:scale-95"
            >
              <FaFileAlt /> Request Quote
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProductDetail;
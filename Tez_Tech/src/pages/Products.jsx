import { useEffect, useState } from "react";
import { getProducts } from "../services/productService";
import ProductCard from "../components/common/ProductCard";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data } = await getProducts({
        keyword,
        page,
        limit: 8,
      });
      setProducts(data.products || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Failed to fetch products", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]); // Re-run when page changes

  const handleSearch = (e) => {
    e.preventDefault(); // Prevent page reload if wrapped in form
    setPage(1);
    loadProducts();
  };

  return (
    <div className="min-h-screen px-4 py-12 font-sans bg-gray-50 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        
        {/* 🌟 Header & Search Section */}
        <div className="flex flex-col justify-between gap-6 mb-12 md:flex-row md:items-center">
          
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">
              Our Products
            </h2>
            <p className="mt-2 text-gray-500">
              Discover the best electronic components for your next project.
            </p>
          </div>

          {/* 🔍 Premium Search Bar */}
          <form 
            onSubmit={handleSearch} 
            className="relative w-full md:w-96 group"
          >
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400 transition-colors group-focus-within:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              className="block w-full pl-11 pr-24 py-3.5 border border-gray-200 rounded-full leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
              placeholder="Search components..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <button
              type="submit"
              className="absolute inset-y-1.5 right-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-full hover:bg-blue-700 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Search
            </button>
          </form>

        </div>

        {/* 📦 Loading & Product Grid */}
        {loading ? (
          // Skeleton/Loader while fetching
          <div className="flex flex-col items-center justify-center py-20">
            <svg className="w-10 h-10 mb-4 text-blue-600 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="font-medium text-gray-500">Loading products...</p>
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p) => (
              <div 
                key={p._id} 
                className="transition-all duration-300 transform hover:-translate-y-1"
              >
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        ) : (
          // Empty State
          <div className="py-20 text-center bg-white border border-gray-100 shadow-sm rounded-2xl">
            <span className="block mb-4 text-5xl">📭</span>
            <h3 className="text-lg font-bold text-gray-900">No products found</h3>
            <p className="mt-2 text-gray-500">We couldn't find anything matching "{keyword}". Try another search.</p>
            <button 
              onClick={() => { setKeyword(""); setPage(1); loadProducts(); }}
              className="mt-6 font-medium text-blue-600 hover:underline"
            >
              Clear Search
            </button>
          </div>
        )}

        {/* 📄 Modern Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 pt-8 border-t border-gray-200 mt-14">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-300 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:text-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
              Previous
            </button>

            <span className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-full shadow-inner">
              Page <span className="font-bold text-gray-900">{page}</span> of {totalPages}
            </span>

            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-300 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:text-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-700"
            >
              Next
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default Products;
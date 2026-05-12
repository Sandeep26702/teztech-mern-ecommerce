import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import { getProducts } from "../services/productService";
import ProductCard from "../components/common/ProductCard";

// Cache ko bahar rakha hai taaki performance achhi rahe
const productsListCache = new Map();

const Products = () => {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [keyword, setKeyword] = useState(searchParams.get("q") || "");
  const [appliedKeyword, setAppliedKeyword] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [breadcrumbPath, setBreadcrumbPath] = useState([]);

  // Universal Filter Modal State (Ab ye Desktop + Mobile dono pe chalega)
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  useEffect(() => {
    if (slug) {
      axios.get(`https://sonani-backend.onrender.com/api/categories/tree/${slug}`)
        .then(res => {
           if (res.data.success) setBreadcrumbPath(res.data.tree);
        })
        .catch(err => console.error(err));
    } else {
      setBreadcrumbPath([]);
    }
  }, [slug]);

  // Load Categories on Mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await axios.get("https://sonani-backend.onrender.com/api/categories");
        if (res.data.success) {
          setCategories(res.data.categories || []);
        }
      } catch (error) {
        console.error("Failed to load categories", error);
      }
    };
    loadCategories();
  }, []);

  // Handle Route Category
  useEffect(() => {
    if (slug && categories.length > 0) {
      const routeCategoryName = categories.find((item) => item.slug === slug)?.name;
      if (routeCategoryName && routeCategoryName !== selectedCategory) {
        setSelectedCategory(routeCategoryName);
        setPage(1);
      }
    }
  }, [slug, categories]);

  // Debounce Search Keyword
  useEffect(() => {
    const timer = setTimeout(() => {
      if (appliedKeyword !== keyword) {
        setAppliedKeyword(keyword);
        setPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [keyword, appliedKeyword]);

  // Sync State TO URL
  useEffect(() => {
    const params = {};
    if (appliedKeyword) params.q = appliedKeyword;
    if (selectedCategory) params.category = selectedCategory;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    if (page > 1) params.page = String(page);
    
    setSearchParams(params, { replace: true });
  }, [appliedKeyword, selectedCategory, minPrice, maxPrice, page, setSearchParams]);

  // Fetch Products Function
  const loadProducts = async () => {
    const cacheKey = JSON.stringify({
      keyword: appliedKeyword || "",
      category: selectedCategory || "",
      minPrice: minPrice || "",
      maxPrice: maxPrice || "",
      page,
      limit: 8,
      random: true,
    });

    const cached = productsListCache.get(cacheKey);
    if (cached) {
      setProducts(cached.products || []);
      setTotalPages(cached.totalPages || 1);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data } = await getProducts({
        keyword: appliedKeyword,
        category: selectedCategory,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        page,
        limit: 8,
        random: true,
      });
      
      setProducts(data.products || []);
      setTotalPages(data.totalPages || 1);
      
      productsListCache.set(cacheKey, {
        products: data.products || [],
        totalPages: data.totalPages || 1,
      });
    } catch (error) {
      console.error("Failed to fetch products", error);
      setProducts([]); 
    } finally {
      setLoading(false);
    }
  };

  // Trigger API Call when filters change
  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, appliedKeyword, selectedCategory, minPrice, maxPrice]);

  const categoryOptions = useMemo(() => categories.map((item) => item.name), [categories]);

  const clearFilters = () => {
    setKeyword("");
    setAppliedKeyword("");
    setSelectedCategory("");
    setMinPrice("");
    setMaxPrice("");
    setPage(1);
    setIsFilterModalOpen(false);
  };

  const activeCategoryLabel = slug ? categories.find((item) => item.slug === slug)?.name : selectedCategory;

  // Jab modal open ho toh background scroll disable karne ke liye
  useEffect(() => {
    if (isFilterModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => { document.body.style.overflow = "auto"; };
  }, [isFilterModalOpen]);

  // 🔥 NAYA FUNCTION: Page change hone par smooth scroll to top
  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="relative min-h-screen pb-12 font-sans bg-gray-50">
      
      {/* 1. NON-STICKY HEADER */}
      <div className="px-4 pt-12 mx-auto sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex flex-col gap-6 mb-4">
          {breadcrumbPath.length > 0 && (
            <nav className="flex items-center overflow-x-auto text-sm font-medium text-gray-500 whitespace-nowrap">
              <Link to="/" className="hover:text-blue-600">Home</Link>
              <span className="mx-2 text-gray-400">/</span>
              <Link to="/categories" className="hover:text-blue-600">Categories</Link>
              {breadcrumbPath.map((item, index) => (
                <span key={item._id} className="flex items-center">
                  <span className="mx-2 text-gray-400">/</span>
                  {index === breadcrumbPath.length - 1 ? (
                    <span className="font-bold text-gray-900">{item.name}</span>
                  ) : (
                    <Link to={`/category/${item.slug}`} className="hover:text-blue-600">{item.name}</Link>
                  )}
                </span>
              ))}
            </nav>
          )}
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">Our Products</h2>
            <p className="mt-2 text-gray-500">
              {activeCategoryLabel
                ? `Showing category: ${activeCategoryLabel}`
                : "Discover the best electronic components for your next project."}
            </p>
          </div>
        </div>
      </div>

      {/* 🚀 2. STICKY SEARCH & FILTER SECTION (UNIVERSAL FOR PC & MOBILE) */}
      <div className="sticky top-[60px] md:top-[70px] z-30 w-full px-4 py-4 transition-all duration-300 border-b shadow-sm sm:px-6 lg:px-8 bg-gray-50/95 backdrop-blur-md border-gray-200/60">
        <div className="flex flex-col gap-4 mx-auto max-w-7xl">
          
          <div className="flex items-center w-full gap-3">
            {/* Search Bar */}
            <div className="relative flex-grow group">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400 transition-colors group-focus-within:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                className="block w-full py-3.5 pl-11 pr-12 transition-all bg-white border border-gray-200 rounded-full shadow-sm leading-5 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search products by name..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
              {keyword && (
                <button
                  type="button"
                  onClick={() => setKeyword("")}
                  className="absolute inset-y-1.5 right-1.5 px-3 py-2 text-gray-500 hover:text-red-500 focus:outline-none"
                  title="Clear Search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Button (Now visible on Desktop too!) */}
            <button
              type="button"
              onClick={() => setIsFilterModalOpen(true)}
              className="flex items-center justify-center px-4 py-3.5 bg-white border border-gray-200 rounded-full shadow-sm text-gray-700 hover:bg-gray-100 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              {/* Desktop par "Filters" likha hua aayega icon ke sath */}
              <span className="hidden ml-2 font-bold md:block">Filters</span>
            </button>
          </div>

        </div>
      </div>

      {/* 3. SCROLLABLE PRODUCTS GRID */}
      <div className="px-4 mx-auto mt-8 sm:px-6 lg:px-8 max-w-7xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <svg className="w-10 h-10 mb-4 text-blue-600 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            <p className="font-medium text-gray-500">Loading products...</p>
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p) => (
              <div key={p._id} className="transition-all duration-300 transform hover:-translate-y-1">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center bg-white border border-gray-100 shadow-sm rounded-2xl">
            <span className="block mb-4 text-5xl">📦</span>
            <h3 className="text-lg font-bold text-gray-900">No products found</h3>
            <p className="mt-2 text-gray-500">Try changing category or price filters.</p>
            <button onClick={clearFilters} className="mt-6 font-medium text-blue-600 hover:underline">
              Clear all filters
            </button>
          </div>
        )}

        {/* PAGINATION */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 pt-8 border-t border-gray-200 mt-14">
            <button 
              disabled={page === 1} 
              onClick={() => handlePageChange(page - 1)} // 🔥 Updated Function Here
              className="px-5 py-2.5 rounded-full border border-gray-300 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-full shadow-inner">
              Page <span className="font-bold text-gray-900">{page}</span> of {totalPages}
            </span>
            <button 
              disabled={page === totalPages} 
              onClick={() => handlePageChange(page + 1)} // 🔥 Updated Function Here
              className="px-5 py-2.5 rounded-full border border-gray-300 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* 🎛️ 4. UNIVERSAL FILTER MODAL (Desktop + Mobile) */}
      {/* ========================================== */}
      <div 
        className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center transition-all duration-300 ${
          isFilterModalOpen ? "visible opacity-100 pointer-events-auto" : "invisible opacity-0 pointer-events-none"
        }`}
      >
        {/* Dark Background Overlay */}
        <div 
          className="absolute inset-0 transition-opacity duration-300 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsFilterModalOpen(false)}
        ></div>

        {/* Modal Box */}
        <div 
          className={`relative w-full sm:max-w-md max-h-[85vh] bg-white rounded-t-3xl sm:rounded-3xl p-6 flex flex-col transform transition-transform duration-300 shadow-2xl ${
            isFilterModalOpen ? "translate-y-0 sm:scale-100" : "translate-y-full sm:translate-y-0 sm:scale-95"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-100">
            <h3 className="text-xl font-bold text-gray-900">Filters</h3>
            <button
              onClick={() => setIsFilterModalOpen(false)}
              className="p-2 text-gray-400 transition-colors bg-gray-100 rounded-full hover:bg-gray-200 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Filter Content */}
          <div className="flex flex-col gap-6 mb-6 overflow-y-auto">
            
            {/* Category Select */}
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
                className="w-full px-4 py-3 text-sm border border-gray-200 outline-none cursor-pointer bg-gray-50 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {categoryOptions.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700">Price Range</label>
              <div className="flex items-center gap-3">
                <input
                  type="number" min="0" placeholder="Min (₹)" value={minPrice}
                  onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
                  className="w-1/2 px-4 py-3 text-sm border border-gray-200 outline-none bg-gray-50 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <span className="font-bold text-gray-400">-</span>
                <input
                  type="number" min="0" placeholder="Max (₹)" value={maxPrice}
                  onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
                  className="w-1/2 px-4 py-3 text-sm border border-gray-200 outline-none bg-gray-50 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4 pt-4 mt-auto border-t border-gray-100">
            <button 
              onClick={clearFilters} 
              className="px-4 py-3.5 font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Clear All
            </button>
            <button 
              onClick={() => setIsFilterModalOpen(false)} 
              className="px-4 py-3.5 font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-md shadow-blue-500/30 transition-all active:scale-95"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Products;
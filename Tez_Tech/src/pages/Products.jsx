import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import { getProducts } from "../services/productService";
import ProductCard from "../components/common/ProductCard";

const productsListCache = new Map();

const Products = () => {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [categories, setCategories] = useState([]);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/categories");
        if (res.data.success) {
          setCategories(res.data.categories || []);
        }
      } catch (error) {
        console.error("Failed to load categories", error);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    const routeCategory = slug
      ? categories.find((item) => item.slug === slug)?.name || ""
      : "";

    const queryKeyword = searchParams.get("q") || "";
    const queryCategory = searchParams.get("category") || "";
    const queryMin = searchParams.get("minPrice") || "";
    const queryMax = searchParams.get("maxPrice") || "";
    const queryPage = Number(searchParams.get("page") || 1);

    setKeyword(queryKeyword);
    setAppliedKeyword(queryKeyword);
    setSelectedCategory(routeCategory || queryCategory);
    setMinPrice(queryMin);
    setMaxPrice(queryMax);
    setPage(Number.isFinite(queryPage) && queryPage > 0 ? queryPage : 1);
  }, [slug, searchParams, categories]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (appliedKeyword !== keyword) {
        setAppliedKeyword(keyword);
        setPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [keyword, appliedKeyword]);

  useEffect(() => {
    const params = {};
    if (appliedKeyword) params.q = appliedKeyword;
    if (selectedCategory) params.category = selectedCategory;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    if (page > 1) params.page = String(page);
    setSearchParams(params, { replace: true });
  }, [appliedKeyword, selectedCategory, minPrice, maxPrice, page, setSearchParams]);

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
    } finally {
      setLoading(false);
    }
  };

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
  };

  const activeCategoryLabel = slug ? categories.find((item) => item.slug === slug)?.name : "";

  return (
    <div className="min-h-screen px-4 py-12 font-sans bg-gray-50 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 mb-8">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">Our Products</h2>
            <p className="mt-2 text-gray-500">
              {activeCategoryLabel
                ? `Showing category: ${activeCategoryLabel}`
                : "Discover the best electronic components for your next project."}
            </p>
          </div>

          <div className="relative w-full md:w-96 group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400 transition-colors group-focus-within:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              className="block w-full py-3.5 pl-11 pr-24 transition-all bg-white border border-gray-200 rounded-full shadow-sm leading-5 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search components..."
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
                X
              </button>
            )}
          </div>
        </div>

        <div className="p-4 mb-8 bg-white border border-gray-100 shadow-sm rounded-2xl">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg"
            >
              <option value="">All Categories</option>
              {categoryOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>

            <input
              type="number"
              min="0"
              placeholder="Min Price"
              value={minPrice}
              onChange={(e) => {
                setMinPrice(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg"
            />

            <input
              type="number"
              min="0"
              placeholder="Max Price"
              value={maxPrice}
              onChange={(e) => {
                setMaxPrice(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg"
            />

            <button
              type="button"
              onClick={clearFilters}
              className="px-3 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Clear Filters
            </button>
          </div>
        </div>

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
            <span className="block mb-4 text-5xl">??</span>
            <h3 className="text-lg font-bold text-gray-900">No products found</h3>
            <p className="mt-2 text-gray-500">Try changing category or price filters.</p>
            <button onClick={clearFilters} className="mt-6 font-medium text-blue-600 hover:underline">
              Clear all filters
            </button>
          </div>
        )}

        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 pt-8 border-t border-gray-200 mt-14">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-5 py-2.5 rounded-full border border-gray-300 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>

            <span className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-full shadow-inner">
              Page <span className="font-bold text-gray-900">{page}</span> of {totalPages}
            </span>

            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="px-5 py-2.5 rounded-full border border-gray-300 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;

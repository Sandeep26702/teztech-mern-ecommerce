import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { getApiUrl, optimizeCloudinaryUrl } from "../utils/api.js";

const API_URL = getApiUrl();

const CategoriesPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Naya State: Track karne ke liye ki hum kis folder ke andar hain
  const [selectedPath, setSelectedPath] = useState([]); 
  const navigate = useNavigate();

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await axios.get(`${API_URL}/categories`);
        if (res.data.success) {
          setCategories(res.data.categories || []);
        }
      } catch (error) {
        console.error("Category load failed", error);
      } finally {
        setLoading(false);
      }
    };
    loadCategories();
  }, []);

  // Current parent nikalna (Agar path khali hai toh Level 1 par hain)
  const currentParentId = selectedPath.length > 0 ? selectedPath[selectedPath.length - 1]._id : null;

  const displayCategories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    
    // Agar kuch search ho raha hai, toh poori list me dhoondho (Flat Search)
    if (q) {
      return categories.filter((c) =>
        c.name?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q)
      );
    } 
    
    // Warna step-by-step (Drill-down) dikhao
    return categories.filter((c) => {
      const parentId = c.parentCategory?._id || c.parentCategory; // ObjectId ya populated string
      if (!currentParentId) return !parentId; // Level 1 (Jiska koi baap nahi)
      return parentId === currentParentId; // Level 2 ya 3 (Jo selected parent ke bacche hain)
    });
  }, [categories, searchQuery, currentParentId]);

  // Check karne ke liye ki is category ke aage sub-categories hain ya nahi
  const hasChildren = (categoryId) => {
    return categories.some(c => (c.parentCategory?._id || c.parentCategory) === categoryId);
  };

  // Card Click Logic
  const handleCategoryClick = (category, e) => {
    if (searchQuery) return; // Search mode me direct link kaam karega
    
    if (hasChildren(category._id)) {
      e.preventDefault(); // Link ko dusre page par jaane se roko
      setSelectedPath([...selectedPath, category]); // Andar wale folder me jao
    }
    // Agar children nahi hain, toh Link default behave karega aur /category/:slug par le jayega
  };

  // Breadcrumb Click Logic (Peeche aane ke liye)
  const handleBreadcrumbClick = (index) => {
    if (index === -1) {
      setSelectedPath([]); // Wapas Home/Level 1 par
    } else {
      setSelectedPath(selectedPath.slice(0, index + 1)); // Kisi specific level par wapas
    }
  };

  return (
    <div className="min-h-screen pb-12 bg-gray-50">
      
      {/* ========================================== */}
      {/* 1. NON-STICKY HEADER (Title & Subtitle)    */}
      {/* ========================================== */}
      <div className="px-4 pt-12 text-center w-full sm:px-8 lg:px-12">
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
          Explore <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Categories</span>
        </h1>
        <p className="max-w-2xl mx-auto text-lg text-gray-500">
          Step-by-step products browse karein aur apni pasand ka design dhoondhein.
        </p>
      </div>

      {/* ========================================== */}
      {/* 🚀 2. STICKY SEARCH & BREADCRUMBS SECTION  */}
      {/* ========================================== */}
      <div className="sticky top-0 z-50 w-full px-4 py-4 transition-all duration-300 border-b shadow-sm sm:px-8 lg:px-12 bg-gray-50/90 backdrop-blur-md border-gray-200/60">
        <div className="flex flex-col gap-4 w-full">
          
          {/* Search Box */}
          <div className="relative w-full max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search categories (e.g., Hindu, Lamp, Ganesh)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-3.5 pl-12 pr-4 text-gray-900 transition-all duration-300 bg-white border border-gray-200 shadow-sm rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
            />
          </div>

          {/* Breadcrumbs (Navigation) - Agar kisi folder ke andar hain toh ye bhi sticky rahega */}
          {!searchQuery && selectedPath.length > 0 && (
            <nav className="flex items-center w-full max-w-4xl p-3 mx-auto overflow-x-auto text-sm font-bold text-gray-500 bg-white border border-gray-200 shadow-sm rounded-xl">
              <button onClick={() => handleBreadcrumbClick(-1)} className="pl-2 transition-colors hover:text-blue-600 whitespace-nowrap">
                All Categories
              </button>
              {selectedPath.map((pathItem, index) => (
                <div key={pathItem._id} className="flex items-center whitespace-nowrap">
                  <svg className="w-4 h-4 mx-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <button 
                    onClick={() => handleBreadcrumbClick(index)}
                    className={`transition-colors pr-2 ${index === selectedPath.length - 1 ? 'text-blue-600' : 'hover:text-blue-600'}`}
                  >
                    {pathItem.name}
                  </button>
                </div>
              ))}
            </nav>
          )}

        </div>
      </div>

      {/* ========================================== */}
      {/* 3. SCROLLABLE CATEGORIES GRID              */}
      {/* ========================================== */}
      <div className="px-4 mt-8 w-full sm:px-8 lg:px-12">
        {loading ? (
          <div className="py-16 text-center text-gray-500">Loading categories...</div>
        ) : displayCategories.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8">
            {displayCategories.map((category) => {
              const isFolder = hasChildren(category._id) && !searchQuery;

              return (
                <Link
                  key={category._id}
                  to={`/category/${category.slug}`}
                  onClick={(e) => handleCategoryClick(category, e)}
                  className="flex flex-col items-center group cursor-pointer bg-white p-4 border border-gray-100 shadow-sm rounded-none hover:shadow-md hover:-translate-y-1 transition-all duration-300 hover:border-blue-300"
                >
                  {/* Square Image Box */}
                  <div className="w-full aspect-square rounded-none overflow-hidden border border-gray-200/80 bg-slate-50 shadow-sm flex items-center justify-center relative">
                    {category.image ? (
                      <img 
                        src={optimizeCloudinaryUrl(category.image, 400)} 
                        alt={category.name} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300">
                        No Image
                      </div>
                    )}

                    {/* Folder Indicator Badge */}
                    {isFolder && (
                      <div className="absolute top-3 right-3 bg-blue-500/90 backdrop-blur-sm text-white text-[9px] font-black px-2.5 py-1 rounded-lg tracking-widest uppercase shadow-sm">
                        Sub-categories
                      </div>
                    )}
                  </div>

                  {/* Details block */}
                  <div className="mt-4 text-center w-full">
                    <h2 className="text-base font-bold text-gray-800 group-hover:text-blue-600 transition-colors truncate">
                      {category.name}
                    </h2>
                    <p className="mt-1 text-xs text-gray-500 line-clamp-2 px-1">
                      {category.description || "Browse designs and products"}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center">
            <h3 className="text-lg font-medium text-gray-900">No categories found</h3>
            <p className="mt-1 text-gray-500">
              {searchQuery ? "Try a different search term." : "This category is empty right now."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoriesPage;
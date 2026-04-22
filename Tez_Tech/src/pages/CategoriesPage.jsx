import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

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
        const res = await axios.get("https://sonani-backend.onrender.com/api/categories");
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
    <div className="min-h-screen py-12 bg-gray-50">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        
        <div className="mb-10 text-center">
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            Explore <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Categories</span>
          </h1>
          <p className="max-w-2xl mx-auto mb-8 text-lg text-gray-500">
            Step-by-step products browse karein aur apni pasand ka design dhoondhein.
          </p>

          {/* Search Box */}
          <div className="relative max-w-2xl mx-auto">
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
              className="w-full py-4 pl-12 pr-4 text-gray-900 transition-all duration-300 bg-white border border-gray-200 shadow-sm rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Breadcrumbs (Navigation) */}
        {!searchQuery && selectedPath.length > 0 && (
          <nav className="flex items-center mb-6 text-sm font-bold text-gray-500 bg-white p-4 rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
            <button onClick={() => handleBreadcrumbClick(-1)} className="hover:text-blue-600 whitespace-nowrap transition-colors">
              All Categories
            </button>
            {selectedPath.map((pathItem, index) => (
              <div key={pathItem._id} className="flex items-center whitespace-nowrap">
                <svg className="w-4 h-4 mx-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <button 
                  onClick={() => handleBreadcrumbClick(index)}
                  className={`transition-colors ${index === selectedPath.length - 1 ? 'text-blue-600' : 'hover:text-blue-600'}`}
                >
                  {pathItem.name}
                </button>
              </div>
            ))}
          </nav>
        )}

        {loading ? (
          <div className="py-16 text-center text-gray-500">Loading categories...</div>
        ) : displayCategories.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {displayCategories.map((category) => {
              const isFolder = hasChildren(category._id) && !searchQuery;

              return (
                <Link
                  key={category._id}
                  to={`/category/${category.slug}`}
                  onClick={(e) => handleCategoryClick(category, e)}
                  className="flex flex-col p-6 transition-all duration-300 bg-white border border-gray-100 shadow-sm group rounded-2xl hover:shadow-lg hover:-translate-y-1 hover:border-blue-100 relative overflow-hidden"
                >
                  {/* Folder Indicator Badge */}
                  {isFolder && (
                    <div className="absolute top-0 right-0 bg-blue-100 text-blue-700 text-[10px] font-black px-3 py-1 rounded-bl-xl tracking-widest uppercase">
                      Sub-categories
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 overflow-hidden border rounded-xl">
                      <img src={category.image} alt={category.name} className="object-cover w-full h-full" />
                    </div>
                    <div className={`p-2 transition-colors duration-300 rounded-full ${isFolder ? 'text-blue-400 bg-blue-50' : 'text-gray-300 group-hover:bg-green-50 group-hover:text-green-600'}`}>
                      {isFolder ? (
                        // Folder Icon
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                      ) : (
                        // Link / Product Icon
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      )}
                    </div>
                  </div>

                  <div className="mt-auto">
                    <h2 className="mb-2 text-lg font-bold text-gray-900 transition-colors group-hover:text-blue-600">
                      {category.name}
                    </h2>
                    <p className="text-sm text-gray-500 line-clamp-2">{category.description || "Browse designs and products"}</p>
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
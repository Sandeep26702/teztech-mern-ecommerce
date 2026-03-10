import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const CategoriesPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/categories");
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

  const filteredCategories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return categories;
    return categories.filter(
      (category) =>
        category.name?.toLowerCase().includes(q) ||
        category.description?.toLowerCase().includes(q)
    );
  }, [categories, searchQuery]);

  return (
    <div className="min-h-screen py-12 bg-gray-50">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            Explore <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Categories</span>
          </h1>
          <p className="max-w-2xl mx-auto mb-8 text-lg text-gray-500">
            Category-wise products browse karo aur filters ke saath quickly shortlist karo.
          </p>

          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-4 pl-12 pr-4 text-gray-900 transition-all duration-300 bg-white border border-gray-200 shadow-sm rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-gray-500">Loading categories...</div>
        ) : filteredCategories.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCategories.map((category) => (
              <Link
                key={category._id}
                to={`/category/${category.slug}`}
                className="flex flex-col p-6 transition-all duration-300 bg-white border border-gray-100 shadow-sm group rounded-2xl hover:shadow-lg hover:-translate-y-1 hover:border-blue-100"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 overflow-hidden border rounded-xl">
                    <img src={category.image} alt={category.name} className="object-cover w-full h-full" />
                  </div>
                  <div className="p-2 text-gray-300 transition-colors duration-300 rounded-full group-hover:bg-blue-50 group-hover:text-blue-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </div>
                </div>

                <div className="mt-auto">
                  <h2 className="mb-2 text-lg font-bold text-gray-900 transition-colors group-hover:text-blue-600">
                    {category.name}
                  </h2>
                  <p className="text-sm text-gray-500 line-clamp-2">{category.description || "No description"}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <h3 className="text-lg font-medium text-gray-900">No categories found</h3>
            <p className="mt-1 text-gray-500">Try a different search term.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoriesPage;

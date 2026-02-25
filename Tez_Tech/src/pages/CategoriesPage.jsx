import { useState } from "react";
import { Link } from "react-router-dom";

const CategoriesPage = () => {
  // 1. Search query ko store karne ke liye state
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    { id: 1, name: "Poly Sheet", slug: "poly-sheet", description: "High-quality durable poly sheets.", icon: "📋", color: "bg-blue-50 text-blue-600" },
    { id: 2, name: "LED Products", slug: "led-products", description: "Modules, strips, and display LEDs.", icon: "💡", color: "bg-yellow-50 text-yellow-600" },
    { id: 3, name: "Scrolling LED Boards", slug: "scrolling-led", description: "Programmable scrolling display boards.", icon: "📟", color: "bg-red-50 text-red-600" },
    { id: 4, name: "LED Controller", slug: "led-controller", description: "Controllers for dynamic LED effects.", icon: "🎛️", color: "bg-purple-50 text-purple-600" },
    { id: 5, name: "SMPS Power Supply", slug: "smps", description: "Reliable SMPS power supply units.", icon: "🔌", color: "bg-green-50 text-green-600" },
    { id: 6, name: "SD Cards", slug: "sd-cards", description: "Memory cards for storage modules.", icon: "💾", color: "bg-gray-100 text-gray-700" },
    { id: 7, name: "Connector & Switches", slug: "connectors-switches", description: "Various connectors and toggle switches.", icon: "🔗", color: "bg-indigo-50 text-indigo-600" },
    { id: 8, name: "IC (Integrated Circuits)", slug: "ic", description: "Timers, logic gates, and microchips.", icon: "🖲️", color: "bg-pink-50 text-pink-600" },
    { id: 9, name: "PCB", slug: "pcb", description: "Printed Circuit Boards for your projects.", icon: "🟩", color: "bg-emerald-50 text-emerald-600" },
    { id: 10, name: "Modules & Sensors", slug: "modules-sensors", description: "Ultrasonic, IR, and temperature sensors.", icon: "📡", color: "bg-cyan-50 text-cyan-600" },
    { id: 11, name: "Wires & Cables", slug: "wires-cables", description: "Jumper wires, ribbon cables, and more.", icon: "🧶", color: "bg-orange-50 text-orange-600" },
    { id: 12, name: "Framing Materials", slug: "framing", description: "Materials for structural framing.", icon: "🏗️", color: "bg-stone-100 text-stone-600" },
    { id: 13, name: "Nylon Cable Ties", slug: "cable-ties", description: "Strong and durable nylon zip ties.", icon: "🎗️", color: "bg-lime-50 text-lime-600" },
    { id: 14, name: "Peltier & ACC", slug: "peltier", description: "Thermoelectric cooling modules & accessories.", icon: "❄️", color: "bg-sky-50 text-sky-600" },
    { id: 15, name: "Softwares & Other", slug: "software", description: "Tools and utility softwares.", icon: "💻", color: "bg-blue-50 text-blue-700" },
    { id: 16, name: "Knowledge Centre", slug: "knowledge-centre", description: "Guides, tutorials, and documentations.", icon: "📚", color: "bg-amber-50 text-amber-600" },
    { id: 17, name: "Electronic Components", slug: "ele-compont", description: "Basic resistors, capacitors, and diodes.", icon: "⚙️", color: "bg-teal-50 text-teal-600" },
    { id: 18, name: "Enclosures", slug: "enclosures", description: "Project boxes and protective casings.", icon: "📦", color: "bg-rose-50 text-rose-600" },
    { id: 19, name: "Art & Craft", slug: "art-craft", description: "Materials for aesthetic project designs.", icon: "🎨", color: "bg-fuchsia-50 text-fuchsia-600" },
    { id: 20, name: "Partner Network Products", slug: "partner-products", description: "Exclusive products from our partners.", icon: "🤝", color: "bg-violet-50 text-violet-600" },
    { id: 21, name: "Raw Materials", slug: "raw-materials", description: "Basic raw materials for manufacturing.", icon: "🧱", color: "bg-amber-100 text-amber-700" },
    { id: 22, name: "Lighting Automation", slug: "lighting-automation", description: "Smart lighting control systems.", icon: "🏠", color: "bg-indigo-100 text-indigo-700" },
    { id: 23, name: "Corner", slug: "corner", description: "Corner pieces and structural joints.", icon: "📐", color: "bg-slate-100 text-slate-600" },
  ];

  // 2. Categories ko filter karne ka logic
  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen py-12 bg-gray-50">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="mb-10 text-center">
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            Explore <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Categories</span>
          </h1>
          <p className="max-w-2xl mx-auto mb-8 text-lg text-gray-500">
            Find everything you need for your next electronics project. From raw materials to advanced modules.
          </p>

          {/* 🔍 SEARCH BAR UI */}
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search categories (e.g., Sensors, LED, Power)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-4 pl-12 pr-4 text-gray-900 transition-all duration-300 bg-white border border-gray-200 shadow-sm rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
            />
            {/* Clear Button (X) */}
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Categories Grid */}
        {filteredCategories.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCategories.map((category) => (
              <Link 
                key={category.id} 
                to={`/products?category=${category.slug}`} 
                className="flex flex-col p-6 transition-all duration-300 bg-white border border-gray-100 shadow-sm group rounded-2xl hover:shadow-lg hover:-translate-y-1 hover:border-blue-100"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 flex items-center justify-center rounded-xl text-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${category.color}`}>
                    {category.icon}
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
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {category.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          /* Empty State - Jab koi result na mile */
          <div className="py-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 text-gray-400 bg-gray-100 rounded-full">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">No categories found</h3>
            <p className="mt-1 text-gray-500">Try adjusting your search terms.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoriesPage;
import { useNavigate } from "react-router-dom";
import { CATEGORY_ITEMS } from "../utils/constants";

const Home = () => {
  const navigate = useNavigate();

  const handleExploreProducts = () => {
    const categoryIds = Object.keys(CATEGORY_ITEMS);
    const randomCategoryId = categoryIds[Math.floor(Math.random() * categoryIds.length)];
    navigate(`/products/${randomCategoryId}`);
  };

  // Industry Standard: Map data over arrays to keep JSX super clean
  const features = [
    {
      id: 1,
      title: "Quality Products",
      description: "Premium electronic components from trusted manufacturers worldwide",
      icon: "💎",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      borderHover: "group-hover:border-blue-500",
    },
    {
      id: 2,
      title: "Fast Delivery",
      description: "Quick and reliable shipping to meet your project deadlines",
      icon: "🚀",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      borderHover: "group-hover:border-emerald-500",
    },
    {
      id: 3,
      title: "Expert Support",
      description: "Technical assistance from our experienced electronics team",
      icon: "🛠️",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      borderHover: "group-hover:border-purple-500",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen font-sans bg-gray-50">
      
      {/* 🚀 Hero Section (Premium Gradient + Glow Effects) */}
      <section className="relative py-24 overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 sm:py-32 lg:py-40">
        
        {/* Background Blur 'Masala' */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-3/4 bg-gradient-radial from-blue-500/20 to-transparent blur-[100px] pointer-events-none"></div>

        <div className="relative z-10 px-4 mx-auto text-center max-w-7xl sm:px-6 lg:px-8">
          
          {/* Main Title with Gradient Text */}
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-7xl drop-shadow-lg">
            Welcome to <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              Sonani Electronics
            </span>
          </h1>
          
          {/* Subtitle */}
          <p className="max-w-2xl mx-auto mt-4 mb-10 text-lg leading-relaxed sm:text-xl text-blue-100/80">
            Your trusted partner for premium electronic components and cutting-edge solutions. Built for innovators, by experts.
          </p>
          
          {/* Animated Call-to-Action Button */}
          <button 
            onClick={handleExploreProducts}
            className="group relative inline-flex items-center justify-center px-8 py-3.5 text-base sm:text-lg font-bold text-gray-900 bg-white rounded-full overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(59,130,246,0.5)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-white"
          >
            <span className="relative z-10 flex items-center gap-2">
              Explore Products
              {/* Arrow that slides to the right on hover */}
              <svg 
                className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </button>
        </div>
      </section>

      {/* ✨ Features Section (Hover Cards) */}
      <section className="relative z-20 py-20 -mt-10 sm:-mt-16">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          
          {/* Section Heading */}
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Why Choose Us
            </h2>
            {/* Underline Decorative Element */}
            <div className="mt-3 h-1.5 w-24 bg-gradient-to-r from-blue-600 to-cyan-400 mx-auto rounded-full"></div>
          </div>

          {/* Cards Grid: 1 col mobile, 3 cols desktop */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {features.map((feature) => (
              <div 
                key={feature.id}
                className={`group bg-white rounded-2xl p-8 shadow-md border-b-4 border-transparent hover:-translate-y-3 hover:shadow-2xl transition-all duration-300 cursor-default ${feature.borderHover}`}
              >
                {/* Floating Icon Container */}
                <div className={`w-16 h-16 rounded-2xl ${feature.iconBg} ${feature.iconColor} flex items-center justify-center text-3xl mb-6 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                
                {/* Content */}
                <h3 className="mb-3 text-2xl font-bold text-gray-900 transition-colors group-hover:text-blue-600">
                  {feature.title}
                </h3>
                <p className="leading-relaxed text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>
      
    </div>
  );
};

export default Home;
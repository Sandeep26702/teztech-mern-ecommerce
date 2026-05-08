import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// 🌐 SMART API URL LOGIC (Local aur Live dono ke liye)
const API_URL = import.meta.env.VITE_BACKEND_URL || "https://sonani-backend.onrender.com";

const Home = () => {
  const navigate = useNavigate();
  const [layout, setLayout] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLayout = async () => {
      try {
        // 🔥 Localhost hata kar dynamic API_URL lagaya hai
        const { data } = await axios.get(`${API_URL}/api/layout/home`);
        setLayout(data);
      } catch (error) {
        console.error("Error fetching home layout:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLayout();
  }, []);

  const handleExploreProducts = () => {
    navigate('/products');
  };

  // Fallback data in case API fails or returns nothing
  const features = layout?.featureCards?.length > 0 ? layout.featureCards : [
    {
      _id: 1,
      title: "Quality Products",
      description: "Premium electronic components from trusted manufacturers worldwide",
      image: "",
    },
    {
      _id: 2,
      title: "Fast Delivery",
      description: "Quick and reliable shipping to meet your project deadlines",
      image: "",
    },
    {
      _id: 3,
      title: "Expert Support",
      description: "Technical assistance from our experienced electronics team",
      image: "",
    },
  ];

  // Gradients for back of cards
  const backGradients = [
    "from-indigo-600 to-violet-900",
    "from-teal-600 to-emerald-900",
    "from-purple-600 to-pink-900"
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen font-sans bg-gray-50">

      {/* 🚀 Hero Section */}
      <section className="relative flex items-center justify-center py-24 overflow-hidden bg-gray-900 sm:py-32 lg:py-40 min-h-[500px]">
        {/* Background Video */}
        {layout?.heroVideo ? (
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute top-0 left-0 w-full h-full object-cover z-0"
          >
            <source src={layout.heroVideo} type="video/mp4" />
          </video>
        ) : (
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 z-0"></div>
        )}

        {/* Dark Overlay to ensure text readability */}
        <div className="absolute top-0 left-0 w-full h-full bg-black/60 z-0"></div>

        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-3/4 bg-gradient-radial from-blue-500/30 to-transparent blur-[100px] pointer-events-none z-0"></div>

        <div className="relative z-10 px-4 mx-auto text-center max-w-7xl sm:px-6 lg:px-8">
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-7xl drop-shadow-lg">
            {layout?.heroTitle?.split(" ").slice(0, -2).join(" ")}{" "}
            <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              {layout?.heroTitle?.split(" ").slice(-2).join(" ") || "Sonani Electronics"}
            </span>
          </h1>

          <p className="max-w-2xl mx-auto mt-4 mb-10 text-lg leading-relaxed sm:text-xl text-blue-100/90 drop-shadow">
            {layout?.heroSubtitle || "Your trusted partner for premium electronic components and cutting-edge solutions. Built for innovators, by experts."}
          </p>

          <button
            onClick={handleExploreProducts}
            className="group relative inline-flex items-center justify-center px-8 py-3.5 text-base sm:text-lg font-bold text-gray-900 bg-white rounded-full overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(59,130,246,0.6)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-white"
          >
            <span className="relative z-10 flex items-center gap-2">
              Explore Products
              <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </button>
        </div>
      </section>

      {/* ✨ Features Section (3D Flip Cards) */}
      <section className="relative z-20 py-20 -mt-10 sm:-mt-16">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">

          <div className="mb-16 text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Why Choose Us
            </h2>
            <div className="mt-3 h-1.5 w-24 bg-gradient-to-r from-blue-600 to-cyan-400 mx-auto rounded-full"></div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 place-items-center">
            {features.map((feature, index) => (

              <div
                key={feature._id || index}
                tabIndex="0"
                className="group relative h-80 w-full max-w-[320px] [perspective:1000px] cursor-pointer focus:outline-none"
              >
                <div className="absolute duration-1000 w-full h-full [transform-style:preserve-3d] group-hover:[transform:rotateX(180deg)] group-focus:[transform:rotateX(180deg)]">

                  {/* Front Side */}
                  <div className={`absolute w-full h-full rounded-2xl bg-gray-800 text-white [backface-visibility:hidden] shadow-xl overflow-hidden`}>
                    {feature.image ? (
                      <img 
                        src={feature.image} 
                        alt={feature.title} 
                        className="absolute inset-0 w-full h-full object-cover z-0"
                      />
                    ) : (
                      <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 z-0"></div>
                    )}
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20 z-10"></div>

                    <div className="relative z-20 flex flex-col h-full p-8">
                      <div className="flex items-start justify-between">
                        <div className="text-2xl font-bold leading-tight drop-shadow-md">{feature.title}</div>
                      </div>
                      <div className="mt-auto text-center">
                        <p className="text-sm font-medium tracking-wide text-white/80 animate-pulse drop-shadow">Tap to reveal ⤵</p>
                      </div>
                    </div>
                  </div>

                  {/* Back Side */}
                  <div className={`absolute w-full h-full rounded-2xl bg-gradient-to-br ${backGradients[index % 3]} p-8 text-white [transform:rotateX(180deg)] [backface-visibility:hidden] shadow-2xl flex flex-col`}>
                    <div className="flex flex-col h-full">
                      <div className="mb-4 text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
                        Explore Catalog
                      </div>
                      <div className="flex-grow">
                        <p className="text-lg text-white/90">
                          {feature.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-auto">
                        <button
                          onClick={() => navigate('/products')}
                          className="px-5 py-2.5 bg-white text-gray-900 rounded-lg font-bold hover:bg-gray-100 hover:scale-105 transition-transform duration-200 shadow-md"
                        >
                          Read more
                        </button>
                        <span className="text-3xl drop-shadow-md">✨</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

            ))}
          </div>

        </div>
      </section>

    </div>
  );
};

export default Home;
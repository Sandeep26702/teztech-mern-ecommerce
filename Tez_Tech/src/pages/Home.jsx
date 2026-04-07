import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  const handleExploreProducts = () => {
    navigate('/products');
  };

  const features = [
    {
      id: 1,
      title: "Quality Products",
      description: "Premium electronic components from trusted manufacturers worldwide",
      icon: "💎",
      frontGrad: "from-violet-400 to-indigo-600",
      backGrad: "from-indigo-600 to-violet-900",
    },
    {
      id: 2,
      title: "Fast Delivery",
      description: "Quick and reliable shipping to meet your project deadlines",
      icon: "🚀",
      frontGrad: "from-emerald-400 to-teal-600",
      backGrad: "from-teal-600 to-emerald-900",
    },
    {
      id: 3,
      title: "Expert Support",
      description: "Technical assistance from our experienced electronics team",
      icon: "🛠️",
      frontGrad: "from-pink-400 to-purple-600",
      backGrad: "from-purple-600 to-pink-900",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen font-sans bg-gray-50">
      
      {/* 🚀 Hero Section */}
      <section className="relative py-24 overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 sm:py-32 lg:py-40">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-3/4 bg-gradient-radial from-blue-500/20 to-transparent blur-[100px] pointer-events-none"></div>

        <div className="relative z-10 px-4 mx-auto text-center max-w-7xl sm:px-6 lg:px-8">
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-7xl drop-shadow-lg">
            Welcome to <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              Sonani Electronics
            </span>
          </h1>
          
          <p className="max-w-2xl mx-auto mt-4 mb-10 text-lg leading-relaxed sm:text-xl text-blue-100/80">
            Your trusted partner for premium electronic components and cutting-edge solutions. Built for innovators, by experts.
          </p>
          
          <button 
            onClick={handleExploreProducts}
            className="group relative inline-flex items-center justify-center px-8 py-3.5 text-base sm:text-lg font-bold text-gray-900 bg-white rounded-full overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(59,130,246,0.5)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-white"
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
            {features.map((feature) => (
              
              /* 📱 MOBILE FIX: tabIndex="0", cursor-pointer, and focus:outline-none added */
              <div 
                key={feature.id} 
                tabIndex="0"
                className="group relative h-80 w-full max-w-[320px] [perspective:1000px] cursor-pointer focus:outline-none"
              >
                {/* 📱 MOBILE FIX: group-focus:[transform:rotateX(180deg)] added for touch devices */}
                <div className="absolute duration-1000 w-full h-full [transform-style:preserve-3d] group-hover:[transform:rotateX(180deg)] group-focus:[transform:rotateX(180deg)]">
                  
                  {/* Front Side */}
                  <div className={`absolute w-full h-full rounded-2xl bg-gradient-to-br ${feature.frontGrad} p-8 text-white [backface-visibility:hidden] shadow-xl`}>
                    <div className="flex flex-col h-full">
                      <div className="flex items-start justify-between">
                        <div className="text-2xl font-bold leading-tight">{feature.title}</div>
                        <div className="text-4xl drop-shadow-md">{feature.icon}</div>
                      </div>
                      <div className="mt-6">
                        <p className="text-lg text-white/90">
                          {feature.description}
                        </p>
                      </div>
                      <div className="mt-auto text-center">
                        <p className="text-sm font-medium tracking-wide opacity-80 animate-pulse">Tap to reveal ⤵</p>
                      </div>
                    </div>
                  </div>

                  {/* Back Side */}
                  <div className={`absolute w-full h-full rounded-2xl bg-gradient-to-br ${feature.backGrad} p-8 text-white [transform:rotateX(180deg)] [backface-visibility:hidden] shadow-2xl`}>
                    <div className="flex flex-col h-full">
                      <div className="mb-4 text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
                        Explore Catalog
                      </div>
                      <div className="flex-grow">
                        <p className="text-lg text-white/90">
                          Discover our extensive range of {feature.title.toLowerCase()} and take your projects to the next level.
                        </p>
                      </div>
                      
                      {/* Action Button */}
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
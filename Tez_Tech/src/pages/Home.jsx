import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// 🔥 SWIPER JS IMPORTS
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/effect-fade";
import { Autoplay, Pagination, Navigation, EffectFade } from "swiper/modules";

// 🌐 SMART API URL LOGIC
const API_URL = import.meta.env.VITE_BACKEND_URL || "https://sonani-backend.onrender.com";

const Home = () => {
  const navigate = useNavigate();
  const [layout, setLayout] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLayout = async () => {
      try {
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

  const getYouTubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // ==========================================
  // 🔥 UPDATED MEDIA RENDERER (NO CROPPING)
  // ==========================================
  const renderSlideMedia = (slide) => {
    // 1. ALWAYS check for YouTube links first, regardless of mediaType
    const ytId = slide.sourceType === "link" ? getYouTubeId(slide.mediaUrl) : null;
    if (ytId) {
      const ytSrc = `https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${ytId}&showinfo=0&rel=0`;
      return (
        <div className="absolute inset-0 w-full h-full bg-black z-0">
          <iframe
            className="w-full h-full pointer-events-none"
            src={ytSrc}
            frameBorder="0"
            allow="autoplay; encrypted-media"
            allowFullScreen
          ></iframe>
        </div>
      );
    }

    // 2. Render standard video
    if (slide.mediaType === "video") {
      return (
        <div className="absolute inset-0 w-full h-full bg-black z-0">
          <video
            autoPlay loop muted playsInline
            className="w-full h-full object-contain"
            src={slide.mediaUrl}
          />
        </div>
      );
    } 
    
    // 3. Render image (Premium Blurred Background Effect)
    return (
      <div className="absolute inset-0 w-full h-full bg-gray-900 z-0 overflow-hidden">
        {/* 1. Background Blur (Khali jagah bharne ke liye) */}
        <img
          src={slide.mediaUrl}
          alt="blur-bg"
          className="absolute inset-0 w-full h-full object-cover opacity-40 blur-2xl scale-110"
        />
        {/* 2. Main Crisp Image (Puri dikhegi, katega nahi) */}
        <img
          src={slide.mediaUrl}
          alt="Hero Slide"
          className="absolute inset-0 w-full h-full object-contain z-10"
        />
      </div>
    );
  };

  const slides = layout?.heroSlides?.length > 0 ? layout.heroSlides : [];
  const features = layout?.featureCards?.length > 0 ? layout.featureCards : [];
  const backGradients = ["from-indigo-600 to-violet-900", "from-teal-600 to-emerald-900", "from-purple-600 to-pink-900"];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen font-sans bg-gray-50">

      {/* 🚀 HERO SLIDER SECTION */}
      <section className="relative w-full h-[600px] sm:h-[700px] lg:h-[80vh] overflow-hidden bg-gray-900 z-10">

        {slides.length > 0 ? (
          <Swiper
            spaceBetween={0}
            slidesPerView={1}
            effect={'fade'}
            loop={true}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            pagination={{ clickable: true }}
            navigation={true}
            modules={[Autoplay, Pagination, Navigation, EffectFade]}
            className="w-full h-full"
          >
            {slides.map((slide, index) => (
              <SwiperSlide key={index} className="relative w-full h-full">

                {/* Media Render Hoga */}
                {renderSlideMedia(slide)}

                {/* Dark Overlay Taki Text Padhne Mein Aaye */}
                <div className="absolute top-0 left-0 w-full h-full bg-black/40 z-10 pointer-events-none"></div>

                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-4 text-center max-w-7xl mx-auto sm:px-6 lg:px-8 pointer-events-none">
                  <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-7xl drop-shadow-lg pointer-events-auto">
                    {slide.title || "Sonani Electronics"}
                  </h1>
                  {slide.subtitle && (
                    <p className="max-w-2xl mx-auto mt-4 mb-10 text-lg leading-relaxed sm:text-xl text-blue-100/90 drop-shadow pointer-events-auto">
                      {slide.subtitle}
                    </p>
                  )}

                  <button
                    onClick={handleExploreProducts}
                    className="group relative inline-flex items-center justify-center px-8 py-3.5 text-base sm:text-lg font-bold text-gray-900 bg-white rounded-full overflow-hidden transition-all duration-300 hover:scale-105 focus:outline-none pointer-events-auto"
                    onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 0 40px rgba(59,130,246,0.6)"}
                    onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Explore Products
                      <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                  </button>
                </div>

              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 z-0"></div>
        )}
      </section>

      {/* ✨ FEATURES SECTION (Waise ka waisa hi chhod diya) */}
      <section className="relative z-20 py-20 -mt-10 sm:-mt-16">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Why Choose Us</h2>
            <div className="mt-3 h-1.5 w-24 bg-gradient-to-r from-blue-600 to-cyan-400 mx-auto rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 place-items-center">
            {features.map((feature, index) => (
              <div key={feature._id || index} tabIndex="0" className="group relative h-80 w-full max-w-[320px] [perspective:1000px] cursor-pointer focus:outline-none">
                <div className="absolute duration-1000 w-full h-full [transform-style:preserve-3d] group-hover:[transform:rotateX(180deg)] group-focus:[transform:rotateX(180deg)]">
                  <div className="absolute w-full h-full rounded-2xl bg-gray-800 text-white [backface-visibility:hidden] shadow-xl overflow-hidden">
                    {feature.image ? (
                      <img src={feature.image} alt={feature.title} className="absolute inset-0 w-full h-full object-cover z-0" />
                    ) : (
                      <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 z-0"></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20 z-10"></div>
                    <div className="relative z-20 flex flex-col h-full p-8">
                      <div className="text-2xl font-bold leading-tight drop-shadow-md">{feature.title}</div>
                      <div className="mt-auto text-center">
                        <p className="text-sm font-medium tracking-wide text-white/80 animate-pulse drop-shadow">Tap to reveal ⤵</p>
                      </div>
                    </div>
                  </div>
                  <div className={`absolute w-full h-full rounded-2xl bg-gradient-to-br ${backGradients[index % 3]} p-8 text-white [transform:rotateX(180deg)] [backface-visibility:hidden] shadow-2xl flex flex-col`}>
                    <div className="flex flex-col h-full">
                      <div className="mb-4 text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">Explore Catalog</div>
                      <div className="flex-grow">
                        <p className="text-lg text-white/90">{feature.description}</p>
                      </div>
                      <div className="flex items-center justify-between mt-auto">
                        <button
                          onClick={() => navigate('/products')}
                          className="px-5 py-2.5 bg-white text-gray-900 rounded-lg font-bold hover:bg-gray-100 hover:scale-105 transition-transform shadow-md"
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
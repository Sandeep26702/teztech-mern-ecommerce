import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getApiUrl, optimizeCloudinaryUrl } from "../utils/api.js";

// 🔥 SWIPER JS IMPORTS
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/effect-fade";
import { Autoplay, Pagination, Navigation, EffectFade } from "swiper/modules";

const API_URL = getApiUrl();

const Home = () => {
  const navigate = useNavigate();
  const [layout, setLayout] = useState(null);
  const [homeCategories, setHomeCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [layoutRes, categoriesRes] = await Promise.all([
          axios.get(`${API_URL}/layout/home`),
          axios.get(`${API_URL}/categories/home-categories`)
        ]);
        setLayout(layoutRes.data);
        if (categoriesRes.data.success) {
          setHomeCategories(categoriesRes.data.categories || []);
        }
      } catch (error) {
        console.error("Error fetching homepage data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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
    const desktopUrl = optimizeCloudinaryUrl(slide.mediaUrl, 1200);
    const mobileUrl = optimizeCloudinaryUrl(slide.mobileMediaUrl || slide.mediaUrl, 600); // Fallback to desktop if mobile is missing

    // 1. ALWAYS check for YouTube links first, regardless of mediaType
    const desktopYtId = slide.sourceType === "link" ? getYouTubeId(desktopUrl) : null;
    const mobileYtId = slide.sourceType === "link" ? getYouTubeId(mobileUrl) : null;

    if (desktopYtId || mobileYtId) {
      const desktopYtSrc = desktopYtId ? `https://www.youtube.com/embed/${desktopYtId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${desktopYtId}&showinfo=0&rel=0` : "";
      const mobileYtSrc = mobileYtId ? `https://www.youtube.com/embed/${mobileYtId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${mobileYtId}&showinfo=0&rel=0` : desktopYtSrc;
      
      return (
        <div className="absolute inset-0 w-full h-full bg-black z-0 flex">
          {/* Mobile Iframe */}
          <iframe className="w-full h-full pointer-events-none block md:hidden" src={mobileYtSrc} frameBorder="0" allow="autoplay; encrypted-media" allowFullScreen></iframe>
          {/* Desktop Iframe */}
          <iframe className="w-full h-full pointer-events-none hidden md:block" src={desktopYtSrc} frameBorder="0" allow="autoplay; encrypted-media" allowFullScreen></iframe>
        </div>
      );
    }

    // 2. Render standard video
    if (slide.mediaType === "video") {
      return (
        <div className="absolute inset-0 w-full h-full bg-black z-0 flex">
          {/* Mobile Video */}
          <video autoPlay loop muted playsInline className="w-full h-full object-contain block md:hidden" src={mobileUrl} />
          {/* Desktop Video */}
          <video autoPlay loop muted playsInline className="w-full h-full object-contain hidden md:block" src={desktopUrl} />
        </div>
      );
    } 
    
    // 3. Render image (Premium Blurred Background Effect)
    return (
      <div className="absolute inset-0 w-full h-full bg-gray-900 z-0 overflow-hidden">
        {/* Background Blur */}
        <img src={desktopUrl} alt="blur-bg" className="absolute inset-0 w-full h-full object-cover opacity-40 blur-2xl scale-110 hidden md:block" />
        <img src={mobileUrl} alt="blur-bg-mobile" className="absolute inset-0 w-full h-full object-cover opacity-40 blur-2xl scale-110 block md:hidden" />
        
        {/* Main Crisp Image */}
        <picture className="absolute inset-0 w-full h-full z-10 flex items-center justify-center">
          <source media="(min-width: 768px)" srcSet={desktopUrl} />
          <img src={mobileUrl} alt="Hero Slide" className="w-full h-full object-contain" />
        </picture>
      </div>
    );
  };

  const slides = layout?.heroSlides?.length > 0 ? layout.heroSlides : [];

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

                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-4 text-center w-full pointer-events-none">
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

      {/* 📦 TOP CATEGORIES SECTION */}
      {homeCategories.length > 0 && (
        <section className="py-16 bg-white border-t border-b border-gray-100">
          <div className="px-4 w-full sm:px-8 lg:px-12">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl tracking-tight">
                Shop by <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Category</span>
              </h2>
              <p className="mt-3 text-lg text-gray-500 max-w-2xl mx-auto">
                Discover our curated range of premium manufacturing solutions and design collections.
              </p>
              <div className="mt-4 h-1.5 w-20 bg-gradient-to-r from-blue-600 to-cyan-400 mx-auto rounded-full"></div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-6">
              {homeCategories.map((category) => (
                <div
                  key={category._id}
                  onClick={() => navigate(`/category/${category.slug}`)}
                  className="flex flex-col items-center group cursor-pointer"
                >
                  <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-none overflow-hidden border border-gray-200 bg-slate-50 shadow-sm group-hover:shadow-md group-hover:border-blue-500 transition-all duration-300 flex items-center justify-center">
                    <img
                      src={optimizeCloudinaryUrl(category.image, 300)}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <span className="mt-3 text-xs sm:text-sm font-semibold text-gray-700 text-center line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {category.name}
                  </span>
                </div>
              ))}
            </div>

            {/* "More" button at the bottom/end */}
            <div className="mt-12 text-center">
              <button
                onClick={() => navigate('/categories')}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-blue-600 border-2 border-blue-600 rounded-full hover:bg-blue-600 hover:text-white transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <span>View More Categories</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>
        </section>
      )}

    </div>
  );
};

export default Home;
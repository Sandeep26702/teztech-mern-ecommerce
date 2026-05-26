import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

// 🌐 SMART API URL LOGIC
const API_URL = import.meta.env.VITE_BACKEND_URL || "https://sonani-backend.onrender.com";

const UserView = () => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [formData, setFormData] = useState({
    heroSlides: [
      {
        mediaType: "image",
        sourceType: "upload",
        mediaUrl: "",
        mobileMediaUrl: "", // Mobile URL
        title: "",
        subtitle: "",
        file: null,
        mobileFile: null, // Mobile File
        existingUrl: "",
        existingMobileUrl: "",
      }
    ],
    featureCards: [
      { title: "", description: "", image: null, existingImage: "" },
      { title: "", description: "", image: null, existingImage: "" },
      { title: "", description: "", image: null, existingImage: "" },
    ],
  });

  useEffect(() => {
    fetchLayoutData();
  }, []);

  const fetchLayoutData = async () => {
    try {
      setFetching(true);
      const { data } = await axios.get(`${API_URL}/api/layout/home`);
      if (data) {
        setFormData({
          heroSlides: data.heroSlides && data.heroSlides.length > 0
            ? data.heroSlides.map(slide => ({
              mediaType: slide.mediaType || "image",
              sourceType: slide.sourceType || "upload",
              mediaUrl: slide.sourceType === "link" ? slide.mediaUrl : "",
              mobileMediaUrl: slide.sourceType === "link" ? slide.mobileMediaUrl || "" : "",
              title: slide.title || "",
              subtitle: slide.subtitle || "",
              file: null,
              mobileFile: null,
              existingUrl: slide.sourceType === "upload" ? slide.mediaUrl : "",
              existingMobileUrl: slide.sourceType === "upload" ? slide.mobileMediaUrl || "" : "",
            }))
            : [{ mediaType: "image", sourceType: "upload", mediaUrl: "", mobileMediaUrl: "", title: "", subtitle: "", file: null, mobileFile: null, existingUrl: "", existingMobileUrl: "" }],
          
          featureCards: data.featureCards && data.featureCards.length > 0
            ? data.featureCards.map(card => ({
              title: card.title,
              description: card.description,
              image: null,
              existingImage: card.image || "",
            }))
            : [
              { title: "", description: "", image: null, existingImage: "" },
              { title: "", description: "", image: null, existingImage: "" },
              { title: "", description: "", image: null, existingImage: "" },
            ],
        });
      }
    } catch (error) {
      console.error("Error fetching layout:", error);
      toast.error("Failed to fetch current layout.");
    } finally {
      setFetching(false);
    }
  };

  // ==========================================
  // SLIDER HANDLERS
  // ==========================================
  const handleSlideChange = (index, field, value) => {
    const updatedSlides = [...formData.heroSlides];
    updatedSlides[index][field] = value;
    
    // Agar source type change ho raha hai, toh purana data clear kar do
    if (field === "sourceType") {
      updatedSlides[index].file = null;
      updatedSlides[index].mobileFile = null;
      updatedSlides[index].mediaUrl = "";
      updatedSlides[index].mobileMediaUrl = "";
    }

    // Smart Validation for mediaUrl
    if (field === "mediaUrl" && value) {
      // 1. YouTube Auto-detect
      if (value.includes("youtube.com") || value.includes("youtu.be")) {
        updatedSlides[index].mediaType = "video";
      }
      
      // 2. Google Search URL Warning
      if (value.includes("google.com/search")) {
        toast.error("Please paste a direct Image/Video URL, not a Google Search page link!");
      }
    }
    
    setFormData({ ...formData, heroSlides: updatedSlides });
  };

  const handleSlideFileChange = (index, file, isMobile = false) => {
    const updatedSlides = [...formData.heroSlides];
    if (isMobile) {
      updatedSlides[index].mobileFile = file;
    } else {
      updatedSlides[index].file = file;
    }
    setFormData({ ...formData, heroSlides: updatedSlides });
  };

  const addSlide = () => {
    if (formData.heroSlides.length >= 5) {
      toast.error("Maximum 5 slides allowed!");
      return;
    }
    setFormData({
      ...formData,
      heroSlides: [
        ...formData.heroSlides,
        { mediaType: "image", sourceType: "upload", mediaUrl: "", mobileMediaUrl: "", title: "", subtitle: "", file: null, mobileFile: null, existingUrl: "", existingMobileUrl: "" }
      ]
    });
  };

  const removeSlide = (index) => {
    if (formData.heroSlides.length === 1) {
      toast.error("You must have at least 1 slide!");
      return;
    }
    const updatedSlides = formData.heroSlides.filter((_, i) => i !== index);
    setFormData({ ...formData, heroSlides: updatedSlides });
  };

  // ==========================================
  // CARD HANDLERS
  // ==========================================
  const handleCardChange = (index, field, value) => {
    const updatedCards = [...formData.featureCards];
    updatedCards[index][field] = value;
    setFormData({ ...formData, featureCards: updatedCards });
  };

  const handleCardFileChange = (index, file) => {
    const updatedCards = [...formData.featureCards];
    updatedCards[index].image = file;
    setFormData({ ...formData, featureCards: updatedCards });
  };

  // ==========================================
  // SUBMIT FORM
  // ==========================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();

      // 1. Prepare JSON structure for Slides
      const slidesToSubmit = formData.heroSlides.map(slide => ({
        mediaType: slide.mediaType,
        sourceType: slide.sourceType,
        mediaUrl: slide.sourceType === "link" ? slide.mediaUrl : "",
        mobileMediaUrl: slide.sourceType === "link" ? slide.mobileMediaUrl : "",
        existingUrl: slide.existingUrl,
        existingMobileUrl: slide.existingMobileUrl,
        title: slide.title,
        subtitle: slide.subtitle
      }));
      data.append("heroSlides", JSON.stringify(slidesToSubmit));

      // 2. Prepare JSON structure for Cards
      const featureCardsText = formData.featureCards.map(card => ({
        title: card.title,
        description: card.description,
        existingImage: card.existingImage
      }));
      data.append("featureCards", JSON.stringify(featureCardsText));

      // 3. Append Slide Files
      formData.heroSlides.forEach((slide, index) => {
        if (slide.sourceType === "upload") {
          if (slide.file) {
            data.append(`slide_${index}_file`, slide.file);
          }
          if (slide.mobileFile) {
            data.append(`slide_${index}_mobileFile`, slide.mobileFile);
          }
        }
      });

      // 4. Append Card Files
      formData.featureCards.forEach((card, index) => {
        if (card.image) {
          data.append(`featureCards_${index}_image`, card.image);
        }
      });

      const token = localStorage.getItem("token");
      await axios.put(`${API_URL}/api/layout/home`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`
        },
      });

      toast.success("Home Layout updated successfully!");
      fetchLayoutData();
    } catch (error) {
      console.error("Error updating layout:", error);
      toast.error("Failed to update layout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 mx-auto font-sans sm:px-6 lg:px-8 max-w-5xl sm:py-10 bg-slate-50">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl text-slate-900">Home Page Layout</h2>
          <p className="mt-1 text-sm text-slate-500">Manage Dynamic Hero Slider & Feature Cards.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* ================= HERO SLIDER SECTION ================= */}
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-800">Hero Slider Configuration</h3>
            <button
              type="button"
              onClick={addSlide}
              disabled={formData.heroSlides.length >= 5}
              className="px-4 py-2 bg-slate-800 text-white text-sm font-semibold rounded-lg hover:bg-slate-700 disabled:opacity-50"
            >
              + Add Slide ({formData.heroSlides.length}/5)
            </button>
          </div>

          <div className="space-y-6">
            {formData.heroSlides.map((slide, index) => (
              <div key={index} className="p-5 border border-slate-200 rounded-xl bg-slate-50 relative">
                
                {/* Remove Button */}
                {formData.heroSlides.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSlide(index)}
                    className="absolute top-4 right-4 text-red-500 hover:text-red-700 text-sm font-bold"
                  >
                    ✕ Remove
                  </button>
                )}

                <h4 className="mb-4 font-bold text-slate-700">Slide {index + 1}</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  {/* Dropdowns */}
                  <div>
                    <label className="block mb-1 text-xs font-semibold text-slate-600">Media Type</label>
                    <select
                      value={slide.mediaType}
                      onChange={(e) => handleSlideChange(index, "mediaType", e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="image">Image</option>
                      <option value="video">Video</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 text-xs font-semibold text-slate-600">Source Type</label>
                    <select
                      value={slide.sourceType}
                      onChange={(e) => handleSlideChange(index, "sourceType", e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="upload">Upload File (Cloudinary)</option>
                      <option value="link">External URL (YouTube / Image Link)</option>
                    </select>
                  </div>
                </div>

                {/* File Upload OR Link Input based on Source Type */}
                <div className="mb-4 p-4 border border-blue-100 bg-blue-50/50 rounded-lg">
                  {slide.sourceType === "upload" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* DESKTOP UPLOAD */}
                      <div>
                        <label className="block mb-2 text-sm font-semibold text-slate-700">Desktop {slide.mediaType === "video" ? "Video (Landscape)" : "Image (Landscape)"}</label>
                        {slide.existingUrl && !slide.file && (
                          <div className="mb-3">
                            <p className="text-xs text-green-600 font-semibold mb-1">Current Active</p>
                            {slide.mediaType === "video" ? (
                              <video src={slide.existingUrl} className="w-full max-h-32 rounded shadow object-cover" controls muted />
                            ) : (
                              <img src={slide.existingUrl} className="w-full max-h-32 rounded shadow object-cover" alt="slide preview" />
                            )}
                          </div>
                        )}
                        <input
                          type="file"
                          accept={slide.mediaType === "video" ? "video/mp4,video/webm" : "image/png, image/jpeg, image/jpg"}
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleSlideFileChange(index, e.target.files[0], false);
                            }
                          }}
                          required={!slide.existingUrl && !slide.file}
                          className="w-full px-3 py-2 text-xs text-slate-500 border border-slate-300 rounded-lg file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:font-semibold file:bg-blue-50 file:text-blue-700"
                        />
                      </div>

                      {/* MOBILE UPLOAD */}
                      <div>
                        <label className="block mb-2 text-sm font-semibold text-slate-700">Mobile {slide.mediaType === "video" ? "Video (Portrait)" : "Image (Portrait)"} <span className="text-blue-500 text-xs font-normal">(Optional)</span></label>
                        {slide.existingMobileUrl && !slide.mobileFile && (
                          <div className="mb-3">
                            <p className="text-xs text-green-600 font-semibold mb-1">Current Active Mobile</p>
                            {slide.mediaType === "video" ? (
                              <video src={slide.existingMobileUrl} className="w-16 md:w-24 max-h-32 rounded shadow object-cover" controls muted />
                            ) : (
                              <img src={slide.existingMobileUrl} className="w-16 md:w-24 max-h-32 rounded shadow object-cover" alt="slide mobile preview" />
                            )}
                          </div>
                        )}
                        <input
                          type="file"
                          accept={slide.mediaType === "video" ? "video/mp4,video/webm" : "image/png, image/jpeg, image/jpg"}
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleSlideFileChange(index, e.target.files[0], true);
                            }
                          }}
                          className="w-full px-3 py-2 text-xs text-slate-500 border border-slate-300 rounded-lg file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:font-semibold file:bg-blue-50 file:text-blue-700"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* DESKTOP LINK */}
                      <div>
                        <label className="block mb-2 text-sm font-semibold text-slate-700">Desktop {slide.mediaType === "video" ? "YouTube/Video (Landscape)" : "Image Link (Landscape)"}</label>
                        <input
                          type="url"
                          value={slide.mediaUrl}
                          onChange={(e) => handleSlideChange(index, "mediaUrl", e.target.value)}
                          required
                          placeholder={slide.mediaType === "video" ? "https://www.youtube.com/watch?v=..." : "https://example.com/image.jpg"}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>
                      
                      {/* MOBILE LINK */}
                      <div>
                        <label className="block mb-2 text-sm font-semibold text-slate-700">Mobile {slide.mediaType === "video" ? "YouTube/Video (Portrait)" : "Image Link (Portrait)"} <span className="text-blue-500 text-xs font-normal">(Optional)</span></label>
                        <input
                          type="url"
                          value={slide.mobileMediaUrl}
                          onChange={(e) => handleSlideChange(index, "mobileMediaUrl", e.target.value)}
                          placeholder={slide.mediaType === "video" ? "https://youtube.com/shorts/..." : "https://example.com/mobile-image.jpg"}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Slide Text */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block mb-1 text-xs font-semibold text-slate-600">Slide Title (Optional)</label>
                    <input
                      type="text"
                      value={slide.title}
                      onChange={(e) => handleSlideChange(index, "title", e.target.value)}
                      placeholder="e.g. Welcome to Sonani Electronics"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-xs font-semibold text-slate-600">Slide Subtitle (Optional)</label>
                    <textarea
                      value={slide.subtitle}
                      onChange={(e) => handleSlideChange(index, "subtitle", e.target.value)}
                      rows="2"
                      placeholder="Subtitle text..."
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>

        {/* ================= FEATURE CARDS SECTION ================= */}
        {/* Isko maine bilkul nahi chheda, yeh aapka purana perfectly working code hai */}
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <h3 className="mb-4 text-xl font-bold text-slate-800">"Why Choose Us" Feature Cards</h3>
          <div className="space-y-6">
            {formData.featureCards.map((card, index) => (
              <div key={index} className="p-5 border border-slate-200 rounded-xl bg-slate-50">
                <h4 className="mb-4 font-bold text-slate-700">Card {index + 1}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block mb-1 text-xs font-semibold text-slate-600">Title</label>
                      <input
                        type="text"
                        value={card.title}
                        onChange={(e) => handleCardChange(index, "title", e.target.value)}
                        required
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-xs font-semibold text-slate-600">Description</label>
                      <textarea
                        value={card.description}
                        onChange={(e) => handleCardChange(index, "description", e.target.value)}
                        required
                        rows="2"
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block mb-1 text-xs font-semibold text-slate-600">Card Image</label>
                    {card.existingImage && !card.image && (
                      <div className="mb-2">
                        <img src={card.existingImage} alt={`Card ${index + 1}`} className="h-20 rounded shadow object-cover" />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleCardFileChange(index, e.target.files[0]);
                        }
                      }}
                      className="w-full px-3 py-2 text-xs text-slate-500 border border-slate-300 rounded-lg file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 font-bold text-white transition-all bg-blue-600 rounded-xl hover:bg-blue-700 hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? "Saving Changes..." : "Save Layout"}
          </button>
        </div>

      </form>
    </div>
  );
};

export default UserView;
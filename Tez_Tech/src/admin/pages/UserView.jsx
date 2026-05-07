import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

// 🌐 SMART API URL LOGIC
// Agar Vite me VITE_BACKEND_URL set hai toh wo lega, warna aapka live Render URL lega.
const API_URL = import.meta.env.VITE_BACKEND_URL || "https://sonani-backend.onrender.com";

const UserView = () => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [formData, setFormData] = useState({
    heroTitle: "",
    heroSubtitle: "",
    heroVideo: null,
    featureCards: [
      { title: "", description: "", image: null, existingImage: "" },
      { title: "", description: "", image: null, existingImage: "" },
      { title: "", description: "", image: null, existingImage: "" },
    ],
  });

  const [existingVideo, setExistingVideo] = useState("");

  useEffect(() => {
    fetchLayoutData();
  }, []);

  const fetchLayoutData = async () => {
    try {
      setFetching(true);
      // 🔥 Localhost ki jagah dynamic API_URL lagaya hai
      const { data } = await axios.get(`${API_URL}/api/layout/home`);
      if (data) {
        setFormData({
          heroTitle: data.heroTitle || "",
          heroSubtitle: data.heroSubtitle || "",
          heroVideo: null,
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
        setExistingVideo(data.heroVideo || "");
      }
    } catch (error) {
      console.error("Error fetching layout:", error);
      toast.error("Failed to fetch current layout.");
    } finally {
      setFetching(false);
    }
  };

  const handleTextChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleVideoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, heroVideo: e.target.files[0] });
    }
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      data.append("heroTitle", formData.heroTitle);
      data.append("heroSubtitle", formData.heroSubtitle);

      if (formData.heroVideo) {
        data.append("heroVideo", formData.heroVideo);
      }

      const featureCardsText = formData.featureCards.map(card => ({
        title: card.title,
        description: card.description,
        image: card.existingImage
      }));
      data.append("featureCards", JSON.stringify(featureCardsText));

      formData.featureCards.forEach((card, index) => {
        if (card.image) {
          data.append(`featureCards_${index}_image`, card.image);
        }
      });

      const token = localStorage.getItem("token");
      // 🔥 Localhost ki jagah dynamic API_URL lagaya hai
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
      <div className="mb-8">
        <h2 className="text-2xl font-black tracking-tight sm:text-3xl text-slate-900">Home Page Layout</h2>
        <p className="mt-1 text-sm text-slate-500">Manage the dynamic content on your Home Page.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* HERO SECTION */}
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <h3 className="mb-4 text-xl font-bold text-slate-800">Hero Section</h3>

          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block mb-2 text-sm font-semibold text-slate-700">Hero Title</label>
              <input
                type="text"
                name="heroTitle"
                value={formData.heroTitle}
                onChange={handleTextChange}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. Welcome to Sonani Electronics"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-semibold text-slate-700">Hero Subtitle</label>
              <textarea
                name="heroSubtitle"
                value={formData.heroSubtitle}
                onChange={handleTextChange}
                required
                rows="3"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Subtitle text..."
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-semibold text-slate-700">Hero Background Video</label>
              {existingVideo && (
                <div className="mb-3">
                  <p className="text-xs text-green-600 font-semibold mb-1">Current Video Active</p>
                  <video src={existingVideo} className="w-48 rounded-lg shadow" muted loop autoPlay />
                </div>
              )}
              <input
                type="file"
                accept="video/mp4,video/webm"
                onChange={handleVideoChange}
                className="w-full px-3 py-2 text-sm text-slate-500 border border-slate-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="mt-2 text-xs text-slate-500 italic">Recommended size: 1920x1080, Max video size: 50MB (MP4/WEBM)</p>
            </div>
          </div>
        </div>

        {/* FEATURE CARDS SECTION */}
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <h3 className="mb-4 text-xl font-bold text-slate-800">"Why Choose Us" Feature Cards</h3>

          <div className="space-y-6">
            {formData.featureCards.map((card, index) => (
              <div key={index} className="p-5 border border-slate-200 rounded-xl bg-slate-50">
                <h4 className="mb-4 font-bold text-slate-700">Card {index + 1}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Text Inputs */}
                  <div className="space-y-4">
                    <div>
                      <label className="block mb-1 text-xs font-semibold text-slate-600">Title</label>
                      <input
                        type="text"
                        value={card.title}
                        onChange={(e) => handleCardChange(index, "title", e.target.value)}
                        required
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-xs font-semibold text-slate-600">Description</label>
                      <textarea
                        value={card.description}
                        onChange={(e) => handleCardChange(index, "description", e.target.value)}
                        required
                        rows="2"
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Image Input */}
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
                    <p className="mt-1 text-xs text-slate-500 italic">Recommended size: 400x300px, Max file size: 2MB (JPG/PNG)</p>
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
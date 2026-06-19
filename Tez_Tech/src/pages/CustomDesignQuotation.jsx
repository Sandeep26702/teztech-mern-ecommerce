import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { toast } from "react-hot-toast";
import {
  FaPlus,
  FaTrashAlt,
  FaPaperPlane,
  FaCheckCircle,
  FaTimesCircle,
  FaHistory,
  FaUpload,
  FaPalette,
} from "react-icons/fa";
const cleanPrefilledValue = (val, fieldName) => {
  if (!val) return "";
  
  // Format address object to string
  if (typeof val === "object") {
    const { street, city, state, zipCode } = val;
    const parts = [street, city, state, zipCode].map(p => String(p || "").trim()).filter(p => p !== "");
    val = parts.join(", ");
  }

  const s = String(val).trim();
  const lower = s.toLowerCase();

  if (
    lower === "john doe" ||
    lower === "test user" ||
    lower === "test otp user" ||
    lower === "super admin" ||
    lower.includes("example") ||
    lower.includes("e.g.") ||
    lower.includes("[object object]") ||
    (fieldName === "phone" && (s === "9876543210" || s === "9999999999" || s === "1234567890" || s === "0123456789" || s.startsWith("00000")))
  ) {
    return "";
  }

  return s;
};

const renderNotesWithLinks = (text) => {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a 
          key={i} 
          href={part} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-cyan-400 underline hover:text-cyan-300 break-all font-semibold"
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

const CustomDesignQuotation = () => {
  const { user } = useAuth();

  const [userDetails, setUserDetails] = useState({
    name: "",
    phone: "",
    company: "",
    address: "",
  });

  const [designs, setDesigns] = useState([
    {
      designName: "",
      length: "",
      width: "",
      sheetColor: "",
      ledType: "9mm",
      thickness: "",
      requiredDate: "",
      file: null,
      previewUrl: "",
      specialInstructions: "",
    },
  ]);

  const [myQuotes, setMyQuotes] = useState([]);
  const [loadingQuotes, setLoadingQuotes] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Load user details if logged in
  useEffect(() => {
    if (user) {
      setUserDetails((prev) => ({
        ...prev,
        name: cleanPrefilledValue(user.name, "name"),
        phone: cleanPrefilledValue(user.phone, "phone"),
        company: cleanPrefilledValue(user.company, "company"),
        address: cleanPrefilledValue(user.address, "address"),
      }));
    }
  }, [user]);

  // Fetch previous custom quotations
  const fetchMyQuotes = async () => {
    try {
      const res = await api.get("/custom-quote/my-quotes");
      if (res.data && res.data.success) {
        setMyQuotes(res.data.quotes || []);
      }
    } catch (error) {
      console.error("Error fetching custom quotes:", error);
    } finally {
      setLoadingQuotes(false);
    }
  };

  useEffect(() => {
    fetchMyQuotes();
  }, []);

  const handleUserDetailChange = (e) => {
    setUserDetails({ ...userDetails, [e.target.name]: e.target.value });
  };

  const handleDesignChange = (index, field, value) => {
    const updated = [...designs];
    updated[index][field] = value;
    setDesigns(updated);
  };

  const handleFileChange = (index, file) => {
    if (!file) return;

    // Check size limit (e.g. 25MB max)
    if (file.size > 1024 * 1024 * 25) {
      toast.error("File size is too large (max 25MB)");
      return;
    }

    const updated = [...designs];
    updated[index].file = file;

    // Clean up old preview URL if any
    if (updated[index].previewUrl) {
      URL.revokeObjectURL(updated[index].previewUrl);
    }
    updated[index].previewUrl = URL.createObjectURL(file);
    setDesigns(updated);
  };

  const addAnotherDesign = () => {
    setDesigns([
      ...designs,
      {
        designName: "",
        length: "",
        width: "",
        sheetColor: "",
        ledType: "9mm",
        thickness: "",
        requiredDate: "",
        file: null,
        previewUrl: "",
        specialInstructions: "",
      },
    ]);
  };

  const removeDesign = (index) => {
    if (designs.length === 1) return;
    const updated = designs.filter((_, idx) => idx !== index);
    // Revoke removed file preview url
    if (designs[index].previewUrl) {
      URL.revokeObjectURL(designs[index].previewUrl);
    }
    setDesigns(updated);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!userDetails.name || !userDetails.phone || !userDetails.address) {
      toast.error("Please fill in Name, Phone, and Address details.");
      return;
    }

    // Validate designs
    for (let i = 0; i < designs.length; i++) {
      const d = designs[i];
      if (!d.designName || !d.length || !d.width || !d.sheetColor || !d.thickness || !d.requiredDate) {
        toast.error(`Please fill all required fields for Design #${i + 1}`);
        return;
      }
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("userDetails", JSON.stringify(userDetails));

      let fileCounter = 0;
      const designsData = designs.map((d) => {
        const item = {
          designName: d.designName,
          length: d.length,
          width: d.width,
          sheetColor: d.sheetColor,
          ledType: d.ledType,
          thickness: d.thickness,
          requiredDate: d.requiredDate,
          specialInstructions: d.specialInstructions,
        };

        if (d.file) {
          formData.append("files", d.file); // Append file
          item.fileIndex = fileCounter++; // Map file to design
        } else {
          item.fileIndex = null;
        }

        return item;
      });

      formData.append("designs", JSON.stringify(designsData));

      const res = await api.post("/custom-quote/create", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data && res.data.success) {
        toast.success("Quotation requested successfully!");
        // Reset form specifications
        setDesigns([
          {
            designName: "",
            length: "",
            width: "",
            sheetColor: "",
            ledType: "9mm",
            thickness: "",
            requiredDate: "",
            file: null,
            previewUrl: "",
            specialInstructions: "",
          },
        ]);
        // Reset User Details back to standard prefilled profile values
        if (user) {
          setUserDetails({
            name: cleanPrefilledValue(user.name, "name"),
            phone: cleanPrefilledValue(user.phone, "phone"),
            company: cleanPrefilledValue(user.company, "company"),
            address: cleanPrefilledValue(user.address, "address"),
          });
        } else {
          setUserDetails({
            name: "",
            phone: "",
            company: "",
            address: "",
          });
        }
        fetchMyQuotes(); // Refresh list
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error(error.response?.data?.message || "Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (quoteId, status) => {
    if (!window.confirm(`Are you sure you want to mark this quotation as ${status.toLowerCase()}?`)) return;

    try {
      const res = await api.patch(`/custom-quote/status/${quoteId}`, { status });
      if (res.data && res.data.success) {
        toast.success(`Quote successfully marked as ${status.toLowerCase()}`);
        fetchMyQuotes();
      }
    } catch (error) {
      console.error("Status update error:", error);
      toast.error("Failed to update status.");
    }
  };

  return (
    <div className="min-h-screen px-4 py-6 font-sans bg-gray-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Page Title & Intro - Compact */}
        <div className="mb-6 text-center">
          <h1 className="mb-2 text-2xl font-extrabold tracking-tight sm:text-3xl bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
            Custom Design Quotation
          </h1>
          <p className="max-w-2xl mx-auto text-xs text-gray-500 dark:text-slate-400">
            Submit your custom design specifications. Our engineers will offer a custom price quote.
          </p>
        </div>

        {/* Main Glassmorphic Form Card (Split Layout) */}
        <form onSubmit={handleFormSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12 items-start">
          
          {/* LEFT COLUMN: User Details & Actions (Sticky) */}
          <div className="lg:col-span-5 p-5 border bg-white dark:bg-slate-800/50 backdrop-blur-md border-gray-250 dark:border-slate-700/60 shadow-xl rounded-2xl space-y-4 lg:sticky lg:top-24">
            <h2 className="mb-3 text-base font-bold border-b pb-1 border-gray-200 dark:border-slate-700/50 text-cyan-600 dark:text-cyan-400 flex items-center gap-2">
              <span>01.</span> User Information
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-1">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder=""
                  value={userDetails.name}
                  onChange={handleUserDetailChange}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900/80 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none placeholder-gray-400 text-gray-900 dark:text-slate-100 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  placeholder=""
                  pattern="[0-9]{10}"
                  title="10-digit mobile number"
                  value={userDetails.phone}
                  onChange={handleUserDetailChange}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900/80 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none placeholder-gray-400 text-gray-900 dark:text-slate-100 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-1">Company Name (Optional)</label>
                <input
                  type="text"
                  name="company"
                  placeholder=""
                  value={userDetails.company}
                  onChange={handleUserDetailChange}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900/80 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none placeholder-gray-400 text-gray-900 dark:text-slate-100 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-1">Full Delivery Address *</label>
                <textarea
                  name="address"
                  required
                  rows="3"
                  placeholder=""
                  value={userDetails.address}
                  onChange={handleUserDetailChange}
                  className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-900/80 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none placeholder-gray-400 text-gray-900 dark:text-slate-100 transition resize-y"
                ></textarea>
              </div>
            </div>

            {/* Submit Action Block inside Left sticky column - Desktop Only */}
            <div className="pt-2 hidden lg:block">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center justify-center gap-2 px-6 py-3 font-bold text-sm text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-lg shadow-lg transition disabled:opacity-50 w-full cursor-pointer"
              >
                {submitting ? (
                  "Submitting..."
                ) : (
                  <>
                    <FaPaperPlane /> Submit Quote Request
                  </>
                )}
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Design Requirements (Scrollable List) */}
          <div className="lg:col-span-7 p-5 border bg-white dark:bg-slate-800/50 backdrop-blur-md border-gray-250 dark:border-slate-700/60 shadow-xl rounded-2xl space-y-4">
            <h2 className="text-base font-bold border-b pb-1 border-gray-200 dark:border-slate-700/50 text-cyan-600 dark:text-cyan-400 flex items-center justify-between">
              <span className="flex items-center gap-2"><span>02.</span> Design Specifications</span>
              <span className="text-xs font-medium text-gray-500 dark:text-slate-400">Total Designs: {designs.length}</span>
            </h2>

            <div className="space-y-4">
              {designs.map((design, index) => (
                <div 
                  key={index} 
                  className="relative p-4 border border-gray-200 dark:border-slate-700/40 bg-gray-50 dark:bg-slate-900/30 rounded-xl space-y-3 shadow-inner"
                >
                  {/* Delete Design Block Button */}
                  {designs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDesign(index)}
                      className="absolute top-3 right-3 p-1.5 text-gray-400 dark:text-slate-400 hover:text-red-400 hover:bg-gray-150 dark:hover:bg-slate-800 rounded transition cursor-pointer"
                      title="Remove this design"
                    >
                      <FaTrashAlt size={13} />
                    </button>
                  )}

                  <h3 className="text-sm font-extrabold text-cyan-600 dark:text-cyan-400/90 flex items-center gap-2">
                    Design Item #{index + 1}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Design Name */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1">Design Name / Title *</label>
                      <input
                        type="text"
                        required
                        placeholder=""
                        value={design.designName}
                        onChange={(e) => handleDesignChange(index, "designName", e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900/80 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none placeholder-gray-400 text-gray-900 dark:text-slate-100 transition"
                      />
                    </div>

                    {/* Length in Feet */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1">Length (in Feet) *</label>
                      <input
                        type="text"
                        required
                        placeholder=""
                        value={design.length}
                        onChange={(e) => handleDesignChange(index, "length", e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900/80 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none placeholder-gray-400 text-gray-900 dark:text-slate-100 transition"
                      />
                    </div>

                    {/* Width in Feet */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1">Width (in Feet) *</label>
                      <input
                        type="text"
                        required
                        placeholder=""
                        value={design.width}
                        onChange={(e) => handleDesignChange(index, "width", e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900/80 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none placeholder-gray-400 text-gray-900 dark:text-slate-100 transition"
                      />
                    </div>

                    {/* Sheet Color Detail */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                        <FaPalette className="text-cyan-600 dark:text-cyan-500" /> Color Description *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder=""
                        value={design.sheetColor}
                        onChange={(e) => handleDesignChange(index, "sheetColor", e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900/80 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none placeholder-gray-400 text-gray-900 dark:text-slate-100 transition"
                      />
                    </div>

                    {/* LED Type */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1">LED Type *</label>
                      <select
                        value={design.ledType}
                        onChange={(e) => handleDesignChange(index, "ledType", e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900/80 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none text-gray-900 dark:text-slate-100 transition cursor-pointer"
                      >
                        <option value="9mm">9mm LED</option>
                        <option value="12mm">12mm LED</option>
                      </select>
                    </div>

                    {/* Thickness */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1">Thickness (mm) *</label>
                      <select
                        required
                        value={design.thickness}
                        onChange={(e) => handleDesignChange(index, "thickness", e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900/80 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none text-gray-900 dark:text-slate-100 transition cursor-pointer"
                      >
                        <option value="" disabled>Select Thickness</option>
                        <option value="1.5">1.5 mm</option>
                        <option value="2">2 mm</option>
                      </select>
                    </div>

                    {/* Required Date */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1">Required Date *</label>
                      <input
                        type="date"
                        required
                        value={design.requiredDate}
                        onChange={(e) => handleDesignChange(index, "requiredDate", e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900/80 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none text-gray-900 dark:text-slate-100 transition"
                      />
                    </div>

                    {/* File Upload with Preview */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1">Upload reference file</label>
                      <div className="flex gap-2 items-center">
                        <label className="flex items-center justify-center gap-1.5 px-3 py-2 border border-dashed border-gray-350 dark:border-slate-700 hover:border-cyan-500 bg-white dark:bg-slate-900/80 hover:bg-gray-100 dark:hover:bg-slate-900 rounded-lg cursor-pointer transition w-full h-[38px] text-xs">
                          <FaUpload className="text-gray-400 dark:text-slate-500" size={12} />
                          <span className="text-gray-600 dark:text-slate-400 truncate max-w-[80px]">
                            {design.file ? design.file.name : "Choose File"}
                          </span>
                          <input
                            key={design.file ? "loaded" : "empty"}
                            type="file"
                            accept="image/*,video/*"
                            onChange={(e) => handleFileChange(index, e.target.files[0])}
                            className="hidden"
                          />
                        </label>

                        {/* Preview Zone */}
                        {design.previewUrl && (
                          <div className="relative w-10 h-[38px] rounded border border-gray-300 dark:border-slate-700 overflow-hidden bg-gray-950 flex-shrink-0 flex items-center justify-center">
                            {design.file?.type.startsWith("video/") ? (
                              <video src={design.previewUrl} className="object-contain w-full h-full" />
                            ) : (
                              <img src={design.previewUrl} alt="Preview" className="object-contain w-full h-full" />
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...designs];
                                updated[index].file = null;
                                URL.revokeObjectURL(updated[index].previewUrl);
                                updated[index].previewUrl = "";
                                setDesigns(updated);
                              }}
                              className="absolute -top-0.5 -right-0.5 bg-red-600 text-white rounded-full p-0.5 hover:bg-red-700"
                              title="Remove file"
                            >
                              <FaTimesCircle size={9} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Special Instructions */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1">Special Instructions / Description</label>
                      <textarea
                        rows="4"
                        placeholder=""
                        value={design.specialInstructions}
                        onChange={(e) => handleDesignChange(index, "specialInstructions", e.target.value)}
                        className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-900/80 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none placeholder-gray-400 text-gray-900 dark:text-slate-100 transition resize-y"
                      ></textarea>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Design Button */}
            <button
              type="button"
              onClick={addAnotherDesign}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-dashed border-cyan-500/50 hover:border-cyan-500 text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 bg-cyan-50 dark:bg-cyan-950/20 hover:bg-cyan-100 dark:hover:bg-cyan-950/40 rounded-xl font-bold w-full text-xs transition cursor-pointer"
            >
              <FaPlus /> Add Another Design Requirements
            </button>

            {/* Submit Action Block - Mobile Only */}
            <div className="pt-2 block lg:hidden">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center justify-center gap-2 px-6 py-3.5 font-bold text-sm text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-lg shadow-lg transition disabled:opacity-50 w-full cursor-pointer"
              >
                {submitting ? (
                  "Submitting..."
                ) : (
                  <>
                    <FaPaperPlane /> Submit Quote Request
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomDesignQuotation;

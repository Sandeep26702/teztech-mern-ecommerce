import { useState, useEffect } from "react";
import { 
  FaPlus, FaPalette, FaComments, FaCheckCircle, FaTimesCircle, 
  FaCloudDownloadAlt, FaSpinner, FaSearch, FaExclamationTriangle, 
  FaDownload, FaBook, FaBoxes, FaRuler, FaPaperPlane, FaHistory, 
  FaCheck, FaTimes, FaInbox, FaCube, FaPaperclip, FaFileImage, FaChevronLeft
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/api";

const AdminDesignRequests = () => {
  const { user } = useAuth();
  const userRole = user?.role?.toLowerCase() || "";

  const [requests, setRequests] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("All");

  // Search & Navigation
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Creation Modal (Sales Agent only)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [designName, setDesignName] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [materialSpecs, setMaterialSpecs] = useState("");
  const [priority, setPriority] = useState("Normal");
  const [quantity, setQuantity] = useState(1);
  const [referenceFile, setReferenceFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Chat/Feedback
  const [commentText, setCommentText] = useState("");
  const [sendingComment, setSendingComment] = useState(false);

  // SVG Upload Form (Designer only)
  const [svgFile, setSvgFile] = useState(null);
  const [commonLineCutting, setCommonLineCutting] = useState(false);
  const [uploadingSvg, setUploadingSvg] = useState(false);

  // Reference Image Zoom Modal
  const [zoomImage, setZoomImage] = useState(null);

  useEffect(() => {
    fetchRequests();
    fetchMaterials();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get("/design-requests");
      if (res.data.success) {
        setRequests(res.data.designRequests || []);
        
        // If a ticket is currently selected, refresh its details from the list
        if (selectedTicket) {
          const updated = (res.data.designRequests || []).find(r => r._id === selectedTicket._id);
          if (updated) setSelectedTicket(updated);
        }
      }
    } catch (err) {
      toast.error("Failed to load design tickets");
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterials = async () => {
    try {
      const res = await api.get("/materials");
      if (res.data.success) {
        setMaterials(res.data.materials || []);
      }
    } catch (err) {
      console.error("Error loading materials:", err);
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!designName) {
      toast.error("Design Name is required!");
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append("designName", designName);
    formData.append("dimensions", dimensions);
    formData.append("materialSpecs", materialSpecs);
    formData.append("priority", priority);
    formData.append("quantity", quantity);
    if (referenceFile) {
      formData.append("referenceFile", referenceFile);
    }

    try {
      const res = await api.post("/design-requests", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        toast.success("Design ticket generated successfully!");
        setDesignName("");
        setDimensions("");
        setMaterialSpecs("");
        setPriority("Normal");
        setQuantity(1);
        setReferenceFile(null);
        setShowCreateModal(false);
        fetchRequests();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create design request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSvgUpload = async (e) => {
    e.preventDefault();
    if (!svgFile) {
      toast.error("Please select an SVG cut file first!");
      return;
    }
    setUploadingSvg(true);
    const formData = new FormData();
    formData.append("optimizedSvg", svgFile);
    formData.append("commonLineCuttingUsed", commonLineCutting);

    try {
      const res = await api.put(`/design-requests/${selectedTicket._id}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        toast.success(`Optimized SVG proof (V${res.data.designRequest.versions?.length || 1}) uploaded!`);
        setSelectedTicket(res.data.designRequest);
        setSvgFile(null);
        setCommonLineCutting(false);
        fetchRequests();
      }
    } catch (err) {
      toast.error("Failed to upload SVG file");
    } finally {
      setUploadingSvg(false);
    }
  };

  const handleApproveStatus = async (ticketId, newStatus) => {
    try {
      const res = await api.put(`/design-requests/${ticketId}/status`, { status: newStatus });
      if (res.data.success) {
        toast.success(`Design marked as ${newStatus}!`);
        setRequests((prev) => prev.map((t) => (t._id === ticketId ? res.data.designRequest : t)));
        if (selectedTicket?._id === ticketId) {
          setSelectedTicket(res.data.designRequest);
        }
      }
    } catch (err) {
      toast.error("Failed to update ticket status");
    }
  };

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSendingComment(true);
    try {
      const res = await api.post(`/design-requests/${selectedTicket._id}/comments`, { text: commentText });
      if (res.data.success) {
        setSelectedTicket(res.data.designRequest);
        setRequests((prev) => prev.map((t) => (t._id === selectedTicket._id ? res.data.designRequest : t)));
        setCommentText("");
      }
    } catch (err) {
      toast.error("Failed to send comment");
    } finally {
      setSendingComment(false);
    }
  };

  // Metrics calculation
  const getMetrics = () => {
    const pending = requests.filter(r => ["Pending", "In Progress"].includes(r.status)).length;
    const rework = requests.filter(r => r.status === "Rejected").length;
    const awaiting = requests.filter(r => r.status === "Design Ready").length;
    
    // Approved today
    const startOfToday = new Date();
    startOfToday.setHours(0,0,0,0);
    const approvedToday = requests.filter(r => 
      r.status === "Approved" && new Date(r.updatedAt) >= startOfToday
    ).length;

    return { pending, rework, awaiting, approvedToday };
  };

  const metrics = getMetrics();

  // Filter requests
  const filteredRequests = requests.filter(r => {
    const matchesSearch = 
      r.requestCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.designName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.materialSpecs?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.lead?.name && r.lead.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.order?.shippingInfo?.fullName && r.order.shippingInfo.fullName.toLowerCase().includes(searchQuery.toLowerCase()));

    if (filterStatus === "All") return matchesSearch;
    if (filterStatus === "Pending") return matchesSearch && ["Pending", "In Progress"].includes(r.status);
    if (filterStatus === "Rework") return matchesSearch && r.status === "Rejected";
    if (filterStatus === "Awaiting") return matchesSearch && r.status === "Design Ready";
    if (filterStatus === "Approved") return matchesSearch && r.status === "Approved";
    return matchesSearch;
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "In Progress":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "Design Ready":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 animate-pulse";
      case "Approved":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "Rejected":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  const getPriorityBadgeClass = (prio) => {
    switch (prio) {
      case "Urgent":
        return "bg-red-600 text-white font-black animate-pulse shadow-sm";
      case "High Priority":
        return "bg-amber-500/20 text-amber-500 border border-amber-500/30 font-bold";
      default:
        return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700";
    }
  };

  // Find if raw material is out of stock / low based on ticket specs
  const getMaterialStockWarning = (specs) => {
    if (!specs || !materials.length) return null;
    const lowerSpecs = specs.toLowerCase();
    
    // Attempt to match material name
    const matched = materials.find(m => 
      lowerSpecs.includes(m.name.toLowerCase()) || 
      m.name.toLowerCase().includes(lowerSpecs)
    );

    if (matched) {
      const isOut = matched.stock <= 0;
      const isLow = matched.stock < matched.minStockLimit;
      if (isOut) {
        return {
          type: "out",
          message: `Raw Material Out of Stock: "${matched.name}" has 0 ${matched.unit} left!`,
          material: matched
        };
      } else if (isLow) {
        return {
          type: "low",
          message: `Low Stock warning: "${matched.name}" has only ${matched.stock} ${matched.unit} left (Threshold: ${matched.minStockLimit}).`,
          material: matched
        };
      }
    }
    return null;
  };

  // Static Library Assets removed

  // Render list or single workbench depending on state
  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
            <FaPalette className="text-blue-650" /> Design Workbench
          </h1>
          <p className="text-[11px] text-slate-450 mt-0.5">Manage custom AutoCAD drawings & specifications workflow</p>
        </div>

        {["admin", "subadmin", "sales team"].includes(userRole) && !selectedTicket && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl transition cursor-pointer shadow-md shadow-blue-500/20"
          >
            <FaPlus /> Raise Design Request
          </button>
        )}
      </div>


          {/* Dashboard Metrics Panel (Only shown in main list) */}
          {!selectedTicket && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm flex items-center gap-4">
                <div className="p-3 bg-yellow-500/10 text-yellow-500 rounded-xl"><FaInbox size={20} /></div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Pending Requests</span>
                  <span className="text-xl font-black text-slate-800 dark:text-white">{metrics.pending}</span>
                </div>
              </div>
              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm flex items-center gap-4">
                <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl"><FaExclamationTriangle size={20} /></div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Rework / Revisions</span>
                  <span className="text-xl font-black text-slate-800 dark:text-white">{metrics.rework}</span>
                </div>
              </div>
              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm flex items-center gap-4">
                <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl animate-pulse"><FaSpinner size={20} /></div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Awaiting Approval</span>
                  <span className="text-xl font-black text-slate-800 dark:text-white">{metrics.awaiting}</span>
                </div>
              </div>
              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl"><FaCheckCircle size={20} /></div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Approved Today</span>
                  <span className="text-xl font-black text-slate-800 dark:text-white">{metrics.approvedToday}</span>
                </div>
              </div>
            </div>
          )}

          {/* MAIN WORKBENCH PANEL */}
          {!selectedTicket ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
              {/* Table search & filter bar */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-80">
                  <FaSearch className="absolute text-slate-400 left-3 top-1/2 -translate-y-1/2 text-xs" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search ID, name, customer..."
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-xs font-semibold"
                  />
                </div>

                <div className="flex gap-1 overflow-x-auto w-full md:w-auto">
                  {["All", "Pending", "Rework", "Awaiting", "Approved"].map((st) => (
                    <button
                      key={st}
                      onClick={() => setFilterStatus(st)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer shrink-0 ${filterStatus === st ? "bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/40"}`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Design Request Table Queue */}
              {loading ? (
                <div className="py-20 text-center text-slate-400 flex flex-col items-center gap-2">
                  <FaSpinner className="animate-spin text-blue-600 text-xl" />
                  <span className="text-xs">Loading queue...</span>
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="py-20 text-center text-slate-400 italic text-xs">No design tickets found matching the filters.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/30 text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                        <th className="p-4">Ticket Code</th>
                        <th className="p-4">Design Name</th>
                        <th className="p-4">Client Name</th>
                        <th className="p-4">Material Specs</th>
                        <th className="p-4">Priority</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-center">Ref Sketch</th>
                        <th className="p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredRequests.map((ticket) => {
                        const clientName = ticket.lead?.name || ticket.order?.shippingInfo?.fullName || "Walk-in / Direct";
                        const warning = getMaterialStockWarning(ticket.materialSpecs);
                        return (
                          <tr 
                            key={ticket._id}
                            className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all align-middle"
                          >
                            <td className="p-4 font-black text-blue-600 dark:text-blue-400">{ticket.requestCode}</td>
                            <td className="p-4 font-bold text-slate-800 dark:text-white max-w-[200px] truncate">{ticket.designName}</td>
                            <td className="p-4 font-medium text-slate-600 dark:text-slate-300">{clientName}</td>
                            <td className="p-4 text-slate-500 font-medium">
                              <div className="flex flex-col">
                                <span>{ticket.materialSpecs || "N/A"}</span>
                                {warning && (
                                  <span className={`text-[9px] font-bold ${warning.type === "out" ? "text-rose-500 animate-pulse" : "text-amber-500"}`}>
                                    ⚠️ {warning.type === "out" ? "Out of Stock" : "Low Stock"}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-wide uppercase ${getPriorityBadgeClass(ticket.priority)}`}>
                                {ticket.priority}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold border ${getStatusBadgeClass(ticket.status)}`}>
                                {ticket.status}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              {ticket.referenceFileUrl ? (
                                <button
                                  onClick={() => setZoomImage(ticket.referenceFileUrl)}
                                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg text-[10px] font-bold flex items-center gap-1 mx-auto transition cursor-pointer"
                                >
                                  <FaFileImage /> Preview
                                </button>
                              ) : (
                                <span className="text-slate-400 italic text-[10px]">No sketch</span>
                              )}
                            </td>
                            <td className="p-4">
                              <button
                                onClick={() => setSelectedTicket(ticket)}
                                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-black tracking-wide transition cursor-pointer shadow-sm text-[10px]"
                              >
                                Open Workbench
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            
            /* DUAL-PANE DETAILED WORKBENCH WORKSPACE */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              
              {/* LEFT & CENTER PANEL: Workbench workspace */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Workbench Core Block */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm rounded-3xl p-6 space-y-6">
                  
                  {/* Workspace Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedTicket(null)}
                        className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-500 transition cursor-pointer"
                      >
                        <FaChevronLeft size={12} />
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-black text-slate-800 dark:text-white">Workspace: {selectedTicket.requestCode}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-wide uppercase ${getPriorityBadgeClass(selectedTicket.priority)}`}>
                            {selectedTicket.priority}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold block mt-0.5 uppercase">Design Ticket Workflow Process</p>
                      </div>
                    </div>

                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${getStatusBadgeClass(selectedTicket.status)}`}>
                      {selectedTicket.status}
                    </span>
                  </div>

                  {/* Requirements Section */}
                  <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 rounded-2xl p-4">
                    <h4 className="text-[10px] uppercase font-black text-slate-450 tracking-wider mb-3">Exact Specifications Checklist</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 block font-bold text-[10px]">Dimensions (L x W)</span>
                        <span className="font-black text-slate-800 dark:text-white text-sm">{selectedTicket.dimensions || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-bold text-[10px]">Material & Thickness</span>
                        <span className="font-black text-slate-800 dark:text-white text-sm">{selectedTicket.materialSpecs || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-bold text-[10px]">Required Quantity</span>
                        <span className="font-black text-slate-800 dark:text-white text-sm">{selectedTicket.quantity || 1} Sheets</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-bold text-[10px]">Design Name</span>
                        <span className="font-black text-slate-800 dark:text-white text-sm truncate block">{selectedTicket.designName}</span>
                      </div>
                    </div>
                  </div>

                  {/* Reference Image Viewer Area */}
                  {selectedTicket.referenceFileUrl && (
                    <div>
                      <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider mb-2">Customer Sketch / Reference Photo</span>
                      <div className="relative group h-64 border border-slate-100 dark:border-slate-850 rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center">
                        <img 
                          src={selectedTicket.referenceFileUrl} 
                          alt="Customer Reference Preview" 
                          className="object-contain w-full h-full"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <button
                            onClick={() => setZoomImage(selectedTicket.referenceFileUrl)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md transition cursor-pointer"
                          >
                            Zoom In Preview
                          </button>
                          <a
                            href={selectedTicket.referenceFileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black border border-slate-700 transition cursor-pointer"
                          >
                            Open Link ↗
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SVG Output & Version History */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                    
                    {/* SVG File Uploader Form */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">Publish drawing output</h4>
                      
                      {["admin", "subadmin", "designer"].includes(userRole) && ["Pending", "In Progress", "Rejected"].includes(selectedTicket.status) ? (
                        <form onSubmit={handleSvgUpload} className="p-4 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-4">
                          <div>
                            <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1.5">Select AutoCAD/CorelDRAW SVG Cut file</label>
                            <input
                              type="file"
                              required
                              accept=".svg"
                              onChange={(e) => setSvgFile(e.target.files[0])}
                              className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:bg-blue-50 dark:file:bg-slate-800 file:text-blue-600 dark:file:text-blue-400 hover:file:bg-blue-100 cursor-pointer"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="commonLine"
                              checked={commonLineCutting}
                              onChange={(e) => setCommonLineCutting(e.target.checked)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded cursor-pointer"
                            />
                            <label htmlFor="commonLine" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                              I used Common Line Cutting logic
                            </label>
                          </div>

                          <button
                            type="submit"
                            disabled={uploadingSvg || !svgFile}
                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl transition disabled:opacity-50 text-xs shadow-md shadow-blue-500/10 cursor-pointer"
                          >
                            {uploadingSvg ? (
                              <span className="flex items-center justify-center gap-1.5"><FaSpinner className="animate-spin" /> Uploading proof...</span>
                            ) : (
                              <span>Upload V{(selectedTicket.versions?.length || 0) + 1} SVG File</span>
                            )}
                          </button>
                        </form>
                      ) : (
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 rounded-2xl text-center text-slate-400 italic">
                          {selectedTicket.status === "Approved" ? (
                            <span className="text-emerald-500 font-bold flex items-center justify-center gap-1"><FaCheckCircle /> Design is approved! Edits locked.</span>
                          ) : (
                            <span>Awaiting review. Upload is enabled for designers/admins.</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Version History List */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                        <FaHistory /> Version Proof History
                      </h4>
                      {selectedTicket.versions && selectedTicket.versions.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {selectedTicket.versions.map((ver) => (
                            <div 
                              key={ver.versionNumber}
                              className="p-3 border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 rounded-xl flex items-center justify-between text-xs"
                            >
                              <div>
                                <span className="font-black text-slate-850 dark:text-white">Version {ver.versionNumber}</span>
                                <div className="flex gap-2 items-center text-[10px] text-slate-400 font-semibold mt-0.5">
                                  <span>{new Date(ver.createdAt).toLocaleDateString()}</span>
                                  {ver.commonLineCuttingUsed && (
                                    <span className="text-emerald-500 font-black">● Common Line</span>
                                  )}
                                </div>
                              </div>
                              <a
                                href={ver.fileUrl}
                                download
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1.5 bg-blue-50 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 font-black rounded-lg text-[10px] flex items-center gap-1 shadow-sm transition"
                              >
                                <FaCloudDownloadAlt /> Download
                              </a>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-center text-slate-450 italic text-[11px]">
                          No SVG proofs uploaded yet. File history starts on first upload.
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Sales Agent Approval Trigger */}
                  {["admin", "subadmin", "sales team"].includes(userRole) && selectedTicket.status === "Design Ready" && (
                    <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
                      <div>
                        <h5 className="font-black text-indigo-900 dark:text-indigo-400 text-xs uppercase">Design proof awaiting approval</h5>
                        <p className="text-[10px] text-indigo-600 dark:text-indigo-500 mt-0.5">Review the drawing specs and download the SVG above to confirm. Select approve or reject.</p>
                      </div>
                      <div className="flex gap-2 w-full md:w-auto shrink-0">
                        <button
                          onClick={() => handleApproveStatus(selectedTicket._id, "Approved")}
                          className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md shadow-emerald-600/10"
                        >
                          <FaCheckCircle /> Approve Design
                        </button>
                        <button
                          onClick={() => handleApproveStatus(selectedTicket._id, "Rejected")}
                          className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md shadow-rose-600/10"
                        >
                          <FaTimesCircle /> Reject / Rework
                        </button>
                      </div>
                    </div>
                  )}

                </div>

                {/* Collaboration & Approval Mini-Chat Log */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm rounded-3xl overflow-hidden flex flex-col h-[400px]">
                  <div className="px-5 py-4 bg-slate-800 dark:bg-slate-950 text-white flex items-center justify-between shrink-0">
                    <div>
                      <h4 className="font-black text-xs uppercase tracking-wider">Collaboration & Alignment chat</h4>
                      <p className="text-[9px] text-slate-400 font-bold block mt-0.5">Sales Agent & Designer channel</p>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 italic">Persistent Log</span>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 p-5 overflow-y-auto bg-[#efeae2] dark:bg-slate-900 space-y-4">
                    {selectedTicket.comments?.length === 0 ? (
                      <div className="text-center py-20 text-xs text-slate-400 italic">
                        No alignment remarks added yet. Drop a message to align drawing parameters.
                      </div>
                    ) : (
                      selectedTicket.comments.map((cmt, idx) => {
                        const isMyComment = cmt.author === user.name;
                        return (
                          <div
                            key={idx}
                            className={`flex flex-col p-3 rounded-xl shadow-sm border max-w-[85%] ${
                              isMyComment
                                ? "bg-[#d9fdd3] text-slate-900 border-[#b7e9b0] ml-auto rounded-tr-none"
                                : "bg-white text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-white dark:border-slate-700 ml-0 rounded-tl-none"
                            }`}
                          >
                            <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">{cmt.author}</p>
                            <p className="text-xs leading-relaxed font-bold">{cmt.text}</p>
                            <span className="text-[8px] text-slate-400 mt-1.5 self-end">
                              {new Date(cmt.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Chat Input Bar */}
                  <form onSubmit={handleSendComment} className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex gap-2 items-center shrink-0">
                    <input
                      type="text"
                      required
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Ask query or mention specific edge margins..."
                      className="flex-1 px-4 py-2.5 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-white font-medium"
                    />
                    <button
                      type="submit"
                      disabled={sendingComment || !commentText.trim()}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs transition disabled:opacity-50 cursor-pointer shadow-md shadow-blue-500/10 flex items-center gap-1.5"
                    >
                      <FaPaperPlane size={10} /> Send
                    </button>
                  </form>
                </div>

              </div>

              {/* RIGHT PANEL: Reference constraints & stock alerts */}
              <div className="space-y-6">
                
                {/* 1. Material & Machine Constraints Viewer */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm rounded-3xl p-5 space-y-4">
                  <h4 className="text-xs font-black text-slate-850 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <FaRuler className="text-blue-600" /> Machine & Sheets Limits
                  </h4>

                  {/* Bed Size constraints */}
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-3 border border-slate-100 dark:border-slate-800/60 rounded-xl space-y-1.5 text-xs">
                    <span className="text-slate-400 block font-bold text-[9px] uppercase tracking-wider">Laser Bed Limits</span>
                    <p className="font-bold text-slate-800 dark:text-white">Maximum Size: 2440mm x 1220mm</p>
                    <p className="text-[10px] text-slate-500 leading-tight">Always leave a 10mm safety border edge. Ensure coordinates fall inside active boundary sheets.</p>
                  </div>

                  {/* Active Stock Warnings */}
                  {selectedTicket && (
                    <div className="space-y-3">
                      <span className="text-slate-400 block font-bold text-[9px] uppercase tracking-wider">Inventory Availability check</span>
                      {(() => {
                        const alert = getMaterialStockWarning(selectedTicket.materialSpecs);
                        if (alert) {
                          return (
                            <div className={`p-4 border rounded-xl flex items-start gap-2.5 text-xs ${alert.type === "out" ? "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400" : "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"}`}>
                              <FaExclamationTriangle className="shrink-0 mt-0.5" size={14} />
                              <div className="space-y-1">
                                <span className="font-bold block">{alert.type === "out" ? "Raw Material Out of Stock!" : "Low Sheet Inventory Alert"}</span>
                                <p className="text-[10px] leading-tight font-medium">{alert.message}</p>
                                <span className="text-[9px] font-black underline uppercase block mt-1">Halt drawing & coordinate with Purchase team</span>
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                              <FaCheckCircle className="shrink-0" size={14} />
                              <span className="font-bold">Raw Material specs available in stock.</span>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  )}

                  {/* Live Stock levels Reference */}
                  <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                    <span className="text-slate-400 block font-bold text-[9px] uppercase tracking-wider mb-2">Live Sheets Inventory Levels</span>
                    {materials.length === 0 ? (
                      <span className="text-slate-400 text-[10px] italic">No material inventory records</span>
                    ) : (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {materials.map(m => (
                          <div key={m._id} className="flex justify-between items-center text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                            <span>{m.name}</span>
                            <span className={`px-1.5 py-0.5 rounded font-black ${m.stock <= 0 ? "bg-rose-500/10 text-rose-500" : m.stock < m.minStockLimit ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500"}`}>
                              {m.stock} {m.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

      {/* CREATE TICKET MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-800 mx-4 animate-scale-up">
            <h3 className="text-base font-black text-slate-800 dark:text-white mb-4">Request Custom Design Drawing</h3>
            <form onSubmit={handleCreateRequest} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">Design Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flower Pattern Gate Partition"
                  value={designName}
                  onChange={(e) => setDesignName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 rounded-xl text-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">Dimensions (L x W mm)</label>
                  <input
                    type="text"
                    placeholder="e.g. 1000 x 2000"
                    value={dimensions}
                    onChange={(e) => setDimensions(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 rounded-xl text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">Material Specification</label>
                  <input
                    type="text"
                    placeholder="e.g. 1mm HDPE Black"
                    value={materialSpecs}
                    onChange={(e) => setMaterialSpecs(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 rounded-xl text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">Quantity Requested</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 rounded-xl text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">Priority Target</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 rounded-xl text-slate-800 dark:text-white focus:outline-none"
                  >
                    <option value="Normal">Normal</option>
                    <option value="High Priority">High Priority</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">Upload Rough Sketch / Reference Image</label>
                <input
                  type="file"
                  onChange={(e) => setReferenceFile(e.target.files[0])}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:bg-blue-50 dark:file:bg-slate-800 file:text-blue-600 dark:file:text-blue-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-black text-slate-600 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black transition disabled:opacity-50 cursor-pointer shadow-md shadow-blue-500/20"
                >
                  {submitting ? "Submitting..." : "Submit Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULLSCREEN IMAGE ZOOM MODAL */}
      {zoomImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setZoomImage(null)}
        >
          <div className="relative max-w-4xl max-h-[85vh] w-full h-full flex items-center justify-center">
            <img 
              src={zoomImage} 
              alt="Zoomed Reference Drawing" 
              className="object-contain max-w-full max-h-full rounded-lg shadow-2xl border border-slate-800"
            />
            <button 
              onClick={() => setZoomImage(null)}
              className="absolute top-2 right-2 text-white bg-slate-800 hover:bg-slate-700 p-3 rounded-full text-xs font-bold transition cursor-pointer"
            >
              ✕ Close Preview
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDesignRequests;

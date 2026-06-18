import { useState, useEffect } from "react";
import { FaPlus, FaPalette, FaComments, FaCheckCircle, FaTimesCircle, FaCloudDownloadAlt, FaSpinner } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/api";

const AdminDesignRequests = () => {
  const { user } = useAuth();
  const userRole = user?.role?.toLowerCase() || "";

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Creation Modal (Sales Agent only)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [designName, setDesignName] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [materialSpecs, setMaterialSpecs] = useState("");
  const [referenceFile, setReferenceFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Chat/Feedback Modal
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [sendingComment, setSendingComment] = useState(false);

  // SVG Upload Form (Designer only)
  const [svgFile, setSvgFile] = useState(null);
  const [uploadingSvg, setUploadingSvg] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get("/design-requests");
      if (res.data.success) {
        setRequests(res.data.designRequests || []);
      }
    } catch (err) {
      toast.error("Failed to load design tickets");
    } finally {
      setLoading(false);
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
    try {
      const res = await api.put(`/design-requests/${selectedTicket._id}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        toast.success("Optimized SVG uploaded! Sales notified.");
        setSelectedTicket(res.data.designRequest);
        setSvgFile(null);
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
        setLeadsListUpdate(res.data.designRequest);
        setCommentText("");
      }
    } catch (err) {
      toast.error("Failed to send comment");
    } finally {
      setSendingComment(false);
    }
  };

  const setLeadsListUpdate = (updatedTicket) => {
    setRequests((prev) => prev.map((t) => (t._id === updatedTicket._id ? updatedTicket : t)));
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "In Progress":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Design Ready":
        return "bg-indigo-50 text-indigo-700 border-indigo-200 animate-pulse";
      case "Approved":
        return "bg-green-50 text-green-700 border-green-200";
      case "Rejected":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="p-6 bg-white border border-slate-100 shadow-sm rounded-2xl">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FaPalette className="text-blue-600" /> Custom Design Requests
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Collaborative pipeline for drawing specs, custom laser cutting, and SVG file proofing.
          </p>
        </div>
        {["admin", "subadmin", "sales team"].includes(userRole) && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition cursor-pointer shadow-md"
          >
            <FaPlus /> New Design Ticket
          </button>
        )}
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">Loading design tickets...</div>
      ) : requests.length === 0 ? (
        <div className="py-16 text-center text-slate-400 border border-dashed rounded-2xl border-slate-200">
          No design tickets found in this queue.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map((ticket) => (
            <div
              key={ticket._id}
              onClick={() => setSelectedTicket(ticket)}
              className="p-5 border border-slate-100 hover:border-blue-100 bg-white hover:bg-slate-50/20 shadow-sm rounded-2xl transition cursor-pointer flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">
                    {ticket.requestCode}
                  </span>
                  <span
                    className={`px-2.5 py-1 text-[10px] font-bold border rounded-full uppercase ${getStatusStyle(
                      ticket.status
                    )}`}
                  >
                    {ticket.status}
                  </span>
                </div>

                <h4 className="font-bold text-slate-800 text-base mt-2 truncate">{ticket.designName}</h4>

                <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-slate-600">
                  <div>
                    <span className="text-slate-400 block font-medium">Dimensions</span>
                    <span className="font-bold">{ticket.dimensions || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Thickness/Material</span>
                    <span className="font-bold">{ticket.materialSpecs || "N/A"}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>Agent: {ticket.salesAgent?.name || "System"}</span>
                {ticket.designer && <span className="text-blue-600 font-bold">Designer Assigned</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 mx-4">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Request Custom Design</h3>
            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-550 mb-1">Design Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flower Pattern Gate Partition"
                  value={designName}
                  onChange={(e) => setDesignName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-550 mb-1">Dimensions</label>
                  <input
                    type="text"
                    placeholder="e.g. 4x8 ft"
                    value={dimensions}
                    onChange={(e) => setDimensions(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-550 mb-1">Material Specs</label>
                  <input
                    type="text"
                    placeholder="e.g. 1mm HDPE Black"
                    value={materialSpecs}
                    onChange={(e) => setMaterialSpecs(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-550 mb-1">Upload Reference Drawing/Sketch</label>
                <input
                  type="file"
                  onChange={(e) => setReferenceFile(e.target.files[0])}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-600 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {submitting ? "Submitting..." : "Generate Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Details & Chat Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-[#efeae2] rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col md:flex-row h-[560px] mx-4">
            
            {/* Left Specifications Column */}
            <div className="w-full md:w-1/2 p-6 bg-white overflow-y-auto border-r border-slate-200 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="font-bold text-slate-800 text-base">{selectedTicket.requestCode} : Details</h4>
                  <span className={`px-2.5 py-1 text-[10px] font-bold border rounded-full uppercase ${getStatusStyle(selectedTicket.status)}`}>
                    {selectedTicket.status}
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <p><span className="text-slate-400 font-bold block">Design Name:</span> <span className="font-semibold text-slate-800 text-sm">{selectedTicket.designName}</span></p>
                  <p><span className="text-slate-400 font-bold block">Dimensions Required:</span> <span className="font-semibold text-slate-800">{selectedTicket.dimensions || "N/A"}</span></p>
                  <p><span className="text-slate-400 font-bold block">Material Specifications:</span> <span className="font-semibold text-slate-800">{selectedTicket.materialSpecs || "N/A"}</span></p>
                </div>

                {/* Reference File */}
                {selectedTicket.referenceFileUrl && (
                  <div className="pt-2">
                    <span className="text-slate-400 font-bold block text-xs mb-1.5">Reference Drawing/File</span>
                    <div className="h-44 border border-slate-200 rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center relative group">
                      <img src={selectedTicket.referenceFileUrl} alt="Reference Preview" className="object-contain w-full h-full" />
                      <a
                        href={selectedTicket.referenceFileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute hidden group-hover:flex items-center justify-center bg-black/60 text-white font-bold text-xs p-2 rounded-xl transition"
                      >
                        Open In New Tab ↗
                      </a>
                    </div>
                  </div>
                )}

                {/* Optimized SVG cut file */}
                {selectedTicket.optimizedSvgUrl && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-blue-900 text-xs">Optimized SVG Cut File Ready</h5>
                      <p className="text-[10px] text-blue-700 mt-0.5">Common line cutting optimized for lasers.</p>
                    </div>
                    <a
                      href={selectedTicket.optimizedSvgUrl}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition"
                    >
                      <FaCloudDownloadAlt /> Download
                    </a>
                  </div>
                )}
              </div>

              {/* Status Action Buttons for Sales Agent */}
              {["admin", "subadmin", "sales team"].includes(userRole) && selectedTicket.status === "Design Ready" && (
                <div className="flex gap-2 pt-4 border-t border-slate-100 flex-shrink-0">
                  <button
                    onClick={() => handleApproveStatus(selectedTicket._id, "Approved")}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-sm"
                  >
                    <FaCheckCircle /> Approve Design
                  </button>
                  <button
                    onClick={() => handleApproveStatus(selectedTicket._id, "Rejected")}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-sm"
                  >
                    <FaTimesCircle /> Reject & Re-draw
                  </button>
                </div>
              )}

              {/* Designer SVG Upload Form */}
              {["admin", "subadmin", "designer"].includes(userRole) && ["Pending", "In Progress", "Rejected"].includes(selectedTicket.status) && (
                <form onSubmit={handleSvgUpload} className="p-4 bg-slate-50 border border-slate-200 rounded-xl mt-4 space-y-2.5">
                  <label className="block text-xs font-bold text-slate-600">Upload Optimized SVG Cut File</label>
                  <input
                    type="file"
                    required
                    accept=".svg"
                    onChange={(e) => setSvgFile(e.target.files[0])}
                    className="w-full text-xs text-slate-550 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700"
                  />
                  <button
                    type="submit"
                    disabled={uploadingSvg || !svgFile}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition disabled:opacity-50 cursor-pointer text-center"
                  >
                    {uploadingSvg ? "Uploading..." : "Publish Design Proof"}
                  </button>
                </form>
              )}
            </div>

            {/* Right Chat/Comments Section (WhatsApp style) */}
            <div className="w-full md:w-1/2 flex flex-col bg-[#efeae2] overflow-hidden h-full">
              <div className="px-5 py-4 bg-slate-800 text-white flex items-center justify-between flex-shrink-0">
                <h4 className="font-bold text-sm">Design chat logs</h4>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="text-slate-300 hover:text-white font-bold cursor-pointer text-sm"
                >
                  ✕ Close
                </button>
              </div>

              {/* Messages Area */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4">
                {selectedTicket.comments?.length === 0 ? (
                  <div className="text-center py-20 text-xs text-slate-400 italic">
                    No comments yet. Write a remark to align on drawing specifics.
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
                            : "bg-white text-slate-800 border-slate-200 rounded-tl-none"
                        }`}
                      >
                        <p className="text-xs font-semibold text-slate-500 mb-0.5">{cmt.author}</p>
                        <p className="text-xs leading-relaxed font-medium">{cmt.text}</p>
                        <span className="text-[8px] text-slate-400 mt-1 self-end">
                          {new Date(cmt.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSendComment} className="p-3 bg-slate-100 border-t border-slate-200 flex gap-2 items-center flex-shrink-0">
                <input
                  type="text"
                  required
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Ask for modifications or explain drawing files..."
                  className="flex-1 px-3.5 py-2 text-xs border border-slate-250 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                />
                <button
                  type="submit"
                  disabled={sendingComment || !commentText.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDesignRequests;

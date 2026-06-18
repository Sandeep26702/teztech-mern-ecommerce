import { useState, useEffect } from "react";
import { FaIndustry, FaPlayCircle, FaCheckCircle, FaCloudDownloadAlt, FaFileCode } from "react-icons/fa";
import { toast } from "react-hot-toast";
import api from "../../utils/api";

const AdminJobCards = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Awaiting Production");

  // Operator Notes Completion Modal
  const [selectedJob, setSelectedJob] = useState(null);
  const [notes, setNotes] = useState("");
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await api.get("/job-cards");
      if (res.data.success) {
        setJobs(res.data.jobCards || []);
      }
    } catch (err) {
      toast.error("Failed to load laser jobs list");
    } finally {
      setLoading(false);
    }
  };

  const handleStartLaser = async (jobId) => {
    try {
      const res = await api.put(`/job-cards/${jobId}/start`);
      if (res.data.success) {
        toast.success("Laser cutting started! Status set to 'In Production'.");
        setJobs((prev) => prev.map((j) => (j._id === jobId ? res.data.jobCard : j)));
        fetchJobs();
      }
    } catch (err) {
      toast.error("Failed to start laser cutting");
    }
  };

  const handleCompleteLaser = async (e) => {
    e.preventDefault();
    if (!selectedJob) return;
    setCompleting(true);
    try {
      const res = await api.put(`/job-cards/${selectedJob._id}/complete`, { operatorNotes: notes });
      if (res.data.success) {
        toast.success("Laser cutting complete! Order moved to packing queue.");
        setJobs((prev) => prev.map((j) => (j._id === selectedJob._id ? res.data.jobCard : j)));
        setSelectedJob(null);
        setNotes("");
        fetchJobs();
      }
    } catch (err) {
      toast.error("Failed to complete laser job");
    } finally {
      setCompleting(false);
    }
  };

  const filteredJobs = jobs.filter((job) => job.status === activeTab);

  return (
    <div className="p-6 bg-white border border-slate-100 shadow-sm rounded-2xl">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FaIndustry className="text-blue-600" /> Laser Cutting Queue
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Manufacturing Job Cards tracker for material thicknesses, cut files, and machine triggers.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 pb-4 mb-6 border-b border-slate-100">
        {["Awaiting Production", "In Production", "Completed"].map((status) => (
          <button
            key={status}
            onClick={() => setActiveTab(status)}
            className={`px-4 py-2 text-sm font-semibold rounded-xl border transition cursor-pointer ${
              activeTab === status
                ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                : "bg-white border-slate-200 text-slate-650 hover:border-blue-200 hover:text-blue-600"
            }`}
          >
            {status} Jobs
            <span className="ml-2 px-2 py-0.5 text-xs bg-slate-100 text-slate-650 rounded-full">
              {jobs.filter((j) => j.status === status).length}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">Loading manufacturing jobs...</div>
      ) : filteredJobs.length === 0 ? (
        <div className="py-16 text-center text-slate-400 border border-dashed rounded-2xl border-slate-200">
          No Job Cards currently in this stage.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => (
            <div
              key={job._id}
              className="p-5 border border-slate-100 bg-white shadow-sm rounded-2xl flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-blue-650 uppercase tracking-wide">
                    {job.jobCode}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold border rounded-full uppercase ${
                      job.status === "Awaiting Production"
                        ? "bg-yellow-50 text-yellow-700 border-yellow-100"
                        : job.status === "In Production"
                        ? "bg-indigo-50 text-indigo-700 border-indigo-100 animate-pulse"
                        : "bg-green-50 text-green-700 border-green-100"
                    }`}
                  >
                    {job.status}
                  </span>
                </div>

                <div className="mt-4 space-y-2.5 text-slate-700">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400 font-medium">Order Reference:</span>
                    <span className="font-bold text-slate-800">{job.order?.orderCode || "N/A"}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400 font-medium">Material Specs:</span>
                    <span className="font-bold text-slate-800">
                      {job.thickness}mm {job.materialType}
                    </span>
                  </div>
                  <div className="text-xs border-t border-slate-100 pt-2 text-slate-650">
                    <span className="text-slate-400 font-bold block mb-1">Shipping Target:</span>
                    <p className="font-semibold truncate">{job.order?.shippingInfo?.fullName}</p>
                    <p className="text-[10px] text-slate-500 truncate">{job.order?.shippingInfo?.address}</p>
                  </div>
                </div>

                {/* SVG Download Link */}
                {job.optimizedSvgUrl && (
                  <a
                    href={job.optimizedSvgUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 flex items-center justify-center gap-1.5 w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs shadow-sm transition border border-blue-100"
                  >
                    <FaCloudDownloadAlt /> Download Cut SVG File
                  </a>
                )}
              </div>

              {/* Action Buttons */}
              {job.status === "Awaiting Production" && (
                <button
                  onClick={() => handleStartLaser(job._id)}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-sm"
                >
                  <FaPlayCircle /> Start Laser Machine
                </button>
              )}

              {job.status === "In Production" && (
                <button
                  onClick={() => setSelectedJob(job)}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-sm"
                >
                  <FaCheckCircle /> Mark Cutting Complete
                </button>
              )}

              {job.status === "Completed" && (
                <div className="text-xs bg-slate-50 p-2.5 rounded border border-slate-100 text-slate-600">
                  <span className="font-bold block text-slate-400 uppercase tracking-wide">Operator Notes:</span>
                  <p className="italic mt-1">{job.operatorNotes || "Completed without notes"}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Completion Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 mx-4">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Mark Laser Cutting Done</h3>
            <p className="text-xs text-slate-400 mb-4">Job Code: {selectedJob.jobCode}</p>
            <form onSubmit={handleCompleteLaser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-550 mb-1">Operator Notes / Laser Log</label>
                <textarea
                  rows="3"
                  placeholder="e.g. Common line cutting worked perfectly, minimum wastage of leftover rolls."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedJob(null);
                    setNotes("");
                  }}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-600 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={completing}
                  className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {completing ? "Submitting..." : "Send to Packing Queue"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminJobCards;

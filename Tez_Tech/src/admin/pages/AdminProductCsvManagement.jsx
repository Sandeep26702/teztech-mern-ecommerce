import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom"; // 🔥 Added Link for navigation
import axios from "axios";
import {
  FaCloudUploadAlt,
  FaFileExport,
  FaFileImport,
  FaHistory,
  FaUndo,
  FaEye,
  FaTrash,
  FaTimes,
  FaBoxOpen,
  FaCheckCircle,
  FaTimesCircle,
  FaPlus,
  FaDownload
} from "react-icons/fa";
import { getApiUrl } from "../../utils/api";

const API = `${getApiUrl()}/products`;

const AdminProductCsvManagement = () => {
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [overview, setOverview] = useState({});
  const [selectedJob, setSelectedJob] = useState(null);
  const fileRef = useRef();
  const token = localStorage.getItem("token");

  // Upload Progress States
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [eta, setEta] = useState(null);
  const [uploadStage, setUploadStage] = useState("idle");
  const [uploadFileName, setUploadFileName] = useState("");
  const [uploadError, setUploadError] = useState("");

  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [overviewRes, historyRes] = await Promise.all([
        axios.get(`${API}/import/csv/overview`, { headers }),
        axios.get(`${API}/import/csv/history`, { headers }),
      ]);
      setOverview(overviewRes.data.overview || {});
      setJobs(historyRes.data.jobs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 🔥 NAYA: Download Demo CSV Logic
  const handleDownloadDemo = () => {
    // Apne backend schema ke hisaab se headers update kar lena agar zaroorat ho
    const csvHeaders = "sku,name,description,price,mrp,gst_percent,shipping_charge,weight_kg,category,stock,images,variations\n";
    const sampleData = "VNK20,Sample Product,This is a test description,999,1499,18,1350,1.5,Electronics,50,http://image1.jpg|http://image2.jpg,Size:M:Red|Size:L:Blue\n";
    
    const csvContent = csvHeaders + sampleData;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = window.URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", "TezTech_Demo_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const form = new FormData();
    form.append("file", file);

    setUploadFileName(file.name);
    setUploading(true);
    setUploadProgress(0);
    setUploadStage("uploading");
    setUploadError("");
    setLoading(true);

    const startTime = Date.now();

    try {
      const res = await axios.post(`${API}/import/csv`, form, {
        headers: { ...headers, "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const { loaded, total } = progressEvent;
          if (total) {
            const percentage = Math.round((loaded * 100) / total);
            setUploadProgress(percentage);
            
            const elapsed = (Date.now() - startTime) / 1000;
            if (elapsed > 0) {
              const speed = loaded / elapsed;
              const remaining = total - loaded;
              const remainingSeconds = Math.round(remaining / speed);
              setEta(remainingSeconds);
            }
            
            if (percentage === 100) {
              setUploadStage("processing");
            }
          }
        }
      });
      
      setUploadStage("completed");
      fetchData();
    } catch (err) {
      console.error("CSV Upload Error:", err);
      setUploadStage("failed");
      setUploadError(err.response?.data?.message || err.message || "Import failed. Please try again.");
    } finally {
      setLoading(false);
      e.target.value = null; // reset file input
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/export/csv`, {
        headers,
        responseType: "blob",
      });
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "teztech_all_products.csv";
      a.click();
    } catch {
      alert("❌ Export failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = async (id) => {
    if (!window.confirm("⚠️ Kya aap sach mein is import ko Rollback karna chahte hain?")) return;
    try {
      await axios.delete(`${API}/import/csv/history/${id}`, { headers });
      fetchData();
    } catch {
      alert("❌ Rollback failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("🚨 Delete record permanently?")) return;
    try {
      await axios.delete(`${API}/import/csv/history/${id}/record`, { headers });
      fetchData();
    } catch {
      alert("❌ Delete failed");
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
      processing: "bg-blue-100 text-blue-700 border-blue-200 animate-pulse",
      failed: "bg-rose-100 text-rose-700 border-rose-200",
      rolled_back: "bg-orange-100 text-orange-700 border-orange-200",
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusStyles[status.toLowerCase()] || "bg-gray-100 text-gray-700"}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="min-h-screen p-6 font-sans text-gray-800 bg-gray-50/50 md:p-10">
      
      {/* 🚀 HEADER SECTION */}
      <div className="flex flex-col justify-between gap-4 mb-8 xl:flex-row xl:items-center">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-extrabold text-transparent md:text-4xl bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">
            <FaHistory className="text-violet-600" /> CSV Manager Pro
          </h1>
          <p className="mt-1 font-medium text-gray-500">Manage your product imports, exports, and manual entries like a boss 😎</p>
        </div>

        {/* 🔥 NEW ACTIONS GROUP */}
        <div className="flex flex-wrap gap-3">
          
          <Link 
            to="/admin/products/add" 
            className="flex items-center gap-2 px-5 py-2.5 font-semibold text-white transition-all duration-300 shadow-lg bg-blue-600 rounded-xl hover:bg-blue-700 hover:-translate-y-1"
          >
            <FaPlus /> Add Manually
          </Link>

          <button 
            onClick={handleDownloadDemo}
            className="flex items-center gap-2 px-5 py-2.5 font-semibold text-gray-700 bg-white border border-gray-300 transition-all duration-300 shadow-sm rounded-xl hover:bg-gray-50 hover:-translate-y-1"
          >
            <FaDownload /> Demo CSV
          </button>

          <input type="file" hidden ref={fileRef} onChange={handleUpload} accept=".csv" />
          <button 
            onClick={() => fileRef.current.click()} 
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 font-semibold text-white transition-all duration-300 shadow-lg bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl hover:shadow-indigo-500/40 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaCloudUploadAlt className="text-lg" /> 
            {loading ? "Uploading..." : "Upload CSV"}
          </button>

          <button 
            onClick={handleExport} 
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 font-semibold text-white transition-all duration-300 shadow-lg bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl hover:shadow-teal-500/40 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaFileExport className="text-lg" /> 
            Export All
          </button>
        </div>
      </div>

      {/* 📊 OVERVIEW CARDS */}
      <div className="grid grid-cols-1 gap-6 mb-10 md:grid-cols-3">
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-2xl shadow-xl shadow-indigo-200 text-white group hover:scale-[1.02] transition-transform duration-300">
          <div className="absolute transition-transform duration-500 -right-6 -top-6 text-white/20 text-8xl group-hover:rotate-12"><FaBoxOpen /></div>
          <p className="mb-1 text-lg font-medium text-indigo-100">Total Jobs Run</p>
          <h3 className="text-5xl font-black tracking-tight">{overview.totalJobs || 0}</h3>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-400 to-green-600 p-6 rounded-2xl shadow-xl shadow-green-200 text-white group hover:scale-[1.02] transition-transform duration-300">
          <div className="absolute transition-transform duration-500 -right-6 -top-6 text-white/20 text-8xl group-hover:rotate-12"><FaCheckCircle /></div>
          <p className="mb-1 text-lg font-medium text-green-100">Total Imported</p>
          <h3 className="text-5xl font-black tracking-tight">{overview.totalImported || 0}</h3>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-rose-400 to-red-600 p-6 rounded-2xl shadow-xl shadow-red-200 text-white group hover:scale-[1.02] transition-transform duration-300">
          <div className="absolute transition-transform duration-500 -right-6 -top-6 text-white/20 text-8xl group-hover:rotate-12"><FaTimesCircle /></div>
          <p className="mb-1 text-lg font-medium text-red-100">Total Failed</p>
          <h3 className="text-5xl font-black tracking-tight">{overview.totalFailed || 0}</h3>
        </div>
      </div>

      {/* 📋 TABLE SECTION */}
      <div className="overflow-hidden bg-white border border-gray-100 shadow-xl rounded-2xl">
        <div className="flex items-center justify-between px-6 py-5 bg-white border-b border-gray-100">
          <h2 className="flex items-center gap-2 text-xl font-bold text-gray-800">
            <FaFileImport className="text-indigo-500" /> Recent Imports
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs font-bold tracking-wider text-gray-500 uppercase bg-gray-50/80">
                <th className="px-6 py-4">File Name</th>
                <th className="px-6 py-4">Imported</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 font-medium text-center text-gray-400">
                    No import history found. Start by uploading a CSV!
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job._id} className="transition-colors duration-200 hover:bg-indigo-50/30 group">
                    <td className="px-6 py-4 font-semibold text-gray-700">{job.fileName}</td>
                    <td className="px-6 py-4 font-medium text-gray-600">{job.importedCount} items</td>
                    <td className="px-6 py-4">{getStatusBadge(job.status)}</td>
                    <td className="flex justify-center gap-3 px-6 py-4 transition-opacity opacity-80 group-hover:opacity-100">
                      
                      <button 
                        onClick={() => setSelectedJob(job)}
                        className="p-2 text-blue-600 transition-all rounded-lg shadow-sm bg-blue-50 hover:bg-blue-600 hover:text-white"
                        title="View Details"
                      >
                        <FaEye />
                      </button>
                      
                      <button 
                        onClick={() => handleRollback(job._id)}
                        className="p-2 text-orange-600 transition-all rounded-lg shadow-sm bg-orange-50 hover:bg-orange-600 hover:text-white"
                        title="Rollback Import"
                      >
                        <FaUndo />
                      </button>
                      
                      <button 
                        onClick={() => handleDelete(job._id)}
                        className="p-2 text-red-600 transition-all rounded-lg shadow-sm bg-red-50 hover:bg-red-600 hover:text-white"
                        title="Delete Record"
                      >
                        <FaTrash />
                      </button>

                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🔮 MODAL */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md p-8 transition-all transform scale-100 bg-white shadow-2xl rounded-3xl">
            
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-100">
              <h2 className="pr-4 text-xl font-bold text-gray-800 break-all">
                {selectedJob.fileName}
              </h2>
              <button 
                onClick={() => setSelectedJob(null)}
                className="p-2 text-gray-400 transition-colors rounded-full hover:text-rose-500 hover:bg-rose-50"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <span className="font-medium text-gray-500">Status</span>
                {getStatusBadge(selectedJob.status)}
              </div>
              
              <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl">
                <span className="font-medium text-emerald-700">Successfully Imported</span>
                <span className="text-xl font-black text-emerald-600">{selectedJob.importedCount}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-rose-50 rounded-xl">
                <span className="font-medium text-rose-700">Failed Items</span>
                <span className="text-xl font-black text-rose-600">{selectedJob.failedCount || 0}</span>
              </div>
            </div>

            <button 
              onClick={() => setSelectedJob(null)}
              className="w-full py-3 mt-8 font-bold text-white transition-colors bg-gray-900 shadow-lg rounded-xl hover:bg-gray-800"
            >
              Close Window
            </button>
            
          </div>
        </div>
      )}

      {/* 🚀 PREMIUM UPLOAD PROGRESS MODAL */}
      {uploading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md p-8 bg-white border border-gray-100 shadow-2xl rounded-3xl text-center">
            
            <div className="flex flex-col items-center mb-6">
              {uploadStage === "uploading" && (
                <div className="relative flex items-center justify-center w-20 h-20 mb-4 bg-indigo-50 rounded-full text-indigo-600 animate-pulse">
                  <FaCloudUploadAlt className="text-4xl animate-bounce" />
                </div>
              )}
              {uploadStage === "processing" && (
                <div className="relative flex items-center justify-center w-20 h-20 mb-4 bg-amber-50 rounded-full text-amber-600">
                  <div className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  <FaBoxOpen className="text-3xl text-amber-500" />
                </div>
              )}
              {uploadStage === "completed" && (
                <div className="flex items-center justify-center w-20 h-20 mb-4 bg-emerald-50 rounded-full text-emerald-600">
                  <FaCheckCircle className="text-5xl" />
                </div>
              )}
              {uploadStage === "failed" && (
                <div className="flex items-center justify-center w-20 h-20 mb-4 bg-rose-50 rounded-full text-rose-600">
                  <FaTimesCircle className="text-5xl" />
                </div>
              )}

              <h3 className="text-xl font-black text-gray-800 break-all px-2">
                {uploadStage === "uploading" && "Uploading CSV..."}
                {uploadStage === "processing" && "Processing Catalog..."}
                {uploadStage === "completed" && "Import Successful!"}
                {uploadStage === "failed" && "Import Failed"}
              </h3>
              <p className="mt-1 text-xs font-semibold text-gray-400 break-all px-2">{uploadFileName}</p>
            </div>

            {(uploadStage === "uploading" || uploadStage === "processing") && (
              <div className="space-y-4">
                <div className="w-full h-3.5 bg-gray-100 rounded-full overflow-hidden p-0.5 border border-gray-200/50">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      uploadStage === "processing" 
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 w-full animate-pulse" 
                        : "bg-gradient-to-r from-violet-600 to-indigo-600"
                    }`}
                    style={{ width: `${uploadStage === "processing" ? 100 : uploadProgress}%` }}
                  />
                </div>
                
                <div className="flex justify-between items-center text-sm font-semibold text-gray-500 px-1">
                  <span>
                    {uploadStage === "uploading" 
                      ? `${uploadProgress}% uploaded` 
                      : "Saving to database..."
                    }
                  </span>
                  <span>
                    {uploadStage === "uploading" && eta !== null && (
                      eta > 0 ? `${eta}s remaining` : "Almost done"
                    )}
                    {uploadStage === "processing" && "Please wait..."}
                  </span>
                </div>
                
                <p className="text-xs font-medium text-gray-400 italic">
                  {uploadStage === "uploading" 
                    ? "Sending data to server, please keep this window open."
                    : "Writing products and categories to database. Do not reload."
                  }
                </p>
              </div>
            )}

            {uploadStage === "completed" && (
              <div className="space-y-3">
                <div className="p-4 text-emerald-700 bg-emerald-50 rounded-2xl border border-emerald-100 font-semibold text-sm">
                  Catalog imported successfully. All products are now live!
                </div>
                <button 
                  onClick={() => {
                    setUploading(false);
                    setUploadStage("idle");
                  }}
                  className="w-full py-3 mt-6 font-bold text-white transition-colors bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100 rounded-xl"
                >
                  View Catalog
                </button>
              </div>
            )}

            {uploadStage === "failed" && (
              <div className="space-y-3">
                <div className="p-4 text-rose-700 bg-rose-50 rounded-2xl border border-rose-100 font-semibold text-sm text-left max-h-32 overflow-y-auto break-words">
                  {uploadError || "An unexpected error occurred during CSV parsing."}
                </div>
                <button 
                  onClick={() => {
                    setUploading(false);
                    setUploadStage("idle");
                  }}
                  className="w-full py-3 mt-6 font-bold text-white transition-colors bg-gray-900 hover:bg-gray-800 shadow-lg rounded-xl"
                >
                  Close Window
                </button>
              </div>
            )}
            
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminProductCsvManagement;
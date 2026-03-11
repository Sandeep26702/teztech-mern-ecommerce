import { useState, useEffect, useRef, useCallback } from "react";
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
} from "react-icons/fa";

const AdminProductCsvManagement = () => {
  const [importingCsv, setImportingCsv] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [importJobs, setImportJobs] = useState([]);
  const [importOverview, setImportOverview] = useState({
    totalJobs: 0,
    activeJobs: 0,
    rolledBackJobs: 0,
    totalRows: 0,
    totalImported: 0,
    totalFailed: 0,
    untrackedProducts: 0,
  });
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyStatusFilter, setHistoryStatusFilter] = useState("all");
  const [historySearch, setHistorySearch] = useState("");
  const [rollingBackJobId, setRollingBackJobId] = useState(null);
  const [deletingRecordJobId, setDeletingRecordJobId] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);

  const csvInputRef = useRef(null);
  const token = localStorage.getItem("token");

  const formatDateTime = (value) => {
    if (!value) return "--";
    return new Date(value).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const fetchImportOverview = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/products/import/csv/overview", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success && res.data.overview) {
        setImportOverview(res.data.overview);
      }
    } catch (error) {
      console.error("Import overview fetch error:", error);
    }
  }, [token]);

  const fetchImportHistory = useCallback(async (status = "all", search = "") => {
    try {
      setHistoryLoading(true);
      const params = {};
      if (status && status !== "all") params.status = status;
      if (search?.trim()) params.search = search.trim();

      const res = await axios.get("http://localhost:5000/api/products/import/csv/history", {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      if (res.data.success) {
        setImportJobs(res.data.jobs || []);
      }
    } catch (error) {
      console.error("Import history fetch error:", error);
    } finally {
      setHistoryLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchImportOverview();
    fetchImportHistory("all", "");
  }, [fetchImportOverview, fetchImportHistory]);

  const downloadSampleCsv = () => {
    const sample = [
      "name,description,brand,category,price,gst_rate,shipping_charge,stock,image,sku,custom_fields,details,product_attribute_length,product_variation_option_material",
      '"Sample Product","High quality industrial item","Sonani","Electronics",1999,18,50,25,"https://placehold.co/600x600?text=Product","SKU-123","[{""label"":""MATERIAL"",""type"":""radio"",""required"":true,""options"":[{""label"":""PolySheet"",""priceAdjustment"":0},{""label"":""Acrylic"",""priceAdjustment"":150}]}]","[{""key"":""LENGTH"",""value"":""2 Meter""}]","2 Meter","PolySheet|0;Acrylic|150"',
    ].join("\n");

    const blob = new Blob([sample], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "products-import-template.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleExportCsv = async () => {
    try {
      setExportingCsv(true);
      const response = await axios.get("http://localhost:5000/api/products/export/csv", {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `products-export-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert(error.response?.data?.message || "CSV export failed");
    } finally {
      setExportingCsv(false);
    }
  };

  const handleCsvFileSelected = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      alert("Please upload a valid CSV file.");
      return;
    }

    const uploadForm = new FormData();
    uploadForm.append("file", file);

    try {
      setImportingCsv(true);
      const response = await axios.post("http://localhost:5000/api/products/import/csv", uploadForm, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const result = response.data;
      alert(`${result.message}\nImported: ${result.importedCount || 0}\nFailed: ${result.failedCount || 0}`);
      fetchImportOverview();
      fetchImportHistory(historyStatusFilter, historySearch);
    } catch (error) {
      alert(error.response?.data?.message || "CSV import failed");
    } finally {
      setImportingCsv(false);
    }
  };

  const handleRollbackImport = async (jobId) => {
    if (!window.confirm("This will remove products created by this upload. Continue?")) return;

    try {
      setRollingBackJobId(jobId);
      const response = await axios.delete(`http://localhost:5000/api/products/import/csv/history/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert(
        `${response.data.message}\nDeleted: ${response.data.deletedCount || 0}\nCategories removed: ${
          response.data.removedCategories || 0
        }`
      );
      fetchImportOverview();
      fetchImportHistory(historyStatusFilter, historySearch);
    } catch (error) {
      alert(error.response?.data?.message || "Rollback failed");
    } finally {
      setRollingBackJobId(null);
    }
  };

  const handleDeleteImportRecord = async (jobId) => {
    if (!window.confirm("Remove this upload history record?")) return;

    try {
      setDeletingRecordJobId(jobId);
      const response = await axios.delete(`http://localhost:5000/api/products/import/csv/history/${jobId}/record`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert(response.data.message || "Record removed");
      if (selectedJob?._id === jobId) setSelectedJob(null);
      fetchImportOverview();
      fetchImportHistory(historyStatusFilter, historySearch);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to remove import record");
    } finally {
      setDeletingRecordJobId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans">
      <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">CSV Management</h1>
            <p className="text-sm text-gray-600 mt-1">Bulk import, export, history tracking, rollback and cleanup.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleCsvFileSelected}
            />

            <button
              onClick={() => csvInputRef.current?.click()}
              disabled={importingCsv}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-70"
            >
              <FaFileImport /> {importingCsv ? "Importing..." : "Import CSV"}
            </button>

            <button
              onClick={handleExportCsv}
              disabled={exportingCsv}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-70"
            >
              <FaFileExport /> {exportingCsv ? "Exporting..." : "Export CSV"}
            </button>

            <button
              onClick={downloadSampleCsv}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100"
            >
              <FaCloudUploadAlt /> Download Template
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FaHistory className="text-indigo-600" /> Upload History
          </h2>
          <button
            onClick={() => {
              fetchImportOverview();
              fetchImportHistory(historyStatusFilter, historySearch);
            }}
            className="px-3 py-1.5 text-sm font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100"
          >
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="p-3 rounded-xl bg-gray-50 border">
            <p className="text-xs text-gray-500">Total Uploads</p>
            <p className="text-lg font-bold text-gray-900">{importOverview.totalJobs}</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
            <p className="text-xs text-emerald-700">Active</p>
            <p className="text-lg font-bold text-emerald-800">{importOverview.activeJobs}</p>
          </div>
          <div className="p-3 rounded-xl bg-red-50 border border-red-100">
            <p className="text-xs text-red-700">Rolled Back</p>
            <p className="text-lg font-bold text-red-800">{importOverview.rolledBackJobs}</p>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100">
            <p className="text-xs text-indigo-700">Imported Rows</p>
            <p className="text-lg font-bold text-indigo-800">{importOverview.totalImported}</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
            <p className="text-xs text-amber-700">Legacy Products</p>
            <p className="text-lg font-bold text-amber-800">{importOverview.untrackedProducts || 0}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
          <input
            type="text"
            value={historySearch}
            onChange={(e) => setHistorySearch(e.target.value)}
            placeholder="Search CSV file"
            className="md:col-span-6 px-3 py-2 text-sm border border-gray-200 rounded-lg"
          />
          <select
            value={historyStatusFilter}
            onChange={(e) => setHistoryStatusFilter(e.target.value)}
            className="md:col-span-3 px-3 py-2 text-sm border border-gray-200 rounded-lg"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="rolled_back">Rolled Back</option>
          </select>
          <button
            onClick={() => fetchImportHistory(historyStatusFilter, historySearch)}
            className="md:col-span-3 px-3 py-2 text-sm font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100"
          >
            Apply Filter
          </button>
        </div>

        <div className="overflow-x-auto border rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-3 py-2 text-left">File</th>
                <th className="px-3 py-2 text-left">Rows</th>
                <th className="px-3 py-2 text-left">Imported</th>
                <th className="px-3 py-2 text-left">Failed</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Uploaded By</th>
                <th className="px-3 py-2 text-left">Uploaded At</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {historyLoading ? (
                <tr>
                  <td colSpan="8" className="px-3 py-6 text-center text-gray-500">
                    Loading upload history...
                  </td>
                </tr>
              ) : importJobs.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-3 py-6 text-center text-gray-500">
                    No CSV uploads found.
                  </td>
                </tr>
              ) : (
                importJobs.map((job) => (
                  <tr key={job._id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-900">{job.fileName}</td>
                    <td className="px-3 py-2">{job.totalRows || 0}</td>
                    <td className="px-3 py-2">{job.importedCount}</td>
                    <td className="px-3 py-2">{job.failedCount}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                          job.status === "rolled_back" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {job.status === "rolled_back" ? "Rolled Back" : "Active"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-600">
                      {job._id === "legacy-untracked-products"
                        ? "System (Legacy)"
                        : job.createdBy?.name || job.createdBy?.email || "N/A"}
                    </td>
                    <td className="px-3 py-2 text-gray-600">
                      {job._id === "legacy-untracked-products" ? "--" : formatDateTime(job.createdAt)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => setSelectedJob(job)}
                          className="px-2 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 inline-flex items-center gap-1"
                        >
                          <FaEye /> View
                        </button>

                        {job.status === "active" && job.importedCount > 0 && (
                          <button
                            onClick={() => handleRollbackImport(job._id)}
                            disabled={rollingBackJobId === job._id}
                            className="px-2 py-1 text-xs font-semibold rounded-lg bg-red-50 text-red-700 hover:bg-red-100 inline-flex items-center gap-1 disabled:opacity-70"
                          >
                            <FaUndo /> {rollingBackJobId === job._id ? "Rolling..." : "Rollback"}
                          </button>
                        )}

                        {job._id !== "legacy-untracked-products" && (
                          <button
                            onClick={() => handleDeleteImportRecord(job._id)}
                            disabled={deletingRecordJobId === job._id}
                            className="px-2 py-1 text-xs font-semibold rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 inline-flex items-center gap-1 disabled:opacity-70"
                          >
                            <FaTrash /> {deletingRecordJobId === job._id ? "Removing..." : "Remove"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-2xl p-6 bg-white rounded-2xl border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">Upload Details</h4>
                <p className="text-sm text-gray-600">{selectedJob.fileName}</p>
              </div>
              <button onClick={() => setSelectedJob(null)} className="p-2 text-gray-500 rounded-lg hover:bg-gray-100">
                <FaTimes />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
              <div className="p-3 border rounded-lg bg-gray-50">Rows: <strong>{selectedJob.totalRows || 0}</strong></div>
              <div className="p-3 border rounded-lg bg-gray-50">Imported: <strong>{selectedJob.importedCount || 0}</strong></div>
              <div className="p-3 border rounded-lg bg-gray-50">Failed: <strong>{selectedJob.failedCount || 0}</strong></div>
              <div className="p-3 border rounded-lg bg-gray-50">Status: <strong>{selectedJob.status}</strong></div>
            </div>

            <div className="max-h-60 overflow-y-auto border rounded-lg">
              {selectedJob.errors?.length ? (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Row</th>
                      <th className="px-3 py-2 text-left">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedJob.errors.map((err, index) => (
                      <tr key={`${err.row}-${index}`} className="border-t">
                        <td className="px-3 py-2">{err.row}</td>
                        <td className="px-3 py-2">{err.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="p-3 text-sm text-gray-500">No row errors for this upload.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductCsvManagement;

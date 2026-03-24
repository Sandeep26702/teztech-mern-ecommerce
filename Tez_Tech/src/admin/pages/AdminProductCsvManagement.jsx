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
    const header = [
      "Product_ID",
      "SKU",
      "Product_Name",
      "Category_1",
      "Category_2",
      "Category_3",
      "Category_4",
      "Category_5",
      "MRP",
      "Selling_Price",
      "Stock",
      "Status",
      "Search_Tags",
      "Image_1",
      "Image_2",
      "Image_3",
      "Image_4",
      "Image_5",
      "Image_6",
      "Height_ft",
      "Width_ft",
      "Total_Holes",
      "Hole_Size",
      "Material_Type",
      "Sheet_Thickness",
      "LED_Compatible",
      "Input_Voltage",
      "Output_Voltage",
      "Power_Watt",
      "Connectivity",
      "IC_Number",
      "LED_Per_Meter",
      "Controller_Type",
      "Warranty",
      "Color_Red_Add",
      "Color_Green_Add",
      "Color_Blue_Add",
      "Hole_9mm_Add",
      "Hole_12mm_Add",
      "Material_TezTech_Add",
      "Material_Sunrise_Add",
      "Power_12W_Add",
      "Power_24W_Add",
      "Remote_Add",
      "Waterproof_Add",
    ].join(",");

    const sampleRow = [
      "1",
      "SKU-001",
      "Sample Poly Sheet",
      "PolySheets",
      "",
      "",
      "",
      "",
      "1500",
      "1200",
      "25",
      "Active",
      "poly,sheet,white,8mm",
      "https://placehold.co/600x600?text=Image1",
      "",
      "",
      "",
      "",
      "",
      "8",
      "4",
      "16",
      "9mm",
      "TezTech",
      "1mm",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "0",
      "50",
      "0",
      "0",
      "100",
      "0",
      "",
      "",
      "",
      "",
    ].join(",");

    const sample = [header, sampleRow].join("\n");

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
      alert(
        `${result.message}\nNew: ${result.importedCount || 0}\nUpdated: ${result.updatedCount || 0}\nFailed: ${
          result.failedCount || 0
        }`
      );
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
    <div className="mx-auto space-y-6 font-sans max-w-7xl">
      <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-2xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Catalog Manager</h1>
            <p className="mt-1 text-sm text-gray-600">
              Upload the `Final_Clean_Catalog.csv` file to sync the entire website catalog in one click.
            </p>
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
              <FaFileImport /> {importingCsv ? "Uploading..." : "Upload CSV Catalog"}
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
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-indigo-700 border border-indigo-200 bg-indigo-50 rounded-xl hover:bg-indigo-100"
            >
              <FaCloudUploadAlt /> Download Template
            </button>
          </div>
        </div>
      </div>

      <div className="p-8 border shadow-sm bg-gradient-to-br from-emerald-50 to-white border-emerald-100 rounded-3xl">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600">
            <FaCloudUploadAlt className="text-3xl" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Upload CSV Catalog</h2>
            <p className="mt-1 text-sm text-gray-600">
              Drag and drop the file or click the button below to sync all products, prices, stock, and variations.
            </p>
          </div>
          <button
            onClick={() => csvInputRef.current?.click()}
            disabled={importingCsv}
            className="px-6 py-3 text-base font-bold text-white bg-emerald-600 rounded-2xl hover:bg-emerald-700 disabled:opacity-70"
          >
            {importingCsv ? "Uploading..." : "Upload CSV Catalog"}
          </button>
        </div>
      </div>

      <div className="p-6 space-y-5 bg-white border border-gray-200 shadow-sm rounded-2xl">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
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

        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <div className="p-3 border rounded-xl bg-gray-50">
            <p className="text-xs text-gray-500">Total Uploads</p>
            <p className="text-lg font-bold text-gray-900">{importOverview.totalJobs}</p>
          </div>
          <div className="p-3 border rounded-xl bg-emerald-50 border-emerald-100">
            <p className="text-xs text-emerald-700">Active</p>
            <p className="text-lg font-bold text-emerald-800">{importOverview.activeJobs}</p>
          </div>
          <div className="p-3 border border-red-100 rounded-xl bg-red-50">
            <p className="text-xs text-red-700">Rolled Back</p>
            <p className="text-lg font-bold text-red-800">{importOverview.rolledBackJobs}</p>
          </div>
          <div className="p-3 border border-indigo-100 rounded-xl bg-indigo-50">
            <p className="text-xs text-indigo-700">Imported Rows</p>
            <p className="text-lg font-bold text-indigo-800">{importOverview.totalImported}</p>
          </div>
          <div className="p-3 border rounded-xl bg-amber-50 border-amber-100">
            <p className="text-xs text-amber-700">Legacy Products</p>
            <p className="text-lg font-bold text-amber-800">{importOverview.untrackedProducts || 0}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-12">
          <input
            type="text"
            value={historySearch}
            onChange={(e) => setHistorySearch(e.target.value)}
            placeholder="Search CSV file"
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg md:col-span-6"
          />
          <select
            value={historyStatusFilter}
            onChange={(e) => setHistoryStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg md:col-span-3"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="rolled_back">Rolled Back</option>
          </select>
          <button
            onClick={() => fetchImportHistory(historyStatusFilter, historySearch)}
            className="px-3 py-2 text-sm font-semibold text-indigo-700 border border-indigo-200 rounded-lg md:col-span-3 bg-indigo-50 hover:bg-indigo-100"
          >
            Apply Filter
          </button>
        </div>

        <div className="overflow-x-auto border rounded-xl">
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-600 uppercase bg-gray-50">
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
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-blue-700 rounded-lg bg-blue-50 hover:bg-blue-100"
                        >
                          <FaEye /> View
                        </button>

                        {job.status === "active" && job.importedCount > 0 && (
                          <button
                            onClick={() => handleRollbackImport(job._id)}
                            disabled={rollingBackJobId === job._id}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-red-700 rounded-lg bg-red-50 hover:bg-red-100 disabled:opacity-70"
                          >
                            <FaUndo /> {rollingBackJobId === job._id ? "Rolling..." : "Rollback"}
                          </button>
                        )}

                        {job._id !== "legacy-untracked-products" && (
                          <button
                            onClick={() => handleDeleteImportRecord(job._id)}
                            disabled={deletingRecordJobId === job._id}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-70"
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
          <div className="w-full max-w-2xl p-6 bg-white border border-gray-200 rounded-2xl">
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

            <div className="overflow-y-auto border rounded-lg max-h-60">
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

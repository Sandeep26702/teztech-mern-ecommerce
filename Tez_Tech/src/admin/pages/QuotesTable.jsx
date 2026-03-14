import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaEye, FaEdit, FaFileInvoiceDollar, FaPlus } from "react-icons/fa";
import api from "../../utils/api"; // Axios instance with interceptors for seamless API calls and error handling
import CreateManualQuotationModal from "../components/CreateManualQuotationModal.jsx";

const QuotesTable = () => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showManualModal, setShowManualModal] = useState(false);

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      // ⚠️ Note: Hume backend mein GET /api/quotes route banana padega iske liye
      const response = await api.get("/quote/all");
      setQuotes(response.data.quotes || []);
    } catch (error) {
      console.error("Error fetching quotes:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Pending": return "bg-yellow-100 text-yellow-800";
      case "Responded": return "bg-blue-100 text-blue-800";
      case "Accepted": return "bg-green-100 text-green-800";
      case "Rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-800">
          <FaFileInvoiceDollar className="text-blue-600" /> Quotation Requests
        </h2>
        <button 
          onClick={() => setShowManualModal(true)}
          className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white shadow-lg bg-emerald-600 rounded-xl hover:bg-emerald-700"
        >
          <FaPlus /> Create Manual Quotation
        </button>
      </div>

      {loading ? (
        <p className="py-10 text-center text-gray-500">Loading quotes...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-sm tracking-wider text-gray-600 uppercase border-b border-gray-200 bg-gray-50">
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Client Name</th>
                <th className="p-4 font-semibold">Company</th>
                <th className="p-4 font-semibold">Items</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 divide-y divide-gray-100">
              {quotes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">No quotes found.</td>
                </tr>
              ) : (
                quotes.map((quote) => (
                  <tr key={quote._id} className="transition-colors hover:bg-gray-50">
                    <td className="p-4">{new Date(quote.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 font-medium text-gray-900">{quote.userDetails.name}</td>
                    <td className="p-4">{quote.userDetails.company || "-"}</td>
                    <td className="p-4">{quote.requestedItems?.length || 0}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadge(quote.status)}`}>
                        {quote.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {/* 👇 Edit page par bhejne ka link */}
                      <Link 
                        to={`/admin/quotes/${quote._id}`}
                        className="inline-flex items-center justify-center p-2 text-blue-600 transition-colors rounded-lg bg-blue-50 hover:bg-blue-600 hover:text-white"
                        title="View & Respond"
                      >
                        {quote.status === "Pending" ? <FaEdit /> : <FaEye />}
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      </div>
      <CreateManualQuotationModal isOpen={showManualModal} onClose={() => setShowManualModal(false)} />
    </div>
  );
};

export default QuotesTable;

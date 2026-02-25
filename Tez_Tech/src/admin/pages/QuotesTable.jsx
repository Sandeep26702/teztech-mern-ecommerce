import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaEye, FaEdit, FaFileInvoiceDollar } from "react-icons/fa";
import api from "../../api/api"; // Aapka axios instance

const QuotesTable = () => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      // ⚠️ Note: Hume backend mein GET /api/quotes route banana padega iske liye
      const response = await api.get("/quotes");
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
    <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FaFileInvoiceDollar className="text-blue-600" /> Quotation Requests
        </h2>
      </div>

      {loading ? (
        <p className="text-gray-500 text-center py-10">Loading quotes...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider border-b border-gray-200">
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Client Name</th>
                <th className="p-4 font-semibold">Company</th>
                <th className="p-4 font-semibold">Items</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {quotes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">No quotes found.</td>
                </tr>
              ) : (
                quotes.map((quote) => (
                  <tr key={quote._id} className="hover:bg-gray-50 transition-colors">
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
                        className="inline-flex items-center justify-center p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-colors"
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
  );
};

export default QuotesTable;
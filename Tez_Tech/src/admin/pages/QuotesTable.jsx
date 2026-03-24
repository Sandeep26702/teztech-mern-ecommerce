import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { 
  FaEdit, 
  FaFileInvoiceDollar, 
  FaPlus, 
  FaSearch, 
  FaCalendarAlt, 
  FaUserShield, 
  FaGlobe 
} from "react-icons/fa";
import api from "../../utils/api";
import CreateManualQuotationModal from "../components/CreateManualQuotationModal.jsx";

const STATUS_TABS = [
  { key: "action", label: "Action Needed", statuses: ["Pending"] },
  { key: "awaiting", label: "Awaiting Client", statuses: ["Responded", "Offered", "Updated"] },
  { key: "accepted", label: "Accepted", statuses: ["Accepted"] },
  { key: "rejected", label: "Rejected", statuses: ["Rejected"] },
  { key: "all", label: "All Quotes", statuses: null },
];

const toSafeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatINR = (value) => {
  const safeValue = Math.max(0, toSafeNumber(value, 0));
  return `₹ ${safeValue.toLocaleString("en-IN")}`;
};

const getQuoteTotal = (quote) => {
  const finalTotal = toSafeNumber(quote?.finalTotal, 0);
  if (finalTotal > 0) return finalTotal;
  const items = Array.isArray(quote?.requestedItems) ? quote.requestedItems : [];
  return items.reduce((sum, item) => {
    const qty = Math.max(0, toSafeNumber(item?.quantity, 0));
    const price = toSafeNumber(
      item?.offeredPrice,
      toSafeNumber(item?.originalPrice, toSafeNumber(item?.basePrice, 0))
    );
    return sum + qty * price;
  }, 0);
};

const QuotesTable = () => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showManualModal, setShowManualModal] = useState(false);
  const [activeTab, setActiveTab] = useState("action");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
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
      case "Offered": return "bg-blue-100 text-blue-800";
      case "Updated": return "bg-indigo-100 text-indigo-800";
      case "Accepted": return "bg-green-100 text-green-800";
      case "Rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const filteredQuotes = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const startDate = dateRange.start ? new Date(`${dateRange.start}T00:00:00`) : null;
    const endDate = dateRange.end ? new Date(`${dateRange.end}T23:59:59.999`) : null;

    return quotes.filter((quote) => {
      const quoteNumber = String(quote?.quoteNumber || "").toLowerCase();
      const clientName = String(quote?.userDetails?.name || "").toLowerCase();

      const matchesSearch = !term || quoteNumber.includes(term) || clientName.includes(term);

      if (!matchesSearch) return false;

      if (!startDate && !endDate) return true;
      const createdAt = quote?.createdAt ? new Date(quote.createdAt) : null;
      if (!createdAt || Number.isNaN(createdAt.getTime())) return false;
      if (startDate && createdAt < startDate) return false;
      if (endDate && createdAt > endDate) return false;
      return true;
    });
  }, [quotes, searchTerm, dateRange.start, dateRange.end]);

  const tabbedQuotes = useMemo(() => {
    const tab = STATUS_TABS.find((entry) => entry.key === activeTab) || STATUS_TABS[0];
    if (!tab.statuses) return filteredQuotes;
    return filteredQuotes.filter((quote) => tab.statuses.includes(quote?.status));
  }, [filteredQuotes, activeTab]);

  const buildStats = (statuses) => {
    const pool = filteredQuotes.filter((quote) => statuses.includes(quote?.status));
    const count = pool.length;
    const amount = pool.reduce((sum, quote) => sum + getQuoteTotal(quote), 0);
    return { count, amount };
  };

  const actionStats = buildStats(["Pending"]);
  const awaitingStats = buildStats(["Responded", "Offered", "Updated"]);
  const wonStats = buildStats(["Accepted"]);

  const tabCounts = STATUS_TABS.reduce((acc, tab) => {
    if (!tab.statuses) {
      acc[tab.key] = filteredQuotes.length;
      return acc;
    }
    acc[tab.key] = filteredQuotes.filter((quote) => tab.statuses.includes(quote?.status)).length;
    return acc;
  }, {});

  return (
    <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
      <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-800">
            <FaFileInvoiceDollar className="text-blue-600" /> Sales Pipeline
          </h2>
          <p className="mt-1 text-sm text-gray-500">Track quote health, follow-ups, and conversions.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative">
            <FaSearch className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by client or Quote ID"
              className="w-full py-2.5 pl-10 pr-4 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <div className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-xl">
            <FaCalendarAlt className="text-gray-400" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(event) => setDateRange((prev) => ({ ...prev, start: event.target.value }))}
              className="text-sm text-gray-600 bg-transparent focus:outline-none"
            />
            <span className="text-gray-400">-</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(event) => setDateRange((prev) => ({ ...prev, end: event.target.value }))}
              className="text-sm text-gray-600 bg-transparent focus:outline-none"
            />
          </div>
          <button 
            onClick={() => setShowManualModal(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white shadow-lg bg-emerald-600 rounded-xl hover:bg-emerald-700"
          >
            <FaPlus /> Create Manual Quotation
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3">
        <div className="p-4 border border-amber-100 bg-amber-50 rounded-2xl">
          <p className="text-xs font-semibold tracking-wide text-amber-700 uppercase">Action Needed</p>
          <div className="flex items-end justify-between mt-4">
            <div>
              <p className="text-2xl font-bold text-amber-900">{actionStats.count}</p>
              <p className="text-xs text-amber-700">Pending quotes</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-amber-900">{formatINR(actionStats.amount)}</p>
              <p className="text-[11px] text-amber-700">Total pending value</p>
            </div>
          </div>
        </div>
        <div className="p-4 border border-blue-100 bg-blue-50 rounded-2xl">
          <p className="text-xs font-semibold tracking-wide text-blue-700 uppercase">Awaiting Client</p>
          <div className="flex items-end justify-between mt-4">
            <div>
              <p className="text-2xl font-bold text-blue-900">{awaitingStats.count}</p>
              <p className="text-xs text-blue-700">Responded / Offered</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-blue-900">{formatINR(awaitingStats.amount)}</p>
              <p className="text-[11px] text-blue-700">Total awaiting value</p>
            </div>
          </div>
        </div>
        <div className="p-4 border border-emerald-100 bg-emerald-50 rounded-2xl">
          <p className="text-xs font-semibold tracking-wide text-emerald-700 uppercase">Deals Won</p>
          <div className="flex items-end justify-between mt-4">
            <div>
              <p className="text-2xl font-bold text-emerald-900">{wonStats.count}</p>
              <p className="text-xs text-emerald-700">Accepted quotes</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-emerald-900">{formatINR(wonStats.amount)}</p>
              <p className="text-[11px] text-emerald-700">Total won value</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pb-4 mb-4 border-b border-gray-100">
        {STATUS_TABS.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border transition ${
                isActive
                  ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                  : "bg-white border-gray-200 text-gray-600 hover:border-blue-200 hover:text-blue-600"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-2 py-0.5 text-xs rounded-full ${
                  isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                {tabCounts[tab.key] || 0}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="py-10 text-center text-gray-500">Loading quotes...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-sm tracking-wider text-gray-600 uppercase border-b border-gray-200 bg-gray-50">
                <th className="p-4 font-semibold">Quote ID & Version</th>
                <th className="p-4 font-semibold">Source</th>
                <th className="p-4 font-semibold">Client Info</th>
                <th className="p-4 font-semibold">Amount</th>
                <th className="p-4 font-semibold text-left">Status & Action</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 divide-y divide-gray-100">
              {tabbedQuotes.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">
                    No quotes match the selected filters.
                  </td>
                </tr>
              ) : (
                tabbedQuotes.map((quote) => {
                  const quoteNumber = quote?.quoteNumber ? `#${quote.quoteNumber}` : `#${quote?._id || "—"}`;
                  const version = `V${toSafeNumber(quote?.version, 1)}`;
                  const isManual = Boolean(quote?.isManual);
                  const createdAt = quote?.createdAt ? new Date(quote.createdAt).toLocaleDateString() : "—";
                  const total = formatINR(getQuoteTotal(quote));
                  const detailsLink = `/admin/quotes/${quote._id}`;

                  return (
                    <tr key={quote._id} className="transition-colors hover:bg-gray-50">
                      <td className="p-4">
                        <Link
                          to={detailsLink}
                          className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 rounded-lg"
                          title="Open quote details"
                        >
                          <p className="font-semibold text-gray-900">{`${quoteNumber} - ${version}`}</p>
                          <p className="text-xs text-gray-500">Created {createdAt}</p>
                        </Link>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm">
                          <span
                            className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                              isManual ? "bg-emerald-100 text-emerald-700" : "bg-indigo-100 text-indigo-700"
                            }`}
                            title={isManual ? "Created by Admin" : "Requested by Client/Web"}
                          >
                            {isManual ? <FaUserShield /> : <FaGlobe />}
                          </span>
                          <div>
                            <p className="font-semibold text-gray-800">{isManual ? "Admin" : "Client/Web"}</p>
                            <p className="text-xs text-gray-500">{isManual ? "Manual entry" : "Online request"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Link
                          to={detailsLink}
                          className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 rounded-lg"
                          title="Open quote details"
                        >
                          <p className="font-semibold text-gray-900">{quote?.userDetails?.name || "—"}</p>
                          <p className="text-xs text-gray-500">{quote?.userDetails?.company || "No company"}</p>
                        </Link>
                      </td>
                      <td className="p-4">
                        <Link
                          to={detailsLink}
                          className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 rounded-lg"
                          title="Open quote details"
                        >
                          <p className="text-base font-semibold text-gray-900">{total}</p>
                          <p className="text-xs text-gray-500">
                            {quote?.requestedItems?.length || 0} items
                          </p>
                        </Link>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadge(quote.status)}`}>
                            {quote.status}
                          </span>
                          <Link 
                            to={`/admin/quotes/${quote._id}`}
                            className="inline-flex items-center justify-center p-2 text-blue-600 transition-colors rounded-lg bg-blue-50 hover:bg-blue-600 hover:text-white"
                            title="View & Respond"
                          >
                            <FaEdit />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
      <CreateManualQuotationModal isOpen={showManualModal} onClose={() => setShowManualModal(false)} />
    </div>
  );
};

export default QuotesTable;

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  FiSearch, 
  FiRefreshCw, 
  FiDownload, 
  FiShield, 
  FiAlertTriangle, 
  FiXCircle,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { getApiUrl } from '../../utils/api';

const AdminLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [riskLevel, setRiskLevel] = useState('All');
  const [dateRange, setDateRange] = useState('Today');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const limit = 20;
  const refreshIntervalRef = useRef(null);

  const fetchLogs = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setIsRefreshing(true);
    
    try {
      const queryParams = new URLSearchParams({
        page,
        limit,
        search,
        riskLevel,
        dateRange
      });

      const { data } = await axios.get(`${getApiUrl()}/admin/logs?${queryParams.toString()}`, {
        withCredentials: true
      });

      if (data.success) {
        setLogs(data.logs);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch logs", error);
      toast.error("Failed to load traffic logs");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, riskLevel, dateRange]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1); // Reset to page 1 on new search
      fetchLogs();
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  // Auto-refresh logic (every 15 seconds)
  useEffect(() => {
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(() => {
        fetchLogs(true);
      }, 15000);
    } else {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    }

    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, [autoRefresh, page, search, riskLevel, dateRange]);

  const handleExportCSV = async () => {
    try {
      const queryParams = new URLSearchParams({
        search,
        riskLevel,
        dateRange
      });
      
      const response = await axios.get(`${getApiUrl()}/admin/logs/export?${queryParams.toString()}`, {
        withCredentials: true,
        responseType: 'blob' // Important for file download
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `traffic_logs_${new Date().getTime()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Logs exported successfully");
    } catch (error) {
      toast.error("Failed to export logs");
    }
  };

  const getRiskBadge = (level) => {
    switch (level) {
      case 'Safe':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200"><FiShield className="w-3 h-3"/> Safe</span>;
      case 'Warning':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200"><FiAlertTriangle className="w-3 h-3"/> Warning</span>;
      case 'Blocked':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200"><FiXCircle className="w-3 h-3"/> Blocked</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">Unknown</span>;
    }
  };

  return (
    <div className="p-6 w-full space-y-6">
      {/* 1. Top Header (The Command Center) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Live Traffic & Security Logs</h1>
            <div className="relative flex items-center justify-center w-3 h-3">
              <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${autoRefresh ? 'bg-green-400 animate-ping' : 'bg-gray-400'}`}></span>
              <span className={`relative inline-flex rounded-full w-2 h-2 ${autoRefresh ? 'bg-green-500' : 'bg-gray-500'}`}></span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-1">Monitor all incoming traffic and security events in real-time.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
              autoRefresh 
                ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100' 
                : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
            }`}
          >
            <FiRefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-green-600' : ''}`} />
            {autoRefresh ? 'Auto-Refresh: ON' : 'Auto-Refresh: OFF'}
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-all duration-200 shadow-sm"
          >
            <FiDownload className="w-4 h-4" />
            Export to CSV
          </button>
        </div>
      </div>

      {/* 2. Smart Filters */}
      <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search IP Address or Email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
          />
        </div>
        
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-4 py-2.5 bg-gray-50 border-none rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 cursor-pointer outline-none"
        >
          <option value="Today">Today</option>
          <option value="Last 7 Days">Last 7 Days</option>
          <option value="All Time">All Time</option>
        </select>

        <select
          value={riskLevel}
          onChange={(e) => setRiskLevel(e.target.value)}
          className="px-4 py-2.5 bg-gray-50 border-none rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 cursor-pointer outline-none"
        >
          <option value="All">All Actions</option>
          <option value="Safe">🟢 Safe Actions</option>
          <option value="Warning">🟡 Warnings</option>
          <option value="Blocked">🔴 Blocked</option>
        </select>
      </div>

      {/* 3. Main Data Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Identity</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Endpoint</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Risk Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 relative">
              {loading ? (
                // Skeleton Loader
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                      <div className="h-3 bg-gray-100 rounded w-24"></div>
                    </td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-40"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                    <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded-full w-20"></div></td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <FiSearch className="w-8 h-8 text-gray-300 mb-3" />
                      <p>No traffic logs found matching your criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr 
                    key={log._id} 
                    className="hover:bg-gray-50/80 transition-colors duration-150 group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(log.createdAt).toLocaleString('en-IN', { 
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
                      })}
                    </td>
                    <td className="px-6 py-4">
                      {log.user ? (
                        <div>
                          <p className="text-sm font-medium text-gray-900">{log.user.name}</p>
                          <p className="text-xs text-gray-500">{log.user.email}</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 uppercase tracking-wider">Guest</span>
                            {log.email && <span className="text-gray-500 font-normal">({log.email})</span>}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 font-mono">{log.ipAddress}</p>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{log.action}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono text-xs">
                      <span className="px-2 py-1 bg-gray-50 rounded border border-gray-100">{log.method}</span> {log.endpoint}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRiskBadge(log.riskLevel)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 4. Pagination */}
        {!loading && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
            <p className="text-sm text-gray-500">
              Showing <span className="font-medium text-gray-900">{(page - 1) * limit + 1}</span> to <span className="font-medium text-gray-900">{Math.min(page * limit, total)}</span> of <span className="font-medium text-gray-900">{total}</span> results
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <FiChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <FiChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLogs;

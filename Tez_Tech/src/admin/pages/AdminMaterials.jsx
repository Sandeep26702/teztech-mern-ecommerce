import { useState, useEffect, useRef } from "react";
import { 
  FaCubes, FaPlus, FaExclamationTriangle, FaEdit, FaSearch, 
  FaTruck, FaMoneyBillWave, FaTrash, FaCheck, FaPhoneAlt, 
  FaEnvelope, FaUniversity, FaStar, FaHistory, FaFileInvoiceDollar, 
  FaExchangeAlt, FaShieldAlt, FaPrint, FaWhatsapp 
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/api";
import Chart from "chart.js/auto";

const AdminMaterials = () => {
  const { user } = useAuth();
  const userRole = user?.role?.toLowerCase() || "";

  // Active Tab: 'tracker', 'po', 'vendors', 'forecast', 'qc'
  const [activeTab, setActiveTab] = useState("tracker");
  
  // Data States
  const [materials, setMaterials] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [pos, setPOs] = useState([]);
  const [creditNotes, setCreditNotes] = useState([]);
  const [upcomingJobs, setUpcomingJobs] = useState([]);
  const [scraps, setScraps] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Chart Ref
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // Modals Toggle
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showPOModal, setShowPOModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [activePOPreview, setActivePOPreview] = useState(null);

  // Create Material Form State
  const [matName, setMatName] = useState("");
  const [matSku, setMatSku] = useState("");
  const [matStock, setMatStock] = useState("");
  const [matMin, setMatMin] = useState("5");
  const [matUnit, setMatUnit] = useState("rolls");
  const [matPrice, setMatPrice] = useState("4500");

  // Create Vendor Form State
  const [vName, setVName] = useState("");
  const [vPhone, setVPhone] = useState("");
  const [vEmail, setVEmail] = useState("");
  const [vBank, setVBank] = useState("");
  const [vMaterial, setVMaterial] = useState("");
  const [vRate, setVRate] = useState("");

  // Create PO Form State
  const [poVendorId, setPOVendorId] = useState("");
  const [poExpectedDate, setPOExpectedDate] = useState("");
  const [poItems, setPOItems] = useState([{ materialId: "", qty: "", rate: 0 }]);

  // Log QC Inward Form State
  const [inwardPOId, setInwardPOId] = useState("");
  const [inwardAccepted, setInwardAccepted] = useState("");
  const [inwardDamaged, setInwardDamaged] = useState("0");
  const [inwardChallan, setInwardChallan] = useState("");
  const [inwardNotes, setInwardNotes] = useState("");

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (activeTab === "tracker" && materials.length > 0) {
      renderChart();
    }
  }, [activeTab, materials]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Materials & Alerts
      const matRes = await api.get("/materials");
      if (matRes.data.success) {
        setMaterials(matRes.data.materials || []);
        setLowStockAlerts(matRes.data.lowStockAlerts || []);
      }

      // 2. Fetch Vendors
      const vendorRes = await api.get("/vendors");
      if (vendorRes.data.success) {
        setVendors(vendorRes.data.vendors || []);
      }

      // 3. Fetch POs
      const poRes = await api.get("/pos");
      if (poRes.data.success) {
        setPOs(poRes.data.pos || []);
      }

      // 4. Fetch Credit Notes
      const cnRes = await api.get("/credit-notes");
      if (cnRes.data.success) {
        setCreditNotes(cnRes.data.creditNotes || []);
      }

      // 5. Fetch Upcoming Manufacturing Job Cards
      const jobRes = await api.get("/job-cards?status=Awaiting Production");
      if (jobRes.data.success) {
        setUpcomingJobs(jobRes.data.jobCards || []);
      }

      // 6. Fetch Live Scraps
      const scrapRes = await api.get("/scrap");
      if (scrapRes.data.success) {
        setScraps(scrapRes.data.scrap || []);
      }

    } catch (err) {
      console.error("Load Purchase Data Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Render Value Distribution Chart
  const renderChart = () => {
    if (!chartRef.current) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const labels = materials.map(m => m.name);
    // Standard mock pricing helper mapping:
    const data = materials.map(m => m.stock * (m.minStockLimit > 5 ? 5000 : 180));

    const ctx = chartRef.current.getContext("2d");
    chartInstance.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Stock Level",
          data: materials.map(m => m.stock),
          backgroundColor: materials.map(m => m.stock < m.minStockLimit ? "rgba(239, 68, 68, 0.75)" : "rgba(59, 130, 246, 0.75)"),
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { grid: { color: "rgba(0,0,0,0.05)" } },
          x: { grid: { display: false } }
        }
      }
    });
  };

  // ----------------------------------------------------
  // SUBMIT HANDLERS
  // ----------------------------------------------------

  const handleCreateMaterial = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/materials", {
        name: matName,
        sku: matSku,
        stock: Number(matStock) || 0,
        minStockLimit: Number(matMin) || 5,
        unit: matUnit,
      });
      if (res.data.success) {
        toast.success("Raw material registered!");
        setShowMaterialModal(false);
        setMatName("");
        setMatSku("");
        setMatStock("");
        setMatMin("5");
        fetchAllData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add material");
    }
  };

  const handleCreateVendor = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/vendors", {
        name: vName,
        phone: vPhone,
        email: vEmail,
        bank: vBank,
        mainMaterial: vMaterial,
        contractRate: Number(vRate),
      });
      if (res.data.success) {
        toast.success("Vendor CRM entry registered!");
        setShowVendorModal(false);
        setVName("");
        setVPhone("");
        setVEmail("");
        setVBank("");
        setVMaterial("");
        setVRate("");
        fetchAllData();
      }
    } catch (err) {
      toast.error("Failed to register supplier");
    }
  };

  const handleCreatePO = async (e) => {
    e.preventDefault();
    try {
      const validItems = poItems.filter(it => it.materialId && it.qty);
      if (!validItems.length) {
        toast.error("Please add at least one material");
        return;
      }

      const res = await api.post("/pos", {
        vendor: poVendorId,
        expectedDate: poExpectedDate,
        items: validItems
      });

      if (res.data.success) {
        toast.success("Purchase Order dispatched!");
        setShowPOModal(false);
        setPOVendorId("");
        setPOExpectedDate("");
        setPOItems([{ materialId: "", qty: "", rate: 0 }]);
        fetchAllData();
      }
    } catch (err) {
      toast.error("Failed to generate Purchase Order");
    }
  };

  const handleQCInwardSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/pos/inward-qc", {
        poId: inwardPOId,
        accepted: Number(inwardAccepted),
        damaged: Number(inwardDamaged),
      });
      if (res.data.success) {
        toast.success("QC Inward synced successfully!");
        setInwardPOId("");
        setInwardAccepted("");
        setInwardDamaged("0");
        setInwardChallan("");
        setInwardNotes("");
        fetchAllData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to log QC inward");
    }
  };

  // ----------------------------------------------------
  // INTERACTIVE TRANSITIONS
  // ----------------------------------------------------

  const changePOStatus = async (id, nextStatus) => {
    try {
      const res = await api.put(`/pos/${id}/status`, { status: nextStatus });
      if (res.data.success) {
        toast.success(`PO transitioned to ${nextStatus}`);
        fetchAllData();
      }
    } catch (err) {
      toast.error("Failed to update PO status");
    }
  };

  const handleNegotiateRate = async (vendorId, oldRate) => {
    const newRate = prompt("Enter new negotiated contract price (per unit):", oldRate);
    if (newRate && !isNaN(newRate)) {
      try {
        const res = await api.put(`/vendors/${vendorId}/rate`, { contractRate: Number(newRate) });
        if (res.data.success) {
          toast.success("Rate card updated!");
          fetchAllData();
        }
      } catch (err) {
        toast.error("Failed to update rate card");
      }
    }
  };

  // Simulates Manufacturing Auto-Deduction by marking a Job Card complete
  const handleSimulateDeduction = async (jobId) => {
    try {
      const res = await api.post(`/job-cards/${jobId}/complete`, { operatorNotes: "Simulated completed by Purchase team" });
      if (res.data.success) {
        toast.success("Sim completed! Stock level deducted in real-time.");
        fetchAllData();
      }
    } catch (err) {
      toast.error("Simulation failed");
    }
  };

  // ----------------------------------------------------
  // UTILS
  // ----------------------------------------------------

  const triggerWhatsAppPO = (po) => {
    let text = `*OFFICIAL PURCHASE ORDER*\n`;
    text += `*PO Number:* ${po.poNumber}\n`;
    text += `*Expected Delivery:* ${new Date(po.expectedDate).toLocaleDateString()}\n\n`;
    text += `*Vendor:* ${po.vendor?.name}\n`;
    text += `--------------------------------\n`;

    let total = 0;
    po.items.forEach(it => {
      text += `• ${it.materialId?.name || 'Material'} - Qty: ${it.qty} @ ₹${it.rate}/unit\n`;
      total += it.qty * it.rate;
    });

    text += `--------------------------------\n`;
    text += `*Grand Total (Est):* ₹${Math.round(total * 1.18).toLocaleString('en-IN')}\n\n`;
    text += `Please acknowledge this procurement request. QC inspection will apply upon delivery.`;

    const encodedText = encodeURIComponent(text);
    const waUrl = `https://wa.me/${po.vendor?.phone?.replace(/[^0-9+]/g, '')}?text=${encodedText}`;
    window.open(waUrl, '_blank');
  };

  // Computes metrics
  const getMetrics = () => {
    let totalStockVal = 0;
    materials.forEach(m => {
      // standard pricing mapping multiplier
      const rate = m.minStockLimit > 5 ? 5000 : 180;
      totalStockVal += m.stock * rate;
    });

    let monthlySpend = 0;
    pos.forEach(p => {
      let sub = 0;
      p.items.forEach(it => sub += it.qty * it.rate);
      monthlySpend += sub * 1.18; // plus 18% GST
    });

    const inTransitCount = pos.filter(p => p.status === "In Transit" || p.status === "Sent to Vendor").length;

    return {
      criticalCount: lowStockAlerts.length,
      inTransitCount,
      totalStockVal,
      monthlySpend
    };
  };

  const metrics = getMetrics();

  // Search filter
  const filterSearch = (items, fields) => {
    if (!searchQuery) return items;
    return items.filter(item => {
      return fields.some(field => {
        const val = field.split('.').reduce((obj, key) => obj?.[key], item);
        return String(val || '').toLowerCase().includes(searchQuery.toLowerCase());
      });
    });
  };

  // Sort materials: critical to the top
  const sortedMaterials = [...materials].sort((a, b) => {
    const aCrit = a.stock < a.minStockLimit ? 1 : 0;
    const bCrit = b.stock < b.minStockLimit ? 1 : 0;
    return bCrit - aCrit;
  });

  const filteredMaterials = filterSearch(sortedMaterials, ["name", "sku"]);
  const filteredPOs = filterSearch(pos, ["poNumber", "vendor.name"]);
  const filteredVendors = filterSearch(vendors, ["name", "mainMaterial"]);

  return (
    <div className="p-6 bg-slate-50 min-h-screen text-slate-800 font-sans">
      
      {/* 1. Header & Quick Alerts */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            <FaCubes className="text-indigo-600 animate-pulse" /> AeroStock procurement Control
          </h1>
          <p className="text-slate-500 text-sm mt-1">Advanced inventory status tracker and purchase lifecycle pipeline.</p>
        </div>
        
        {/* Global Search and Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            <input 
              type="text" 
              placeholder="Search material, supplier, or PO..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
            />
          </div>
          <button 
            onClick={() => setShowPOModal(true)}
            className="flex items-center gap-1.5 px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition text-sm shadow-md shadow-indigo-600/10 cursor-pointer"
          >
            <FaPlus /> Create PO
          </button>
        </div>
      </div>

      {/* Emergency Stock-out Warning Panel */}
      {lowStockAlerts.length > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl mb-6 flex items-start gap-3.5 animate-pulse">
          <div className="w-10 h-10 bg-rose-100 border border-rose-200 text-rose-600 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
            <FaExclamationTriangle />
          </div>
          <div>
            <h4 className="font-bold text-rose-950 text-sm">CRITICAL RAW MATERIAL ALERT (STOCK OUT RISK)</h4>
            <div className="flex flex-wrap gap-2 mt-2">
              {lowStockAlerts.map(alert => (
                <span key={alert._id} className="px-2.5 py-0.5 text-[11px] font-extrabold bg-white border border-rose-200 text-rose-600 rounded-md shadow-sm">
                  ⚠️ {alert.name}: {alert.stock} {alert.unit} left (Min: {alert.minStockLimit})
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. Dashboard metrics row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="p-5 bg-white border border-slate-100 shadow-sm rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl flex-shrink-0"><FaExclamationTriangle /></div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Critical Low Stock</span>
            <span className="text-2xl font-black text-slate-900 block mt-0.5">{metrics.criticalCount}</span>
            <span className="text-[10px] text-rose-500 font-bold">Needs immediate reorder</span>
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-100 shadow-sm rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center text-xl flex-shrink-0"><FaTruck /></div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">In Transit POs</span>
            <span className="text-2xl font-black text-slate-900 block mt-0.5">{metrics.inTransitCount}</span>
            <span className="text-[10px] text-cyan-500 font-bold">Expected within week</span>
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-100 shadow-sm rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl flex-shrink-0"><FaMoneyBillWave /></div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Inventory Value</span>
            <span className="text-2xl font-black text-slate-900 block mt-0.5">₹{metrics.totalStockVal.toLocaleString('en-IN')}</span>
            <span className="text-[10px] text-emerald-500 font-bold">Stock current asset value</span>
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-100 shadow-sm rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl flex-shrink-0"><FaFileInvoiceDollar /></div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Procurement Spend</span>
            <span className="text-2xl font-black text-slate-900 block mt-0.5">₹{metrics.monthlySpend.toLocaleString('en-IN')}</span>
            <span className="text-[10px] text-amber-500 font-bold">Active spend (inc. GST)</span>
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex border-b border-slate-200 gap-6 mb-6">
        <button onClick={() => setActiveTab("tracker")} className={`pb-3 font-bold text-sm tracking-wide border-b-2 cursor-pointer transition ${activeTab === 'tracker' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-450 hover:text-slate-700'}`}>
          Live Tracker
        </button>
        <button onClick={() => setActiveTab("po")} className={`pb-3 font-bold text-sm tracking-wide border-b-2 cursor-pointer transition ${activeTab === 'po' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-450 hover:text-slate-700'}`}>
          PO Pipeline
        </button>
        <button onClick={() => setActiveTab("vendors")} className={`pb-3 font-bold text-sm tracking-wide border-b-2 cursor-pointer transition ${activeTab === 'vendors' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-450 hover:text-slate-700'}`}>
          Vendor directory
        </button>
        <button onClick={() => setActiveTab("forecast")} className={`pb-3 font-bold text-sm tracking-wide border-b-2 cursor-pointer transition ${activeTab === 'forecast' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-450 hover:text-slate-700'}`}>
          Sales demand Forecaster
        </button>
        <button onClick={() => setActiveTab("qc")} className={`pb-3 font-bold text-sm tracking-wide border-b-2 cursor-pointer transition ${activeTab === 'qc' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-450 hover:text-slate-700'}`}>
          QC & Inward Logging
        </button>
      </div>

      {/* TAB CONTENTS */}
      {loading ? (
        <div className="py-24 text-center text-slate-400 font-bold">Fetching purchase logs...</div>
      ) : (
        <>
          {/* TAB 1: Live Tracker & Charts */}
          {activeTab === "tracker" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Materials Table */}
              <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-900 text-base">Live stock checklist</h3>
                  <button onClick={() => setShowMaterialModal(true)} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-lg transition text-xs font-bold cursor-pointer">
                    <FaPlus /> Add Raw Material
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-100">
                        <th className="p-4">Material Description</th>
                        <th className="p-4">SKU</th>
                        <th className="p-4">Quantity in Hand</th>
                        <th className="p-4">Alert Limit</th>
                        <th className="p-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {filteredMaterials.map(m => {
                        const isLow = m.stock < m.minStockLimit;
                        return (
                          <tr key={m._id} className={`${isLow ? 'bg-rose-50/40 border-l-4 border-l-rose-500' : ''} hover:bg-slate-50/50 transition`}>
                            <td className="p-4">
                              <span className="font-bold text-slate-800 block">{m.name}</span>
                              <span className="text-[10px] text-slate-400 capitalize">{m.unit} scale</span>
                            </td>
                            <td className="p-4 font-mono text-xs text-slate-500">{m.sku}</td>
                            <td className="p-4">
                              <span className={`font-black ${isLow ? 'text-rose-600' : 'text-emerald-600'}`}>{m.stock} {m.unit}</span>
                            </td>
                            <td className="p-4 text-xs font-bold text-slate-400">{m.minStockLimit}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded-md uppercase ${isLow ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                {isLow ? 'Low stock alert' : 'Healthy'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Chart Card */}
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 flex flex-col justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base mb-4">Stock level charts</h3>
                  <div className="h-[280px] w-full relative">
                    <canvas ref={chartRef}></canvas>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl mt-4 text-xs text-slate-500">
                  <FaShieldAlt className="text-indigo-600 inline mr-1.5" /> HDPE & PP values recalculate in real-time when new inward logs occur.
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PO Pipeline (Kanban) */}
          {activeTab === "po" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {["Drafted", "Sent to Vendor", "In Transit", "Received"].map(col => {
                const poList = filteredPOs.filter(p => p.status === col);
                return (
                  <div key={col} className="p-4 bg-slate-100/50 border border-slate-200/60 rounded-2xl flex flex-col gap-4.5 min-h-[460px]">
                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                      <h4 className="font-extrabold text-slate-800 text-sm">{col}</h4>
                      <span className="px-2 py-0.5 text-xs font-black bg-white border border-slate-200 rounded-full text-slate-500">{poList.length}</span>
                    </div>

                    <div className="flex flex-col gap-3.5 overflow-y-auto">
                      {poList.map(po => {
                        let total = po.items.reduce((sum, item) => sum + (item.qty * item.rate), 0);
                        return (
                          <div key={po._id} className="p-4 bg-white border border-slate-150 rounded-xl shadow-sm flex flex-col gap-3 hover:shadow-md transition">
                            <div className="flex justify-between items-center">
                              <span className="font-mono font-extrabold text-indigo-600 text-xs">{po.poNumber}</span>
                              <div className="flex gap-1.5">
                                <button 
                                  onClick={() => { setActivePOPreview(po); setShowPreviewModal(true); }}
                                  className="p-1.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 text-slate-400 rounded-md transition text-xs cursor-pointer"
                                  title="View Invoice"
                                >
                                  <FaFileInvoiceDollar />
                                </button>
                                {po.status === "Drafted" && (
                                  <button onClick={() => changePOStatus(po._id, "Sent to Vendor")} className="p-1.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-600 border border-slate-200 text-slate-400 rounded-md transition text-xs cursor-pointer">➡️</button>
                                )}
                                {po.status === "Sent to Vendor" && (
                                  <button onClick={() => changePOStatus(po._id, "In Transit")} className="p-1.5 bg-slate-50 hover:bg-cyan-50 hover:text-cyan-600 border border-slate-200 text-slate-400 rounded-md transition text-xs cursor-pointer">🚚</button>
                                )}
                                {po.status === "In Transit" && (
                                  <button 
                                    onClick={() => { 
                                      setInwardPOId(po._id);
                                      // pre-fill values
                                      const defaultQty = po.items[0]?.qty || "";
                                      setInwardAccepted(defaultQty);
                                      setActiveTab("qc"); 
                                    }} 
                                    className="p-1.5 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 text-slate-400 rounded-md transition text-xs cursor-pointer"
                                    title="QC Inward"
                                  >
                                    <FaShieldAlt />
                                  </button>
                                )}
                              </div>
                            </div>

                            <div>
                              <span className="font-extrabold text-slate-800 text-sm block truncate">{po.vendor?.name}</span>
                              <span className="text-[10px] text-slate-450 block mt-1">ETA: {new Date(po.expectedDate).toLocaleDateString()}</span>
                            </div>

                            <div className="border-t border-slate-100 pt-2.5 mt-1 flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Total amount:</span>
                              <span className="font-black text-slate-900 text-xs">₹{Math.round(total * 1.18).toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: Vendor CRM Directory */}
          {activeTab === "vendors" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVendors.map(v => {
                let stars = [];
                for (let i = 1; i <= 5; i++) {
                  stars.push(
                    <FaStar key={i} className={i <= Math.floor(v.rating) ? 'text-amber-400' : 'text-slate-200'} />
                  );
                }
                return (
                  <div key={v._id} className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition">
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-4">
                        <div>
                          <h4 className="font-black text-slate-800 text-base">{v.name}</h4>
                          <span className="px-2 py-0.5 text-[9px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-md inline-block mt-1">Authorized Supplier</span>
                        </div>
                        <div className="flex text-sm mt-1">{stars}</div>
                      </div>

                      <div className="space-y-2 border-b border-slate-100 pb-4 mb-4 text-xs text-slate-500">
                        <div className="flex items-center gap-2"><FaPhoneAlt className="text-slate-400" /> {v.phone}</div>
                        <div className="flex items-center gap-2"><FaEnvelope className="text-slate-400" /> {v.email}</div>
                        <div className="flex items-center gap-2"><FaUniversity className="text-slate-400" /> <span className="font-mono text-[11px]">{v.bank}</span></div>
                      </div>
                    </div>

                    <div>
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl mb-4">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase block mb-1">Contract rate card</span>
                        <div className="flex justify-between text-xs">
                          <span className="font-bold text-slate-700">{v.mainMaterial}</span>
                          <span className="font-extrabold text-indigo-600">₹{v.contractRate} / unit</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <button onClick={() => handleNegotiateRate(v._id, v.contractRate)} className="flex items-center justify-center gap-1.5 py-2 border border-slate-250 hover:bg-slate-50 rounded-xl text-xs font-extrabold text-slate-600 transition cursor-pointer">
                          <FaHistory /> Rate card
                        </button>
                        <button 
                          onClick={() => {
                            setPOVendorId(v._id);
                            // Prepopulate first items list
                            const matchingMaterial = materials.find(m => m.name.toLowerCase().includes(v.mainMaterial.toLowerCase()) || v.mainMaterial.toLowerCase().includes(m.name.toLowerCase()));
                            setPOItems([{ materialId: matchingMaterial?._id || "", qty: 10, rate: v.contractRate }]);
                            setShowPOModal(true);
                          }} 
                          className="flex items-center justify-center gap-1.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold transition shadow-sm cursor-pointer"
                        >
                          <FaPlus /> Dispatched PO
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Register Vendor Button Card */}
              <div 
                onClick={() => setShowVendorModal(true)}
                className="bg-slate-50 hover:bg-slate-100/50 border border-dashed border-slate-250 rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer min-h-[250px] transition"
              >
                <div className="w-12 h-12 bg-white rounded-full border border-slate-200 flex items-center justify-center text-indigo-600 text-xl shadow-sm mb-3">
                  <FaPlus />
                </div>
                <h4 className="font-black text-slate-800 text-sm">Register new supplier</h4>
                <p className="text-xs text-slate-400 max-w-[200px] mt-1">Register new raw material rates and contract cards.</p>
              </div>
            </div>
          )}

          {/* TAB 4: Sales Forecaster & Dead Stock */}
          {activeTab === "forecast" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Upcoming Demand Cards */}
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
                <h3 className="font-extrabold text-slate-900 text-base mb-1">⚡ High Demand production requirements</h3>
                <p className="text-xs text-slate-400 mb-4">Direct manufacturing queue connectivity. Check supply feasibility.</p>

                {upcomingJobs.length === 0 ? (
                  <div className="py-12 border border-dashed rounded-xl border-slate-200 text-center text-slate-400 text-xs">
                    No upcoming manufacturing demands pending production.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingJobs.map(job => {
                      // Simple stock check logic
                      const matchingMat = materials.find(m => m.name.toLowerCase().includes(job.materialType.toLowerCase()));
                      const hasSufficient = matchingMat && matchingMat.stock > 10;
                      
                      return (
                        <div key={job._id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between gap-4">
                          <div>
                            <span className="font-mono text-[10px] font-extrabold text-indigo-600 block">{job.jobCode}</span>
                            <span className="font-bold text-slate-800 text-xs block mt-0.5">Laser sheet: {job.thickness}mm {job.materialType}</span>
                            <span className="text-[10px] text-slate-450 block mt-1">Operator Notes: {job.operatorNotes || 'Normal production processing'}</span>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-0.5 text-[9px] font-bold border rounded-md uppercase ${hasSufficient ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                              {hasSufficient ? 'Stock Ready' : 'Low Stock Warning'}
                            </span>
                            <button 
                              onClick={() => handleSimulateDeduction(job._id)} 
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black uppercase transition cursor-pointer"
                            >
                              Complete Sim
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right: Dead Stock & Scrap Analytics */}
              <div className="space-y-6">
                <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
                  <h3 className="font-extrabold text-slate-900 text-base mb-1">📦 Dead Stock Analytics</h3>
                  <p className="text-xs text-slate-400 mb-4">Stock materials sitting idle for more than 90 days.</p>

                  <div className="space-y-4">
                    <div className="p-4 bg-rose-50/40 border border-rose-100 rounded-xl flex justify-between items-center">
                      <div>
                        <strong className="text-xs text-rose-900 block">0.5mm Clear PVC Sheet</strong>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Idle: 120 days ago</span>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-xs text-rose-600 block">₹55,000 idle value</span>
                        <span className="px-2 py-0.5 text-[8px] bg-rose-100 text-rose-700 font-extrabold rounded mt-1.5 inline-block uppercase">Promote clearance discount</span>
                      </div>
                    </div>

                    <div className="p-4 bg-amber-50/40 border border-amber-100 rounded-xl flex justify-between items-center">
                      <div>
                        <strong className="text-xs text-amber-900 block">Double-sided foam tape</strong>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Idle: 95 days ago</span>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-xs text-amber-600 block">₹12,000 idle value</span>
                        <span className="px-2 py-0.5 text-[8px] bg-amber-100 text-amber-700 font-extrabold rounded mt-1.5 inline-block uppercase">Substitute in factory A</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Scrap Registry */}
                <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
                  <h3 className="font-extrabold text-slate-900 text-base mb-1">♻️ Leftover Scrap Registry</h3>
                  <p className="text-xs text-slate-400 mb-4">Live off-cut inventory logged by machine operators for upcycling.</p>

                  {scraps.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No scrap sheets currently registered.</p>
                  ) : (
                    <div className="space-y-3">
                      {scraps.map(sc => (
                        <div key={sc._id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex justify-between items-center text-xs">
                          <div>
                            <strong className="text-slate-800 block">{sc.thickness} {sc.material} Scrap</strong>
                            <span className="text-[10px] text-slate-400 block mt-0.5">Size: {sc.size}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-indigo-600 block">Qty: {sc.qty}</span>
                            <span className="text-[9px] text-slate-400 mt-0.5 block">Status: Available</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: QC Inwarding & Damaged Credit Notes */}
          {activeTab === "qc" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Log Inward form */}
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
                <h3 className="font-extrabold text-slate-900 text-base mb-4">Log Incoming Shipment & QC Check</h3>
                
                <form onSubmit={handleQCInwardSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-450 mb-1">Select Transit PO *</label>
                    <select 
                      value={inwardPOId}
                      onChange={(e) => {
                        setInwardPOId(e.target.value);
                        const selectedPo = pos.find(p => p._id === e.target.value);
                        if (selectedPo) {
                          setInwardAccepted(selectedPo.items[0]?.qty || "");
                        }
                      }}
                      required
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="">-- Choose Active PO --</option>
                      {pos.filter(p => p.status === "In Transit" || p.status === "Sent to Vendor").map(p => (
                        <option key={p._id} value={p._id}>{p.poNumber} - {p.vendor?.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-450 mb-1">Accepted quantity *</label>
                      <input 
                        type="number" 
                        required 
                        min="1"
                        placeholder="Passed QC check"
                        value={inwardAccepted}
                        onChange={(e) => setInwardAccepted(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-450 mb-1">Damaged / Rejected quantity</label>
                      <input 
                        type="number" 
                        required 
                        min="0"
                        placeholder="Failed QC (creates Debit Note)"
                        value={inwardDamaged}
                        onChange={(e) => setInwardDamaged(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-450 mb-1">Delivery challan invoice number *</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. CH-2384"
                      value={inwardChallan}
                      onChange={(e) => setInwardChallan(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-450 mb-1">Inspection Notes</label>
                    <textarea 
                      placeholder="Note physical damage or quality remarks..."
                      rows="3"
                      value={inwardNotes}
                      onChange={(e) => setInwardNotes(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
                    ></textarea>
                  </div>

                  <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl transition text-xs shadow-md shadow-indigo-600/10 cursor-pointer">
                    Log QC inward & Update stock
                  </button>
                </form>
              </div>

              {/* Credit note register */}
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
                <h3 className="font-extrabold text-slate-900 text-base mb-1">🛡️ Damaged Return Credit Notes</h3>
                <p className="text-xs text-slate-400 mb-4">Registry of issued credit adjustments against supplier damage logs.</p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-100">
                        <th className="p-3">Credit Note ID</th>
                        <th className="p-3">Vendor</th>
                        <th className="p-3">Material</th>
                        <th className="p-3">Credit Value</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {creditNotes.length === 0 ? (
                        <tr><td colSpan="5" className="p-6 text-center text-slate-400 italic">No credit notes recorded.</td></tr>
                      ) : (
                        creditNotes.map(cn => (
                          <tr key={cn._id} className="hover:bg-slate-50/50 transition">
                            <td className="p-3 font-mono font-extrabold text-indigo-600">{cn.creditNoteId}</td>
                            <td className="p-3 font-bold">{cn.vendor?.name}</td>
                            <td className="p-3">{cn.materialName}</td>
                            <td className="p-3 font-black text-rose-600">₹{cn.value.toLocaleString('en-IN')}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 text-[8px] bg-amber-100 text-amber-700 font-extrabold rounded-md uppercase">
                                {cn.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ----------------------------------------------------
         MODALS RENDERING
      ---------------------------------------------------- */}

      {/* 1. Add Material Modal */}
      {showMaterialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Register raw material SKU</h3>
            <form onSubmit={handleCreateMaterial} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-450 mb-1">Material Name *</label>
                <input 
                  type="text" required placeholder="e.g. 1.5mm PP Sheet Roll" 
                  value={matName} onChange={(e) => setMatName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-450 mb-1">SKU *</label>
                  <input 
                    type="text" required placeholder="e.g. MAT-PP-15MM" 
                    value={matSku} onChange={(e) => setMatSku(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-450 mb-1">Unit *</label>
                  <select 
                    value={matUnit} onChange={(e) => setMatUnit(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 bg-white rounded-xl focus:outline-none text-slate-800 text-xs"
                  >
                    <option value="rolls">rolls</option>
                    <option value="sheets">sheets</option>
                    <option value="kg">kg</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-450 mb-1">Initial Stock</label>
                  <input 
                    type="number" min="0" placeholder="e.g. 10" 
                    value={matStock} onChange={(e) => setMatStock(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-450 mb-1">Min Alert Limit</label>
                  <input 
                    type="number" min="1" placeholder="e.g. 5" 
                    value={matMin} onChange={(e) => setMatMin(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2.5">
                <button type="button" onClick={() => setShowMaterialModal(false)} className="px-4.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold rounded-xl cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl cursor-pointer">Register Material</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Register Supplier Modal */}
      {showVendorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Register new supplier</h3>
            <form onSubmit={handleCreateVendor} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-450 mb-1">Supplier Name *</label>
                <input 
                  type="text" required placeholder="e.g. Super HDPE Polymers Ltd." 
                  value={vName} onChange={(e) => setVName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-450 mb-1">Contact Phone *</label>
                  <input 
                    type="text" required placeholder="e.g. +91 9876543210" 
                    value={vPhone} onChange={(e) => setVPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-450 mb-1">Email *</label>
                  <input 
                    type="email" required placeholder="e.g. sales@vendor.com" 
                    value={vEmail} onChange={(e) => setVEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-450 mb-1">UPI ID or bank account details *</label>
                <input 
                  type="text" required placeholder="e.g. vendor@okaxis" 
                  value={vBank} onChange={(e) => setVBank(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-450 mb-1">Primary Material *</label>
                  <input 
                    type="text" required placeholder="e.g. HDPE Sheets" 
                    value={vMaterial} onChange={(e) => setVMaterial(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-450 mb-1">Contract rate *</label>
                  <input 
                    type="number" required placeholder="₹ Contract Price" 
                    value={vRate} onChange={(e) => setVRate(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2.5">
                <button type="button" onClick={() => setShowVendorModal(false)} className="px-4.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold rounded-xl cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl cursor-pointer">Register Supplier</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Create PO Modal */}
      {showPOModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Generate Purchase Order (PO)</h3>
            <form onSubmit={handleCreatePO} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-450 mb-1">Select Supplier *</label>
                  <select 
                    value={poVendorId} onChange={(e) => setPOVendorId(e.target.value)} required
                    className="w-full px-3.5 py-2.5 border border-slate-200 bg-white rounded-xl focus:outline-none text-slate-800 text-xs"
                  >
                    <option value="">-- Choose Vendor --</option>
                    {vendors.map(v => (
                      <option key={v._id} value={v._id}>{v.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-450 mb-1">Expected Delivery Date *</label>
                  <input 
                    type="date" required 
                    value={poExpectedDate} onChange={(e) => setPOExpectedDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Dynamic items selection */}
              <div className="space-y-3.5">
                <span className="text-[10px] font-black uppercase text-slate-450 block">Procurement items</span>
                {poItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-3 gap-3 items-center">
                    <select 
                      value={item.materialId}
                      onChange={(e) => {
                        const copy = [...poItems];
                        copy[index].materialId = e.target.value;
                        const mat = materials.find(m => m._id === e.target.value);
                        // set default rate mapping standard rate
                        copy[index].rate = mat ? (mat.minStockLimit > 5 ? 5000 : 180) : 0;
                        setPOItems(copy);
                      }}
                      required
                      className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl focus:outline-none text-slate-850 text-xs"
                    >
                      <option value="">-- Material --</option>
                      {materials.map(m => (
                        <option key={m._id} value={m._id}>{m.name}</option>
                      ))}
                    </select>
                    
                    <input 
                      type="number" required placeholder="Qty" min="1"
                      value={item.qty}
                      onChange={(e) => {
                        const copy = [...poItems];
                        copy[index].qty = e.target.value;
                        setPOItems(copy);
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none text-slate-800 font-bold text-xs"
                    />

                    <span className="font-extrabold text-slate-500 text-right pr-4 text-xs">
                      ₹{(item.rate * (Number(item.qty) || 0)).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2.5 border-t border-slate-100">
                <button type="button" onClick={() => setShowPOModal(false)} className="px-4.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold rounded-xl cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl cursor-pointer shadow-md shadow-indigo-600/10">Dispatch PO</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. PO Detail & Preview Modal */}
      {showPreviewModal && activePOPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-100 overflow-y-auto max-h-[90%]">
            <div className="flex justify-between items-center mb-6 no-print border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-800 text-base">Purchase Order Preview</h3>
              <button onClick={() => setShowPreviewModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer">&times;</button>
            </div>

            {/* Print Container */}
            <div className="p-6 border border-slate-200 rounded-xl bg-white text-slate-800 font-sans text-xs" id="printable-po">
              <div className="flex justify-between items-start gap-4 mb-6">
                <div>
                  <h2 className="text-sm font-black text-slate-900 tracking-wider">SONANI ELECTRONICS PVT LTD</h2>
                  <p className="text-[10px] text-slate-400 mt-1">Plot 45, GIDC Industrial Estate, Surat, Gujarat</p>
                  <p className="text-[10px] text-slate-400">GSTIN: 24AAACS9842F1Z4</p>
                </div>
                <div className="text-right">
                  <h1 className="text-lg font-black text-indigo-600 uppercase tracking-widest">Purchase Order</h1>
                  <p className="text-[10px] mt-1"><strong>PO #:</strong> {activePOPreview.poNumber}</p>
                  <p className="text-[10px]"><strong>Date:</strong> {new Date(activePOPreview.createdDate).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-100 py-4 mb-6">
                <div>
                  <h5 className="font-bold text-slate-400 uppercase text-[9px] mb-1">Vendor / Supplier</h5>
                  <p className="font-bold text-slate-800">{activePOPreview.vendor?.name}</p>
                  <p className="text-slate-450 mt-0.5">Phone: {activePOPreview.vendor?.phone}</p>
                  <p className="text-slate-450">Email: {activePOPreview.vendor?.email}</p>
                </div>
                <div>
                  <h5 className="font-bold text-slate-400 uppercase text-[9px] mb-1">Delivery Address</h5>
                  <p className="font-bold text-slate-800">Sonani Warehouse Wing A</p>
                  <p className="text-slate-450 mt-0.5">GIDC Industrial Sector, Surat</p>
                  <p className="text-slate-450">Expected ETA: {new Date(activePOPreview.expectedDate).toLocaleDateString()}</p>
                </div>
              </div>

              <table className="w-full text-left border-collapse mb-6">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500">
                    <th className="p-3">Item Name</th>
                    <th className="p-3 text-right">Quantity</th>
                    <th className="p-3 text-right">Contract Rate</th>
                    <th className="p-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activePOPreview.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-3 font-bold">{it.materialId?.name || 'Raw Material'}</td>
                      <td className="p-3 text-right">{it.qty}</td>
                      <td className="p-3 text-right">₹{it.rate.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right font-bold">₹{(it.qty * it.rate).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end mb-6">
                <div className="w-[200px] space-y-2 border-t border-slate-100 pt-3">
                  <div className="flex justify-between">
                    <span className="text-slate-450 text-[10px]">Subtotal:</span>
                    <span className="font-bold text-slate-800">₹{activePOPreview.items.reduce((s,i)=>s+(i.qty*i.rate),0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-450 text-[10px]">Tax (GST 18%):</span>
                    <span className="font-bold text-slate-850">₹{Math.round(activePOPreview.items.reduce((s,i)=>s+(i.qty*i.rate),0)*0.18).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2 font-black text-slate-900 text-sm">
                    <span>Total Amount:</span>
                    <span>₹{Math.round(activePOPreview.items.reduce((s,i)=>s+(i.qty*i.rate),0)*1.18).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-[9px] text-slate-400">
                <strong>Important:</strong> Material subject to quality check upon receipt at Sonani Warehouse. Damaged units will reject and trigger automatic debit returns.
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2.5 mt-5 no-print">
              <button 
                onClick={() => triggerWhatsAppPO(activePOPreview)} 
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                <FaWhatsapp /> Share via WhatsApp
              </button>
              <button 
                onClick={() => window.print()} 
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                <FaPrint /> Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminMaterials;

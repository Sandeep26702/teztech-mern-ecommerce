import { useState, useEffect } from "react";
import { 
  FaIndustry, FaPlayCircle, FaCheckCircle, FaCloudDownloadAlt, 
  FaExclamationTriangle, FaSearch, FaTools, FaCheck, FaPlus, 
  FaClock, FaSpinner, FaTools as FaWrench, FaThermometerHalf, FaEnvelopeOpenText 
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import api from "../../utils/api";

const AdminJobCards = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Awaiting Production");
  const [searchQuery, setSearchQuery] = useState("");
  const [isBreakdownMode, setIsBreakdownMode] = useState(false);

  // Operator Notes & Scrap Handoff Modal
  const [selectedJob, setSelectedJob] = useState(null);
  const [operatorNotes, setOperatorNotes] = useState("");
  
  // Scrap Logging state
  const [hasScrap, setHasScrap] = useState(false);
  const [scrapSize, setScrapSize] = useState("");
  const [scrapQty, setScrapQty] = useState("1");
  const [scrapPrice, setScrapPrice] = useState("50");
  
  const [completing, setCompleting] = useState(false);

  // Active workbench checkboxes
  const [checklist, setChecklist] = useState({
    thickness: false,
    polymer: false,
    svgLoaded: false
  });

  // Maintenance Log State
  const [maintenanceDone, setMaintenanceDone] = useState({
    lensCleaned: false,
    tubeDusted: false,
    waterChecked: false
  });

  // Consumable Request State
  const [partName, setPartName] = useState("");
  const [partQty, setPartQty] = useState("1");
  const [submittingPartRequest, setSubmittingPartRequest] = useState(false);

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
      // 1. If leftover scrap is present, log it to backend `/api/scrap`
      if (hasScrap && scrapSize) {
        await api.post("/scrap", {
          material: selectedJob.materialType,
          size: scrapSize,
          thickness: `${selectedJob.thickness}mm`,
          qty: Number(scrapQty),
          price: Number(scrapPrice)
        });
        toast.success("Leftover scrap logged to upcycle directory!");
      }

      // 2. Complete laser job on backend
      const res = await api.put(`/job-cards/${selectedJob._id}/complete`, { 
        operatorNotes: `${operatorNotes}${hasScrap ? ` | Scrap leftover: ${scrapSize}` : ""}` 
      });

      if (res.data.success) {
        toast.success("Laser cutting complete! Order handoff to Packing Team.");
        setSelectedJob(null);
        setOperatorNotes("");
        setHasScrap(false);
        setScrapSize("");
        setScrapQty("1");
        setChecklist({ thickness: false, polymer: false, svgLoaded: false });
        fetchJobs();
      }
    } catch (err) {
      toast.error("Failed to complete laser job");
    } finally {
      setCompleting(false);
    }
  };

  // Triggers breakdown stop notification to Sales and Admin
  const handleBreakdownAlert = async () => {
    try {
      // Toggle local breakdown state
      const nextMode = !isBreakdownMode;
      setIsBreakdownMode(nextMode);

      if (nextMode) {
        // Post breakdown notification
        await api.post("/notifications", {
          recipientRole: "sales team",
          text: "⚠️ CRITICAL BREAKDOWN ALERT: Laser machine is currently DOWN for emergency breakdown stop. Adjust sales order delivery ETAs accordingly."
        });
        await api.post("/notifications", {
          recipientRole: "admin",
          text: "🚨 MACHINE FAILURE ALERT: Laser cutter reported emergency breakdown stop. Operator requires immediate maintenance check."
        });
        toast.error("Emergency Breakdown active! Sales and Admin notified.");
      } else {
        toast.success("Machine status reset to Active.");
      }
    } catch (err) {
      toast.error("Failed to dispatch breakdown notification");
    }
  };

  // Submit consumable request to Purchase Team
  const handleConsumableRequest = async (e) => {
    e.preventDefault();
    if (!partName) return;
    setSubmittingPartRequest(true);
    try {
      await api.post("/notifications", {
        recipientRole: "purchase",
        text: `🔧 PARTS REQUEST: Machine Operator requested ${partQty} x "${partName}" parts for laser machine maintenance.`
      });
      toast.success("Consumables parts request routed to Purchase Team!");
      setPartName("");
      setPartQty("1");
    } catch (err) {
      toast.error("Failed to dispatch parts request");
    } finally {
      setSubmittingPartRequest(false);
    }
  };

  // Search filter
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = 
      job.jobCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.order?.orderCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.materialType?.toLowerCase().includes(searchQuery.toLowerCase());
    return job.status === activeTab && matchesSearch;
  });

  // Sort queue: Urgent orders at the top
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    const aUrgent = a.order?.orderNotes?.toLowerCase().includes("urgent") || a.operatorNotes?.toLowerCase().includes("urgent") ? 1 : 0;
    const bUrgent = b.order?.orderNotes?.toLowerCase().includes("urgent") || b.operatorNotes?.toLowerCase().includes("urgent") ? 1 : 0;
    return bUrgent - aUrgent;
  });

  // Calculate metrics
  const getMetrics = () => {
    const pending = jobs.filter(j => j.status === "Awaiting Production").length;
    
    // Completed today helper check:
    const completedToday = jobs.filter(j => {
      if (j.status !== "Completed" || !j.completedAt) return false;
      const compDate = new Date(j.completedAt).toDateString();
      const todayDate = new Date().toDateString();
      return compDate === todayDate;
    }).length;

    // Active productivity runtime mock
    const activeTime = jobs.filter(j => j.status === "In Production").length * 1.5 + completedToday * 0.8;

    return { pending, completedToday, activeTime: activeTime.toFixed(1) };
  };

  const metrics = getMetrics();
  const activeWorkbenchJob = jobs.find(j => j.status === "In Production");

  return (
    <div className="p-6 bg-slate-50 min-h-screen text-slate-800 font-sans">
      
      {/* 1. Header & BreakdownStop */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            <FaIndustry className="text-indigo-600" /> Operator Laser Queue
          </h1>
          <p className="text-slate-500 text-sm mt-1">Operator: <strong>Sunil Kumar</strong> | Shift: <strong>Morning (06:00 AM - 02:00 PM)</strong></p>
        </div>

        {/* Emergency Stop Break Down button */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            <input 
              type="text" 
              placeholder="Search Job ID or Order..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs w-[200px]"
            />
          </div>
          <button 
            onClick={handleBreakdownAlert}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-extrabold text-xs shadow-md transition cursor-pointer ${isBreakdownMode ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20 animate-pulse' : 'bg-red-600 hover:bg-red-700 shadow-red-600/20'}`}
          >
            <FaExclamationTriangle />
            {isBreakdownMode ? "Reset Machine Status" : "Emergency Stop / Breakdown"}
          </button>
        </div>
      </div>

      {/* Breakdown Stop Warning Banner */}
      {isBreakdownMode && (
        <div className="p-4.5 bg-red-50 border border-red-200 rounded-2xl mb-6 flex items-start gap-3.5 animate-pulse">
          <div className="w-10 h-10 bg-red-100 border border-red-200 text-red-600 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
            <FaExclamationTriangle />
          </div>
          <div>
            <h4 className="font-bold text-red-950 text-sm">CRITICAL DOWNTIME ACTIVE</h4>
            <p className="text-xs text-red-700 mt-1">
              Laser Cutter is locked in emergency breakdown/maintenance downtime mode. Sales and Admin are notified.
            </p>
          </div>
        </div>
      )}

      {/* 2. Dashboard Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="p-5 bg-white border border-slate-100 shadow-sm rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl flex-shrink-0"><FaClock /></div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Pending Manufacturers</span>
            <span className="text-2xl font-black text-slate-900 block mt-0.5">{metrics.pending}</span>
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-100 shadow-sm rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl flex-shrink-0"><FaCheck /></div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Completed Today</span>
            <span className="text-2xl font-black text-slate-900 block mt-0.5">{metrics.completedToday}</span>
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-100 shadow-sm rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center text-xl flex-shrink-0"><FaThermometerHalf /></div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Laser Machine Run time</span>
            <span className="text-2xl font-black text-slate-900 block mt-0.5">{metrics.activeTime} Hrs</span>
          </div>
        </div>
      </div>

      {/* 3. Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns: Production Queue Tabs & Cards list */}
        <div className="lg:col-span-2 space-y-5">
          
          {/* Stage tab selectors */}
          <div className="flex border-b border-slate-200 gap-6">
            {["Awaiting Production", "In Production", "Completed"].map(status => (
              <button 
                key={status} 
                onClick={() => setActiveTab(status)} 
                className={`pb-3 font-bold text-sm tracking-wide border-b-2 cursor-pointer transition ${activeTab === status ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
              >
                {status} ({jobs.filter(j => j.status === status).length})
              </button>
            ))}
          </div>

          {/* Cards List */}
          {loading ? (
            <div className="py-16 text-center text-slate-400 font-bold">Syncing laser queue...</div>
          ) : sortedJobs.length === 0 ? (
            <div className="py-16 text-center text-slate-400 border border-dashed rounded-2xl border-slate-200 bg-white">
              No manufacturers in this stage.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {sortedJobs.map(job => {
                const isUrgent = job.order?.orderNotes?.toLowerCase().includes("urgent");
                
                return (
                  <div key={job._id} className={`bg-white border p-5 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md transition ${isUrgent ? 'border-rose-250 bg-rose-50/20' : 'border-slate-100'}`}>
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="font-mono text-xs font-black text-indigo-600 block">{job.jobCode}</span>
                          <span className="text-[10px] text-slate-400 block mt-1">Order Ref: {job.order?.orderCode}</span>
                        </div>
                        {isUrgent && (
                          <span className="px-2 py-0.5 text-[9px] font-black bg-rose-100 text-rose-700 border border-rose-200 rounded-md uppercase animate-pulse">
                            Urgent
                          </span>
                        )}
                      </div>

                      <div className="mt-4 space-y-2 border-b border-slate-100 pb-3 mb-3 text-xs text-slate-650">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Material Type:</span>
                          <strong className="text-slate-800">{job.materialType}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Thickness limit:</span>
                          <strong className="text-slate-800">{job.thickness} mm</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Target Customer:</span>
                          <span className="font-semibold text-slate-700 truncate max-w-[120px]">{job.order?.shippingInfo?.fullName}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      {job.optimizedSvgUrl && (
                        <a 
                          href={job.optimizedSvgUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center justify-center gap-1.5 w-full py-2 bg-indigo-50 border border-indigo-100 hover:bg-indigo-600 hover:text-white text-indigo-600 rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          <FaCloudDownloadAlt /> Download Cut Design File
                        </a>
                      )}

                      {job.status === "Awaiting Production" && (
                        <button 
                          onClick={() => handleStartLaser(job._id)} 
                          className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition cursor-pointer"
                        >
                          <FaPlayCircle /> Start Laser Machine
                        </button>
                      )}

                      {job.status === "In Production" && (
                        <button 
                          onClick={() => setSelectedJob(job)} 
                          className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition cursor-pointer"
                        >
                          <FaCheckCircle /> Mark Cutting Done
                        </button>
                      )}

                      {job.status === "Completed" && (
                        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-500 italic">
                          <strong>Completed remarks:</strong>
                          <p className="mt-1">"{job.operatorNotes || 'Laser cutting completed perfectly'}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Columns: Active Workbench & Maintenance log */}
        <div className="space-y-6">
          
          {/* Active Job Panel (Workbench) */}
          <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5">
            <h3 className="font-extrabold text-slate-900 text-base mb-1">⚡ Workbench (Active cutting job)</h3>
            <p className="text-xs text-slate-400 mb-4">Operator checklist verification for active production parameters.</p>

            {activeWorkbenchJob ? (
              <div className="space-y-4">
                <div className="p-4 bg-indigo-50/40 border border-indigo-100 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-mono text-xs font-black text-indigo-600">{activeWorkbenchJob.jobCode}</span>
                    <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded-full animate-pulse uppercase">In Production</span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">Sheet: {activeWorkbenchJob.thickness}mm {activeWorkbenchJob.materialType}</h4>
                  <p className="text-[11px] text-slate-450 mt-1">Customer Order: {activeWorkbenchJob.order?.orderCode}</p>
                </div>

                <div className="space-y-2 text-xs">
                  <span className="text-[10px] font-black uppercase text-slate-450 block mb-1">Verification checklist</span>
                  <label className="flex items-center gap-2.5 p-2 border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-slate-50 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={checklist.thickness} 
                      onChange={(e) => setChecklist(prev => ({ ...prev, thickness: e.target.checked }))}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500/20"
                    />
                    <span>Sheet thickness is <strong>{activeWorkbenchJob.thickness}mm</strong></span>
                  </label>
                  <label className="flex items-center gap-2.5 p-2 border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-slate-50 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={checklist.polymer} 
                      onChange={(e) => setChecklist(prev => ({ ...prev, polymer: e.target.checked }))}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500/20"
                    />
                    <span>Material type is <strong>{activeWorkbenchJob.materialType}</strong></span>
                  </label>
                  <label className="flex items-center gap-2.5 p-2 border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-slate-50 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={checklist.svgLoaded} 
                      onChange={(e) => setChecklist(prev => ({ ...prev, svgLoaded: e.target.checked }))}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500/20"
                    />
                    <span>SVG file loaded in laser machine</span>
                  </label>
                </div>

                <button 
                  onClick={() => setSelectedJob(activeWorkbenchJob)}
                  disabled={!(checklist.thickness && checklist.polymer && checklist.svgLoaded)}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-extrabold rounded-xl text-xs transition cursor-pointer shadow-sm shadow-emerald-600/10"
                >
                  <FaCheckCircle /> Mark Workbench Job Done
                </button>
              </div>
            ) : (
              <div className="py-12 border border-dashed rounded-xl border-slate-200 text-center text-slate-400 text-xs">
                No active production manufacturer on workbench. Start a manufacturer from the queue list.
              </div>
            )}
          </div>

          {/* Maintenance & Consumables Log */}
          <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5 space-y-6">
            
            {/* End of Shift Maintenance Checklist */}
            <div>
              <h3 className="font-extrabold text-slate-900 text-base mb-1">🔧 Maintenance Log</h3>
              <p className="text-xs text-slate-400 mb-3.5">End-of-shift checklist for laser machine optics and health.</p>

              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2.5 p-2 border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-slate-50 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={maintenanceDone.lensCleaned} 
                    onChange={(e) => setMaintenanceDone(prev => ({ ...prev, lensCleaned: e.target.checked }))}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500/20"
                  />
                  <span>Cleaned laser focus lens & mirror</span>
                </label>
                <label className="flex items-center gap-2.5 p-2 border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-slate-50 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={maintenanceDone.tubeDusted} 
                    onChange={(e) => setMaintenanceDone(prev => ({ ...prev, tubeDusted: e.target.checked }))}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500/20"
                  />
                  <span>Cleaned laser tube dust/carbon soot</span>
                </label>
                <label className="flex items-center gap-2.5 p-2 border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-slate-50 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={maintenanceDone.waterChecked} 
                    onChange={(e) => setMaintenanceDone(prev => ({ ...prev, waterChecked: e.target.checked }))}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500/20"
                  />
                  <span>Checked chiller water levels & temp</span>
                </label>
              </div>
              
              <button 
                onClick={() => {
                  if (maintenanceDone.lensCleaned && maintenanceDone.tubeDusted && maintenanceDone.waterChecked) {
                    toast.success("Maintenance log recorded in shift registry!");
                    setMaintenanceDone({ lensCleaned: false, tubeDusted: false, waterChecked: false });
                  } else {
                    toast.error("Please complete all cleaning check items first!");
                  }
                }}
                className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold rounded-xl transition mt-3 cursor-pointer"
              >
                Log Shift Maintenance Done
              </button>
            </div>

            {/* Consumable Request Form */}
            <div className="border-t border-slate-100 pt-5">
              <h4 className="font-extrabold text-slate-800 text-sm mb-1">✉️ Request Consumables Parts</h4>
              <p className="text-xs text-slate-450 mb-3.5">Request replacement mirrors, nozzles, or chiller gas directly to purchase team.</p>

              <form onSubmit={handleConsumableRequest} className="space-y-3.5 text-xs">
                <div>
                  <select 
                    value={partName} 
                    onChange={(e) => setPartName(e.target.value)} 
                    required
                    className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-slate-800 text-xs"
                  >
                    <option value="">-- Choose Part/Material --</option>
                    <option value="Focusing Lens 2.0 Inch">Focusing Lens 2.0 Inch</option>
                    <option value="Copper Laser Nozzle 1.5mm">Copper Laser Nozzle 1.5mm</option>
                    <option value="Distilled Water 20L">Distilled Water 20L</option>
                    <option value="Co2 Gas Canister Refill">Co2 Gas Canister Refill</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    min="1" 
                    value={partQty} 
                    onChange={(e) => setPartQty(e.target.value)} 
                    required
                    className="w-20 px-3 py-2 border border-slate-200 rounded-xl text-slate-800 font-bold"
                    placeholder="Qty"
                  />
                  <button 
                    type="submit" 
                    disabled={submittingPartRequest}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold transition cursor-pointer text-center"
                  >
                    {submittingPartRequest ? "Sending..." : "Submit request"}
                  </button>
                </div>
              </form>
            </div>

          </div>

        </div>

      </div>

      {/* 4. Leftover / Scrap Entry & Quality Check Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white p-6 rounded-3xl w-full max-w-md shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-extrabold text-slate-900">Mark cutting complete</h3>
              <button onClick={() => { setSelectedJob(null); setOperatorNotes(""); setHasScrap(false); }} className="text-slate-400 hover:text-slate-600 font-bold">&times;</button>
            </div>
            
            <form onSubmit={handleCompleteLaser} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-450 mb-1">Operator comments / Laser logs</label>
                <textarea 
                  placeholder="e.g., Common line cutting completed, sheet thickness verified." 
                  rows="3" 
                  value={operatorNotes}
                  onChange={(e) => setOperatorNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                ></textarea>
              </div>

              {/* Scrap Question block */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                <span className="text-[10px] font-black uppercase text-slate-450 block mb-2">Smart Inventory: Leftover Off-cut?</span>
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                  <input 
                    type="checkbox" 
                    checked={hasScrap} 
                    onChange={(e) => setHasScrap(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500/20 rounded"
                  />
                  <span className="text-slate-750">Yes, leftover scrap material is remaining</span>
                </label>

                {hasScrap && (
                  <div className="space-y-3 mt-3 pt-3 border-t border-slate-200/60 animate-fade-in">
                    <div>
                      <label className="block text-[9px] font-black uppercase text-slate-450 mb-1">Off-cut size dimensions *</label>
                      <input 
                        type="text" 
                        required={hasScrap} 
                        placeholder="e.g. 250mm x 350mm" 
                        value={scrapSize} 
                        onChange={(e) => setScrapSize(e.target.value)}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-black uppercase text-slate-450 mb-1">Quantity *</label>
                        <input 
                          type="number" 
                          required={hasScrap} 
                          min="1" 
                          value={scrapQty} 
                          onChange={(e) => setScrapQty(e.target.value)}
                          className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black uppercase text-slate-450 mb-1">Estimated contract rate (₹) *</label>
                        <input 
                          type="number" 
                          required={hasScrap} 
                          min="0" 
                          value={scrapPrice} 
                          onChange={(e) => setScrapPrice(e.target.value)}
                          className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 font-bold"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => { setSelectedJob(null); setOperatorNotes(""); setHasScrap(false); }} className="px-4.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold rounded-xl cursor-pointer">Cancel</button>
                <button type="submit" disabled={completing} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer shadow-emerald-600/10">
                  {completing ? <FaSpinner className="animate-spin inline mr-1" /> : <FaCheckCircle className="inline mr-1" />} Handoff to Packing
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

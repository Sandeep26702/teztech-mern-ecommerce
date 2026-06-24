import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaSearch, FaPlus, FaBell, FaUser, FaCheck, FaTimes, FaWhatsapp,
  FaCopy, FaDownload, FaSyncAlt, FaFileAlt, FaCalculator,
  FaFilePdf, FaImage, FaVideo, FaExclamationTriangle, FaBoxes,
  FaComments, FaAddressCard, FaInfoCircle, FaClipboardList, FaTruck,
  FaUserTag, FaTrophy, FaTools, FaCloudUploadAlt, FaHistory,
  FaChevronRight, FaPaperPlane, FaUserClock, FaRupeeSign
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/api";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

const SalesDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Core Data States
  const [leads, setLeads] = useState([]);
  const [orders, setOrders] = useState([]);
  const [designRequests, setDesignRequests] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tab State: 'leads' | 'payments' | 'designs' | 'crm' | 'utilities'
  const [activeTab, setActiveTab] = useState("leads");

  // Sub-tab States
  const [paymentSubTab, setPaymentSubTab] = useState("verification"); // 'verification' | 'pipeline' | 'sync'
  const [designSubTab, setDesignSubTab] = useState("portal"); // 'portal' | 'approvals' | 'machines'
  const [crmSubTab, setCrmSubTab] = useState("awb"); // 'awb' | 'complaints' | 'top-customers'

  // Modal / Dropdown / Form States
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [showQuickAddDropdown, setShowQuickAddDropdown] = useState(false);
  const [universalSearchQuery, setUniversalSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchHistoryDetail, setSearchHistoryDetail] = useState(null); // Selected item history modal

  // Quick Add Lead Modal
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [leadForm, setLeadForm] = useState({ name: "", phone: "", email: "", requirement: "", source: "Direct Call" });
  
  // Quick Design Ticket Modal
  const [showDesignModal, setShowDesignModal] = useState(false);
  const [designForm, setDesignForm] = useState({ designName: "", dimensions: "", materialSpecs: "", leadId: "", orderId: "" });

  // Call Logs Modal
  const [selectedLeadForLog, setSelectedLeadForLog] = useState(null);
  const [newLogNote, setNewLogNote] = useState("");

  // Payment Verification Screenshots Lightbox
  const [activeReceiptScreenshot, setActiveReceiptScreenshot] = useState(null);

  // Notifications State (initialized with realistic system events, stored locally)
  const [notifications, setNotifications] = useState([
    { id: 1, text: "Designer uploaded SVG for Ticket DR-4821", time: "10 mins ago", read: false, type: "design" },
    { id: 2, text: "Google Sheets Payment Sync failed for Order #1042", time: "1 hour ago", read: false, type: "sync" },
    { id: 3, text: "New Facebook Lead captured: Rohan Verma", time: "2 hours ago", read: false, type: "lead" },
    { id: 4, text: "Raw material '1.5mm PP Sheet' fell below min stock", time: "Yesterday", read: true, type: "stock" }
  ]);

  // Quick Quote Calculator State
  const [calcInputs, setCalcInputs] = useState({ length: 500, width: 500, thickness: 2, material: "HDPE", qty: 1 });
  const [calcResult, setCalcResult] = useState(null);

  // Scrap Materials Marketplace (interactive mock upcycle list)
  const [scrapItems, setScrapItems] = useState([
    { id: 1, material: "HDPE Sheet Leftover", size: "250mm x 350mm", thickness: "2mm", color: "Black", qty: 12, pricePerUnit: 60, originalPrice: 120 },
    { id: 2, material: "PP Sheet Leftover", size: "180mm x 400mm", thickness: "1.5mm", color: "Grey", qty: 8, pricePerUnit: 45, originalPrice: 85 },
    { id: 3, material: "HDPE Sheet Leftover", size: "300mm x 300mm", thickness: "3mm", color: "White", qty: 5, pricePerUnit: 80, originalPrice: 150 },
    { id: 4, material: "Acrylic Sheet Leftover", size: "200mm x 300mm", thickness: "5mm", color: "Transparent", qty: 7, pricePerUnit: 110, originalPrice: 220 }
  ]);

  // Media Library catalog items
  const mediaLibrary = [
    { title: "HDPE Sheet Specifications Catalog", type: "pdf", url: "https://pdfobject.com/pdf/sample.pdf" },
    { title: "PP Laser Cutting Speed & Calibration Sheet", type: "pdf", url: "https://pdfobject.com/pdf/sample.pdf" },
    { title: "Laser Machine Demo Guide (Video)", type: "video", url: "https://www.w3schools.com/html/mov_bbb.mp4" },
    { title: "Custom Laser Cut Grills Gallery", type: "images", url: "https://cloudinary.com/gallery" }
  ];

  // Daily Shift Metrics Target Progress
  const shiftMetrics = {
    callsMade: 7,
    callsTarget: 10,
    salesClosed: 18500,
    salesTarget: 30000,
    monthlySales: 124000,
    monthlyTarget: 200000
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Recalculate Quote when Inputs change
  useEffect(() => {
    handleCalculateQuote();
  }, [calcInputs]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch Leads
      const leadsRes = await api.get("/leads");
      if (leadsRes.data.success) {
        setLeads(leadsRes.data.leads || []);
      }

      // Fetch Orders
      const ordersRes = await api.get("/orders/admin/all");
      if (ordersRes.data.success) {
        setOrders(ordersRes.data.orders || []);
      }

      // Fetch Design Requests
      const designRes = await api.get("/design-requests");
      if (designRes.data.success) {
        setDesignRequests(designRes.data.designRequests || []);
      }

      // Fetch Materials
      const materialsRes = await api.get("/materials");
      if (materialsRes.data.success) {
        setMaterials(materialsRes.data.materials || []);
      }

      // Fetch Feedbacks
      const feedbacksRes = await api.get("/feedbacks");
      if (feedbacksRes.data.success) {
        setFeedbacks(feedbacksRes.data.feedbacks || []);
      }

    } catch (error) {
      console.error("Error loading sales dashboard data:", error);
      toast.error("Failed to load real-time dashboard data");
    } finally {
      setLoading(false);
    }
  };

  // --- 1. Notification Actions ---
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const handleMarkNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success("All notifications marked as read");
  };

  const handleClearNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // --- 2. Universal Search ---
  const handleUniversalSearch = (e) => {
    const query = e.target.value;
    setUniversalSearchQuery(query);
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }

    const q = query.toLowerCase();

    // Search across leads
    const matchedLeads = leads.filter(l => 
      l.leadCode?.toLowerCase().includes(q) ||
      l.name?.toLowerCase().includes(q) ||
      l.phone?.includes(q) ||
      l.requirement?.toLowerCase().includes(q)
    );

    // Search across orders
    const matchedOrders = orders.filter(o => 
      o.orderCode?.toLowerCase().includes(q) ||
      o.shippingInfo?.fullName?.toLowerCase().includes(q) ||
      o.shippingInfo?.phone?.includes(q) ||
      o.utrNumber?.toLowerCase().includes(q)
    );

    // Search across design requests
    const matchedDesigns = designRequests.filter(d => 
      d.requestCode?.toLowerCase().includes(q) ||
      d.designName?.toLowerCase().includes(q) ||
      d.dimensions?.toLowerCase().includes(q)
    );

    setSearchResults({
      leads: matchedLeads,
      orders: matchedOrders,
      designs: matchedDesigns
    });
    setShowSearchModal(true);
  };

  // Opening full customer interaction details
  const handleViewCustomerHistory = (item, type) => {
    // Find all links related to this customer (based on phone/name match)
    let phoneNum = "";
    let customerName = "";

    if (type === "lead") {
      phoneNum = item.phone;
      customerName = item.name;
    } else if (type === "order") {
      phoneNum = item.shippingInfo?.phone;
      customerName = item.shippingInfo?.fullName;
    }

    const relatedLeads = leads.filter(l => l.phone === phoneNum || l.name === customerName);
    const relatedOrders = orders.filter(o => o.shippingInfo?.phone === phoneNum || o.shippingInfo?.fullName === customerName);
    const relatedDesigns = designRequests.filter(d => 
      (d.lead && relatedLeads.some(l => l._id === d.lead._id)) || 
      (d.order && relatedOrders.some(o => o._id === d.order._id))
    );

    setSearchHistoryDetail({
      customerName,
      phoneNum,
      type,
      mainItem: item,
      leads: relatedLeads,
      orders: relatedOrders,
      designs: relatedDesigns
    });
  };

  // --- 3. Quick Add Lead Modal Submit ---
  const handleCreateLead = async (e) => {
    e.preventDefault();
    if (!leadForm.name || !leadForm.phone) {
      toast.error("Name and Phone are required!");
      return;
    }
    try {
      const res = await api.post("/leads", leadForm);
      if (res.data.success) {
        toast.success("Inquiry lead registered successfully!");
        setLeadForm({ name: "", phone: "", email: "", requirement: "", source: "Direct Call" });
        setShowLeadModal(false);
        fetchDashboardData();
        // Add notification
        setNotifications(prev => [
          { id: Date.now(), text: `New lead created: ${res.data.lead.name}`, time: "Just now", read: false, type: "lead" },
          ...prev
        ]);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create lead");
    }
  };

  // --- 4. Quick Design Ticket Submit ---
  const handleCreateDesignTicket = async (e) => {
    e.preventDefault();
    if (!designForm.designName) {
      toast.error("Design Name is required!");
      return;
    }
    try {
      const res = await api.post("/design-requests", designForm);
      if (res.data.success) {
        toast.success("Design ticket raised successfully!");
        setDesignForm({ designName: "", dimensions: "", materialSpecs: "", leadId: "", orderId: "" });
        setShowDesignModal(false);
        fetchDashboardData();
        setNotifications(prev => [
          { id: Date.now(), text: `Design request ticket DR raised: ${res.data.designRequest.designName}`, time: "Just now", read: false, type: "design" },
          ...prev
        ]);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to raise design request");
    }
  };

  // --- 5. Bulk CSV Upload ---
  const handleCsvImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const lines = text.split("\n");
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase());

      const leadsArray = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const columns = lines[i].split(",").map(c => c.trim());
        
        const leadObj = {};
        headers.forEach((header, index) => {
          let field = header;
          if (header.includes("name")) field = "name";
          if (header.includes("phone") || header.includes("mobile")) field = "phone";
          if (header.includes("email")) field = "email";
          if (header.includes("requirement") || header.includes("specs")) field = "requirement";
          if (header.includes("source")) field = "source";
          leadObj[field] = columns[index];
        });

        if (leadObj.name && leadObj.phone) {
          leadsArray.push({
            name: leadObj.name,
            phone: leadObj.phone,
            email: leadObj.email || "",
            requirement: leadObj.requirement || "Imported from CSV",
            source: leadObj.source || "Bulk Import"
          });
        }
      }

      if (leadsArray.length === 0) {
        toast.error("No valid leads found in CSV. Required headers: name, phone");
        return;
      }

      try {
        const res = await api.post("/leads/bulk", { leads: leadsArray });
        if (res.data.success) {
          toast.success(`Import success! ${res.data.leads.length} leads created.`);
          fetchDashboardData();
        }
      } catch (err) {
        toast.error("CSV bulk import failed. Check API connectivity.");
      }
    };
    reader.readAsText(file);
  };

  // --- 6. Lead Status & Notes Updates ---
  const handleUpdateLeadStatus = async (leadId, newStatus) => {
    try {
      const res = await api.put(`/leads/${leadId}`, { status: newStatus });
      if (res.data.success) {
        toast.success(`Lead state updated to ${newStatus}`);
        setLeads(prev => prev.map(l => l._id === leadId ? res.data.lead : l));
      }
    } catch (err) {
      toast.error("Failed to update lead status");
    }
  };

  const handleAddCallNote = async (e) => {
    e.preventDefault();
    if (!newLogNote.trim() || !selectedLeadForLog) return;
    try {
      const res = await api.post(`/leads/${selectedLeadForLog._id}/notes`, { text: newLogNote });
      if (res.data.success) {
        toast.success("Call log note saved!");
        setSelectedLeadForLog(res.data.lead);
        setLeads(prev => prev.map(l => l._id === selectedLeadForLog._id ? res.data.lead : l));
        setNewLogNote("");
      }
    } catch (err) {
      toast.error("Failed to add note log");
    }
  };

  // --- 7. Manual Payment Actions ---
  const manualVerificationQueue = useMemo(() => {
    return orders.filter(o => 
      o.paymentMethod === "MANUAL TRANSFER" && 
      o.paymentStatus === "Awaiting Payment"
    );
  }, [orders]);

  const handleApproveManualPayment = async (orderId) => {
    try {
      // Set paid status
      const res = await api.put(`/orders/admin/update/${orderId}`, { 
        paymentStatus: "Paid", 
        orderStatus: "Awaiting Processing" 
      });
      if (res.data.success) {
        toast.success("Receipt verified! Order payment status: Paid.");
        fetchDashboardData();
        // Add alert
        setNotifications(prev => [
          { id: Date.now(), text: `Payment Approved for Order ${res.data.order?.orderCode || orderId}`, time: "Just now", read: false, type: "sync" },
          ...prev
        ]);
      }
    } catch (err) {
      toast.error("Approval failed. Please check backend connection.");
    }
  };

  // --- 8. 1-Click WhatsApp Reminder & Copiers ---
  const handleSendWhatsAppReminder = (order) => {
    const phone = order.shippingInfo?.phone.replace(/\D/g, "");
    const formattedPhone = phone.startsWith("91") ? phone : `91${phone}`;
    const message = `Hi ${order.shippingInfo?.fullName}, your payment of ${formatCurrency(order.totalAmount)} for Order ${order.orderCode || order._id.slice(-6)} is pending. Please complete the transfer and share the screenshot. QR Code Payment link: https://poly.teztech.in/payment-qr. Thank you!`;
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const handleCopyText = (text, message = "Copied to clipboard!") => {
    navigator.clipboard.writeText(text);
    toast.success(message);
  };

  // --- 9. Kanban Board Processing ---
  const kanbanOrders = useMemo(() => {
    const cols = {
      "Awaiting Processing": [],
      "Processing": [],
      "Ready For Pickup": [],
      "Shipped": [],
      "Delivered": []
    };
    orders.forEach(o => {
      if (cols[o.orderStatus] !== undefined) {
        cols[o.orderStatus].push(o);
      }
    });
    return cols;
  }, [orders]);

  // --- 10. Design SVG Handoff Actions ---
  const designApprovals = useMemo(() => {
    return designRequests.filter(d => d.status === "Design Ready");
  }, [designRequests]);

  const handleDesignApproveStatus = async (ticketId, decision) => {
    try {
      const status = decision === "approve" ? "Approved" : "Rejected";
      const res = await api.put(`/design-requests/${ticketId}/status`, { status });
      if (res.data.success) {
        toast.success(`Design status set to: ${status}`);
        fetchDashboardData();
      }
    } catch (err) {
      toast.error("Failed to update design status");
    }
  };

  const handleSendToProduction = async (orderId) => {
    try {
      const res = await api.put(`/orders/admin/production/${orderId}`);
      if (res.data.success) {
        toast.success("Order sent to manufacturing production line!");
        fetchDashboardData();
      }
    } catch (err) {
      toast.error("Send to production failed");
    }
  };

  // --- 11. Quick Quote Calculator Formula ---
  const handleCalculateQuote = () => {
    const { length, width, thickness, material, qty } = calcInputs;
    
    // Density mapping
    const densities = { HDPE: 0.95, PP: 0.90, Acrylic: 1.19 };
    const rates = { HDPE: 180, PP: 160, Acrylic: 240 }; // rates per kg
    
    const density = densities[material] || 0.95;
    const rate = rates[material] || 180;
    
    // Compute Volume: length(mm) * width(mm) * thickness(mm) -> converted to cm3 (divide by 1000)
    const volumeCm3 = (Number(length) * Number(width) * Number(thickness)) / 1000;
    const weightGrams = volumeCm3 * density;
    const weightKg = weightGrams / 1000;
    
    const rawCost = weightKg * rate;
    const processingFee = 50; // processing flat fee per sheet
    const subtotal = (rawCost + processingFee) * Number(qty);
    const gst = subtotal * 0.18; // 18% GST
    const total = subtotal + gst;

    setCalcResult({
      weightKg: weightKg.toFixed(3),
      rawCost: rawCost.toFixed(2),
      subtotal: subtotal.toFixed(2),
      gst: gst.toFixed(2),
      total: Math.round(total)
    });
  };

  // Add scrap item details directly to Quick Calculator inputs
  const handleApplyScrapToCalc = (scrap) => {
    // Parse size e.g. "250mm x 350mm" -> length=250, width=350
    const dimensions = scrap.size.replace(/mm/g, "").split("x").map(Number);
    const thickness = parseFloat(scrap.thickness.replace(/mm/g, ""));
    const materialType = scrap.material.startsWith("HDPE") ? "HDPE" : scrap.material.startsWith("PP") ? "PP" : "Acrylic";

    setCalcInputs({
      length: dimensions[0] || 500,
      width: dimensions[1] || 500,
      thickness: thickness || 2,
      material: materialType,
      qty: 1
    });
    toast.success("Scrap dimensions applied to calculator!");
  };

  // Mock Purchase team notification
  const handleNotifyPurchaseTeam = (materialName) => {
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 1000)),
      {
        loading: "Sending requisition alert...",
        success: `Purchase team notified to restock: ${materialName}!`,
        error: "Alert failed to dispatch"
      }
    );
  };

  return (
    <div className="flex flex-col min-h-screen font-sans bg-slate-50 text-slate-800 pb-16">

      {/* =====================================================================
          2. AT-A-GLANCE METRICS
      ====================================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 p-4 sm:p-6 lg:p-8">
        
        {/* Metric 1: Today's Revenue */}
        <div className="p-4 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl shadow-md flex flex-col justify-between h-28">
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-100">Today's Revenue</span>
          <h3 className="text-xl sm:text-2xl font-black">{formatCurrency(shiftMetrics.salesClosed)}</h3>
          <p className="text-[10px] text-blue-200 font-medium">Approved sales closed today</p>
        </div>

        {/* Metric 2: New Inquiries */}
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between h-28">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">New Inquiries</span>
          <h3 className="text-2xl font-black text-slate-900">
            {leads.filter(l => l.status === "New").length} Leads
          </h3>
          <p className="text-[10px] text-slate-500 font-medium">Awaiting call qualification</p>
        </div>

        {/* Metric 3: Action Required */}
        <div className="p-4 bg-white border border-amber-200 bg-amber-50/20 rounded-2xl shadow-sm flex flex-col justify-between h-28">
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">Action Required</span>
          <h3 className="text-2xl font-black text-amber-600">
            {manualVerificationQueue.length} Pending
          </h3>
          <p className="text-[10px] text-amber-750 font-medium">Manual transfers to verify</p>
        </div>

        {/* Metric 4: Follow-ups Due */}
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between h-28">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Follow-ups Due</span>
          <h3 className="text-2xl font-black text-slate-900">
            {leads.filter(l => l.status === "Negotiation" || l.status === "Contacted").length} Deals
          </h3>
          <p className="text-[10px] text-slate-500 font-medium">Active negotiations</p>
        </div>

        {/* Metric 5: Monthly Target Progress */}
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm col-span-2 lg:col-span-1 flex flex-col justify-between h-28">
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
            <span>Target Progress</span>
            <span className="text-emerald-600 font-black">{Math.round((shiftMetrics.monthlySales/shiftMetrics.monthlyTarget)*100)}%</span>
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">{formatCurrency(shiftMetrics.monthlySales)}</h3>
            <p className="text-[9px] text-slate-400 font-medium">of {formatCurrency(shiftMetrics.monthlyTarget)} Target</p>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(shiftMetrics.monthlySales/shiftMetrics.monthlyTarget)*100}%` }}></div>
          </div>
        </div>

      </div>

      {/* =====================================================================
          3. MAIN LAYOUT: TABS PANEL (LEFT) & STOCK/UPCYCLE SIDEBAR (RIGHT)
      ====================================================================== */}
      <div className="w-full px-4 sm:px-6 lg:px-8">
        
        {/* LEFT COLUMN: OPERATIONS TABS */}
        <div className="w-full flex flex-col gap-6">
          
          {/* Tab Selection Header */}
          <div className="flex border-b border-slate-200 bg-white p-2 rounded-2xl shadow-sm gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab("leads")}
              className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "leads" ? "bg-blue-600 text-white shadow-md shadow-blue-900/10" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              Pre-Sales Leads
            </button>
            <button
              onClick={() => setActiveTab("payments")}
              className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "payments" ? "bg-blue-600 text-white shadow-md shadow-blue-900/10" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              Payments & Pipelines
            </button>
            <button
              onClick={() => setActiveTab("designs")}
              className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "designs" ? "bg-blue-600 text-white shadow-md shadow-blue-900/10" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              Design Handoffs
            </button>
            <button
              onClick={() => setActiveTab("crm")}
              className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "crm" ? "bg-blue-600 text-white shadow-md shadow-blue-900/10" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              Post-Sales CRM
            </button>
            <button
              onClick={() => setActiveTab("utilities")}
              className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "utilities" ? "bg-blue-600 text-white shadow-md shadow-blue-900/10" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              Sales Utilities
            </button>
          </div>

          {/* TAB CONTENT PANEL */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm min-h-[500px]">
            
            {/* ==============================================
                TAB 1: LEAD INBOX & PRE-SALES
            ============================================== */}
            {activeTab === "leads" && (
              <div className="space-y-6">
                
                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-lg font-black text-slate-900">Pre-Sales Lead Inbox</h4>
                    <p className="text-xs text-slate-500 font-medium">Qualify, schedule follow-ups, and convert inquiries.</p>
                  </div>
                  
                  {/* File Upload / Import Button */}
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-sm cursor-pointer transition-all">
                      <FaCloudUploadAlt size={16} /> Import Leads CSV
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleCsvImport}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Leads Table */}
                <div className="overflow-x-auto border border-slate-150 rounded-2xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] tracking-wider uppercase font-black text-slate-500 border-b border-slate-200">
                        <th className="p-4">Lead ID</th>
                        <th className="p-4">Customer Details</th>
                        <th className="p-4">Requirement</th>
                        <th className="p-4">Source</th>
                        <th className="p-4">Workflow status</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {leads.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="p-8 text-center text-slate-400 italic">No inquiry leads found.</td>
                        </tr>
                      ) : (
                        leads.map(lead => (
                          <tr key={lead._id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 font-bold text-blue-600">{lead.leadCode || "N/A"}</td>
                            <td className="p-4">
                              <p className="font-bold text-slate-900">{lead.name}</p>
                              <p className="text-slate-400 mt-0.5">{lead.phone}</p>
                              {lead.email && <p className="text-[10px] text-slate-400">{lead.email}</p>}
                            </td>
                            <td className="p-4 max-w-xs truncate" title={lead.requirement}>{lead.requirement}</td>
                            <td className="p-4">
                              <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-semibold text-slate-600">
                                {lead.source}
                              </span>
                            </td>
                            <td className="p-4">
                              <select
                                value={lead.status}
                                onChange={(e) => handleUpdateLeadStatus(lead._id, e.target.value)}
                                className="px-2.5 py-1 border border-slate-200 bg-white rounded-lg text-xs font-bold focus:outline-none"
                              >
                                <option value="New">New</option>
                                <option value="Contacted">Contacted</option>
                                <option value="In Negotiation">In Negotiation</option>
                                <option value="Negotiation">Negotiation</option>
                                <option value="Won">Won</option>
                                <option value="Lost">Lost</option>
                              </select>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => setSelectedLeadForLog(lead)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                >
                                  <FaComments /> Call Log ({lead.notes?.length || 0})
                                </button>
                                <button
                                  onClick={() => navigate("/admin/orders/create", { state: { lead } })}
                                  className="flex items-center gap-1.5 px-3 py-1.5 font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                                >
                                  <FaPlus /> Order
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

              </div>
            )}

            {/* ==============================================
                TAB 2: CORE OPERATIONS (PAYMENTS & PIPELINES)
            ============================================== */}
            {activeTab === "payments" && (
              <div className="space-y-6">
                
                {/* Sub Tab Headers */}
                <div className="flex border-b border-slate-150 pb-2 gap-4">
                  <button
                    onClick={() => setPaymentSubTab("verification")}
                    className={`pb-2 text-xs font-extrabold transition-all border-b-2 ${
                      paymentSubTab === "verification" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-700"
                    }`}
                  >
                    Manual Receipt Verification ({manualVerificationQueue.length})
                  </button>
                  <button
                    onClick={() => setPaymentSubTab("pipeline")}
                    className={`pb-2 text-xs font-extrabold transition-all border-b-2 ${
                      paymentSubTab === "pipeline" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-700"
                    }`}
                  >
                    Order Pipeline (Kanban)
                  </button>
                  <button
                    onClick={() => setPaymentSubTab("sync")}
                    className={`pb-2 text-xs font-extrabold transition-all border-b-2 ${
                      paymentSubTab === "sync" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-700"
                    }`}
                  >
                    Google Sheets & Zoho Sync
                  </button>
                </div>

                {/* Sub-tab 1: Manual Verification Queue */}
                {paymentSubTab === "verification" && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-500 font-medium">Verify customer payment receipts for bank transfers/UPI and approve orders.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {manualVerificationQueue.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-400 italic col-span-2">
                          No pending receipt verifications in queue.
                        </div>
                      ) : (
                        manualVerificationQueue.map(order => (
                          <div key={order._id} className="p-4 border border-slate-200 rounded-2xl flex flex-col justify-between gap-4 hover:shadow-sm transition-all bg-slate-50/50">
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="font-black text-sm text-slate-900">{order.orderCode || `#${order._id.slice(-6)}`}</h5>
                                <p className="text-[10px] text-slate-400 font-bold block mt-0.5">
                                  Created: {new Date(order.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <span className="text-sm font-black text-slate-900">{formatCurrency(order.totalAmount)}</span>
                            </div>

                            <div className="text-xs space-y-1">
                              <p className="text-slate-650"><strong className="text-slate-800">Customer:</strong> {order.shippingInfo?.fullName}</p>
                              <p className="text-slate-650"><strong className="text-slate-800">Phone:</strong> {order.shippingInfo?.phone}</p>
                              <p className="text-slate-650"><strong className="text-slate-800">UTR / Ref No:</strong> <span className="font-mono bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[10px]">{order.utrNumber || "N/A"}</span></p>
                            </div>

                            {order.paymentScreenshot ? (
                              <button
                                onClick={() => setActiveReceiptScreenshot(order.paymentScreenshot)}
                                className="w-full py-2 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                              >
                                <FaImage /> Preview Receipt Screenshot
                              </button>
                            ) : (
                              <div className="text-center text-[10px] italic text-amber-600 bg-amber-50 border border-amber-100 p-2 rounded-xl">
                                Screenshot not uploaded. Request via WhatsApp.
                              </div>
                            )}

                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSendWhatsAppReminder(order)}
                                className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                              >
                                <FaWhatsapp size={14} /> Send Reminder
                              </button>
                              <button
                                onClick={() => handleApproveManualPayment(order._id)}
                                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow"
                              >
                                <FaCheck /> Approve Payment
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Sub-tab 2: Kanban Pipeline */}
                {paymentSubTab === "pipeline" && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-500 font-medium">Follow orders through the manufacturing, packing, and dispatch pipeline.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 overflow-x-auto">
                      {Object.keys(kanbanOrders).map(stage => (
                        <div key={stage} className="bg-slate-50/50 border border-slate-200 p-3 rounded-2xl min-w-[200px] flex flex-col gap-3">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">{stage}</span>
                            <span className="px-2 py-0.5 text-[9px] font-black bg-slate-200 rounded-full text-slate-650">
                              {kanbanOrders[stage].length}
                            </span>
                          </div>

                          <div className="flex flex-col gap-2 overflow-y-auto max-h-[400px]">
                            {kanbanOrders[stage].length === 0 ? (
                              <div className="text-center py-8 text-[10px] text-slate-350 italic">Empty</div>
                            ) : (
                              kanbanOrders[stage].map(order => (
                                <div key={order._id} className="bg-white border border-slate-150 p-2.5 rounded-xl shadow-sm text-xs hover:border-blue-300 transition-colors">
                                  <div className="flex justify-between font-bold text-slate-900">
                                    <span>{order.orderCode || `#${order._id.slice(-6)}`}</span>
                                    <span className="text-slate-500">{formatCurrency(order.totalAmount)}</span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 mt-1 truncate">{order.shippingInfo?.fullName}</p>
                                  <p className="text-[9px] text-slate-400 mt-0.5">{order.items?.length || 0} items</p>
                                  
                                  {stage === "Awaiting Processing" && (
                                    <button
                                      onClick={() => handleSendToProduction(order._id)}
                                      className="w-full mt-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 text-[10px] font-bold rounded-lg transition-all"
                                    >
                                      Send to Production
                                    </button>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sub-tab 3: Live Sync Status */}
                {paymentSubTab === "sync" && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-500 font-medium">Monitor Google Sheets and Zoho ERP synchronization status for approved bookings.</p>
                    
                    <div className="overflow-x-auto border border-slate-150 rounded-2xl">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-[10px] tracking-wider uppercase font-black text-slate-500 border-b border-slate-200">
                            <th className="p-4">Order Code</th>
                            <th className="p-4">Customer Name</th>
                            <th className="p-4">Amount</th>
                            <th className="p-4">Google Sheets Sync</th>
                            <th className="p-4">Zoho CRM Sync</th>
                            <th className="p-4">Sync Timestamp</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {orders.filter(o => o.paymentStatus === "Paid").slice(0, 10).map(order => (
                            <tr key={order._id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-4 font-bold text-slate-800">{order.orderCode || `#${order._id.slice(-6)}`}</td>
                              <td className="p-4 font-semibold text-slate-800">{order.shippingInfo?.fullName}</td>
                              <td className="p-4 font-mono">{formatCurrency(order.totalAmount)}</td>
                              <td className="p-4">
                                <span className={`flex items-center gap-1.5 font-bold ${order.syncStatus?.googleSheets === "Synced" ? "text-green-600" : "text-red-500"}`}>
                                  <span className={`h-2 w-2 rounded-full ${order.syncStatus?.googleSheets === "Synced" ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></span>
                                  {order.syncStatus?.googleSheets || "Not Synced"}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className={`flex items-center gap-1.5 font-bold ${order.syncStatus?.zoho === "Synced" ? "text-green-600" : "text-red-500"}`}>
                                  <span className={`h-2 w-2 rounded-full ${order.syncStatus?.zoho === "Synced" ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></span>
                                  {order.syncStatus?.zoho || "Not Synced"}
                                </span>
                              </td>
                              <td className="p-4 text-slate-400 font-semibold">
                                {order.syncStatus?.syncedAt ? new Date(order.syncStatus.syncedAt).toLocaleString() : "N/A"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* ==============================================
                TAB 3: DESIGN HANDOFF (CUSTOM WORK)
            ============================================== */}
            {activeTab === "designs" && (
              <div className="space-y-6">
                
                {/* Sub Tab Headers */}
                <div className="flex border-b border-slate-150 pb-2 gap-4">
                  <button
                    onClick={() => setDesignSubTab("portal")}
                    className={`pb-2 text-xs font-extrabold transition-all border-b-2 ${
                      designSubTab === "portal" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-700"
                    }`}
                  >
                    Submit Design Request Form
                  </button>
                  <button
                    onClick={() => setDesignSubTab("approvals")}
                    className={`pb-2 text-xs font-extrabold transition-all border-b-2 ${
                      designSubTab === "approvals" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-700"
                    }`}
                  >
                    SVG Design Approvals ({designApprovals.length})
                  </button>
                  <button
                    onClick={() => setDesignSubTab("machines")}
                    className={`pb-2 text-xs font-extrabold transition-all border-b-2 ${
                      designSubTab === "machines" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-700"
                    }`}
                  >
                    Live CNC Machine Status
                  </button>
                </div>

                {/* Sub-tab 1: Submit Form */}
                {designSubTab === "portal" && (
                  <form onSubmit={handleCreateDesignTicket} className="space-y-4 max-w-xl">
                    <p className="text-xs text-slate-500 font-medium">Forward custom drawing requirements and dimensions to the designer.</p>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Design Name *</label>
                        <input
                          type="text"
                          required
                          value={designForm.designName}
                          onChange={(e) => setDesignForm(prev => ({ ...prev, designName: e.target.value }))}
                          placeholder="e.g. Partition Screen Grille"
                          className="w-full p-2.5 border border-slate-250 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Dimensions (mm)</label>
                        <input
                          type="text"
                          value={designForm.dimensions}
                          onChange={(e) => setDesignForm(prev => ({ ...prev, dimensions: e.target.value }))}
                          placeholder="e.g. 1200mm x 2400mm"
                          className="w-full p-2.5 border border-slate-250 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Material Specifications</label>
                      <input
                        type="text"
                        value={designForm.materialSpecs}
                        onChange={(e) => setDesignForm(prev => ({ ...prev, materialSpecs: e.target.value }))}
                        placeholder="e.g. 2mm White HDPE Sheet"
                        className="w-full p-2.5 border border-slate-250 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Associate Lead (Optional)</label>
                        <select
                          value={designForm.leadId}
                          onChange={(e) => setDesignForm(prev => ({ ...prev, leadId: e.target.value }))}
                          className="w-full p-2.5 border border-slate-250 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 bg-white text-slate-800"
                        >
                          <option value="">Unlinked</option>
                          {leads.map(l => (
                            <option key={l._id} value={l._id}>{l.name} ({l.leadCode})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Associate Order (Optional)</label>
                        <select
                          value={designForm.orderId}
                          onChange={(e) => setDesignForm(prev => ({ ...prev, orderId: e.target.value }))}
                          className="w-full p-2.5 border border-slate-250 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 bg-white text-slate-800"
                        >
                          <option value="">Unlinked</option>
                          {orders.map(o => (
                            <option key={o._id} value={o._id}>{o.shippingInfo?.fullName} ({o.orderCode})</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow"
                    >
                      Raise Ticket to Designer
                    </button>
                  </form>
                )}

                {/* Sub-tab 2: Design Approvals */}
                {designSubTab === "approvals" && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-500 font-medium">Verify vector graphics uploaded by designers and get client confirmation.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {designApprovals.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-400 italic col-span-2">
                          No designs awaiting approval.
                        </div>
                      ) : (
                        designApprovals.map(ticket => (
                          <div key={ticket._id} className="p-4 border border-slate-200 rounded-2xl flex flex-col justify-between gap-3 hover:shadow-sm bg-slate-50/50">
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="font-black text-sm text-slate-900">{ticket.designName}</h5>
                                <p className="text-[9px] font-bold text-slate-450 mt-0.5">Ticket Code: {ticket.requestCode}</p>
                              </div>
                              <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 rounded text-[9px] font-bold">
                                {ticket.status}
                              </span>
                            </div>

                            <div className="text-xs space-y-1 text-slate-650 bg-white p-3 rounded-xl border border-slate-150">
                              <p><strong>Dimensions:</strong> {ticket.dimensions || "N/A"}</p>
                              <p><strong>Material Specs:</strong> {ticket.materialSpecs || "N/A"}</p>
                              {ticket.lead && <p><strong>Lead Associated:</strong> {ticket.lead?.name || "Client"}</p>}
                            </div>

                            {ticket.optimizedSvgUrl && (
                              <a
                                href={ticket.optimizedSvgUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-slate-250"
                              >
                                <FaDownload /> Download Optimized SVG Drawing
                              </a>
                            )}

                            <div className="flex gap-2">
                              <button
                                onClick={() => handleDesignApproveStatus(ticket._id, "reject")}
                                className="flex-1 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
                              >
                                <FaTimes /> Reject Design
                              </button>
                              <button
                                onClick={() => handleDesignApproveStatus(ticket._id, "approve")}
                                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow"
                              >
                                <FaCheck /> Approve Design
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Sub-tab 3: Live cnc machine status */}
                {designSubTab === "machines" && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-500 font-medium">Real-time status of the laser cutting and routing factory machines.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Machine 1 */}
                      <div className="p-4 border border-slate-200 rounded-2xl bg-white shadow-sm flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-900 text-sm">CO2 Laser Cutter 1</span>
                          <span className="px-2 py-0.5 bg-red-50 text-red-700 rounded text-[9px] font-bold uppercase animate-pulse">
                            Busy
                          </span>
                        </div>
                        <div className="text-xs space-y-1 text-slate-600">
                          <p><strong>Job:</strong> 2mm HDPE Lattice Screen</p>
                          <p><strong>Material:</strong> HDPE Roll SKU-481</p>
                          <p><strong>Time Remaining:</strong> 8 mins (80% Done)</p>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-1">
                          <div className="h-full bg-blue-600 rounded-full animate-pulse" style={{ width: "80%" }}></div>
                        </div>
                      </div>

                      {/* Machine 2 */}
                      <div className="p-4 border border-slate-200 rounded-2xl bg-white shadow-sm flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-900 text-sm">Fiber Laser Cutter 2</span>
                          <span className="px-2 py-0.5 bg-green-50 text-green-705 rounded text-[9px] font-bold uppercase">
                            Idle
                          </span>
                        </div>
                        <div className="text-xs space-y-1 text-slate-650">
                          <p><strong>Job:</strong> Standby</p>
                          <p><strong>Queue size:</strong> 0 tickets</p>
                          <p><strong>Avg Load:</strong> 45% today</p>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-1">
                          <div className="h-full bg-slate-200 rounded-full" style={{ width: "0%" }}></div>
                        </div>
                      </div>

                      {/* Machine 3 */}
                      <div className="p-4 border border-slate-200 rounded-2xl bg-white shadow-sm flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-900 text-sm">CNC Acrylic Router 3</span>
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-[9px] font-bold uppercase">
                            Maintenance
                          </span>
                        </div>
                        <div className="text-xs space-y-1 text-slate-600">
                          <p><strong>Status:</strong> Spindle Calibration</p>
                          <p><strong>Est. Return:</strong> 2 hours</p>
                          <p><strong>Tech Assigned:</strong> Raju Lal</p>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-1">
                          <div className="h-full bg-amber-500 rounded-full" style={{ width: "100%" }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* ==============================================
                TAB 4: POST-SALES CRM & SUPPORT
            ============================================== */}
            {activeTab === "crm" && (
              <div className="space-y-6">
                
                {/* Sub Tab Headers */}
                <div className="flex border-b border-slate-150 pb-2 gap-4">
                  <button
                    onClick={() => setCrmSubTab("awb")}
                    className={`pb-2 text-xs font-extrabold transition-all border-b-2 ${
                      crmSubTab === "awb" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-700"
                    }`}
                  >
                    Tracking ID (AWB) Copier
                  </button>
                  <button
                    onClick={() => setCrmSubTab("complaints")}
                    className={`pb-2 text-xs font-extrabold transition-all border-b-2 ${
                      crmSubTab === "complaints" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-700"
                    }`}
                  >
                    Feedback & Complaint Tickets
                  </button>
                  <button
                    onClick={() => setCrmSubTab("top-customers")}
                    className={`pb-2 text-xs font-extrabold transition-all border-b-2 ${
                      crmSubTab === "top-customers" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-700"
                    }`}
                  >
                    Top Customers List
                  </button>
                </div>

                {/* Sub-tab 1: AWB Copier */}
                {crmSubTab === "awb" && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-500 font-medium">Quick copy tracking details and forward to courier delivery recipients.</p>
                    
                    <div className="overflow-x-auto border border-slate-150 rounded-2xl">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-[10px] tracking-wider uppercase font-black text-slate-500 border-b border-slate-200">
                            <th className="p-4">Order Code</th>
                            <th className="p-4">Client Name</th>
                            <th className="p-4">Courier Partner</th>
                            <th className="p-4">AWB Tracking ID</th>
                            <th className="p-4">Copy Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {orders.filter(o => o.orderStatus === "Shipped" || o.trackingId).slice(0, 10).map(order => (
                            <tr key={order._id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-4 font-bold text-slate-800">{order.orderCode || `#${order._id.slice(-6)}`}</td>
                              <td className="p-4 font-semibold text-slate-900">{order.shippingInfo?.fullName}</td>
                              <td className="p-4 font-semibold text-slate-650">{order.courierPartner || "Delhivery"}</td>
                              <td className="p-4 font-mono font-bold text-blue-600">{order.trackingId || "AWB-481923"}</td>
                              <td className="p-4">
                                <button
                                  onClick={() => handleCopyText(order.trackingId || "AWB-481923", "Tracking ID copied!")}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-250 rounded-lg transition-colors"
                                >
                                  <FaCopy /> Copy Tracking ID
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Sub-tab 2: Feedback & Complaints */}
                {crmSubTab === "complaints" && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-500 font-medium">Tickets created from customer reviews rating below 4 stars.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {feedbacks.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-400 italic col-span-2">
                          No active complaints found. Customers are satisfied!
                        </div>
                      ) : (
                        feedbacks.map(ticket => (
                          <div key={ticket._id} className="p-4 border border-slate-200 rounded-2xl flex flex-col justify-between gap-3 hover:shadow-sm bg-slate-50/50">
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="font-bold text-sm text-slate-900">Rating: {ticket.rating} / 5 Stars</h5>
                                <p className="text-[10px] text-slate-400 font-bold block mt-0.5">
                                  Order Code: {ticket.order?.orderCode || "N/A"}
                                </p>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                ticket.status === "Resolved" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
                              }`}>
                                {ticket.status}
                              </span>
                            </div>

                            <p className="text-xs text-slate-700 italic bg-white p-3 rounded-xl border border-slate-150">
                              "{ticket.comments || "No comments entered."}"
                            </p>

                            {ticket.status !== "Resolved" ? (
                              <div className="space-y-2">
                                <label className="block text-[10px] font-black uppercase text-slate-500">Resolution Remark</label>
                                <textarea
                                  placeholder="What call action resolved this client dispute?"
                                  rows="2"
                                  className="w-full p-2 border border-slate-200 rounded-xl text-xs text-slate-800"
                                />
                                <button
                                  onClick={async () => {
                                    try {
                                      const res = await api.put(`/feedbacks/${ticket._id}/resolve`, { status: "Resolved", resolutionNotes: "Customer spoke on phone and was satisfied with replacement." });
                                      if (res.data.success) {
                                        toast.success("Feedback ticket resolved successfully!");
                                        fetchDashboardData();
                                      }
                                    } catch (err) {
                                      toast.error("Failed to resolve feedback");
                                    }
                                  }}
                                  className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition-colors"
                                >
                                  Resolve Complaint Ticket
                                </button>
                              </div>
                            ) : (
                              <p className="text-xs text-slate-500">
                                <strong className="text-slate-800">Resolution notes:</strong> {ticket.resolutionNotes || "Resolved via support follow-up."}
                              </p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Sub-tab 3: Top Customers */}
                {crmSubTab === "top-customers" && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-500 font-medium">B2B and individual buyers who generated the most value this month.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Customer 1 */}
                      <div className="p-4 border border-slate-200 rounded-2xl bg-white shadow-sm flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center text-lg font-black border border-amber-200">
                          🥇
                        </div>
                        <div>
                          <h5 className="font-bold text-slate-900 text-sm">Mehta Polyplastics</h5>
                          <p className="text-xs text-slate-500">14 Orders | {formatCurrency(68400)} spent</p>
                        </div>
                      </div>

                      {/* Customer 2 */}
                      <div className="p-4 border border-slate-200 rounded-2xl bg-white shadow-sm flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 text-slate-650 rounded-full flex items-center justify-center text-lg font-black border border-slate-200">
                          🥈
                        </div>
                        <div>
                          <h5 className="font-bold text-slate-900 text-sm">Verma Electro-Fab</h5>
                          <p className="text-xs text-slate-500">8 Orders | {formatCurrency(41200)} spent</p>
                        </div>
                      </div>

                      {/* Customer 3 */}
                      <div className="p-4 border border-slate-200 rounded-2xl bg-white shadow-sm flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center text-lg font-black border border-orange-200">
                          🥉
                        </div>
                        <div>
                          <h5 className="font-bold text-slate-900 text-sm">R.K. Laser Cutters</h5>
                          <p className="text-xs text-slate-500">5 Orders | {formatCurrency(29000)} spent</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* ==============================================
                TAB 5: SMART UTILITIES & QUICK CALCULATORS
            ============================================== */}
            {activeTab === "utilities" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Left: Quick Quote Calculator */}
                <div className="p-5 border border-slate-200 bg-slate-50/50 rounded-2xl flex flex-col gap-4">
                  <div>
                    <h5 className="font-black text-sm text-slate-900 flex items-center gap-2">
                      <FaCalculator className="text-blue-600" /> Laser Cutting Price Calculator
                    </h5>
                    <p className="text-[10px] text-slate-500 mt-0.5">Instantly estimate sheet weights and costs (includes 18% GST).</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Sheet Length (mm)</label>
                      <input
                        type="number"
                        value={calcInputs.length}
                        onChange={(e) => setCalcInputs(prev => ({ ...prev, length: Number(e.target.value) }))}
                        className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Sheet Width (mm)</label>
                      <input
                        type="number"
                        value={calcInputs.width}
                        onChange={(e) => setCalcInputs(prev => ({ ...prev, width: Number(e.target.value) }))}
                        className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Thickness (mm)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={calcInputs.thickness}
                        onChange={(e) => setCalcInputs(prev => ({ ...prev, thickness: Number(e.target.value) }))}
                        className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Material Polymer</label>
                      <select
                        value={calcInputs.material}
                        onChange={(e) => setCalcInputs(prev => ({ ...prev, material: e.target.value }))}
                        className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 bg-white"
                      >
                        <option value="HDPE">HDPE (Density: 0.95)</option>
                        <option value="PP">PP (Density: 0.90)</option>
                        <option value="Acrylic">Acrylic (Density: 1.19)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 text-xs">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={calcInputs.qty}
                      onChange={(e) => setCalcInputs(prev => ({ ...prev, qty: Number(e.target.value) }))}
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs text-slate-800 bg-white"
                    />
                  </div>

                  {calcResult && (
                    <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 text-xs">
                      <div className="flex justify-between border-b border-slate-100 pb-1">
                        <span className="text-slate-450 font-bold">Estimated Sheet Weight:</span>
                        <span className="font-bold text-slate-900">{calcResult.weightKg} kg</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1">
                        <span className="text-slate-450 font-bold">Material cost ({calcInputs.material}):</span>
                        <span className="font-mono">₹{calcResult.rawCost}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1">
                        <span className="text-slate-450 font-bold">Processing charge:</span>
                        <span className="font-mono">₹50.00</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1">
                        <span className="text-slate-450 font-bold">GST (18%):</span>
                        <span className="font-mono">₹{calcResult.gst}</span>
                      </div>
                      <div className="flex justify-between pt-1 font-black text-sm text-slate-900">
                        <span>Total Estimated Cost:</span>
                        <span className="font-mono text-blue-600">₹{calcResult.total}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Media Library Catalog */}
                <div className="space-y-4">
                  <div>
                    <h5 className="font-black text-sm text-slate-900">Agent Media Library</h5>
                    <p className="text-[10px] text-slate-550 mt-0.5">1-Click catalogs and videos sharing to WhatsApp.</p>
                  </div>

                  <div className="flex flex-col gap-2">
                    {mediaLibrary.map((item, idx) => (
                      <div key={idx} className="p-3 border border-slate-150 rounded-xl flex items-center justify-between gap-4 hover:border-slate-300 bg-white">
                        <div className="flex items-center gap-2.5">
                          {item.type === "pdf" && <FaFilePdf className="text-red-500 text-lg flex-shrink-0" />}
                          {item.type === "video" && <FaVideo className="text-blue-500 text-lg flex-shrink-0" />}
                          {item.type === "images" && <FaImage className="text-purple-500 text-lg flex-shrink-0" />}
                          <span className="text-xs font-bold text-slate-800 line-clamp-1">{item.title}</span>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCopyText(item.url, "Catalog link copied!")}
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
                            title="Copy link"
                          >
                            <FaCopy size={12} />
                          </button>
                          <a
                            href={`https://wa.me/?text=${encodeURIComponent(`Check out the ${item.title}: ${item.url}`)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors flex items-center justify-center"
                            title="Share on WhatsApp"
                          >
                            <FaWhatsapp size={12} />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>

      </div>

      {/* =====================================================================
          MODALS & LIGHTBOX DRAWERS
      ====================================================================== */}
      
      {/* 1. Quick Add Lead Modal */}
      {showLeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white p-6 rounded-3xl w-full max-w-md shadow-2xl border border-slate-150 animate-scale-up">
            <h3 className="text-lg font-black text-slate-900 mb-4">Register Inquiry Lead</h3>
            
            <form onSubmit={handleCreateLead} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-550 mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikramaditya Dev"
                  value={leadForm.name}
                  onChange={(e) => setLeadForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-550 mb-1">Mobile Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={leadForm.phone}
                    onChange={(e) => setLeadForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-550 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="e.g. vdev@gmail.com"
                    value={leadForm.email}
                    onChange={(e) => setLeadForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-550 mb-1">Requirement Details</label>
                <textarea
                  rows="3"
                  placeholder="Sheet size, thickness, material specifications required..."
                  value={leadForm.requirement}
                  onChange={(e) => setLeadForm(prev => ({ ...prev, requirement: e.target.value }))}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-550 mb-1">Source Campaign</label>
                <select
                  value={leadForm.source}
                  onChange={(e) => setLeadForm(prev => ({ ...prev, source: e.target.value }))}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white text-slate-800"
                >
                  <option value="Direct Call">Direct Call</option>
                  <option value="Facebook Ad">Facebook Ad</option>
                  <option value="Instagram Ad">Instagram Ad</option>
                  <option value="WhatsApp Business">WhatsApp Business</option>
                  <option value="Website Portal">Website Portal</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLeadModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow"
                >
                  Create Inquiry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Call Logs / Notes Modal */}
      {selectedLeadForLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-[#f0ece3] rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[520px]">
            
            {/* Header */}
            <div className="px-5 py-4 bg-slate-850 text-white flex justify-between items-center flex-shrink-0">
              <div>
                <h4 className="font-bold text-sm">Call Logs & Interactions: {selectedLeadForLog.name}</h4>
                <p className="text-[10px] text-slate-300">Lead Code: {selectedLeadForLog.leadCode || "N/A"}</p>
              </div>
              <button onClick={() => setSelectedLeadForLog(null)} className="text-slate-300 hover:text-white font-bold">
                ✕ Close
              </button>
            </div>

            {/* Logs List Area */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4">
              {selectedLeadForLog.notes?.length === 0 ? (
                <div className="text-center py-20 text-xs text-slate-400 italic">No notes logged. Register remarks below.</div>
              ) : (
                selectedLeadForLog.notes.map((note, index) => (
                  <div key={index} className="flex flex-col items-start bg-white p-3.5 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm max-w-[85%]">
                    <p className="text-xs text-slate-850 leading-relaxed font-medium">{note.text}</p>
                    <div className="flex items-center justify-between w-full mt-2.5 border-t border-slate-100 pt-1.5 text-[9px] text-slate-450 font-bold">
                      <span>👤 {note.author}</span>
                      <span>{new Date(note.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Note submission form */}
            <form onSubmit={handleAddCallNote} className="p-3 bg-slate-100 border-t border-slate-200 flex gap-2 items-center flex-shrink-0">
              <input
                type="text"
                required
                value={newLogNote}
                onChange={(e) => setNewLogNote(e.target.value)}
                placeholder="Log requirement revisions / phone call summary..."
                className="flex-1 px-4 py-2 border border-slate-250 bg-white rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
              />
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow"
              >
                Save Log
              </button>
            </form>

          </div>
        </div>
      )}

      {/* 3. Universal Search Results Modal */}
      {showSearchModal && searchResults && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white p-6 rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-150 overflow-hidden flex flex-col h-[520px]">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 flex-shrink-0">
              <h3 className="text-base font-black text-slate-900">Universal Search Results: "{universalSearchQuery}"</h3>
              <button onClick={() => { setShowSearchModal(false); setSearchResults(null); }} className="text-slate-400 hover:text-slate-700 font-bold">
                ✕ Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-6">
              
              {/* Leads Matches */}
              <div>
                <h4 className="text-[10px] font-black uppercase text-slate-450 tracking-wider mb-2">Leads Matches ({searchResults.leads.length})</h4>
                {searchResults.leads.length === 0 ? (
                  <p className="text-xs text-slate-350 italic pl-2">No matching leads</p>
                ) : (
                  <div className="space-y-2">
                    {searchResults.leads.map(lead => (
                      <div key={lead._id} className="p-3 border border-slate-150 rounded-2xl flex justify-between items-center bg-slate-50/30 hover:border-slate-300 transition-colors">
                        <div>
                          <p className="text-xs font-bold text-slate-900">{lead.name} ({lead.leadCode || "LD"})</p>
                          <p className="text-[10px] text-slate-500">Phone: {lead.phone} | Req: {lead.requirement}</p>
                        </div>
                        <button
                          onClick={() => { handleViewCustomerHistory(lead, "lead"); setShowSearchModal(false); }}
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-bold rounded-lg transition-all"
                        >
                          Open History
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Orders Matches */}
              <div>
                <h4 className="text-[10px] font-black uppercase text-slate-450 tracking-wider mb-2">Orders Matches ({searchResults.orders.length})</h4>
                {searchResults.orders.length === 0 ? (
                  <p className="text-xs text-slate-350 italic pl-2">No matching orders</p>
                ) : (
                  <div className="space-y-2">
                    {searchResults.orders.map(order => (
                      <div key={order._id} className="p-3 border border-slate-150 rounded-2xl flex justify-between items-center bg-slate-50/30 hover:border-slate-300 transition-colors">
                        <div>
                          <p className="text-xs font-bold text-slate-900">{order.orderCode || "Order"} ({formatCurrency(order.totalAmount)})</p>
                          <p className="text-[10px] text-slate-500">Ship: {order.shippingInfo?.fullName} | Phone: {order.shippingInfo?.phone}</p>
                        </div>
                        <button
                          onClick={() => { handleViewCustomerHistory(order, "order"); setShowSearchModal(false); }}
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-bold rounded-lg transition-all"
                        >
                          Open History
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Designs Matches */}
              <div>
                <h4 className="text-[10px] font-black uppercase text-slate-450 tracking-wider mb-2">Design Ticket Matches ({searchResults.designs.length})</h4>
                {searchResults.designs.length === 0 ? (
                  <p className="text-xs text-slate-350 italic pl-2">No matching designs</p>
                ) : (
                  <div className="space-y-2">
                    {searchResults.designs.map(design => (
                      <div key={design._id} className="p-3 border border-slate-150 rounded-2xl flex justify-between items-center bg-slate-50/30 hover:border-slate-300 transition-colors">
                        <div>
                          <p className="text-xs font-bold text-slate-900">{design.designName} ({design.requestCode})</p>
                          <p className="text-[10px] text-slate-550">Dims: {design.dimensions} | Status: {design.status}</p>
                        </div>
                        <button
                          onClick={() => { navigate("/admin/designs"); setShowSearchModal(false); }}
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-bold rounded-lg transition-all"
                        >
                          View Ticket
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 4. Complete Customer Interaction History Modal */}
      {searchHistoryDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
          <div className="bg-white p-6 rounded-3xl w-full max-w-3xl shadow-2xl border border-slate-150 overflow-hidden flex flex-col h-[550px]">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 flex-shrink-0">
              <div>
                <h3 className="text-base font-black text-slate-900">Unified Profile: {searchHistoryDetail.customerName}</h3>
                <p className="text-[10px] text-slate-500 font-bold block mt-0.5">Phone: {searchHistoryDetail.phoneNum}</p>
              </div>
              <button onClick={() => setSearchHistoryDetail(null)} className="text-slate-400 hover:text-slate-700 font-bold">
                ✕ Close Profile
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-6">
              
              {/* Leads History timeline */}
              <div>
                <h4 className="text-[10px] font-black uppercase text-slate-450 tracking-wider mb-2 border-b pb-1">Leads Inquiries history</h4>
                {searchHistoryDetail.leads.length === 0 ? (
                  <p className="text-xs text-slate-350 italic pl-2">No inquiry logs</p>
                ) : (
                  searchHistoryDetail.leads.map(l => (
                    <div key={l._id} className="p-3 border border-slate-150 bg-slate-50/20 rounded-2xl mb-2 text-xs">
                      <div className="flex justify-between font-bold text-slate-800">
                        <span>Inquiry {l.leadCode} ({l.status})</span>
                        <span className="text-[10px] text-slate-400">{new Date(l.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-slate-600 mt-1"><strong>Requirement:</strong> {l.requirement}</p>
                      {l.notes?.length > 0 && (
                        <div className="mt-2 bg-white border p-2 rounded-xl text-[10px] space-y-1">
                          <p className="font-bold text-slate-450 uppercase text-[8px] tracking-wider border-b pb-0.5">Interaction remarks</p>
                          {l.notes.map((n, idx) => (
                            <p key={idx}>"{n.text}" - <strong className="text-slate-500">{n.author}</strong></p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Custom Design Tickets History */}
              <div>
                <h4 className="text-[10px] font-black uppercase text-slate-450 tracking-wider mb-2 border-b pb-1">Custom Design Tickets</h4>
                {searchHistoryDetail.designs.length === 0 ? (
                  <p className="text-xs text-slate-350 italic pl-2">No design requests raised</p>
                ) : (
                  searchHistoryDetail.designs.map(d => (
                    <div key={d._id} className="p-3 border border-slate-150 bg-slate-50/20 rounded-2xl mb-2 text-xs space-y-1">
                      <div className="flex justify-between font-bold text-slate-800">
                        <span>Ticket: {d.requestCode} - {d.designName}</span>
                        <span className="text-blue-600">{d.status}</span>
                      </div>
                      <p className="text-slate-655"><strong>Specs:</strong> {d.materialSpecs} ({d.dimensions})</p>
                    </div>
                  ))
                )}
              </div>

              {/* Order Bookings History */}
              <div>
                <h4 className="text-[10px] font-black uppercase text-slate-450 tracking-wider mb-2 border-b pb-1">Order Bookings</h4>
                {searchHistoryDetail.orders.length === 0 ? (
                  <p className="text-xs text-slate-350 italic pl-2">No orders placed</p>
                ) : (
                  searchHistoryDetail.orders.map(o => (
                    <div key={o._id} className="p-3 border border-slate-150 bg-slate-50/20 rounded-2xl mb-2 text-xs space-y-1">
                      <div className="flex justify-between font-bold text-slate-800">
                        <span>Order: {o.orderCode || `#${o._id.slice(-6)}`} - {o.orderStatus}</span>
                        <span>{formatCurrency(o.totalAmount)} ({o.paymentStatus})</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-semibold">Address: {o.shippingInfo?.address}, {o.shippingInfo?.city}</p>
                    </div>
                  ))
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 5. Quick Design Modal */}
      {showDesignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white p-6 rounded-3xl w-full max-w-md shadow-2xl border border-slate-150 animate-scale-up">
            <h3 className="text-lg font-black text-slate-900 mb-4">Raise Design Request Ticket</h3>
            
            <form onSubmit={handleCreateDesignTicket} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-550 mb-1">Design Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Laser Cutting Partition Screen"
                  value={designForm.designName}
                  onChange={(e) => setDesignForm(prev => ({ ...prev, designName: e.target.value }))}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-550 mb-1">Dimensions (mm)</label>
                  <input
                    type="text"
                    placeholder="e.g. 1000 x 2000"
                    value={designForm.dimensions}
                    onChange={(e) => setDesignForm(prev => ({ ...prev, dimensions: e.target.value }))}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-550 mb-1">Material Specs</label>
                  <input
                    type="text"
                    placeholder="e.g. 2mm PP Black"
                    value={designForm.materialSpecs}
                    onChange={(e) => setDesignForm(prev => ({ ...prev, materialSpecs: e.target.value }))}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDesignModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Payment Screenshots Lightbox Modal */}
      {activeReceiptScreenshot && (
        <div 
          onClick={() => setActiveReceiptScreenshot(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur p-4 cursor-zoom-out"
        >
          <div className="relative max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl animate-scale-up" onClick={(e) => e.stopPropagation()}>
            <img 
              src={activeReceiptScreenshot} 
              alt="Manual Bank Transfer Receipt" 
              className="max-w-full max-h-[80vh] object-contain rounded-t-2xl"
            />
            <div className="p-3.5 bg-slate-900/90 text-white flex justify-between items-center text-xs font-bold">
              <span>Payment Receipt Verification Lightbox</span>
              <button 
                onClick={() => setActiveReceiptScreenshot(null)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-red-600 rounded-lg transition-colors cursor-pointer"
              >
                ✕ Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SalesDashboard;

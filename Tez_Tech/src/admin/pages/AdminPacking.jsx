import { useState, useEffect, useRef } from "react";
import { 
  FaGift, FaCheck, FaSearch, FaExclamationTriangle, FaBoxOpen, 
  FaTape, FaPrint, FaHistory, FaTimes, FaSpinner, FaPaperPlane 
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import api from "../../utils/api";

const AdminPacking = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Dashboard Metrics
  const [metrics, setMetrics] = useState({
    awaitingPacking: 0,
    packedToday: 0,
    reworkCount: 0
  });

  // Consumables stock
  const [materials, setMaterials] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);

  // QC Checklist state: map of orderId -> itemIndex -> verifiedBoolean
  const [checklist, setChecklist] = useState({});

  // Rework Modal state
  const [reworkModalOpen, setReworkModalOpen] = useState(false);
  const [reworkOrderId, setReworkOrderId] = useState(null);
  const [reworkReason, setReworkReason] = useState("");
  const [submittingRework, setSubmittingRework] = useState(false);

  // Auto-focus barcode input
  const scannerInputRef = useRef(null);

  useEffect(() => {
    fetchPackingQueue();
    fetchMetrics();
    fetchMaterials();
    // Auto-focus scanner on mount
    if (scannerInputRef.current) {
      scannerInputRef.current.focus();
    }
  }, []);

  const fetchPackingQueue = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/orders");
      if (res.data.success) {
        // Filter orders that are ready for packing (production completed and not yet packed)
        const packingQueue = (res.data.orders || []).filter(
          (o) => o.productionStatus === "Completed" && o.packingStatus === "Awaiting Packing"
        );
        setOrders(packingQueue);

        // Keep selected order updated if it is still in the queue
        if (selectedOrder) {
          const updatedSelected = packingQueue.find(o => o._id === selectedOrder._id);
          setSelectedOrder(updatedSelected || null);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load packing orders queue");
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const res = await api.get("/orders/admin/packing/metrics");
      if (res.data.success) {
        setMetrics(res.data.metrics);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMaterials = async () => {
    try {
      setLoadingMaterials(true);
      const res = await api.get("/materials");
      if (res.data.success) {
        // Filter only packaging materials
        const packagingConsumables = (res.data.materials || []).filter(
          m => m.sku.startsWith("box-") || m.sku.startsWith("tape-") || m.sku.startsWith("bubble-")
        );
        setMaterials(packagingConsumables);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMaterials(false);
    }
  };

  // Barcode / QR Scanner Input Handler (triggers when pressing Enter)
  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    const cleanSearch = searchTerm.trim().toUpperCase();
    if (!cleanSearch) return;

    // Find by Job Card Code or Order Code or Order Number
    const matched = orders.find(
      (o) => 
        o.orderCode?.toUpperCase() === cleanSearch ||
        String(o.orderNumber) === cleanSearch ||
        o.items?.some(item => item.sku?.toUpperCase() === cleanSearch)
    );

    if (matched) {
      setSelectedOrder(matched);
      // Initialize checklist for this order if not exists
      if (!checklist[matched._id]) {
        const itemStates = {};
        matched.items?.forEach((_, idx) => {
          itemStates[idx] = false;
        });
        setChecklist(prev => ({ ...prev, [matched._id]: itemStates }));
      }
      toast.success(`Scanned successfully: Order ${matched.orderCode}`);
      setSearchTerm("");
    } else {
      toast.error(`No active packing order matches scan: "${cleanSearch}"`);
    }
  };

  // Select an order manually from the list
  const handleSelectOrder = (order) => {
    setSelectedOrder(order);
    if (!checklist[order._id]) {
      const itemStates = {};
      order.items?.forEach((_, idx) => {
        itemStates[idx] = false;
      });
      setChecklist(prev => ({ ...prev, [order._id]: itemStates }));
    }
    // Auto focus scanner input back
    if (scannerInputRef.current) {
      scannerInputRef.current.focus();
    }
  };

  // Toggle item verification in checklist
  const handleToggleChecklist = (orderId, itemIndex) => {
    setChecklist(prev => {
      const orderChecklist = { ...prev[orderId] };
      orderChecklist[itemIndex] = !orderChecklist[itemIndex];
      return { ...prev, [orderId]: orderChecklist };
    });
  };

  // Verify if all items for the selected order are checked
  const isOrderFullyVerified = (orderId) => {
    const orderChecklist = checklist[orderId];
    if (!orderChecklist) return false;
    return Object.values(orderChecklist).every(val => val === true);
  };

  // Submit handoff to dispatch & trigger PDF print page in new tab
  const handleMarkPackedAndPrint = async (orderId) => {
    if (!isOrderFullyVerified(orderId)) {
      toast.error("Please complete the Quantity Verification checklist first!");
      return;
    }

    try {
      const res = await api.put(`/orders/admin/pack/${orderId}`);
      if (res.data.success) {
        toast.success("Order marked as packed! Forwarded to Dispatch.");
        
        // Open combined print layout in a new tab
        window.open(`/admin/orders/print-pack-docs/${orderId}`, "_blank");

        // Clear selection and refresh list
        setSelectedOrder(null);
        fetchPackingQueue();
        fetchMetrics();
        fetchMaterials();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to complete packing updates");
    }
  };

  // Rework request submission
  const handleSendToRework = async () => {
    if (!reworkReason.trim()) {
      toast.error("Rework description is required");
      return;
    }

    try {
      setSubmittingRework(true);
      const res = await api.put(`/orders/admin/rework/${reworkOrderId}`, {
        reason: reworkReason
      });

      if (res.data.success) {
        toast.success("Order sent back to Manufacturing for Rework!");
        setReworkModalOpen(false);
        setReworkReason("");
        setSelectedOrder(null);
        fetchPackingQueue();
        fetchMetrics();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to return order to rework");
    } finally {
      setSubmittingRework(false);
    }
  };

  // Trigger material replenishment alert
  const handleRequestConsumable = async (material) => {
    try {
      const res = await api.post("/notifications", {
        recipientRole: "purchase",
        text: `📦 REPLENISHMENT REQUIRED: Packing operator requested stock refill for "${material.name}" (SKU: ${material.sku}). Current stock: ${material.stock} ${material.unit}.`
      });

      if (res.data.success) {
        toast.success(`Refill request sent to Purchase for ${material.name}!`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit refill request");
    }
  };

  // Count total units in an order
  const getOrderTotalQty = (order) => {
    return order.items?.reduce((acc, item) => acc + (item.quantity || 0), 0) || 0;
  };

  // Detect handling tag flags
  const getHandlingInstructions = (order) => {
    const notes = order.orderNotes?.toLowerCase() || "";
    const tags = [];
    
    // Check if notes or items names contain fragile keywords
    const isFragile = notes.includes("fragile") || notes.includes("kaanch") || 
      order.items?.some(item => 
        item.name?.toLowerCase().includes("fragile") || 
        item.name?.toLowerCase().includes("glass") || 
        item.name?.toLowerCase().includes("acrylic")
      );
      
    // Check if notes or items contain bend keywords
    const isDoNotBend = notes.includes("do not bend") || notes.includes("bend") ||
      order.items?.some(item => 
        item.name?.toLowerCase().includes("stencil") || 
        item.name?.toLowerCase().includes("hdpe") || 
        item.name?.toLowerCase().includes("do not bend")
      );

    if (isFragile) tags.push("FRAGILE");
    if (isDoNotBend) tags.push("DO NOT BEND");
    
    return tags;
  };

  // Filter queue list based on search/barcode input (realtime filtering)
  const filteredOrders = orders.filter(
    (o) =>
      o.orderCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(o.orderNumber).includes(searchTerm) ||
      o.shippingInfo?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Identify any Super Urgent running orders for the warning ticker
  const superUrgentOrders = orders.filter(o => o.isSuperUrgent || o.orderNotes?.toLowerCase().includes("super urgent"));

  return (
    <div className="space-y-6 p-1 bg-slate-50/50 min-h-screen text-slate-800">
      
      {/* 1. URGENT ALERTS BLINKING TICKER */}
      {superUrgentOrders.length > 0 && (
        <div className="bg-rose-600 text-white py-2 px-4 rounded-xl flex items-center gap-3 shadow-md animate-pulse">
          <FaExclamationTriangle className="text-white text-lg shrink-0" />
          <div className="text-xs font-black tracking-wider uppercase overflow-hidden whitespace-nowrap w-full">
            <span className="inline-block animate-marquee">
              ⚠️ SUPER URGENT ORDERS AWAITING IMMEDIATE PACKING: &nbsp;
              {superUrgentOrders.map(o => `${o.orderCode} (${o.shippingInfo?.fullName})`).join("  |  ")}
            </span>
          </div>
        </div>
      )}

      {/* 2. TOP SCANNER HEADER BAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-white">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 tracking-tight text-white">
            <FaGift className="text-blue-500 text-2xl" /> TezTech Packing Workbench
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Scan order barcodes, verify quantities with zero paper trail, and route parcel tags directly.
          </p>
        </div>

        <form onSubmit={handleBarcodeSubmit} className="relative w-full md:w-96">
          <div className="relative">
            <FaSearch className="absolute text-slate-500 left-4 top-1/2 -translate-y-1/2" />
            <input
              ref={scannerInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Scan Barcode (Job Card / Order ID)..."
              className="w-full py-3.5 pl-11 pr-24 bg-slate-950/80 border border-slate-800 text-sm rounded-2xl text-white font-mono placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-inner uppercase"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 text-[9px] font-black uppercase rounded bg-green-500/25 border border-green-500 text-green-400 tracking-wider animate-pulse">
              Scanner Active
            </span>
          </div>
        </form>
      </div>

      {/* 3. SHIFT METRICS STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-4 rounded-xl bg-blue-50 text-blue-600 shrink-0">
            <FaBoxOpen className="text-2xl" />
          </div>
          <div>
            <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Awaiting Packing</div>
            <div className="text-2xl font-extrabold text-slate-800 mt-0.5">{metrics.awaitingPacking}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Orders in manufacturing warehouse</div>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-4 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
            <FaCheck className="text-2xl" />
          </div>
          <div>
            <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Packed Today</div>
            <div className="text-2xl font-extrabold text-slate-800 mt-0.5">{metrics.packedToday}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Dispatched boxes sealed & labelled</div>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-4 rounded-xl bg-rose-50 text-rose-600 shrink-0">
            <FaHistory className="text-2xl" />
          </div>
          <div>
            <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Rework / Rejected</div>
            <div className="text-2xl font-extrabold text-slate-800 mt-0.5">{metrics.reworkCount}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Returned queue for defect check</div>
          </div>
        </div>
      </div>

      {/* 4. WORKSPACE SPLIT: PACKING QUEUE & QC WORKBENCH */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: THE PACKING QUEUE (Lg: 5 columns) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">Packing Queue</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Completed by Laser Operator</p>
              </div>
              <span className="px-2.5 py-1 text-[10px] font-bold bg-slate-100 text-slate-600 rounded-full">
                {filteredOrders.length} Ready
              </span>
            </div>

            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
                <FaSpinner className="animate-spin text-2xl text-blue-500" />
                <span className="text-xs">Loading queue...</span>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="py-16 text-center text-slate-400 border border-dashed rounded-xl border-slate-200">
                No orders ready for packing.
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {filteredOrders.map((order) => {
                  const isSelected = selectedOrder?._id === order._id;
                  const isUrgent = order.isSuperUrgent || order.orderNotes?.toLowerCase().includes("urgent");
                  const tags = getHandlingInstructions(order);
                  const totalItems = getOrderTotalQty(order);

                  return (
                    <div
                      key={order._id}
                      onClick={() => handleSelectOrder(order)}
                      className={`group p-4 border rounded-2xl shadow-sm transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                        isSelected 
                          ? "bg-blue-600 border-blue-600 text-white scale-[1.01]" 
                          : isUrgent
                          ? "bg-rose-50/50 border-rose-200 hover:border-rose-350"
                          : "bg-white border-slate-150 hover:border-slate-350"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className={`text-xs font-black font-mono tracking-wider ${isSelected ? 'text-blue-100' : 'text-blue-600'}`}>
                            {order.orderCode}
                          </span>
                          <h4 className={`text-sm font-extrabold mt-1 leading-tight ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                            {order.shippingInfo?.fullName}
                          </h4>
                        </div>
                        {isUrgent && (
                          <span className="px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded bg-rose-600 text-white border border-rose-400 animate-pulse">
                            Super Urgent
                          </span>
                        )}
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-slate-100/50">
                        <span className={`text-[10px] font-bold ${isSelected ? 'text-blue-200' : 'text-slate-500'}`}>
                          Total Pieces: <strong className={isSelected ? 'text-white font-extrabold' : 'text-slate-700 font-extrabold'}>{totalItems}</strong>
                        </span>
                        
                        {/* Handling Instructions Tags */}
                        <div className="flex gap-1">
                          {tags.map((tag, idx) => (
                            <span 
                              key={idx} 
                              className={`px-1.5 py-0.5 rounded text-[8px] font-black tracking-wider ${
                                tag === "FRAGILE" 
                                  ? "bg-orange-500 text-white border border-orange-400" 
                                  : "bg-yellow-400 text-slate-900 border border-yellow-300"
                              }`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SIDEBAR CONSUMABLES TRACKER */}
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm">
            <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider pb-4 border-b border-slate-100 mb-4 flex items-center gap-2">
              <FaBoxOpen className="text-slate-500" /> Packaging Materials
            </h3>

            {loadingMaterials ? (
              <div className="py-8 text-center text-slate-400 text-xs flex justify-center items-center gap-2">
                <FaSpinner className="animate-spin text-blue-500" /> Seeding & loading...
              </div>
            ) : materials.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                No materials registered.
              </div>
            ) : (
              <div className="space-y-4">
                {materials.map((mat) => {
                  const isLow = mat.stock < mat.minStockLimit;
                  return (
                    <div key={mat._id} className="p-3 border border-slate-100 rounded-xl flex items-center justify-between gap-2 hover:bg-slate-50 transition">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-lg shrink-0 ${isLow ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
                          {mat.sku.includes("tape") ? <FaTape /> : <FaBoxOpen />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800 leading-tight">{mat.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">SKU: {mat.sku}</div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex items-center gap-3">
                        <div>
                          <div className={`text-xs font-extrabold ${isLow ? 'text-rose-600' : 'text-slate-800'}`}>
                            {mat.stock} {mat.unit}
                          </div>
                          {isLow && (
                            <span className="text-[8px] font-black text-rose-500 uppercase tracking-wider block mt-0.5">
                              Low Stock
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => handleRequestConsumable(mat)}
                          className={`px-2 py-1.5 rounded-lg text-[9px] font-bold border transition ${
                            isLow 
                              ? "bg-rose-600 border-rose-500 text-white hover:bg-rose-700" 
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          Refill
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: FINAL QC WORKBENCH (Lg: 7 columns) */}
        <div className="lg:col-span-7">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-white min-h-[500px] flex flex-col justify-between">
            {selectedOrder ? (
              <div className="flex flex-col h-full justify-between gap-6">
                
                {/* QC Workbench Header */}
                <div className="pb-4 border-b border-slate-800 flex justify-between items-start gap-4">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider bg-blue-500/20 border border-blue-500 text-blue-400 uppercase">
                      QC Active
                    </span>
                    <h3 className="text-lg font-bold text-white mt-1.5 flex items-center gap-2">
                      Order Checklist: <strong className="font-mono text-blue-400 font-bold">{selectedOrder.orderCode}</strong>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Client: {selectedOrder.shippingInfo?.fullName} | Address: {selectedOrder.shippingInfo?.city}, {selectedOrder.shippingInfo?.state}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                  >
                    <FaTimes />
                  </button>
                </div>

                {/* Items QC Checklist */}
                <div className="space-y-4 flex-1">
                  <div>
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">
                      Quantity Verification Checklist
                    </h4>
                    <p className="text-[10px] text-slate-500 mb-3">
                      Verify each physical item against the list below before placing it in the box.
                    </p>
                  </div>

                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                    {selectedOrder.items?.map((item, idx) => {
                      const isChecked = checklist[selectedOrder._id]?.[idx] || false;
                      return (
                        <div
                          key={idx}
                          onClick={() => handleToggleChecklist(selectedOrder._id, idx)}
                          className={`p-3.5 border rounded-2xl flex items-center justify-between gap-4 cursor-pointer transition ${
                            isChecked
                              ? "bg-slate-950 border-emerald-500/35 text-white"
                              : "bg-slate-950/50 border-slate-800 text-slate-300 hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                              className="w-4 h-4 rounded text-emerald-600 border-slate-700 bg-slate-950 focus:ring-0 focus:ring-offset-0 cursor-pointer shrink-0"
                            />
                            <div>
                              <div className="text-xs font-bold font-mono tracking-wide text-white uppercase leading-tight">
                                {item.name}
                              </div>
                              {item.size && (
                                <div className="text-[10px] text-slate-500 mt-0.5">Size/Specs: {item.size}</div>
                              )}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className={`text-xs font-black px-2 py-1 rounded ${isChecked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                              Qty: {item.quantity}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Workbench Action Footer */}
                <div className="pt-5 border-t border-slate-850 flex flex-col sm:flex-row gap-4 justify-between items-center">
                  
                  {/* Defect trigger */}
                  <button
                    onClick={() => {
                      setReworkOrderId(selectedOrder._id);
                      setReworkModalOpen(true);
                    }}
                    className="w-full sm:w-auto px-4 py-3 border border-rose-900/50 bg-rose-950/20 text-rose-400 hover:bg-rose-950/40 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FaExclamationTriangle className="text-rose-500" /> Send Back to Rework
                  </button>

                  {/* Mark box packed & Generate Documents */}
                  <button
                    onClick={() => handleMarkPackedAndPrint(selectedOrder._id)}
                    disabled={!isOrderFullyVerified(selectedOrder._id)}
                    className={`w-full sm:w-auto px-6 py-3.5 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                      isOrderFullyVerified(selectedOrder._id)
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-750"
                    }`}
                  >
                    <FaCheck /> Mark Box Packed & Print Docs
                  </button>

                </div>

              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-500 py-32 text-center h-full max-h-[500px]">
                <FaBoxOpen className="text-5xl text-slate-700 mb-3" />
                <h3 className="font-extrabold text-sm text-slate-400 uppercase tracking-wider">QC workbench idle</h3>
                <p className="text-[10px] text-slate-500 mt-1 max-w-xs">
                  Scan a Job Card barcode or select a ready order from the packing queue list on the left to begin quality checks.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 5. REWORK REASON MODAL DIALOG */}
      {reworkModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl max-w-md w-full text-white space-y-4">
            
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2 text-rose-500">
                  <FaExclamationTriangle /> Report Quality Defect
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  This order will be returned to Manufacturing with your feedback notes.
                </p>
              </div>
              <button
                onClick={() => setReworkModalOpen(false)}
                className="p-1.5 text-slate-500 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                Defect / Scratch Reason Description
              </label>
              <textarea
                value={reworkReason}
                onChange={(e) => setReworkReason(e.target.value)}
                placeholder="Describe sheet scratches, sizing defects, or machine error details..."
                rows="4"
                className="w-full p-3 bg-slate-950 border border-slate-800 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 placeholder-slate-750"
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setReworkModalOpen(false)}
                className="px-4 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSendToRework}
                disabled={submittingRework}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-rose-900/10"
              >
                {submittingRework ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
                Submit Rework Action
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Embedded Animations Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 25s linear infinite;
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
      `}} />

    </div>
  );
};

export default AdminPacking;

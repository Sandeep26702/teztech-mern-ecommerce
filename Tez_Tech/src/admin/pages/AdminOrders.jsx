import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { getApiUrl } from "../../utils/api.js";
import { 
  FaSearch, FaFilter,
  FaChevronDown, FaChevronUp,
  FaChevronRight, FaTruck, FaShoppingBag
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import TaxInvoice from "../components/TaxInvoice";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Filter States
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [counts, setCounts] = useState({ all: 0, unpaid_unshipped: 0, paid_unshipped: 0, fulfillment: 0 });
  const [shippingMethods, setShippingMethods] = useState([]);
  
  const initialFilterState = {
    paymentStatus: "",
    orderStatus: "",
    paymentMethod: "",
    courierPartner: "",
    startDate: "",
    endDate: "",
    deliveryDateFrom: "",
    deliveryDateTo: "",
    productSearch: "",
    minTotal: "",
    maxTotal: "",
    search: ""
  };
  const [filterState, setFilterState] = useState(initialFilterState);
  const [debouncedFilter, setDebouncedFilter] = useState(initialFilterState);

  // Expanded filter accordions
  const [openFilterAccordions, setOpenFilterAccordions] = useState({
    date: false,
    paymentStatus: false,
    fulfillmentStatus: false,
    paymentMethod: false,
    shippingMethod: false,
    deliveryDate: false,
    products: false,
    amount: false,
  });
  
  // New States
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [expandedOrders, setExpandedOrders] = useState({});
  const [allExpanded, setAllExpanded] = useState(false);
  const [printingOrder, setPrintingOrder] = useState(null);
  
  // activeDropdown handles Action Menu, Payment Status, Fulfillment Status
  // Values: `${orderId}-action`, `${orderId}-payment`, `${orderId}-fulfillment`
  const [activeDropdown, setActiveDropdown] = useState(null); 

  const navigate = useNavigate();
  const invoiceRef = useRef();

  const triggerPrint = (order) => {
    setPrintingOrder(order);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const config = { 
        headers: { Authorization: `Bearer ${token}` },
        params: debouncedFilter
      };
      const API_URL = getApiUrl();
      const res = await axios.get(`${API_URL}/admin/orders`, config);
      if (res.data.success) {
        setOrders(res.data.orders);
        if (res.data.counts) {
          setCounts(res.data.counts);
        }
        if (res.data.shippingMethods) {
          setShippingMethods(res.data.shippingMethods);
        }
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Failed to load orders.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setFilterState(initialFilterState);
  };

  const removeFilter = (key) => {
    if (key === 'date') {
      setFilterState({ ...filterState, startDate: "", endDate: "" });
    } else if (key === 'total') {
      setFilterState({ ...filterState, minTotal: "", maxTotal: "" });
    } else {
      setFilterState({ ...filterState, [key]: "" });
    }
  };

  const handleDatePreset = (preset) => {
    const today = new Date();
    let startDate = "";
    let endDate = today.toISOString().split('T')[0];

    switch (preset) {
      case 'today':
        startDate = endDate;
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        startDate = yesterday.toISOString().split('T')[0];
        endDate = startDate;
        break;
      case 'last7':
        const last7 = new Date(today);
        last7.setDate(last7.getDate() - 7);
        startDate = last7.toISOString().split('T')[0];
        break;
      case 'last30':
        const last30 = new Date(today);
        last30.setDate(last30.getDate() - 30);
        startDate = last30.toISOString().split('T')[0];
        break;
      case 'thisMonth':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        break;
      case 'thisYear':
        startDate = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
        break;
      default:
        startDate = "";
        endDate = "";
    }
    setFilterState({ ...filterState, startDate, endDate });
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilter(filterState);
    }, 500);
    return () => clearTimeout(handler);
  }, [filterState]);

  useEffect(() => {
    fetchOrders();
  }, [debouncedFilter]);

  useEffect(() => {
    // Close dropdowns on outside click
    const handleClickOutside = (e) => {
      if (!e.target.closest('.custom-dropdown-container')) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleStatusChange = async (orderId, newStatus, type) => {
    setActiveDropdown(null); // Close dropdown immediately
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const payload = {};
      if (type === 'payment') {
        payload.paymentStatus = newStatus;
      } else {
        payload.orderStatus = newStatus;
      }

      setOrders(orders.map(o => 
        o._id === orderId 
          ? { ...o, ...(type === 'payment' ? { paymentStatus: newStatus } : { orderStatus: newStatus }) } 
          : o
      ));

      const API_URL = getApiUrl();
      const res = await axios.put(`${API_URL}/admin/orders/${orderId}/status`, payload, config);
      if (!res.data.success) {
        fetchOrders();
        alert("Failed to update status.");
      }
    } catch (err) {
      fetchOrders();
      alert("Failed to update status. Please try again.");
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedOrders(orders.map(o => o._id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectOrder = (id) => {
    setSelectedOrders(prev => 
      prev.includes(id) ? prev.filter(oId => oId !== id) : [...prev, id]
    );
  };

  const toggleAccordion = (id) => {
    setExpandedOrders(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleAllExpanded = () => {
    const nextState = !allExpanded;
    setAllExpanded(nextState);
    if (nextState) {
      const newExpanded = {};
      orders.forEach(o => newExpanded[o._id] = true);
      setExpandedOrders(newExpanded);
    } else {
      setExpandedOrders({});
    }
  };

  const getItemAttributes = (item) => {
    let attrs = item.attributes || item.selectedAttributes || item.selectedCustomFields || item.customFields;
    if (!attrs) return [];
    
    if (Array.isArray(attrs)) {
      return attrs
        .filter(attr => {
          const name = attr.name || attr.label || '';
          const lowerName = name.toLowerCase();
          return lowerName !== 'final price' && lowerName !== '_finalprice';
        })
        .map(attr => [
          attr.name || attr.label || 'Attribute', 
          attr.value || attr.options?.[0] || String(attr)
        ]);
    }
    
    return Object.entries(attrs)
      .filter(([k]) => {
        const lowerK = k.toLowerCase();
        return lowerK !== 'final price' && lowerK !== '_finalprice';
      })
      .map(([k, v]) => {
        let displayValue = v;
        if (typeof v === 'object' && v !== null) {
          displayValue = v.value || v.label || JSON.stringify(v);
        }
        return [k, displayValue];
      });
  };

  const toggleDropdown = (e, id) => {
    e.stopPropagation();
    if (activeDropdown === id) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(id);
    }
  };

  const paymentOptions = ["Paid", "Awaiting Payment", "Canceled", "Refunded", "Partially Refunded"];
  const fulfillmentOptions = ["Awaiting Processing", "Processing", "Ready For Pickup", "Shipped", "Out For Delivery", "Delivered", "Delivery Canceled", "Returned"];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-[#2463d1] rounded-full border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <div className="hidden print:block absolute top-0 left-0 w-full bg-white z-[9999]">
        {printingOrder && <TaxInvoice order={printingOrder} />}
      </div>

      <div className="print:hidden mx-auto font-sans bg-[#f4f6f8] flex flex-col h-[calc(100vh-64px)] -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8" style={{ fontFamily: 'Arial, sans-serif' }}>

        {/* HEADER */}
        <div className="mb-4 shrink-0 flex justify-between items-center">
          <h2 className="text-[28px] font-semibold text-[#1a1a1a]">Orders</h2>
          <button
            type="button"
            onClick={() => navigate('/admin/orders/create')}
            className="bg-[#2463d1] hover:bg-[#1c51b0] text-white text-[13px] font-semibold py-2 px-6 rounded flex items-center gap-1 transition-all shadow-md active:scale-95"
          >
            <span className="text-lg leading-none">+</span> Create Order
          </button>
        </div>
      
        {error && <div className="p-4 mb-4 text-sm font-bold text-red-700 border-l-4 border-red-500 bg-red-50 shrink-0">{error}</div>}

        {/* TWO-COLUMN LAYOUT WRAPPER */}
        <div className="flex flex-col gap-4 flex-1 min-h-0">
          
          {/* Top Filter & Search */}
          <div className="flex gap-2 mb-2 shrink-0">
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2 px-4 py-2 text-[14px] font-semibold text-[#4a5568] bg-white border border-[#c4cdd5] hover:bg-gray-50 rounded shadow-sm transition-colors filter-button"
          >
            <FaFilter className="text-xs" /> Filter
          </button>
          <div className="relative flex-1">
            <FaSearch className="absolute text-[#8a94a6] left-3 top-1/2 -translate-y-1/2 text-sm" />
            <input 
              type="text" 
              placeholder="Order #, customer details, company name, phone number, address, items ordered, tax invoice #" 
              value={filterState.search}
              onChange={(e) => setFilterState({ ...filterState, search: e.target.value })}
              className="w-full h-full min-h-[36px] pl-9 pr-3 text-[14px] border border-[#c4cdd5] rounded focus:outline-none focus:border-[#5c6ac4] focus:ring-1 focus:ring-[#5c6ac4] transition-all placeholder-[#8a94a6] text-[#202223] shadow-sm bg-white"
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-start gap-6 flex-1 min-h-0">

          {/* LEFT SIDEBAR (Filters) */}
          <div className={`w-full md:w-[280px] shrink-0 flex flex-col gap-4 bg-white border border-[#d5dce4] rounded-sm shadow-sm p-4 overflow-y-auto custom-scrollbar h-full ${isFilterOpen ? 'block' : 'hidden'}`}>
            <div className="flex flex-col gap-2">
              <button onClick={() => setFilterState(initialFilterState)} className="text-left text-[14px] text-[#202223] hover:text-[#2463d1] flex justify-between items-center py-1">
                All Orders <span className="text-[#202223] font-semibold">{counts?.all || 0}</span>
              </button>
              <button onClick={() => setFilterState({...initialFilterState, paymentStatus: 'Awaiting Payment', orderStatus: 'Awaiting Processing'})} className="text-left text-[14px] text-[#2463d1] hover:underline flex justify-between items-center py-1">
                Not paid. Needs to be shipped <span className="text-[#2463d1] font-semibold">{counts?.unpaid_unshipped || 0}</span>
              </button>
              <button onClick={() => setFilterState({...initialFilterState, paymentStatus: 'Paid', orderStatus: 'Awaiting Processing'})} className="text-left text-[14px] text-[#2463d1] hover:underline flex justify-between items-center py-1">
                Paid. Needs to be shipped <span className="text-[#2463d1] font-semibold">{counts?.paid_unshipped || 0}</span>
              </button>
              <button onClick={() => setFilterState({...initialFilterState, orderStatus: 'Processing'})} className="text-left text-[14px] text-[#2463d1] hover:underline flex justify-between items-center py-1">
                Fulfillment in process <span className="text-[#2463d1] font-semibold">{counts?.fulfillment || 0}</span>
              </button>
            </div>
            
            <hr className="border-[#d5dce4]" />

            {/* Date */}
            <div>
              <button onClick={() => setOpenFilterAccordions({...openFilterAccordions, date: !openFilterAccordions.date})} className="flex justify-between items-center w-full text-left text-[14px] font-semibold text-[#202223] py-2">
                Date {openFilterAccordions.date ? <FaChevronUp className="text-[10px]" /> : <FaChevronDown className="text-[10px]" />}
              </button>
              {openFilterAccordions.date && (
                <div className="mt-2 flex flex-col gap-3">
                  <div className="flex gap-2 items-center">
                    <input type="date" value={filterState.startDate} onChange={(e) => setFilterState({...filterState, startDate: e.target.value})} className="w-full border border-[#c4cdd5] rounded px-2 py-1.5 text-[13px]" />
                    <span className="text-[#8a94a6] text-[12px]">to</span>
                    <input type="date" value={filterState.endDate} onChange={(e) => setFilterState({...filterState, endDate: e.target.value})} className="w-full border border-[#c4cdd5] rounded px-2 py-1.5 text-[13px]" />
                  </div>
                </div>
              )}
            </div>
            <hr className="border-[#d5dce4]" />

            {/* Payment Status */}
            <div>
              <button onClick={() => setOpenFilterAccordions({...openFilterAccordions, paymentStatus: !openFilterAccordions.paymentStatus})} className="flex justify-between items-center w-full text-left text-[14px] font-semibold text-[#202223] py-2">
                Payment Status {openFilterAccordions.paymentStatus ? <FaChevronUp className="text-[10px]" /> : <FaChevronDown className="text-[10px]" />}
              </button>
              {openFilterAccordions.paymentStatus && (
                <div className="mt-2">
                  <select value={filterState.paymentStatus} onChange={(e) => setFilterState({...filterState, paymentStatus: e.target.value})} className="w-full border border-[#c4cdd5] rounded px-2 py-1.5 text-[13px]">
                    <option value="">Any</option>
                    {paymentOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              )}
            </div>
            <hr className="border-[#d5dce4]" />

            {/* Fulfillment Status */}
            <div>
              <button onClick={() => setOpenFilterAccordions({...openFilterAccordions, fulfillmentStatus: !openFilterAccordions.fulfillmentStatus})} className="flex justify-between items-center w-full text-left text-[14px] font-semibold text-[#202223] py-2">
                Fulfillment Status {openFilterAccordions.fulfillmentStatus ? <FaChevronUp className="text-[10px]" /> : <FaChevronDown className="text-[10px]" />}
              </button>
              {openFilterAccordions.fulfillmentStatus && (
                <div className="mt-2">
                  <select value={filterState.orderStatus} onChange={(e) => setFilterState({...filterState, orderStatus: e.target.value})} className="w-full border border-[#c4cdd5] rounded px-2 py-1.5 text-[13px]">
                    <option value="">Any</option>
                    {fulfillmentOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              )}
            </div>
            <hr className="border-[#d5dce4]" />

            {/* Payment Method */}
            <div>
              <button onClick={() => setOpenFilterAccordions({...openFilterAccordions, paymentMethod: !openFilterAccordions.paymentMethod})} className="flex justify-between items-center w-full text-left text-[14px] font-semibold text-[#202223] py-2">
                Payment Method {openFilterAccordions.paymentMethod ? <FaChevronUp className="text-[10px]" /> : <FaChevronDown className="text-[10px]" />}
              </button>
              {openFilterAccordions.paymentMethod && (
                <div className="mt-2">
                  <select value={filterState.paymentMethod} onChange={(e) => setFilterState({...filterState, paymentMethod: e.target.value})} className="w-full border border-[#c4cdd5] rounded px-2 py-1.5 text-[13px]">
                    <option value="">Any</option>
                    <option value="ONLINE">ONLINE</option>
                    <option value="COD">COD</option>
                    <option value="Card">Card</option>
                    <option value="MANUAL TRANSFER">MANUAL TRANSFER</option>
                    <option value="STORE_PICKUP">STORE_PICKUP</option>
                  </select>
                </div>
              )}
            </div>
            <hr className="border-[#d5dce4]" />

            {/* Shipping Method */}
            <div>
              <button onClick={() => setOpenFilterAccordions({...openFilterAccordions, shippingMethod: !openFilterAccordions.shippingMethod})} className="flex justify-between items-center w-full text-left text-[14px] font-semibold text-[#202223] py-2">
                Shipping Method {openFilterAccordions.shippingMethod ? <FaChevronUp className="text-[10px]" /> : <FaChevronDown className="text-[10px]" />}
              </button>
              {openFilterAccordions.shippingMethod && (
                <div className="mt-2">
                  <select value={filterState.courierPartner} onChange={(e) => setFilterState({...filterState, courierPartner: e.target.value})} className="w-full border border-[#c4cdd5] rounded px-2 py-1.5 text-[13px]">
                    <option value="">Any</option>
                    {shippingMethods.map(method => <option key={method} value={method}>{method}</option>)}
                  </select>
                </div>
              )}
            </div>
            <hr className="border-[#d5dce4]" />

            {/* Pickup or delivery date and time */}
            <div>
              <button onClick={() => setOpenFilterAccordions({...openFilterAccordions, deliveryDate: !openFilterAccordions.deliveryDate})} className="flex justify-between items-center w-full text-left text-[14px] font-semibold text-[#202223] py-2">
                Pickup or delivery date and time {openFilterAccordions.deliveryDate ? <FaChevronUp className="text-[10px]" /> : <FaChevronDown className="text-[10px]" />}
              </button>
              {openFilterAccordions.deliveryDate && (
                <div className="mt-2 flex gap-2 items-center">
                  <input type="date" value={filterState.deliveryDateFrom} onChange={(e) => setFilterState({...filterState, deliveryDateFrom: e.target.value})} className="w-full border border-[#c4cdd5] rounded px-2 py-1.5 text-[13px]" />
                  <span className="text-[#8a94a6] text-[12px]">to</span>
                  <input type="date" value={filterState.deliveryDateTo} onChange={(e) => setFilterState({...filterState, deliveryDateTo: e.target.value})} className="w-full border border-[#c4cdd5] rounded px-2 py-1.5 text-[13px]" />
                </div>
              )}
            </div>
            <hr className="border-[#d5dce4]" />

            {/* Products */}
            <div>
              <button onClick={() => setOpenFilterAccordions({...openFilterAccordions, products: !openFilterAccordions.products})} className="flex justify-between items-center w-full text-left text-[14px] font-semibold text-[#202223] py-2">
                Products {openFilterAccordions.products ? <FaChevronUp className="text-[10px]" /> : <FaChevronDown className="text-[10px]" />}
              </button>
              {openFilterAccordions.products && (
                <div className="mt-2">
                  <input type="text" placeholder="Search product name or SKU" value={filterState.productSearch} onChange={(e) => setFilterState({...filterState, productSearch: e.target.value})} className="w-full border border-[#c4cdd5] rounded px-2 py-1.5 text-[13px]" />
                </div>
              )}
            </div>
            <hr className="border-[#d5dce4]" />

            {/* Order Total */}
            <div>
              <button onClick={() => setOpenFilterAccordions({...openFilterAccordions, amount: !openFilterAccordions.amount})} className="flex justify-between items-center w-full text-left text-[14px] font-semibold text-[#202223] py-2">
                Order Total {openFilterAccordions.amount ? <FaChevronUp className="text-[10px]" /> : <FaChevronDown className="text-[10px]" />}
              </button>
              {openFilterAccordions.amount && (
                <div className="mt-2 flex gap-2 items-center">
                  <input type="number" placeholder="Min ₹" value={filterState.minTotal} onChange={(e) => setFilterState({...filterState, minTotal: e.target.value})} className="w-full border border-[#c4cdd5] rounded px-2 py-1.5 text-[13px]" />
                  <span className="text-[#8a94a6] text-[12px]">-</span>
                  <input type="number" placeholder="Max ₹" value={filterState.maxTotal} onChange={(e) => setFilterState({...filterState, maxTotal: e.target.value})} className="w-full border border-[#c4cdd5] rounded px-2 py-1.5 text-[13px]" />
                </div>
              )}
            </div>
            <hr className="border-[#d5dce4]" />
            
            <button onClick={handleClearFilters} className="text-center text-[13px] font-semibold text-[#4a5568] hover:underline py-2">Clear all filters</button>

          </div>

          {/* MAIN LIST CONTAINER */}
          <div className="flex-1 min-w-0 bg-white border border-[#d5dce4] rounded-sm shadow-sm overflow-hidden flex flex-col h-full">

        {/* Mass Actions Bar */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-[#d5dce4] bg-[#f9fafb] shrink-0">
          <div className="flex items-center gap-3">
            <input 
              type="checkbox" 
              className="w-[14px] h-[14px] rounded-sm border-[#c4cdd5] text-[#2463d1] focus:ring-0 cursor-pointer"
              checked={selectedOrders.length === orders.length && orders.length > 0}
              onChange={handleSelectAll}
            />
            <div className="flex items-center gap-2 custom-dropdown-container">
              <select className="bg-white border border-[#c4cdd5] text-[#202223] text-[12px] font-semibold rounded py-1 pl-2 pr-6 h-7 focus:outline-none appearance-none cursor-pointer" style={{backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23202223' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 4px center', backgroundSize: '12px'}}>
                <option>Mass update</option>
                <option value="mark_paid">Mark as Paid</option>
                <option value="mark_shipped">Mark as Shipped</option>
                <option value="delete">Delete Selected</option>
              </select>
            </div>
            <span className="text-[11px] font-semibold text-[#5c6ac4] uppercase tracking-wider ml-2 cursor-pointer" onClick={() => setFilterState({ ...filterState, search: "" })}>Viewing all orders</span>
            <span className="text-[11px] font-semibold text-[#5c6ac4] uppercase tracking-wider ml-1 cursor-pointer" onClick={() => fetchOrders()}>Refresh</span>
          </div>
          <button onClick={toggleAllExpanded} className="text-[11px] font-semibold text-[#5c6ac4] uppercase tracking-wider flex items-center gap-1 cursor-pointer">
            {allExpanded ? "Collapse view" : "Expanded view"} <FaChevronDown className={`text-[10px] transform transition-transform ${allExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Active Filters Chips */}
        {(filterState.paymentStatus || filterState.orderStatus || filterState.paymentMethod || filterState.courierPartner || filterState.startDate || filterState.endDate || filterState.minTotal || filterState.maxTotal) && (
          <div className="px-3 py-2 border-b border-[#d5dce4] bg-white flex flex-wrap gap-2 items-center">
            <span className="text-[12px] font-semibold text-[#4a5568] mr-1">Active filters:</span>
            
            {filterState.paymentStatus && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#f4f6f8] border border-[#c4cdd5] rounded-full text-[12px] text-[#202223]">
                Payment: {filterState.paymentStatus}
                <button onClick={() => removeFilter('paymentStatus')} className="text-[#8a94a6] hover:text-[#202223] ml-1">&times;</button>
              </span>
            )}
            
            {filterState.orderStatus && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#f4f6f8] border border-[#c4cdd5] rounded-full text-[12px] text-[#202223]">
                Status: {filterState.orderStatus}
                <button onClick={() => removeFilter('orderStatus')} className="text-[#8a94a6] hover:text-[#202223] ml-1">&times;</button>
              </span>
            )}

            {filterState.paymentMethod && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#f4f6f8] border border-[#c4cdd5] rounded-full text-[12px] text-[#202223]">
                Method: {filterState.paymentMethod}
                <button onClick={() => removeFilter('paymentMethod')} className="text-[#8a94a6] hover:text-[#202223] ml-1">&times;</button>
              </span>
            )}

            {filterState.courierPartner && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#f4f6f8] border border-[#c4cdd5] rounded-full text-[12px] text-[#202223]">
                Courier: {filterState.courierPartner}
                <button onClick={() => removeFilter('courierPartner')} className="text-[#8a94a6] hover:text-[#202223] ml-1">&times;</button>
              </span>
            )}

            {(filterState.startDate || filterState.endDate) && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#f4f6f8] border border-[#c4cdd5] rounded-full text-[12px] text-[#202223]">
                Date: {filterState.startDate || 'Any'} to {filterState.endDate || 'Any'}
                <button onClick={() => removeFilter('date')} className="text-[#8a94a6] hover:text-[#202223] ml-1">&times;</button>
              </span>
            )}

            {(filterState.minTotal || filterState.maxTotal) && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#f4f6f8] border border-[#c4cdd5] rounded-full text-[12px] text-[#202223]">
                Total: {filterState.minTotal ? `₹${filterState.minTotal}` : 'Min'} - {filterState.maxTotal ? `₹${filterState.maxTotal}` : 'Max'}
                <button onClick={() => removeFilter('total')} className="text-[#8a94a6] hover:text-[#202223] ml-1">&times;</button>
              </span>
            )}

            <button onClick={handleClearFilters} className="text-[12px] text-[#2463d1] hover:underline ml-2">Clear all</button>
          </div>
        )}

        {/* Orders List */}
        <div className="flex flex-col flex-1 overflow-y-auto custom-scrollbar relative">
          {orders.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-[14px] text-[#6d7175]">No orders found.</p>
            </div>
          ) : (
            orders.map((order) => {
              const isExpanded = expandedOrders[order._id];
              const paymentColor = (order.paymentStatus === 'Paid' || order.paymentStatus === 'paid') ? '#008060' : '#e38a00';

              return (
                <div key={order._id} className="relative flex p-4 border-b border-[#d5dce4] hover:bg-[#f9fafb] transition-colors group">
                  
                  {/* Left Checkbox */}
                  <div className="pt-1 pr-4">
                    <input 
                      type="checkbox" 
                      className="w-[14px] h-[14px] rounded-sm border-[#c4cdd5] text-[#2463d1] focus:ring-0 cursor-pointer"
                      checked={selectedOrders.includes(order._id)}
                      onChange={() => handleSelectOrder(order._id)}
                    />
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 min-w-0 pr-[180px] sm:pr-56">
                    
                    {/* Header Row: ID and Date */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-1">
                      <h3 
                        className="text-[18px] font-bold text-[#202223] cursor-pointer hover:underline" 
                        onClick={() => navigate(`/admin/orders/${order._id}`)}
                      >
                        {order.orderCode || `#${order.orderNumber || order._id.slice(-6)}`}
                      </h3>
                      <span className="text-[13px] sm:text-[15px] text-[#6d7175]">
                        {new Date(order.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true })}
                      </span>
                    </div>

                    {/* Status Row with CUSTOM DROPDOWNS */}
                    <div className="flex items-center gap-4 mb-2">
                      
                      {/* Payment Dropdown */}
                      <div className="relative custom-dropdown-container">
                        <button 
                          onClick={(e) => toggleDropdown(e, `${order._id}-payment`)}
                          className="flex items-center gap-1 text-[13px] font-semibold focus:outline-none"
                          style={{ color: paymentColor }}
                        >
                          {order.paymentStatus || 'Awaiting Payment'} <FaChevronDown className="text-[10px]" />
                        </button>
                        {activeDropdown === `${order._id}-payment` && (
                          <div className="absolute left-0 mt-1 w-48 bg-white border border-[#d5dce4] rounded shadow-lg py-2 z-20">
                            {paymentOptions.map((opt) => (
                              <button 
                                key={opt}
                                onClick={() => handleStatusChange(order._id, opt, 'payment')}
                                className="w-full text-left px-4 py-1.5 text-[13px] text-[#202223] hover:bg-[#f4f6f8]"
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Fulfillment Dropdown */}
                      <div className="relative custom-dropdown-container">
                        <button 
                          onClick={(e) => toggleDropdown(e, `${order._id}-fulfillment`)}
                          className="flex items-center gap-1 text-[13px] font-semibold text-[#2463d1] focus:outline-none"
                        >
                          {order.orderStatus || 'Awaiting Processing'} <FaChevronDown className="text-[10px]" />
                        </button>
                        {activeDropdown === `${order._id}-fulfillment` && (
                          <div className="absolute left-0 mt-1 w-48 bg-white border border-[#d5dce4] rounded shadow-lg py-2 z-20">
                            {fulfillmentOptions.map((opt) => (
                              <button 
                                key={opt}
                                onClick={() => handleStatusChange(order._id, opt, 'fulfillment')}
                                className="w-full text-left px-4 py-1.5 text-[13px] text-[#202223] hover:bg-[#f4f6f8]"
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>

                    {/* Customer Info */}
                    <div className="text-[13px] leading-tight text-[#202223] mb-3">
                      <div className="flex gap-1 mb-0.5">
                        <span>{order.shippingInfo?.fullName || "Guest"}</span>
                        <a href={`mailto:${order.shippingInfo?.email}`} className="text-[#2463d1] hover:underline">
                          {order.shippingInfo?.email}
                        </a>
                      </div>
                      {order.shippingInfo?.companyName && <div className="mb-0.5">{order.shippingInfo?.companyName}</div>}
                      <div className="mb-0.5 text-[#4a5568]">
                        {order.shippingInfo?.address && `${order.shippingInfo.address}, `}
                        {order.shippingInfo?.city && `${order.shippingInfo.city}, `}
                        {order.shippingInfo?.state && `${order.shippingInfo.state}, `}
                        {order.shippingInfo?.zipCode && `${order.shippingInfo.zipCode}, `}
                        India
                      </div>
                      <div className="mb-0.5">Phone {order.shippingInfo?.phone}</div>
                    </div>

                    {/* Method Icons */}
                    <div className="flex items-center gap-4 mb-3 text-[11px] font-semibold text-[#4a5568] uppercase tracking-wider">
                      <div className="flex items-center gap-1.5">
                        <FaTruck className="text-[#8a94a6] text-[13px]" />
                        {order.courierPartner || order.shippingMethod || "TPC ARI (THE PROFESSIONAL COURIER AIR )"}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <FaShoppingBag className="text-[#8a94a6] text-[13px]" />
                        {order.paymentMethod || "MANUALLY TRANSFER ( UPI, NEFT, ETC.. )"}
                      </div>
                    </div>

                    {/* Products Display */}
                    <div className="mt-2">
                      <button 
                        onClick={() => toggleAccordion(order._id)}
                        className="flex items-center gap-1 text-[13px] text-[#2463d1] hover:underline mb-2 font-medium"
                      >
                        {order.items?.length || 0} products {isExpanded ? <FaChevronUp className="text-[10px]" /> : <FaChevronDown className="text-[10px]" />}
                      </button>
                      
                      {/* Compact Thumbnails when collapsed */}
                      {!isExpanded && order.items?.length > 0 && (
                        <div className="flex gap-2">
                          {order.items.slice(0, 5).map((item, idx) => (
                            <div key={idx} className="w-[32px] h-[32px] border border-[#d5dce4] rounded bg-white overflow-hidden flex items-center justify-center p-0.5">
                              {item.image ? (
                                <img src={item.image} alt="" className="object-contain max-w-full max-h-full" />
                              ) : (
                                <div className="w-full h-full bg-gray-100 text-[6px] text-gray-400 flex items-center justify-center">IMG</div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Expanded List with variations */}
                      {isExpanded && (
                        <div className="flex flex-col gap-4 mt-3">
                          {order.items?.map((item, index) => (
                            <div key={index} className="flex items-start gap-3">
                              <div className="w-[42px] h-[42px] border border-[#d5dce4] rounded bg-white overflow-hidden shrink-0 flex items-center justify-center p-0.5 mt-1">
                                {item.image ? (
                                  <img src={item.image} alt="" className="object-contain max-w-full max-h-full" />
                                ) : (
                                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-[8px] text-gray-400">NO IMG</div>
                                )}
                              </div>
                              <div className="text-[13px] text-[#202223] leading-snug">
                                <div className="font-semibold mb-0.5">
                                  <span>{item.productName || item.name}</span>
                                  <span className="text-[#8a94a6] ml-2 font-normal">{item.sku || item.variant?.sku || item.productId?.sku || item.productId?.baseSku || 'N/A'}</span>
                                </div>
                                
                                {getItemAttributes(item).map(([k, v], idx) => (
                                  <div key={idx} className="text-[#4a5568] text-[11px] mb-0.5">
                                    <span className="uppercase">{k}:</span> {v}
                                  </div>
                                ))}
                                
                                <div className="text-[#4a5568] text-[11px] mb-0.5"><span className="uppercase">ADDITIONAL NOTES:</span> -</div>
                                
                                <div className="mt-1 text-[#202223]">{item.quantity} × {formatCurrency(item.price)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Customer Comments */}
                    {(order.customerComments || order.notes) && (
                      <div className="mt-4 text-[13px] text-[#202223]">
                        Customer's comments: {order.customerComments || order.notes}
                      </div>
                    )}

                  </div>

                  {/* Right Actions & Amount */}
                  <div className="absolute flex items-start gap-2 right-4 top-4 custom-dropdown-container">
                    <div className="text-[16px] font-bold text-[#202223] mr-2">
                      {formatCurrency(order.totalAmount)}
                    </div>
                    <button 
                      onClick={() => triggerPrint(order)}
                      className="px-3 py-1 bg-white border border-[#c4cdd5] text-[#202223] text-[12px] font-semibold rounded hover:bg-gray-50 transition-colors h-7"
                    >
                      Print
                    </button>
                    
                    <div className="relative">
                      <button 
                        onClick={(e) => toggleDropdown(e, `${order._id}-action`)}
                        className="px-3 py-1 bg-white border border-[#c4cdd5] text-[#202223] text-[12px] font-semibold rounded hover:bg-gray-50 transition-colors flex items-center gap-1 h-7"
                      >
                        Update <FaChevronDown className="text-[10px]" />
                      </button>
                      
                      {activeDropdown === `${order._id}-action` && (
                        <div className="absolute right-0 mt-1 w-44 bg-white border border-[#d5dce4] rounded shadow-lg py-2 z-20 text-[13px]">
                          <button onClick={() => { navigate(`/admin/orders/${order._id}`); setActiveDropdown(null); }} className="w-full text-left px-4 py-2 hover:bg-[#f4f6f8] text-[#202223]">View Order</button>
                          <button onClick={() => { setActiveDropdown(null); }} className="w-full text-left px-4 py-2 hover:bg-[#f4f6f8] text-[#202223]">Update Status</button>
                          <button onClick={() => { handleStatusChange(order._id, 'Shipped', 'fulfillment'); }} className="w-full text-left px-4 py-2 hover:bg-[#f4f6f8] text-[#202223]">Mark as Shipped</button>
                          <button onClick={() => { navigate(`/admin/orders/edit/${order._id}`); setActiveDropdown(null); }} className="w-full text-left px-4 py-2 hover:bg-[#f4f6f8] text-[#202223]">Edit Order</button>
                          <button onClick={() => { triggerPrint(order); setActiveDropdown(null); }} className="w-full text-left px-4 py-2 hover:bg-[#f4f6f8] text-[#202223]">Print Order</button>
                          <button onClick={() => { window.open(`/admin/orders/tax-invoice/${order._id}`, '_blank'); setActiveDropdown(null); }} className="w-full text-left px-4 py-2 hover:bg-[#f4f6f8] text-[#202223]">Create Tax Invoice</button>
                          <button onClick={() => { window.open(`/admin/orders/print-label/${order._id}`, '_blank'); setActiveDropdown(null); }} className="w-full text-left px-4 py-2 hover:bg-[#f4f6f8] text-[#202223]">Print Label</button>
                          <div className="h-[1px] bg-[#d5dce4] my-1"></div>
                          <button onClick={() => { setActiveDropdown(null); }} className="w-full text-left px-4 py-2 hover:bg-[#f4f6f8] text-[#d82c0d]">Delete Order</button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Arrow (Go to detail) */}
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[#8a94a6] hover:text-[#202223]" onClick={() => navigate(`/admin/orders/${order._id}`)}>
                    <FaChevronRight />
                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
    </div>
    </div>
    </>
  );
};

export default AdminOrders;
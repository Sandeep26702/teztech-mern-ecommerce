import { useState, useEffect } from "react";
import { FaPlus, FaSearch, FaUserCheck, FaComments, FaCalendarAlt } from "react-icons/fa";
import { toast } from "react-hot-toast";
import api from "../../utils/api";

const AdminLeads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("New");
  const [staffUsers, setStaffUsers] = useState([]);

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newLead, setNewLead] = useState({ name: "", phone: "", email: "", requirement: "", source: "Manual Call" });
  const [submitting, setSubmitting] = useState(false);

  // Detail Modal / Interaction Notes States
  const [selectedLead, setSelectedLead] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    fetchLeads();
    fetchStaff();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await api.get("/leads");
      if (res.data.success) {
        setLeads(res.data.leads || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load leads");
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await api.get("/admin/users");
      if (res.data.success) {
        // Filter roles related to Sales/Admin
        const salesStaff = (res.data.users || []).filter(
          (u) => ["admin", "subadmin", "sales team"].includes(u.role?.toLowerCase())
        );
        setStaffUsers(salesStaff);
      }
    } catch (err) {
      console.error("Error fetching staff:", err);
    }
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    if (!newLead.name || !newLead.phone) {
      toast.error("Name and Phone are required!");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post("/leads", newLead);
      if (res.data.success) {
        toast.success("Lead created successfully!");
        setNewLead({ name: "", phone: "", email: "", requirement: "", source: "Manual Call" });
        setShowCreateModal(false);
        fetchLeads();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create lead");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (leadId, newStatus) => {
    try {
      const res = await api.put(`/leads/${leadId}`, { status: newStatus });
      if (res.data.success) {
        toast.success(`Lead status updated to ${newStatus}`);
        setLeads((prev) => prev.map((l) => (l._id === leadId ? res.data.lead : l)));
        if (selectedLead?._id === leadId) {
          setSelectedLead(res.data.lead);
        }
      }
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleAssignAgent = async (leadId, agentId) => {
    try {
      const res = await api.put(`/leads/${leadId}`, { assignedTo: agentId });
      if (res.data.success) {
        toast.success("Sales agent assigned successfully!");
        setLeads((prev) => prev.map((l) => (l._id === leadId ? res.data.lead : l)));
        if (selectedLead?._id === leadId) {
          setSelectedLead(res.data.lead);
        }
      }
    } catch (err) {
      toast.error("Failed to assign agent");
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setAddingNote(true);
    try {
      const res = await api.post(`/leads/${selectedLead._id}/notes`, { text: noteText });
      if (res.data.success) {
        toast.success("Interaction note saved!");
        setSelectedLead(res.data.lead);
        setLeads((prev) => prev.map((l) => (l._id === selectedLead._id ? res.data.lead : l)));
        setNoteText("");
      }
    } catch (err) {
      toast.error("Failed to save note");
    } finally {
      setAddingNote(false);
    }
  };

  // Filter Leads
  const filteredLeads = leads.filter((lead) => {
    const matchesTab = lead.status === activeTab;
    const matchesSearch =
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm) ||
      (lead.leadCode && lead.leadCode.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  return (
    <div className="p-6 bg-white border border-slate-100 shadow-sm rounded-2xl">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Pre-Sales Lead Inquiries</h2>
          <p className="mt-1 text-sm text-slate-500">Track and respond to inbound marketing leads and call logs.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition cursor-pointer shadow-md"
        >
          <FaPlus /> Add Manual Lead
        </button>
      </div>

      {/* Tabs and Search Bar */}
      <div className="flex flex-col gap-4 pb-4 mb-6 border-b border-slate-100 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {["New", "Negotiation", "Won", "Lost"].map((status) => (
            <button
              key={status}
              onClick={() => setActiveTab(status)}
              className={`px-4 py-2 text-sm font-semibold rounded-xl border transition cursor-pointer ${
                activeTab === status
                  ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                  : "bg-white border-slate-200 text-slate-600 hover:border-blue-200 hover:text-blue-600"
              }`}
            >
              {status} Leads
              <span className="ml-2 px-2 py-0.5 text-xs bg-slate-100 text-slate-650 rounded-full group-hover:bg-blue-50">
                {leads.filter((l) => l.status === status).length}
              </span>
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-80">
          <FaSearch className="absolute text-slate-400 -translate-y-1/2 left-3 top-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by client or Lead ID..."
            className="w-full py-2.5 pl-10 pr-4 text-sm border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>
      </div>

      {/* Leads Table */}
      {loading ? (
        <div className="py-12 text-center text-slate-400">Loading leads...</div>
      ) : filteredLeads.length === 0 ? (
        <div className="py-12 text-center text-slate-400 border border-dashed rounded-2xl border-slate-200">
          No leads found in this queue.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs tracking-wider text-slate-500 uppercase border-b border-slate-200 bg-slate-50">
                <th className="p-4 font-semibold">Lead ID</th>
                <th className="p-4 font-semibold">Client Name</th>
                <th className="p-4 font-semibold">Requirement</th>
                <th className="p-4 font-semibold">Source</th>
                <th className="p-4 font-semibold">Assigned Agent</th>
                <th className="p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredLeads.map((lead) => (
                <tr key={lead._id} className="hover:bg-slate-50/50 transition">
                  <td className="p-4 font-bold text-blue-600">{lead.leadCode || "N/A"}</td>
                  <td className="p-4">
                    <div className="font-semibold text-slate-900">{lead.name}</div>
                    <div className="text-xs text-slate-500">{lead.phone}</div>
                    {lead.email && <div className="text-xs text-slate-400">{lead.email}</div>}
                  </td>
                  <td className="p-4 max-w-xs truncate text-sm" title={lead.requirement}>
                    {lead.requirement || <span className="text-slate-400 italic">No notes</span>}
                  </td>
                  <td className="p-4 text-xs font-semibold">
                    <span className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-md">
                      {lead.source}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5">
                      <select
                        value={lead.assignedTo?._id || ""}
                        onChange={(e) => handleAssignAgent(lead._id, e.target.value)}
                        className="px-2 py-1 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none"
                      >
                        <option value="">Unassigned</option>
                        {staffUsers.map((u) => (
                          <option key={u._id} value={u._id}>
                            {u.name} ({u.role})
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedLead(lead)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-lg transition-colors cursor-pointer"
                      >
                        <FaComments /> Call Log ({lead.notes?.length || 0})
                      </button>
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead._id, e.target.value)}
                        className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold bg-white text-slate-700 focus:outline-none"
                      >
                        <option value="New">New</option>
                        <option value="Negotiation">Negotiation</option>
                        <option value="Won">Won</option>
                        <option value="Lost">Lost</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Manual Lead Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 mx-4">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Create Manual Inquiry</h3>
            <form onSubmit={handleCreateLead} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-550 mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={newLead.name}
                  onChange={(e) => setNewLead((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-550 mb-1">Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="9876543210"
                    value={newLead.phone}
                    onChange={(e) => setNewLead((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-550 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="name@gmail.com"
                    value={newLead.email}
                    onChange={(e) => setNewLead((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-550 mb-1">Requirement Notes</label>
                <textarea
                  rows="3"
                  placeholder="What is the customer looking for?"
                  value={newLead.requirement}
                  onChange={(e) => setNewLead((prev) => ({ ...prev, requirement: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-600 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {submitting ? "Saving..." : "Create Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Call Log / Lead Detail Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-[#efeae2] rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[500px] mx-4">
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-slate-800 text-white flex items-center justify-between flex-shrink-0">
              <div>
                <h4 className="font-bold text-sm">Interaction Timeline - {selectedLead.name}</h4>
                <p className="text-[10px] text-slate-300">Lead Code: {selectedLead.leadCode || "N/A"}</p>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="text-slate-300 hover:text-white font-bold cursor-pointer text-sm"
              >
                ✕ Close
              </button>
            </div>

            {/* Chat/Notes timeline list */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4">
              <div className="flex justify-center">
                <span className="bg-white/90 px-3 py-1 rounded-lg text-[10px] font-bold text-slate-400 border border-slate-100 shadow-sm uppercase tracking-wider">
                  Lead Created: {new Date(selectedLead.createdAt).toLocaleDateString()}
                </span>
              </div>

              {selectedLead.notes?.length === 0 ? (
                <div className="text-center py-16 text-xs text-slate-400 italic">
                  No interaction logs registered. Type below to record call remarks.
                </div>
              ) : (
                selectedLead.notes.map((note, index) => (
                  <div key={index} className="flex flex-col items-start bg-white p-3.5 rounded-xl rounded-tl-none border border-slate-200/50 shadow-sm max-w-[85%]">
                    <p className="text-xs text-slate-800 leading-relaxed font-medium">{note.text}</p>
                    <div className="flex items-center justify-between w-full mt-2 border-t border-slate-100 pt-1.5 text-[9px] text-slate-400 font-bold">
                      <span>👤 {note.author}</span>
                      <span>{new Date(note.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Write comment bar */}
            <form onSubmit={handleAddNote} className="p-3 bg-slate-100 border-t border-slate-200 flex gap-2 items-center flex-shrink-0">
              <input
                type="text"
                required
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Log customer requirement details / call notes..."
                className="flex-1 px-3.5 py-2 text-xs border border-slate-250 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
              />
              <button
                type="submit"
                disabled={addingNote || !noteText.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition disabled:opacity-50 cursor-pointer shadow-sm"
              >
                Save
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLeads;

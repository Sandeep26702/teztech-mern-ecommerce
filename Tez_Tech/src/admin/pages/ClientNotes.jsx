import { useState, useEffect, useRef } from "react";
import { 
  FaSearch, FaRegStickyNote, FaUser, FaEnvelope, 
  FaPhone, FaComments, FaHistory, FaChevronRight, FaPlus 
} from "react-icons/fa";
import api from "../../utils/api";
import { toast } from "react-hot-toast";

const ClientNotes = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all"); // "all", "registered", "quote", "hasNotes", "noNotes"
  const [newNoteContent, setNewNoteContent] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const timelineEndRef = useRef(null);

  // Fetch all clients on mount
  const fetchClients = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await api.get("/admin/client-notes/clients");
      if (res.data.success) {
        const list = res.data.clients || [];
        setClients(list);
        
        // Sync selected client state if one is already active
        if (selectedClient) {
          const key = selectedClient.email || selectedClient.phone;
          const found = list.find((c) => (c.email && c.email === selectedClient.email) || (c.phone && c.phone === selectedClient.phone));
          if (found) {
            setSelectedClient(found);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch clients list:", error);
      toast.error("Failed to fetch client directory.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Autoscroll to bottom of notes list when client changes or note is added
  useEffect(() => {
    if (timelineEndRef.current) {
      timelineEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedClient?.notes]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!selectedClient || !newNoteContent.trim()) return;

    setAddingNote(true);
    try {
      const payload = {
        clientName: selectedClient.name,
        clientEmail: selectedClient.email,
        clientPhone: selectedClient.phone,
        content: newNoteContent.trim()
      };

      const res = await api.post("/admin/client-notes", payload);
      if (res.data.success) {
        toast.success("Call note added successfully!");
        setNewNoteContent("");
        
        // Refresh local list state silently
        await fetchClients(true);
      }
    } catch (error) {
      console.error("Failed to append note:", error);
      toast.error("Failed to save note.");
    } finally {
      setAddingNote(false);
    }
  };

  // Filter & Search Logic
  const filteredClients = clients.filter((c) => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch = 
      c.name.toLowerCase().includes(term) || 
      c.email.toLowerCase().includes(term) || 
      c.phone.includes(term);

    if (!matchesSearch) return false;

    switch (filterType) {
      case "registered":
        return c.source === "Registered User";
      case "quote":
        return c.source.includes("Quote") || c.source.includes("Design");
      case "hasNotes":
        return c.notes && c.notes.length > 0;
      case "noNotes":
        return !c.notes || c.notes.length === 0;
      case "all":
      default:
        return true;
    }
  });

  const getSourceBadgeColor = (source) => {
    switch (source) {
      case "Registered User":
        return "bg-emerald-50 text-emerald-700 border-emerald-250";
      case "Manual Quote Contact":
        return "bg-amber-50 text-amber-700 border-amber-250";
      case "Online Quote Request":
        return "bg-blue-50 text-blue-700 border-blue-250";
      case "Custom Design Request":
        return "bg-indigo-50 text-indigo-700 border-indigo-250";
      default:
        return "bg-slate-50 text-slate-700 border-slate-250";
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col overflow-hidden min-h-0 bg-white border border-gray-150 rounded-2xl shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-12 items-stretch h-full flex-1 overflow-hidden min-h-0">
        
        {/* LEFT COLUMN: Client Directory */}
        <div className="md:col-span-5 lg:col-span-4 border-r border-gray-150 flex flex-col h-full overflow-hidden min-h-0 bg-slate-50/50">
          
          {/* Header Search & Title */}
          <div className="p-4 border-b border-gray-150 space-y-3 bg-white">
            <div>
              <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                <FaRegStickyNote className="text-blue-600" /> Client Notes Log
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Track call follow-ups and discussion history.</p>
            </div>
            
            <div className="relative">
              <FaSearch className="absolute text-slate-400 -translate-y-1/2 left-3 top-1/2 text-xs" />
              <input
                type="text"
                placeholder="Search name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-2 pl-9 pr-4 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50 focus:bg-white transition-all font-medium"
              />
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex gap-1.5 p-3 overflow-x-auto border-b border-gray-150 bg-white scrollbar-none whitespace-nowrap">
            {[
              { label: "All Clients", key: "all" },
              { label: "Registered", key: "registered" },
              { label: "Quote Leads", key: "quote" },
              { label: "Has Notes", key: "hasNotes" },
              { label: "No Notes", key: "noNotes" }
            ].map((btn) => (
              <button
                key={btn.key}
                onClick={() => setFilterType(btn.key)}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                  filterType === btn.key
                    ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                    : "bg-slate-50 border-gray-200 text-slate-650 hover:bg-slate-100 hover:text-slate-800"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Directory Client List */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100 min-h-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-8 h-8 border-3 border-blue-500/20 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="mt-3 text-[10px] font-bold text-slate-400 tracking-wider uppercase">Loading Directory...</p>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs py-16">
                No clients match the selected criteria.
              </div>
            ) : (
              filteredClients.map((client) => {
                const isSelected = selectedClient && (
                  (client.email && client.email === selectedClient.email) ||
                  (client.phone && client.phone === selectedClient.phone)
                );
                
                const hasNotes = client.notes && client.notes.length > 0;
                const latestNote = hasNotes ? client.notes[client.notes.length - 1] : null;

                return (
                  <div
                    key={client.email || client.phone}
                    onClick={() => setSelectedClient(client)}
                    className={`p-4 transition-all cursor-pointer flex justify-between items-start gap-4 ${
                      isSelected 
                        ? "bg-blue-50/70 border-l-4 border-blue-600" 
                        : "hover:bg-slate-100/60 bg-white"
                    }`}
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-800 text-xs sm:text-sm truncate">
                          {client.name}
                        </span>
                        <span className={`px-2 py-0.5 text-[8px] font-bold rounded border uppercase ${getSourceBadgeColor(client.source)}`}>
                          {client.source.split(" ")[0]}
                        </span>
                      </div>
                      
                      {client.email && (
                        <p className="text-[10px] text-slate-500 flex items-center gap-1.5 truncate font-medium">
                          <FaEnvelope className="text-slate-400" size={10} /> {client.email}
                        </p>
                      )}
                      
                      {client.phone && (
                        <p className="text-[10px] text-slate-500 flex items-center gap-1.5 font-medium">
                          <FaPhone className="text-slate-400" size={9} /> {client.phone}
                        </p>
                      )}

                      {/* Notes Preview */}
                      {latestNote ? (
                        <div className="mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100 text-[10px] text-slate-600 line-clamp-2 leading-relaxed">
                          <span className="font-bold text-slate-700">{latestNote.author}:</span> {latestNote.content}
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 italic mt-1 font-medium">No notes recorded yet</p>
                      )}
                    </div>
                    
                    <FaChevronRight size={10} className="text-slate-300 mt-2 self-start flex-shrink-0" />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: CRM Call Notes Workspace */}
        <div className="md:col-span-7 lg:col-span-8 flex flex-col h-full overflow-hidden min-h-0 bg-slate-50/20">
          {selectedClient ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden min-h-0">
              
              {/* Client Header Workspace Info */}
              <div className="p-5 bg-white border-b border-gray-150 flex items-center justify-between flex-shrink-0 shadow-sm z-10">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                    {selectedClient.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                      {selectedClient.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-1 text-xs text-slate-500 font-semibold">
                      {selectedClient.email && (
                        <span className="flex items-center gap-1">
                          <FaEnvelope className="text-slate-400" size={10} /> {selectedClient.email}
                        </span>
                      )}
                      {selectedClient.phone && (
                        <span className="flex items-center gap-1">
                          <FaPhone className="text-slate-400" size={10} /> {selectedClient.phone}
                        </span>
                      )}
                      <span className={`px-2 py-0.2 text-[9px] font-black rounded border uppercase ${getSourceBadgeColor(selectedClient.source)}`}>
                        Source: {selectedClient.source}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Note History Feed Area */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/30 flex flex-col">
                <div className="flex justify-center my-2">
                  <span className="bg-white px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-500 shadow-sm border border-slate-150 uppercase tracking-wider">
                    CRM Call Notes Timeline Started
                  </span>
                </div>

                {(!selectedClient.notes || selectedClient.notes.length === 0) ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 border border-slate-200 mb-3">
                      <FaRegStickyNote size={22} />
                    </div>
                    <span className="text-xs font-semibold text-slate-450 max-w-xs leading-relaxed">
                      No logs written yet for this client. Use the composer below to record calls, notes, or future talking points.
                    </span>
                  </div>
                ) : (
                  selectedClient.notes.map((note, idx) => (
                    <div key={idx} className="flex gap-4 items-start max-w-[90%] md:max-w-[75%] bg-white border border-gray-150 p-4 rounded-2xl shadow-sm">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[11px] border border-slate-200 flex-shrink-0">
                        {note.author.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                          <span className="text-slate-700 font-black">{note.author}</span>
                          <span>•</span>
                          <span>{new Date(note.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-slate-650 font-medium whitespace-pre-wrap leading-relaxed">
                          {note.content}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={timelineEndRef} />
              </div>

              {/* CRM Call Notes Composer */}
              <div className="p-4 bg-white border-t border-gray-150 flex-shrink-0">
                <form onSubmit={handleAddNote} className="space-y-3">
                  <div className="border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 transition-all flex items-end">
                    <textarea
                      rows="3"
                      placeholder="Write internal log, customer discussion note, or next actions here..."
                      value={newNoteContent}
                      onChange={(e) => setNewNoteContent(e.target.value)}
                      disabled={addingNote}
                      required
                      className="flex-1 bg-transparent px-2 py-1 text-xs sm:text-sm focus:outline-none text-slate-800 resize-none font-medium placeholder-slate-400"
                    />
                  </div>
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] text-slate-400 font-semibold italic">Notes logged here are internal only and NOT visible to customers.</span>
                    <button
                      type="submit"
                      disabled={addingNote || !newNoteContent.trim()}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs shadow-sm flex-shrink-0"
                    >
                      {addingNote ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <FaPlus size={10} /> Log Call Note
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-blue-500 mb-4 shadow-sm">
                <FaRegStickyNote size={26} className="animate-bounce" />
              </div>
              <h3 className="text-base font-extrabold text-slate-800 mb-1">Select a Client</h3>
              <p className="text-slate-500 text-xs max-w-xs leading-relaxed font-semibold">
                Select a client from the left directory list to view call history logs and record future discussion points.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ClientNotes;

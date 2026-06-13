import { useState, useEffect, useRef } from "react";
import { FaRegStickyNote, FaPlus, FaTimes, FaEnvelope, FaPhone, FaUser } from "react-icons/fa";
import api from "../../utils/api";
import { toast } from "react-hot-toast";

const ClientNotesModal = ({ isOpen, onClose, clientName, clientEmail, clientPhone }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const timelineEndRef = useRef(null);

  const fetchNotes = async () => {
    if (!isOpen) return;
    try {
      setLoading(true);
      const emailParam = clientEmail ? `email=${encodeURIComponent(clientEmail)}` : "";
      const phoneParam = clientPhone ? `phone=${encodeURIComponent(clientPhone)}` : "";
      const queryStr = [emailParam, phoneParam].filter(Boolean).join("&");

      const res = await api.get(`/admin/client-notes?${queryStr}`);
      if (res.data.success) {
        setNotes(res.data.notes || []);
      }
    } catch (error) {
      console.error("Failed to fetch client CRM notes:", error);
      toast.error("Failed to retrieve CRM notes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [isOpen, clientEmail, clientPhone]);

  useEffect(() => {
    if (timelineEndRef.current) {
      timelineEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [notes]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;

    setAddingNote(true);
    try {
      const payload = {
        clientName: clientName || "Unknown Client",
        clientEmail,
        clientPhone,
        content: newNoteContent.trim()
      };

      const res = await api.post("/admin/client-notes", payload);
      if (res.data.success) {
        toast.success("Internal note logged.");
        setNewNoteContent("");
        
        // Refresh notes timeline
        await fetchNotes();
      }
    } catch (error) {
      console.error("Failed to add CRM note:", error);
      toast.error("Failed to save CRM note.");
    } finally {
      setAddingNote(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-250 flex items-center justify-center text-amber-700">
              <FaRegStickyNote size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                Internal Notes: <span className="text-blue-600 font-extrabold">{clientName}</span>
              </h3>
              <div className="flex flex-wrap items-center gap-x-4 text-[10px] text-slate-500 font-semibold mt-1">
                {clientEmail && (
                  <span className="flex items-center gap-1">
                    <FaEnvelope size={8} /> {clientEmail}
                  </span>
                )}
                {clientPhone && (
                  <span className="flex items-center gap-1">
                    <FaPhone size={8} /> {clientPhone}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-200/50 rounded-lg transition"
            title="Close"
          >
            <FaTimes size={16} />
          </button>
        </div>

        {/* Notes Timeline Feed */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/20 min-h-0">
          <div className="flex justify-center mb-2">
            <span className="bg-white px-2.5 py-1 rounded-lg text-[9px] font-bold text-slate-500 shadow-sm border border-slate-150 uppercase tracking-wider">
              Internal Conversation Logs
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-3 border-blue-500/20 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="mt-3 text-[10px] font-bold text-slate-405 uppercase tracking-wider">Loading Notes...</p>
            </div>
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 border border-slate-200 mb-3">
                <FaRegStickyNote size={20} />
              </div>
              <p className="text-xs font-semibold text-slate-400 max-w-xs leading-relaxed">
                No internal call notes logged yet. Log notes below to track follow-ups and discussion items with this client.
              </p>
            </div>
          ) : (
            notes.map((note, idx) => (
              <div key={idx} className="flex gap-3 items-start max-w-[85%] bg-white border border-slate-150 p-4 rounded-xl shadow-sm">
                <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-650 font-extrabold flex items-center justify-center text-[10px] border border-slate-200 flex-shrink-0">
                  {note.author.substring(0, 2).toUpperCase()}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">
                    <span className="text-slate-700 font-black">{note.author}</span>
                    <span>•</span>
                    <span>{new Date(note.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium whitespace-pre-wrap leading-relaxed">
                    {note.content}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={timelineEndRef} />
        </div>

        {/* Notes Editor Form */}
        <div className="p-4 bg-white border-t border-slate-200 flex-shrink-0">
          <form onSubmit={handleAddNote} className="space-y-3">
            <div className="border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 transition-all flex items-end">
              <textarea
                rows="2"
                placeholder="Log internal details, discussion points, or next follow-up items..."
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                disabled={addingNote}
                required
                className="flex-1 bg-transparent px-2 py-1 text-xs focus:outline-none text-slate-800 resize-none font-medium placeholder-slate-400"
              />
            </div>
            <div className="flex justify-between items-center px-1">
              <span className="text-[9px] text-slate-400 font-semibold italic">Visible only to the sales team (Internal Call log).</span>
              <button
                type="submit"
                disabled={addingNote || !newNoteContent.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs shadow-sm flex-shrink-0"
              >
                {addingNote ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FaPlus size={8} /> Log Note
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};

export default ClientNotesModal;

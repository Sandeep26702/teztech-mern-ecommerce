import User from "../models/User.js";
import Quote from "../models/Quote.js";
import CustomDesignQuote from "../models/CustomDesignQuote.js";
import ClientNote from "../models/ClientNote.js";

// Helper to sanitize key lookup
const getLookupKey = (email, phone) => {
  if (email) return email.toLowerCase().trim();
  if (phone) return phone.trim();
  return null;
};

// 1. Fetch unified list of all clients (Users & Quote Contacts) with their notes
export const getAllClientsWithNotes = async (req, res) => {
  try {
    // A. Fetch all registered users (role: "user")
    const users = await User.find({ role: "user" }).select("name email phone");

    // B. Fetch all quotes (both standard and manual)
    const quotes = await Quote.find().select("userDetails user");

    // C. Fetch all custom design quotes
    const customQuotes = await CustomDesignQuote.find()
      .select("userDetails user")
      .populate("user", "name email phone");

    // D. Fetch all client notes
    const clientNotes = await ClientNote.find();
    const notesMap = new Map();
    clientNotes.forEach((n) => {
      if (n.clientEmail) notesMap.set(n.clientEmail.toLowerCase().trim(), n);
      if (n.clientPhone) notesMap.set(n.clientPhone.trim(), n);
    });

    // E. Merge clients
    const clientMap = new Map();

    // Add registered users
    users.forEach((u) => {
      const emailKey = u.email ? u.email.toLowerCase().trim() : null;
      const phoneKey = u.phone ? u.phone.trim() : null;
      const key = emailKey || phoneKey;
      if (key) {
        clientMap.set(key, {
          name: u.name,
          email: u.email || "",
          phone: u.phone || "",
          source: "Registered User",
          userId: u._id,
          notes: []
        });
      }
    });

    // Add quote clients
    quotes.forEach((q) => {
      if (!q.userDetails) return;
      const { name, email, phone } = q.userDetails;
      const emailKey = email ? email.toLowerCase().trim() : null;
      const phoneKey = phone ? phone.trim() : null;
      const key = emailKey || phoneKey;
      if (key) {
        const existing = clientMap.get(key);
        clientMap.set(key, {
          name: existing?.name || name,
          email: existing?.email || email || "",
          phone: existing?.phone || phone || "",
          source: existing?.source || (q.isManual ? "Manual Quote Contact" : "Online Quote Request"),
          userId: existing?.userId || q.user || null,
          notes: []
        });
      }
    });

    // Add custom quote clients
    customQuotes.forEach((cq) => {
      const emailKey = cq.user?.email ? cq.user.email.toLowerCase().trim() : null;
      const phoneKey = cq.userDetails?.phone ? cq.userDetails.phone.trim() : null;
      const key = emailKey || phoneKey;
      if (key) {
        const existing = clientMap.get(key);
        clientMap.set(key, {
          name: existing?.name || cq.userDetails?.name || cq.user?.name || "Unknown",
          email: existing?.email || cq.user?.email || "",
          phone: existing?.phone || cq.userDetails?.phone || cq.user?.phone || "",
          source: existing?.source || "Custom Design Request",
          userId: existing?.userId || cq.user?._id || null,
          notes: []
        });
      }
    });

    // F. Attach notes to merged clients
    const clientsList = Array.from(clientMap.values()).map((client) => {
      const emailKey = client.email ? client.email.toLowerCase().trim() : null;
      const phoneKey = client.phone ? client.phone.trim() : null;
      
      let matchedNoteDoc = null;
      if (emailKey && notesMap.has(emailKey)) {
        matchedNoteDoc = notesMap.get(emailKey);
      } else if (phoneKey && notesMap.has(phoneKey)) {
        matchedNoteDoc = notesMap.get(phoneKey);
      }

      return {
        ...client,
        notes: matchedNoteDoc ? matchedNoteDoc.notes : [],
        lastUpdatedNotes: matchedNoteDoc ? matchedNoteDoc.updatedAt : null
      };
    });

    // Sort: Clients with notes updated recently come first, followed by others alphabetically
    clientsList.sort((a, b) => {
      if (a.lastUpdatedNotes && b.lastUpdatedNotes) {
        return new Date(b.lastUpdatedNotes) - new Date(a.lastUpdatedNotes);
      }
      if (a.lastUpdatedNotes) return -1;
      if (b.lastUpdatedNotes) return 1;
      return a.name.localeCompare(b.name);
    });

    res.status(200).json({ success: true, clients: clientsList });
  } catch (error) {
    console.error("Get All Clients With Notes Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 2. Fetch notes for a single client by email or phone
export const getClientNotes = async (req, res) => {
  try {
    const { email, phone } = req.query;
    if (!email && !phone) {
      return res.status(400).json({ success: false, message: "Email or phone is required" });
    }

    const emailKey = email ? email.toLowerCase().trim() : null;
    const phoneKey = phone ? phone.trim() : null;

    let noteDoc = null;
    if (emailKey) {
      noteDoc = await ClientNote.findOne({ clientEmail: emailKey });
    }
    if (!noteDoc && phoneKey) {
      noteDoc = await ClientNote.findOne({ clientPhone: phoneKey });
    }

    res.status(200).json({
      success: true,
      notes: noteDoc ? noteDoc.notes : [],
      clientInfo: noteDoc ? {
        name: noteDoc.clientName,
        email: noteDoc.clientEmail,
        phone: noteDoc.clientPhone
      } : null
    });
  } catch (error) {
    console.error("Get Client Notes Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 3. Add a note entry to a client
export const addClientNote = async (req, res) => {
  try {
    const { clientName, clientEmail, clientPhone, content } = req.body;
    const author = req.user?.name || "Sales Team";

    if (!clientName || !clientName.trim()) {
      return res.status(400).json({ success: false, message: "Client name is required" });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: "Note content cannot be empty" });
    }
    if (!clientEmail && !clientPhone) {
      return res.status(400).json({ success: false, message: "Client email or phone is required" });
    }

    const emailKey = clientEmail ? clientEmail.toLowerCase().trim() : null;
    const phoneKey = clientPhone ? clientPhone.trim() : null;

    let noteDoc = null;
    if (emailKey) {
      noteDoc = await ClientNote.findOne({ clientEmail: emailKey });
    }
    if (!noteDoc && phoneKey) {
      noteDoc = await ClientNote.findOne({ clientPhone: phoneKey });
    }

    const newNoteEntry = {
      author,
      content: content.trim(),
      createdAt: new Date()
    };

    if (noteDoc) {
      // Document exists, push to list
      noteDoc.notes.push(newNoteEntry);
      // Update phone/name if rich data comes in
      if (!noteDoc.clientPhone && clientPhone) noteDoc.clientPhone = clientPhone.trim();
      if (!noteDoc.clientEmail && clientEmail) noteDoc.clientEmail = clientEmail.toLowerCase().trim();
      await noteDoc.save();
    } else {
      // Create new document
      const fields = {
        clientName: clientName.trim(),
        notes: [newNoteEntry]
      };
      if (emailKey) fields.clientEmail = emailKey;
      if (phoneKey) fields.clientPhone = phoneKey;

      noteDoc = new ClientNote(fields);
      await noteDoc.save();
    }

    res.status(200).json({ success: true, message: "Note added successfully!", notes: noteDoc.notes });
  } catch (error) {
    console.error("Add Client Note Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

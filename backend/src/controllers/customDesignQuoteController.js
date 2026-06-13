import CustomDesignQuote from "../models/CustomDesignQuote.js";

// 1. Create a new custom design quote request
export const createCustomDesignQuote = async (req, res) => {
  try {
    const userDetails = JSON.parse(req.body.userDetails || "{}");
    const designs = JSON.parse(req.body.designs || "[]");

    if (!userDetails.name || !userDetails.phone || !userDetails.address) {
      return res.status(400).json({ success: false, message: "Name, phone, and address are required" });
    }

    if (!designs || designs.length === 0) {
      return res.status(400).json({ success: false, message: "At least one design requirement is required" });
    }

    const files = req.files || [];

    // Map files to designs using the fileIndex provided by the client
    const mappedDesigns = designs.map((design) => {
      let referenceUrl = "";
      if (
        design.fileIndex !== null &&
        design.fileIndex !== undefined &&
        files[design.fileIndex]
      ) {
        referenceUrl = files[design.fileIndex].path; // Cloudinary URL
      }
      return {
        designName: design.designName,
        length: design.length,
        width: design.width,
        sheetColor: design.sheetColor,
        ledType: design.ledType,
        thickness: Number(design.thickness) || 0,
        requiredDate: new Date(design.requiredDate || Date.now()),
        referenceUrl,
        specialInstructions: design.specialInstructions || "",
      };
    });

    const newQuote = new CustomDesignQuote({
      user: req.user._id,
      userDetails: {
        name: userDetails.name,
        phone: userDetails.phone,
        company: userDetails.company || "",
        address: userDetails.address,
      },
      designs: mappedDesigns,
    });

    await newQuote.save();

    res.status(201).json({
      success: true,
      message: "Custom design quotation request submitted successfully!",
      quote: newQuote,
    });
  } catch (error) {
    console.error("Create Custom Design Quote Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 2. Fetch logged-in user's custom quotes
export const getMyCustomDesignQuotes = async (req, res) => {
  try {
    const quotes = await CustomDesignQuote.find({ user: req.user._id }).sort({ createdAt: -1 });
    const filteredQuotes = quotes.map(q => {
      const quoteObj = q.toObject ? q.toObject() : q;
      if (quoteObj.crmNotes) {
        quoteObj.crmNotes = quoteObj.crmNotes.filter(note => note.isPublic === true);
      }
      return quoteObj;
    });
    res.status(200).json({ success: true, quotes: filteredQuotes });
  } catch (error) {
    console.error("Get My Custom Quotes Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 3. Admin fetches all custom quotes
export const getAllCustomDesignQuotes = async (req, res) => {
  try {
    const quotes = await CustomDesignQuote.find()
      .populate("user", "name email")
      .populate("assignedTo", "name email role")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, quotes });
  } catch (error) {
    console.error("Get All Custom Quotes Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 4. Admin responds to custom quote with offered price and notes
export const respondToCustomDesignQuote = async (req, res) => {
  try {
    const { offeredPrice, adminNotes } = req.body;
    const quote = await CustomDesignQuote.findById(req.params.id);

    if (!quote) {
      return res.status(404).json({ success: false, message: "Custom quotation not found" });
    }

    quote.offeredPrice = Number(offeredPrice) || 0;
    quote.adminNotes = adminNotes || "";
    quote.status = "Responded";

    await quote.save();

    res.status(200).json({
      success: true,
      message: "Responded to custom quotation successfully!",
      quote,
    });
  } catch (error) {
    console.error("Respond Custom Quote Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 5. User accepts or rejects the offered price
export const updateCustomDesignQuoteStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["Accepted", "Rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const quote = await CustomDesignQuote.findById(req.params.id);

    if (!quote) {
      return res.status(404).json({ success: false, message: "Custom quotation not found" });
    }

    // Security check: Only the owner of the quote can accept or reject
    if (quote.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to update this quotation" });
    }

    quote.status = status;
    await quote.save();

    res.status(200).json({
      success: true,
      message: `Quotation ${status.toLowerCase()} successfully!`,
      quote,
    });
  } catch (error) {
    console.error("Update Custom Quote Status Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Assign custom design quote to a sales person
export const assignCustomDesignQuote = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body; // User ID

    const quote = await CustomDesignQuote.findById(id);
    if (!quote) {
      return res.status(404).json({ success: false, message: "Custom quotation not found" });
    }

    quote.assignedTo = assignedTo || null;
    await quote.save();

    const updatedQuote = await CustomDesignQuote.findById(id)
      .populate("user", "name email")
      .populate("assignedTo", "name email role");

    res.status(200).json({ success: true, message: "Quote assigned successfully!", quote: updatedQuote });
  } catch (error) {
    console.error("Assign Custom Design Quote Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Add a CRM note to a custom design quote
export const addCustomDesignQuoteCrmNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    if (!remarks || !remarks.trim()) {
      return res.status(400).json({ success: false, message: "Remarks are required" });
    }

    const quote = await CustomDesignQuote.findById(id);
    if (!quote) {
      return res.status(404).json({ success: false, message: "Custom quotation not found" });
    }

    if (!quote.crmNotes) quote.crmNotes = [];
    quote.crmNotes.push({
      author: req.user.name || "Sales Team",
      remarks: remarks.trim(),
      createdAt: new Date(),
      isPublic: true, // Always public for direct chat
      role: "admin",
    });

    await quote.save();

    const updatedQuote = await CustomDesignQuote.findById(id)
      .populate("user", "name email")
      .populate("assignedTo", "name email role");

    res.status(200).json({ success: true, message: "CRM comment added successfully!", quote: updatedQuote });
  } catch (error) {
    console.error("Add Custom Design Quote CRM Note Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Add client comment (public only, owner only) for custom design quote
export const addClientCustomQuoteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    if (!remarks || !remarks.trim()) {
      return res.status(400).json({ success: false, message: "Remarks are required" });
    }

    const quote = await CustomDesignQuote.findById(id);
    if (!quote) return res.status(404).json({ success: false, message: "Custom quotation not found" });

    // Security check: only the owner can comment
    if (quote.user && quote.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to comment on this quotation" });
    }

    if (!quote.crmNotes) quote.crmNotes = [];
    quote.crmNotes.push({
      author: req.user.name || "Client",
      remarks: remarks.trim(),
      createdAt: new Date(),
      isPublic: true,
      role: "client",
    });

    await quote.save();

    const updatedQuote = await CustomDesignQuote.findById(id)
      .populate("user", "name email")
      .populate("assignedTo", "name email role");

    const quoteObj = updatedQuote.toObject ? updatedQuote.toObject() : updatedQuote;
    if (quoteObj.crmNotes) {
      quoteObj.crmNotes = quoteObj.crmNotes.filter(note => note.isPublic === true);
    }

    res.status(200).json({ success: true, message: "Comment added successfully!", quote: quoteObj });
  } catch (error) {
    console.error("Add Client Custom Quote Comment Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

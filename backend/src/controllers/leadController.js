import Lead from "../models/Lead.js";

// Create a new lead (e.g., from marketing campaign or manually)
export const createLead = async (req, res) => {
  try {
    const { name, phone, email, requirement, source } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: "Name and phone are required" });
    }

    const newLead = new Lead({
      name,
      phone,
      email: email || "",
      requirement: requirement || "",
      source: source || "Ad Campaign",
    });

    await newLead.save();

    res.status(201).json({
      success: true,
      message: "Lead created successfully!",
      lead: newLead,
    });
  } catch (error) {
    console.error("Create Lead Error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// Retrieve all leads (for Sales and Admin)
export const getAllLeads = async (req, res) => {
  try {
    const { status, assignedTo } = req.query;
    const query = {};

    if (status) query.status = status;
    if (assignedTo) query.assignedTo = assignedTo;

    const leads = await Lead.find(query)
      .populate("assignedTo", "name email role")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, leads });
  } catch (error) {
    console.error("Get Leads Error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// Update lead status or assign agent
export const updateLead = async (req, res) => {
  try {
    const { status, assignedTo, name, phone, email, requirement } = req.body;
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found" });
    }

    if (status) lead.status = status;
    if (assignedTo !== undefined) lead.assignedTo = assignedTo || null;
    if (name) lead.name = name;
    if (phone) lead.phone = phone;
    if (email) lead.email = email;
    if (requirement) lead.requirement = requirement;

    await lead.save();

    const updatedLead = await Lead.findById(req.params.id).populate("assignedTo", "name email role");

    res.status(200).json({
      success: true,
      message: "Lead updated successfully!",
      lead: updatedLead,
    });
  } catch (error) {
    console.error("Update Lead Error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// Add call log/interaction notes
export const addLeadNote = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: "Note text is required" });
    }

    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found" });
    }

    lead.notes.push({
      author: req.user?.name || "Sales Agent",
      text: text.trim(),
    });

    await lead.save();

    const updatedLead = await Lead.findById(req.params.id).populate("assignedTo", "name email role");

    res.status(200).json({
      success: true,
      message: "Note added successfully!",
      lead: updatedLead,
    });
  } catch (error) {
    console.error("Add Lead Note Error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

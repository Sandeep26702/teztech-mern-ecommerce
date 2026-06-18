import DesignRequest from "../models/DesignRequest.js";

// Sales agent creates a Design Request
export const createDesignRequest = async (req, res) => {
  try {
    const { designName, dimensions, materialSpecs, leadId, orderId } = req.body;

    if (!designName) {
      return res.status(400).json({ success: false, message: "Design Name is required" });
    }

    const referenceFileUrl = req.file ? req.file.path : "";

    const newRequest = new DesignRequest({
      designName,
      dimensions: dimensions || "",
      materialSpecs: materialSpecs || "",
      lead: leadId || null,
      order: orderId || null,
      salesAgent: req.user._id,
      referenceFileUrl,
    });

    await newRequest.save();

    res.status(201).json({
      success: true,
      message: "Design request ticket created successfully!",
      designRequest: newRequest,
    });
  } catch (error) {
    console.error("Create Design Request Error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// Get all Design Requests (Filtered by role)
export const getAllDesignRequests = async (req, res) => {
  try {
    let query = {};

    // If logged-in user is a Designer, they can see all or assigned designs
    if (req.user.role === "designer") {
      // Designers see all pending or assigned to them
      query = { $or: [{ designer: req.user._id }, { designer: null }] };
    } else if (req.user.role === "sales team") {
      // Sales agents see tickets they created
      query = { salesAgent: req.user._id };
    }

    const requests = await DesignRequest.find(query)
      .populate("salesAgent", "name email")
      .populate("designer", "name email")
      .populate("lead", "name leadCode")
      .populate("order", "orderCode")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, designRequests: requests });
  } catch (error) {
    console.error("Get Design Requests Error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// Designer uploads optimized SVG
export const uploadOptimizedSvg = async (req, res) => {
  try {
    const designRequest = await DesignRequest.findById(req.params.id);

    if (!designRequest) {
      return res.status(404).json({ success: false, message: "Design request not found" });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "SVG file is required" });
    }

    designRequest.optimizedSvgUrl = req.file.path;
    designRequest.status = "Design Ready";
    designRequest.designer = req.user._id;

    await designRequest.save();

    res.status(200).json({
      success: true,
      message: "Optimized SVG uploaded successfully!",
      designRequest,
    });
  } catch (error) {
    console.error("Upload SVG Error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// Sales agent approves or rejects design request
export const updateDesignStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["Approved", "Rejected", "In Progress"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const designRequest = await DesignRequest.findById(req.params.id);
    if (!designRequest) {
      return res.status(404).json({ success: false, message: "Design request not found" });
    }

    designRequest.status = status;
    await designRequest.save();

    res.status(200).json({
      success: true,
      message: `Design request status updated to ${status}!`,
      designRequest,
    });
  } catch (error) {
    console.error("Update Design Status Error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// Add comment (Sales agent & Designer communication)
export const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: "Comment text is required" });
    }

    const designRequest = await DesignRequest.findById(req.params.id);
    if (!designRequest) {
      return res.status(404).json({ success: false, message: "Design request not found" });
    }

    designRequest.comments.push({
      author: req.user.name || "Staff",
      text: text.trim(),
    });

    // Automatically assign designer to ticket if not assigned yet and designer comments
    if (req.user.role === "designer" && !designRequest.designer) {
      designRequest.designer = req.user._id;
    }

    await designRequest.save();

    const updated = await DesignRequest.findById(req.params.id)
      .populate("salesAgent", "name email")
      .populate("designer", "name email");

    res.status(200).json({
      success: true,
      message: "Comment added!",
      designRequest: updated,
    });
  } catch (error) {
    console.error("Add Design Comment Error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

import FeedbackTicket from "../models/FeedbackTicket.js";
import Order from "../models/Order.js";

// Retrieve all feedbacks
export const getFeedbacks = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};

    if (status) query.status = status;

    // Filter by sales agent if logged-in user is sales team
    if (req.user.role === "sales team") {
      query.assignedSalesAgent = req.user._id;
    }

    const tickets = await FeedbackTicket.find(query)
      .populate({
        path: "order",
        select: "orderCode shippingInfo items totalAmount orderStatus",
      })
      .populate("assignedSalesAgent", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, feedbacks: tickets });
  } catch (error) {
    console.error("Get Feedbacks Error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// Create a feedback ticket (from Delivery/Feedback Call)
export const createFeedback = async (req, res) => {
  try {
    const { orderId, rating, comments, status, upsellOffered, upsellProduct, upsellStatus } = req.body;

    if (!orderId || !rating) {
      return res.status(400).json({ success: false, message: "Order ID and Rating are required" });
    }

    const order = await Order.findById(orderId).populate("createdBy");
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Determine status: if rating < 4, automatically flag as "Issue Reported"
    let finalStatus = status || "Satisfied";
    if (Number(rating) < 4) {
      finalStatus = "Issue Reported";
    }

    // Determine sales agent to assign (default to order creator if they are sales agent, or admin)
    const assignedSalesAgent = order.createdBy || null;

    const newTicket = new FeedbackTicket({
      order: orderId,
      rating: Number(rating),
      comments: comments || "",
      status: finalStatus,
      upsellOffered: upsellOffered || false,
      upsellProduct: upsellProduct || "",
      upsellStatus: upsellStatus || "No Offer",
      assignedSalesAgent,
    });

    await newTicket.save();

    res.status(201).json({
      success: true,
      message: "Feedback recorded successfully!",
      feedback: newTicket,
    });
  } catch (error) {
    console.error("Create Feedback Error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// Sales agent updates feedback issue & upselling results
export const resolveFeedback = async (req, res) => {
  try {
    const { status, resolutionNotes, upsellOffered, upsellProduct, upsellStatus } = req.body;
    const ticket = await FeedbackTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ success: false, message: "Feedback ticket not found" });
    }

    if (status) ticket.status = status;
    if (resolutionNotes) ticket.resolutionNotes = resolutionNotes;
    if (upsellOffered !== undefined) ticket.upsellOffered = upsellOffered;
    if (upsellProduct) ticket.upsellProduct = upsellProduct;
    if (upsellStatus) ticket.upsellStatus = upsellStatus;

    // Assign to logged-in user if they are resolving it
    if (req.user.role === "sales team" && !ticket.assignedSalesAgent) {
      ticket.assignedSalesAgent = req.user._id;
    }

    await ticket.save();

    res.status(200).json({
      success: true,
      message: "Feedback ticket updated successfully!",
      feedback: ticket,
    });
  } catch (error) {
    console.error("Resolve Feedback Error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

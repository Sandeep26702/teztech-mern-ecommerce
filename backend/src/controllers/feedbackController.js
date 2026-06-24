import mongoose from "mongoose";
import FeedbackTicket from "../models/FeedbackTicket.js";
import Order from "../models/Order.js";
import Notification from "../models/Notification.js";
import Lead from "../models/Lead.js";
import User from "../models/User.js";

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
    const {
      orderId,
      rating,
      comments,
      status,
      upsellOffered,
      upsellProduct,
      upsellStatus,
      cuttingPerfect,
      packingIntact,
      upsellRevenue
    } = req.body;

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
      cuttingPerfect: cuttingPerfect !== undefined ? cuttingPerfect : true,
      packingIntact: packingIntact !== undefined ? packingIntact : true,
      upsellRevenue: Number(upsellRevenue) || 0,
      assignedSalesAgent,
    });

    await newTicket.save();

    // 🔴 RED FLAG ESCALATION:
    // If rating is 1, 2, or 3, automatically create High Priority Red Alert Notification records for both "sales team" and "purchase" roles.
    if (Number(rating) <= 3) {
      const alertText = `RED FLAG ALERT: Order ${order.orderCode} received a low rating of ${rating} stars. Quality Checks - Cutting: ${newTicket.cuttingPerfect ? 'OK' : 'FAIL'}, Packing: ${newTicket.packingIntact ? 'OK' : 'FAIL'}. Comments: ${comments || 'No comments'}`;
      
      const salesNotification = new Notification({
        recipientRole: "sales team",
        text: alertText,
      });
      const purchaseNotification = new Notification({
        recipientRole: "purchase",
        text: alertText,
      });
      await Promise.all([salesNotification.save(), purchaseNotification.save()]);
    }

    // 🟢 UPSELL AUTO-LEAD GENERATION:
    // If rating is 4 or 5 and upsellStatus === "Interested":
    // Instantiate a new Lead document in the sales queue.
    if (Number(rating) >= 4 && upsellStatus === "Interested") {
      const newLead = new Lead({
        name: order.shippingInfo?.fullName || "Feedback Upsell Customer",
        phone: order.shippingInfo?.phone || "0000000000",
        email: "",
        requirement: `Interested in upsell: ${upsellProduct || 'Not specified'}. Pitch made during customer feedback callback for order ${order.orderCode}.`,
        source: "Customer Feedback",
        status: "New",
        assignedTo: assignedSalesAgent || null,
      });

      if (order.user) {
        const userObj = await User.findById(order.user);
        if (userObj && userObj.email) {
          newLead.email = userObj.email;
        }
      }
      await newLead.save();
    }

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
    const { status, resolutionNotes, upsellOffered, upsellProduct, upsellStatus, cuttingPerfect, packingIntact, upsellRevenue } = req.body;
    const ticket = await FeedbackTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ success: false, message: "Feedback ticket not found" });
    }

    if (status) ticket.status = status;
    if (resolutionNotes) ticket.resolutionNotes = resolutionNotes;
    if (upsellOffered !== undefined) ticket.upsellOffered = upsellOffered;
    if (upsellProduct) ticket.upsellProduct = upsellProduct;
    if (cuttingPerfect !== undefined) ticket.cuttingPerfect = cuttingPerfect;
    if (packingIntact !== undefined) ticket.packingIntact = packingIntact;
    if (upsellRevenue !== undefined) ticket.upsellRevenue = Number(upsellRevenue) || 0;

    if (upsellStatus) {
      ticket.upsellStatus = upsellStatus;
      // If status changes to Interested, let's generate a Lead if the rating is 4 or 5
      if (upsellStatus === "Interested" && ticket.rating >= 4) {
        const order = await Order.findById(ticket.order).populate("createdBy");
        if (order) {
          const leadExists = await Lead.findOne({ phone: order.shippingInfo?.phone, source: "Customer Feedback" });
          if (!leadExists) {
            const newLead = new Lead({
              name: order.shippingInfo?.fullName || "Feedback Upsell Customer",
              phone: order.shippingInfo?.phone || "0000000000",
              email: "",
              requirement: `Interested in upsell: ${ticket.upsellProduct || 'Not specified'}. Pitch made during customer feedback callback for order ${order.orderCode}.`,
              source: "Customer Feedback",
              status: "New",
              assignedTo: ticket.assignedSalesAgent || order.createdBy || null,
            });
            if (order.user) {
              const userObj = await User.findById(order.user);
              if (userObj && userObj.email) {
                newLead.email = userObj.email;
              }
            }
            await newLead.save();
          }
        }
      }
    }

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

// Get Call Queue (orders shipped/delivered >= 3 days ago, no feedback yet)
export const getCallQueue = async (req, res) => {
  try {
    const feedbackTickets = await FeedbackTicket.find({}, "order");
    const feedbackedOrderIds = feedbackTickets.map((t) => t.order.toString());

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const orders = await Order.find({
      _id: { $nin: feedbackedOrderIds },
      orderStatus: { $in: ["Shipped", "Delivered"] },
      shippedAt: { $lte: threeDaysAgo },
    })
      .populate("user", "name email phone")
      .populate("createdBy", "name email phone")
      .sort({ shippedAt: -1 });

    res.status(200).json({ success: true, queue: orders });
  } catch (error) {
    console.error("Get Call Queue Error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// Get Feedback Metrics (CSAT, Pending Calls, Open Issues, Upsell Revenue)
export const getFeedbackMetrics = async (req, res) => {
  try {
    const feedbackTickets = await FeedbackTicket.find({}, "order");
    const feedbackedOrderIds = feedbackTickets.map((t) => t.order.toString());

    // 1. Pending Follow-ups (shipped >= 3 days ago, no feedback)
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const pendingCalls = await Order.countDocuments({
      _id: { $nin: feedbackedOrderIds },
      orderStatus: { $in: ["Shipped", "Delivered"] },
      shippedAt: { $lte: threeDaysAgo },
    });

    // 2. Open Issue Tickets
    const openIssues = await FeedbackTicket.countDocuments({
      status: "Issue Reported",
    });

    // 3. CSAT Score (Average rating this month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const csatResult = await FeedbackTicket.aggregate([
      { $match: { createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, avgRating: { $avg: "$rating" } } },
    ]);

    let csatScore = csatResult.length > 0 ? Number(csatResult[0].avgRating.toFixed(1)) : null;
    if (csatScore === null) {
      const allTimeCsat = await FeedbackTicket.aggregate([
        { $group: { _id: null, avgRating: { $avg: "$rating" } } },
      ]);
      csatScore = allTimeCsat.length > 0 ? Number(allTimeCsat[0].avgRating.toFixed(1)) : 5.0;
    }

    // 4. Upsell Revenue Generated
    const upsellResult = await FeedbackTicket.aggregate([
      { $group: { _id: null, totalRevenue: { $sum: "$upsellRevenue" } } },
    ]);
    const upsellRevenue = upsellResult.length > 0 ? upsellResult[0].totalRevenue : 0;

    res.status(200).json({
      success: true,
      metrics: {
        csatScore,
        pendingCalls,
        openIssues,
        upsellRevenue,
      },
    });
  } catch (error) {
    console.error("Get Feedback Metrics Error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

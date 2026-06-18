import JobCard from "../models/JobCard.js";
import Order from "../models/Order.js";

// Fetch manufacturing Job Cards
export const getJobCards = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};

    if (status) query.status = status;

    const jobs = await JobCard.find(query)
      .populate({
        path: "order",
        select: "orderCode shippingInfo items totalAmount orderStatus",
      })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, jobCards: jobs });
  } catch (error) {
    console.error("Get Job Cards Error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// Start laser machine on job card
export const startLaserProduction = async (req, res) => {
  try {
    const job = await JobCard.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: "Job Card not found" });
    }

    job.status = "In Production";
    job.startedAt = new Date();
    await job.save();

    // Update parent order production status
    await Order.findByIdAndUpdate(job.order, {
      productionStatus: "In Production",
      orderStatus: "Processing", // Ensure parent order is active/processing
    });

    res.status(200).json({
      success: true,
      message: "Laser production started! Order status updated to 'In Production'.",
      jobCard: job,
    });
  } catch (error) {
    console.error("Start Laser Production Error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// Complete laser machine job card
export const completeLaserProduction = async (req, res) => {
  try {
    const { operatorNotes } = req.body;
    const job = await JobCard.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ success: false, message: "Job Card not found" });
    }

    job.status = "Completed";
    job.completedAt = new Date();
    if (operatorNotes) job.operatorNotes = operatorNotes;
    await job.save();

    // Update parent order: production complete, transitions to packing ready list
    await Order.findByIdAndUpdate(job.order, {
      productionStatus: "Completed",
      packingStatus: "Awaiting Packing",
    });

    res.status(200).json({
      success: true,
      message: "Laser production complete! Order sent to Packing queue.",
      jobCard: job,
    });
  } catch (error) {
    console.error("Complete Laser Production Error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

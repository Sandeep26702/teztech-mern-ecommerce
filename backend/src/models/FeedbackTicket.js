import mongoose from "mongoose";

const feedbackTicketSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    comments: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["Satisfied", "Issue Reported", "Resolved"],
      default: "Satisfied",
    },
    upsellOffered: {
      type: Boolean,
      default: false,
    },
    upsellProduct: {
      type: String,
      default: "",
    },
    upsellStatus: {
      type: String,
      enum: ["Interested", "Not Interested", "No Offer"],
      default: "No Offer",
    },
    assignedSalesAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    resolutionNotes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const FeedbackTicket = mongoose.models.FeedbackTicket || mongoose.model("FeedbackTicket", feedbackTicketSchema);
export default FeedbackTicket;

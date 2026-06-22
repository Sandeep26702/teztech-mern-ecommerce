import CreditNote from "../models/CreditNote.js";

// Get all Credit Notes (populated)
export const getCreditNotes = async (req, res) => {
  try {
    const creditNotes = await CreditNote.find()
      .populate("vendor")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, creditNotes });
  } catch (error) {
    console.error("Get Credit Notes Error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

import Scrap from "../models/Scrap.js";

// Fetch all available scrap (for sales/upcycling list)
export const getScrap = async (req, res) => {
  try {
    const scrap = await Scrap.find({ status: "Available" }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, scrap });
  } catch (error) {
    console.error("Get Scrap Error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// Log new leftover scrap
export const createScrap = async (req, res) => {
  try {
    const { material, size, thickness, qty, price } = req.body;

    if (!material || !size || !thickness) {
      return res.status(400).json({ success: false, message: "Missing required scrap parameters" });
    }

    const newScrap = new Scrap({
      material,
      size,
      thickness,
      qty: Number(qty) || 1,
      price: Number(price) || 50,
    });

    await newScrap.save();

    res.status(201).json({
      success: true,
      message: "Leftover scrap logged successfully!",
      scrap: newScrap,
    });
  } catch (error) {
    console.error("Create Scrap Error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

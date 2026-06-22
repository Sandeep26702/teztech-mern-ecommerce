import Vendor from "../models/Vendor.js";

// Get all vendors
export const getVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find().sort({ name: 1 });
    res.status(200).json({ success: true, vendors });
  } catch (error) {
    console.error("Get Vendors Error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// Create a new vendor
export const createVendor = async (req, res) => {
  try {
    const { name, phone, email, bank, mainMaterial, contractRate } = req.body;

    if (!name || !phone || !email || !bank || !mainMaterial || !contractRate) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const vendor = new Vendor({
      name,
      phone,
      email,
      bank,
      mainMaterial,
      contractRate: Number(contractRate),
    });

    await vendor.save();

    res.status(201).json({
      success: true,
      message: "Vendor registered successfully!",
      vendor,
    });
  } catch (error) {
    console.error("Create Vendor Error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// Update vendor contract rate
export const updateVendorRate = async (req, res) => {
  try {
    const { contractRate } = req.body;
    const vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor not found" });
    }

    if (contractRate !== undefined) {
      vendor.contractRate = Number(contractRate);
      await vendor.save();
    }

    res.status(200).json({
      success: true,
      message: "Vendor rate card updated successfully!",
      vendor,
    });
  } catch (error) {
    console.error("Update Vendor Rate Error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// Delete vendor
export const deleteVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndDelete(req.params.id);
    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor not found" });
    }
    res.status(200).json({ success: true, message: "Vendor deleted successfully" });
  } catch (error) {
    console.error("Delete Vendor Error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

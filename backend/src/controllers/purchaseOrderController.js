import PurchaseOrder from "../models/PurchaseOrder.js";
import Material from "../models/Material.js";
import CreditNote from "../models/CreditNote.js";
import Vendor from "../models/Vendor.js";

// Get all Purchase Orders (populated)
export const getPOs = async (req, res) => {
  try {
    const pos = await PurchaseOrder.find()
      .populate("vendor")
      .populate("items.materialId")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, pos });
  } catch (error) {
    console.error("Get POs Error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// Create a new Purchase Order
export const createPO = async (req, res) => {
  try {
    const { vendor, expectedDate, items } = req.body;

    if (!vendor || !expectedDate || !items || !items.length) {
      return res.status(400).json({ success: false, message: "Missing required PO fields" });
    }

    const newPO = new PurchaseOrder({
      vendor,
      expectedDate: new Date(expectedDate),
      items: items.map(it => ({
        materialId: it.materialId,
        qty: Number(it.qty),
        rate: Number(it.rate)
      }))
    });

    await newPO.save();

    const populatedPO = await PurchaseOrder.findById(newPO._id)
      .populate("vendor")
      .populate("items.materialId");

    res.status(201).json({
      success: true,
      message: "Purchase Order created successfully!",
      po: populatedPO,
    });
  } catch (error) {
    console.error("Create PO Error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// Transition PO Status (Drafted -> Sent -> In Transit -> Received)
export const updatePOStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const po = await PurchaseOrder.findById(req.params.id);

    if (!po) {
      return res.status(404).json({ success: false, message: "Purchase Order not found" });
    }

    const previousStatus = po.status;
    po.status = status;

    // If marked Received directly, auto-add all quantities to stock
    if (status === "Received" && previousStatus !== "Received") {
      for (const item of po.items) {
        const material = await Material.findById(item.materialId);
        if (material) {
          material.stock += item.qty;
          await material.save();
        }
      }
    }

    await po.save();

    const populatedPO = await PurchaseOrder.findById(po._id)
      .populate("vendor")
      .populate("items.materialId");

    res.status(200).json({
      success: true,
      message: `PO status updated to ${status}`,
      po: populatedPO,
    });
  } catch (error) {
    console.error("Update PO Status Error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// Inward Log with Quality Check (Logs challan, accepted/damaged quantities and issues Credit Notes)
export const inwardLogQC = async (req, res) => {
  try {
    const { poId, accepted, damaged } = req.body;

    const po = await PurchaseOrder.findById(poId).populate("vendor");
    if (!po) {
      return res.status(404).json({ success: false, message: "Purchase Order not found" });
    }

    if (po.status === "Received") {
      return res.status(400).json({ success: false, message: "This Purchase Order has already been received" });
    }

    // Process items in the PO
    // Assuming single-item POs for simplicity or apply to first item
    const orderItem = po.items[0];
    if (!orderItem) {
      return res.status(400).json({ success: false, message: "PO has no items to inward" });
    }

    const material = await Material.findById(orderItem.materialId);
    if (!material) {
      return res.status(404).json({ success: false, message: "Material not found" });
    }

    // Update material inventory stock with accepted quantity
    material.stock += Number(accepted);
    await material.save();

    // Handle Damaged Goods -> Generate Credit Note
    let creditNote = null;
    if (Number(damaged) > 0) {
      const refundValue = Number(damaged) * orderItem.rate;
      creditNote = new CreditNote({
        vendor: po.vendor._id,
        materialName: material.name,
        value: refundValue,
        status: "Pending Adjustment"
      });
      await creditNote.save();
    }

    // Set PO state to Received
    po.status = "Received";
    await po.save();

    const populatedPO = await PurchaseOrder.findById(po._id)
      .populate("vendor")
      .populate("items.materialId");

    res.status(200).json({
      success: true,
      message: "Quality Check inward shipment logged successfully. Stock synced!",
      po: populatedPO,
      creditNote
    });
  } catch (error) {
    console.error("Inward QC Log Error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

import Material from "../models/Material.js";

// Get all materials & low stock alerts
export const getMaterials = async (req, res) => {
  try {
    // Auto-seed packaging consumables if they don't exist
    const defaultConsumables = [
      { name: "Packaging Box (Standard)", sku: "box-standard", stock: 150, minStockLimit: 20, unit: "pcs" },
      { name: "Packing Tape (Heavy Duty)", sku: "tape-heavy", stock: 45, minStockLimit: 10, unit: "rolls" },
      { name: "Bubble Wrap Roll (Double Layer)", sku: "bubble-double", stock: 8, minStockLimit: 3, unit: "rolls" }
    ];

    for (const consumable of defaultConsumables) {
      const exists = await Material.findOne({ sku: consumable.sku });
      if (!exists) {
        const material = new Material(consumable);
        await material.save();
      }
    }

    const materials = await Material.find().sort({ name: 1 });
    
    // Compute low stock items
    const lowStockAlerts = materials.filter(
      (m) => m.stock < m.minStockLimit
    );

    res.status(200).json({
      success: true,
      materials,
      lowStockAlerts,
    });
  } catch (error) {
    console.error("Get Materials Error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// Create a new raw material item
export const createMaterial = async (req, res) => {
  try {
    const { name, sku, stock, minStockLimit, unit } = req.body;

    if (!name || !sku) {
      return res.status(400).json({ success: false, message: "Name and SKU are required" });
    }

    const exists = await Material.findOne({ sku });
    if (exists) {
      return res.status(400).json({ success: false, message: "Material with this SKU already exists" });
    }

    const material = new Material({
      name,
      sku,
      stock: Number(stock) || 0,
      minStockLimit: Number(minStockLimit) || 5,
      unit: unit || "rolls",
    });

    await material.save();

    res.status(201).json({
      success: true,
      message: "Material added successfully!",
      material,
    });
  } catch (error) {
    console.error("Create Material Error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// Update material stock level or threshold
export const updateMaterial = async (req, res) => {
  try {
    const { stock, minStockLimit, name, unit } = req.body;
    const material = await Material.findById(req.params.id);

    if (!material) {
      return res.status(404).json({ success: false, message: "Material not found" });
    }

    if (stock !== undefined) material.stock = Number(stock);
    if (minStockLimit !== undefined) material.minStockLimit = Number(minStockLimit);
    if (name) material.name = name;
    if (unit) material.unit = unit;

    await material.save();

    res.status(200).json({
      success: true,
      message: "Material updated successfully!",
      material,
    });
  } catch (error) {
    console.error("Update Material Error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

import ShippingProvider from "../models/ShippingProvider.js";

// @desc    Get all shipping providers (Admin)
// @route   GET /api/shipping
// @access  Private/Admin
export const getProviders = async (req, res) => {
  try {
    const providers = await ShippingProvider.find({}).sort({ createdAt: -1 });
    res.json({ success: true, providers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get active shipping providers (Public/Client)
// @route   GET /api/shipping/active
// @access  Public
export const getActiveProviders = async (req, res) => {
  try {
    const providers = await ShippingProvider.find({ isActive: true }).sort({ baseRate: 1 });
    res.json({ success: true, providers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new shipping provider (Admin)
// @route   POST /api/shipping
// @access  Private/Admin
export const createProvider = async (req, res) => {
  try {
    const { name, baseRate, extraRatePerKg, isDefault, isActive } = req.body;

    const providerExists = await ShippingProvider.findOne({ name });
    if (providerExists) {
      return res.status(400).json({ success: false, message: "Provider already exists" });
    }

    const provider = await ShippingProvider.create({
      name,
      baseRate,
      extraRatePerKg,
      isDefault,
      isActive,
    });

    res.status(201).json({ success: true, provider });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update shipping provider (Admin)
// @route   PUT /api/shipping/:id
// @access  Private/Admin
export const updateProvider = async (req, res) => {
  try {
    const { name, baseRate, extraRatePerKg, isDefault, isActive } = req.body;

    const provider = await ShippingProvider.findById(req.params.id);
    if (!provider) {
      return res.status(404).json({ success: false, message: "Provider not found" });
    }

    provider.name = name ?? provider.name;
    provider.baseRate = baseRate ?? provider.baseRate;
    provider.extraRatePerKg = extraRatePerKg ?? provider.extraRatePerKg;
    provider.isDefault = isDefault ?? provider.isDefault;
    provider.isActive = isActive ?? provider.isActive;

    const updatedProvider = await provider.save();

    res.json({ success: true, provider: updatedProvider });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete shipping provider (Admin)
// @route   DELETE /api/shipping/:id
// @access  Private/Admin
export const deleteProvider = async (req, res) => {
  try {
    const provider = await ShippingProvider.findById(req.params.id);
    if (!provider) {
      return res.status(404).json({ success: false, message: "Provider not found" });
    }

    await ShippingProvider.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Provider deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

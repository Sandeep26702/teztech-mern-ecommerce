import Cart from "../models/Cart.js";

const toSafeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeSelectionValue = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((v) => String(v).trim())
      .filter(Boolean)
      .sort();
  }
  if (value === undefined || value === null) return "";
  return String(value).trim();
};

const normalizeSelectedCustomFields = (input) => {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const normalized = {};
  Object.keys(input)
    .sort()
    .forEach((key) => {
      const safeKey = String(key).trim();
      if (!safeKey) return;
      normalized[safeKey] = normalizeSelectionValue(input[key]);
    });
  return normalized;
};

const getSelectionSignature = (input) => JSON.stringify(normalizeSelectedCustomFields(input));

const sanitizePricing = (pricing) => {
  if (!pricing || typeof pricing !== "object") {
    return {
      basePrice: 0,
      optionAdjustment: 0,
      gstRate: 0,
      gstAmount: 0,
      unitPrice: 0,
    };
  }

  return {
    basePrice: toSafeNumber(pricing.basePrice, 0),
    optionAdjustment: toSafeNumber(pricing.optionAdjustment, 0),
    gstRate: toSafeNumber(pricing.gstRate, 0),
    gstAmount: toSafeNumber(pricing.gstAmount, 0),
    unitPrice: toSafeNumber(pricing.unitPrice, 0),
  };
};

export const getMyCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.productId",
      "name price gstRate customFields image stock category"
    );

    if (!cart) {
      return res.status(200).json({ success: true, cart: { items: [] } });
    }

    const originalLength = cart.items.length;
    cart.items = cart.items.filter((item) => item.productId !== null);

    if (cart.items.length !== originalLength) {
      await cart.save();
    }

    res.status(200).json({ success: true, cart });
  } catch (error) {
    console.error("Get Cart Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const addToCart = async (req, res) => {
  try {
    const { productId, quantity, selectedCustomFields, pricingSnapshot } = req.body;
    const userId = req.user._id;

    if (!productId) {
      return res.status(400).json({ success: false, message: "Product ID is required" });
    }

    const safeQuantity = Math.max(1, Math.floor(toSafeNumber(quantity, 1)));
    const normalizedSelections = normalizeSelectedCustomFields(selectedCustomFields);
    const selectionSignature = getSelectionSignature(normalizedSelections);
    const safePricing = sanitizePricing(pricingSnapshot);

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    const itemIndex = cart.items.findIndex((item) => {
      const sameProduct = item.productId.toString() === String(productId);
      if (!sameProduct) return false;
      return getSelectionSignature(item.selectedCustomFields) === selectionSignature;
    });

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += safeQuantity;
      cart.items[itemIndex].selectedCustomFields = normalizedSelections;
      cart.items[itemIndex].pricing = safePricing;
    } else {
      cart.items.push({
        productId,
        quantity: safeQuantity,
        selectedCustomFields: normalizedSelections,
        pricing: safePricing,
      });
    }

    await cart.save();

    const updatedCart = await Cart.findById(cart._id).populate(
      "items.productId",
      "name price gstRate customFields image stock category"
    );

    res.status(200).json({ success: true, message: "Item added to cart", cart: updatedCart });
  } catch (error) {
    console.error("Add to Cart Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user._id;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    cart.items = cart.items.filter((item) => {
      const byItemId = item._id ? item._id.toString() === String(itemId) : false;
      const byProductId = item.productId ? item.productId.toString() === String(itemId) : false;
      return !(byItemId || byProductId);
    });
    await cart.save();

    const updatedCart = await Cart.findById(cart._id).populate(
      "items.productId",
      "name price gstRate customFields image stock category"
    );

    res.status(200).json({ success: true, message: "Item removed", cart: updatedCart });
  } catch (error) {
    console.error("Remove from Cart Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const { itemId, quantity } = req.body;
    const userId = req.user._id;

    if (!itemId) {
      return res.status(400).json({ success: false, message: "Cart item id is required" });
    }

    const safeQuantity = Math.floor(toSafeNumber(quantity, 1));
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    const getMatch = (item) => {
      const byItemId = item._id ? item._id.toString() === String(itemId) : false;
      const byProductId = item.productId ? item.productId.toString() === String(itemId) : false;
      return byItemId || byProductId;
    };

    if (safeQuantity <= 0) {
      cart.items = cart.items.filter((item) => !getMatch(item));
      await cart.save();
      const updatedCart = await Cart.findById(cart._id).populate(
        "items.productId",
        "name price gstRate customFields image stock category"
      );
      return res.status(200).json({ success: true, message: "Item removed", cart: updatedCart });
    }

    const itemIndex = cart.items.findIndex((item) => getMatch(item));
    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: "Item not found in cart" });
    }

    cart.items[itemIndex].quantity = safeQuantity;
    await cart.save();

    const updatedCart = await Cart.findById(cart._id).populate(
      "items.productId",
      "name price gstRate customFields image stock category"
    );
    res.status(200).json({ success: true, message: "Quantity updated", cart: updatedCart });
  } catch (error) {
    console.error("Update Cart Item Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const clearCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const cart = await Cart.findOne({ user: userId });
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    res.status(200).json({ success: true, message: "Cart cleared successfully", cart: { items: [] } });
  } catch (error) {
    console.error("Clear Cart Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const mergeCart = async (req, res) => {
  try {
    const { localItems } = req.body;
    const userId = req.user._id;

    if (!Array.isArray(localItems) || localItems.length === 0) {
      const cart = await Cart.findOne({ user: userId }).populate(
        "items.productId",
        "name price gstRate customFields image stock category"
      );
      return res.status(200).json({ success: true, message: "No items to merge", cart: cart || { items: [] } });
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    for (const localItem of localItems) {
      const productId = localItem?.productId?._id || localItem?.productId || localItem?._id;
      if (!productId) continue;

      const quantity = Math.max(1, Math.floor(toSafeNumber(localItem.quantity, 1)));
      const normalizedSelections = normalizeSelectedCustomFields(localItem.selectedCustomFields);
      const selectionSignature = getSelectionSignature(normalizedSelections);

      const itemIndex = cart.items.findIndex((dbItem) => {
        const sameProduct = dbItem.productId.toString() === String(productId);
        if (!sameProduct) return false;
        return getSelectionSignature(dbItem.selectedCustomFields) === selectionSignature;
      });

      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += quantity;
      } else {
        cart.items.push({
          productId,
          quantity,
          selectedCustomFields: normalizedSelections,
          pricing: sanitizePricing(localItem.pricingSnapshot || localItem.pricing),
        });
      }
    }

    await cart.save();

    const updatedCart = await Cart.findById(cart._id).populate(
      "items.productId",
      "name price gstRate customFields image stock category"
    );

    res.status(200).json({ success: true, message: "Cart merged successfully", cart: updatedCart });
  } catch (error) {
    console.error("Merge Cart Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

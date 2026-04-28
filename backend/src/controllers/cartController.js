import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

const round2 = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;
const toSafeNumber = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

// 🚀 THE CORE PRICING ENGINE
export const calculateExactPricing = async (productId, selectedCustomFields, variantParams) => {
  try {
    const product = await Product.findById(productId);
    if (!product) return null;

    let basePrice = toSafeNumber(product.price, 0);
    let optionAdjustment = 0;
    const gstRate = toSafeNumber(product.gstRate, 0);

    // 1. Calculate Option Adjustments (+₹200 etc)
    if (product.customFields && Array.isArray(product.customFields)) {
      for (const field of product.customFields) {
        const fieldLabel = String(field.label || "").trim();
        const selectedValue = selectedCustomFields?.[field._id] || selectedCustomFields?.[fieldLabel];
        
        if (!selectedValue) continue;

        const selectedValuesArr = Array.isArray(selectedValue) ? selectedValue : [selectedValue];
        
        for (const val of selectedValuesArr) {
          const matchedOption = (field.options || []).find(opt => {
            const optLabel = typeof opt === 'object' ? opt.label : opt;
            return String(optLabel).trim() === String(val).trim();
          });

          if (matchedOption && matchedOption.priceAdjustment) {
            optionAdjustment += toSafeNumber(matchedOption.priceAdjustment, 0);
          }
        }
      }
    }

    // 2. Variant Price Override
    if (variantParams && variantParams.price) {
      basePrice = toSafeNumber(variantParams.price, basePrice);
    }

    // 3. Exact Math
    const taxableAmount = round2(basePrice + optionAdjustment);
    const gstAmount = round2((taxableAmount * gstRate) / 100);
    const unitPrice = round2(taxableAmount + gstAmount);

    return {
      basePrice: round2(basePrice),
      optionAdjustment: round2(optionAdjustment),
      gstRate: round2(gstRate),
      gstAmount: round2(gstAmount),
      unitPrice: unitPrice, // 100% Accurate Total Price per piece
    };
  } catch (e) {
    console.error("Pricing Engine Error:", e);
    return null;
  }
};

export const getMyCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate("items.productId", "name price gstRate customFields image stock category shippingCharge sku weightKg");
    res.status(200).json({ success: true, cart: cart || { items: [] } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const addToCart = async (req, res) => {
  try {
    const { productId, quantity, selectedCustomFields, variant, attributes } = req.body;
    const userId = req.user._id;

    const safeQuantity = Math.max(1, Math.floor(toSafeNumber(quantity, 1)));
    
    // 🛡️ Get 100% real price from DB
    const truePricing = await calculateExactPricing(productId, selectedCustomFields || {}, variant);
    if (!truePricing) return res.status(404).json({ success: false, message: "Product not found" });

    let cart = await Cart.findOne({ user: userId });
    if (!cart) cart = new Cart({ user: userId, items: [] });

    const itemIndex = cart.items.findIndex(item => item.productId.toString() === String(productId));

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += safeQuantity;
      cart.items[itemIndex].selectedCustomFields = selectedCustomFields;
      cart.items[itemIndex].pricing = truePricing;
      cart.items[itemIndex].variant = variant;
      cart.items[itemIndex].attributes = attributes;
    } else {
      cart.items.push({
        productId,
        quantity: safeQuantity,
        selectedCustomFields: selectedCustomFields || {},
        pricing: truePricing,
        variant: variant || null,
        attributes: attributes || null
      });
    }

    await cart.save();
    const updatedCart = await Cart.findById(cart._id).populate("items.productId");
    res.status(200).json({ success: true, cart: updatedCart });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const { itemId, quantity } = req.body;
    const safeQuantity = Math.floor(toSafeNumber(quantity, 1));
    const cart = await Cart.findOne({ user: req.user._id });
    
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    if (safeQuantity <= 0) {
      cart.items = cart.items.filter(item => String(item._id) !== String(itemId) && String(item.productId) !== String(itemId));
    } else {
      const itemIndex = cart.items.findIndex(item => String(item._id) === String(itemId) || String(item.productId) === String(itemId));
      if (itemIndex > -1) cart.items[itemIndex].quantity = safeQuantity;
    }

    await cart.save();
    const updatedCart = await Cart.findById(cart._id).populate("items.productId");
    res.status(200).json({ success: true, cart: updatedCart });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ success: false });

    cart.items = cart.items.filter(item => String(item._id) !== String(req.params.itemId) && String(item.productId) !== String(req.params.itemId));
    await cart.save();
    
    const updatedCart = await Cart.findById(cart._id).populate("items.productId");
    res.status(200).json({ success: true, cart: updatedCart });
  } catch (error) { res.status(500).json({ success: false }); }
};

export const clearCart = async (req, res) => {
  try {
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
    res.status(200).json({ success: true, cart: { items: [] } });
  } catch (error) { res.status(500).json({ success: false }); }
};

export const mergeCart = async (req, res) => {
  try {
    const { localItems } = req.body;
    if (!Array.isArray(localItems) || localItems.length === 0) return res.status(200).json({ success: true });

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) cart = new Cart({ user: req.user._id, items: [] });

    for (const localItem of localItems) {
      const productId = localItem.productId?._id || localItem.productId;
      if (!productId) continue;

      const truePricing = await calculateExactPricing(productId, localItem.selectedCustomFields || {}, localItem.variant);
      if (!truePricing) continue;

      const itemIndex = cart.items.findIndex(dbItem => dbItem.productId.toString() === String(productId));

      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += Number(localItem.quantity || 1);
        cart.items[itemIndex].pricing = truePricing;
      } else {
        cart.items.push({
          productId, quantity: Number(localItem.quantity || 1),
          selectedCustomFields: localItem.selectedCustomFields || {},
          pricing: truePricing, variant: localItem.variant, attributes: localItem.attributes
        });
      }
    }
    await cart.save();
    res.status(200).json({ success: true });
  } catch (error) { res.status(500).json({ success: false }); }
};
import Quote from '../models/Quote.js';
import QuoteDraft from '../models/QuoteDraft.js'; 
import Product from '../models/Product.js'; 
import crypto from 'crypto';
import mongoose from 'mongoose';

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

const toOptionEntries = (options) => {
  if (!Array.isArray(options)) return [];
  return options
    .map((option) => {
      if (option && typeof option === "object" && !Array.isArray(option)) {
        const label = String(option.label || "").trim();
        if (!label) return null;
        return {
          label,
          priceAdjustment: toSafeNumber(option.priceAdjustment, 0),
        };
      }
      const label = String(option || "").trim();
      if (!label) return null;
      return { label, priceAdjustment: 0 };
    })
    .filter(Boolean);
};

const resolveSelectedOptions = (product, selectedCustomFields) => {
  const selections = normalizeSelectedCustomFields(selectedCustomFields);
  const selectedOptions = [];
  let optionAdjustment = 0;

  for (const field of product.customFields || []) {
    const fieldId = String(field._id || "");
    const fieldLabel = String(field.label || "").trim();
    const selectedValue = selections[fieldId] ?? selections[fieldLabel];
    if (!selectedValue || (Array.isArray(selectedValue) && !selectedValue.length)) continue;

    const options = toOptionEntries(field.options);
    const selectedValues = Array.isArray(selectedValue) ? selectedValue : [selectedValue];

    for (const value of selectedValues) {
      const safeValue = String(value || "").trim();
      if (!safeValue) continue;

      const matchedOption = options.find((option) => option.label === safeValue);
      const matchedAdjustment = matchedOption ? matchedOption.priceAdjustment : 0;
      optionAdjustment += matchedAdjustment;

      selectedOptions.push({
        fieldLabel: fieldLabel || fieldId || "Option",
        value: safeValue,
        priceAdjustment: matchedAdjustment,
      });
    }
  }

  return {
    selectedCustomFields: selections,
    selectedOptions,
    optionAdjustment,
  };
};

const normalizeQuoteItems = (incomingItems, existingItems = []) => {
  if (!Array.isArray(incomingItems)) return existingItems;
  const existingById = new Map(
    (existingItems || []).map((item) => [String(item._id || item.productId || ""), item])
  );

  return incomingItems
    .map((item) => {
      if (!item) return null;
      const itemKey = String(item._id || item.productId || "");
      const fallback = existingById.get(itemKey) || {};
      const productId =
        item.productId?._id ||
        item.productId ||
        fallback.productId ||
        null;

      const quantity = Math.max(1, Math.floor(toSafeNumber(item.quantity, fallback.quantity || 1)));
      const selectedCustomFields = normalizeSelectedCustomFields(
        item.selectedCustomFields || fallback.selectedCustomFields
      );
      const selectedOptions = Array.isArray(item.selectedOptions)
        ? item.selectedOptions
        : Array.isArray(fallback.selectedOptions)
          ? fallback.selectedOptions
          : [];

      const basePrice = toSafeNumber(item.basePrice, toSafeNumber(fallback.basePrice, 0));
      const optionAdjustment = toSafeNumber(item.optionAdjustment, toSafeNumber(fallback.optionAdjustment, 0));
      const rawOriginal =
        item.originalPrice === "" || item.originalPrice === null || item.originalPrice === undefined
          ? undefined
          : item.originalPrice;
      const originalPrice = toSafeNumber(
        rawOriginal,
        toSafeNumber(
          fallback.originalPrice,
          toSafeNumber(item.price, toSafeNumber(fallback.price, basePrice + optionAdjustment))
        )
      );
      const rawOffered =
        item.offeredPrice === "" || item.offeredPrice === null || item.offeredPrice === undefined
          ? undefined
          : item.offeredPrice;
      const offeredPrice = toSafeNumber(rawOffered, toSafeNumber(fallback.offeredPrice, originalPrice));

      const safeName = String(item.name || fallback.name || "Unknown Product").trim();
      if (!safeName) return null;

      return {
        productId,
        name: safeName,
        quantity,
        basePrice,
        optionAdjustment,
        originalPrice,
        offeredPrice,
        selectedCustomFields,
        selectedOptions,
      };
    })
    .filter(Boolean);
};

/* ============================================================
   🛒 A. QUOTE DRAFT SYSTEM (For QuoteContext)
   Logic: Acts exactly like a Cart, but specifically for quotations.
============================================================ */

export const getQuoteDraft = async (req, res) => {
  try {
    const draft = await QuoteDraft.findOne({ user: req.user._id }).populate(
      "items.productId",
      "name price image stock customFields"
    );
    if (!draft) return res.status(200).json({ success: true, quote: { items: [] } });
    
    // Clean up orphaned items (If a product was deleted by admin)
    const originalLength = draft.items.length;
    draft.items = draft.items.filter(item => item.productId !== null);
    
    if (draft.items.length !== originalLength) {
      await draft.save();
    }
    
    res.status(200).json({ success: true, quote: draft });
  } catch (error) {
    console.error("Get Quote Draft Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const addToQuoteDraft = async (req, res) => {
  try {
    const { productId, quantity, selectedCustomFields } = req.body;
    
    if (!productId) return res.status(400).json({ success: false, message: "Product ID is required" });

    const normalizedSelections = normalizeSelectedCustomFields(selectedCustomFields);
    let draft = await QuoteDraft.findOne({ user: req.user._id });

    if (!draft) {
      draft = new QuoteDraft({
        user: req.user._id,
        items: [{ productId, quantity: quantity || 1, selectedCustomFields: normalizedSelections }],
      });
    } else {
      const itemIndex = draft.items.findIndex(item => item.productId.toString() === productId);
      if (itemIndex > -1) {
        draft.items[itemIndex].quantity += (quantity || 1);
        draft.items[itemIndex].selectedCustomFields = normalizedSelections;
      } else {
        draft.items.push({ productId, quantity: quantity || 1, selectedCustomFields: normalizedSelections });
      }
    }

    await draft.save();
    const updatedDraft = await QuoteDraft.findById(draft._id).populate(
      "items.productId",
      "name price image stock customFields"
    );
    res.status(200).json({ success: true, message: "Added to quote draft", quote: updatedDraft });
  } catch (error) {
    console.error("Add Quote Draft Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const updateQuoteDraft = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    
    // Edge case: UI sends 0 or less
    if (quantity <= 0) {
      const draftToUpdate = await QuoteDraft.findOne({ user: req.user._id });
      if (draftToUpdate) {
        draftToUpdate.items = draftToUpdate.items.filter(item => item.productId.toString() !== productId);
        await draftToUpdate.save();
        const updatedDraft = await QuoteDraft.findById(draftToUpdate._id).populate(
          "items.productId",
          "name price image stock customFields"
        );
        return res.status(200).json({ success: true, message: "Item removed", quote: updatedDraft });
      }
    }

    const draft = await QuoteDraft.findOne({ user: req.user._id });
    if (!draft) return res.status(404).json({ success: false, message: "Draft not found" });

    const itemIndex = draft.items.findIndex(item => item.productId.toString() === productId);
    if (itemIndex > -1) {
      draft.items[itemIndex].quantity = quantity;
      await draft.save();
      const updatedDraft = await QuoteDraft.findById(draft._id).populate(
        "items.productId",
        "name price image stock customFields"
      );
      res.status(200).json({ success: true, message: "Quantity updated", quote: updatedDraft });
    } else {
      res.status(404).json({ success: false, message: "Item not found in draft" });
    }
  } catch (error) {
    console.error("Update Quote Draft Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const removeFromQuoteDraft = async (req, res) => {
  try {
    const draft = await QuoteDraft.findOne({ user: req.user._id });
    if (!draft) return res.status(404).json({ success: false, message: "Draft not found" });

    draft.items = draft.items.filter(item => item.productId.toString() !== req.params.productId);
    await draft.save();
    
    const updatedDraft = await QuoteDraft.findById(draft._id).populate(
      "items.productId",
      "name price image stock customFields"
    );
    res.status(200).json({ success: true, message: "Item removed", quote: updatedDraft });
  } catch (error) {
    console.error("Remove Quote Draft Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 🚀 NEW: MERGE QUOTE DRAFT (Guest LocalStorage to DB)
export const mergeQuoteDraft = async (req, res) => {
  try {
    const { localItems } = req.body;
    const userId = req.user._id;

    if (!localItems || localItems.length === 0) {
      const draft = await QuoteDraft.findOne({ user: userId }).populate(
        "items.productId",
        "name price image stock customFields"
      );
      return res.status(200).json({ success: true, message: "No items to merge", quote: draft || { items: [] } });
    }

    let draft = await QuoteDraft.findOne({ user: userId });

    if (!draft) {
      draft = new QuoteDraft({
        user: userId,
        items: localItems.map(item => ({
          productId: item._id || item.productId,
          quantity: item.quantity || 1,
          selectedCustomFields: normalizeSelectedCustomFields(item.selectedCustomFields),
        }))
      });
    } else {
      for (let localItem of localItems) {
        const prodId = localItem._id || localItem.productId;
        const qty = localItem.quantity || 1;
        const normalizedSelections = normalizeSelectedCustomFields(localItem.selectedCustomFields);

        const itemIndex = draft.items.findIndex((dbItem) => dbItem.productId.toString() === prodId.toString());

        if (itemIndex > -1) {
          draft.items[itemIndex].quantity += qty;
          draft.items[itemIndex].selectedCustomFields = normalizedSelections;
        } else {
          draft.items.push({ productId: prodId, quantity: qty, selectedCustomFields: normalizedSelections });
        }
      }
    }

    await draft.save();
    const updatedDraft = await QuoteDraft.findById(draft._id).populate(
      "items.productId",
      "name price image stock customFields"
    );
    
    res.status(200).json({ success: true, message: "Quote draft merged successfully", quote: updatedDraft });
  } catch (error) {
    console.error("Merge Quote Draft Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

/* ============================================================
   📝 B. FORMAL QUOTATION SUBMISSION & MANAGEMENT
============================================================ */

export const createQuote = async (req, res) => {
  try {
    const { userDetails, requestedItems } = req.body;

    if (!requestedItems || requestedItems.length === 0) {
      return res.status(400).json({ success: false, message: "No items provided in the quotation" });
    }
    if (!userDetails?.name || !userDetails?.email || !userDetails?.phone) {
      return res.status(400).json({ success: false, message: "Name, email and phone are required" });
    }

    const normalizedItems = requestedItems.map((item) => {
      const prodId = item.productId?._id || item.productId;
      if (!prodId || !Number.isFinite(Number(item.quantity)) || Number(item.quantity) < 1) {
        throw new Error("Invalid quote item data");
      }
      if (!mongoose.Types.ObjectId.isValid(prodId)) {
        throw new Error(`Invalid productId: ${prodId}`);
      }
      return {
        productId: prodId.toString(),
        quantity: Number(item.quantity),
        name: item.name || "Unknown Product",
        selectedCustomFields: normalizeSelectedCustomFields(item.selectedCustomFields),
      };
    });

    const productIds = [...new Set(normalizedItems.map((item) => item.productId))];
    const products = await Product.find({ _id: { $in: productIds } }).select("_id name price customFields");
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    const missingProducts = productIds.filter((id) => !productMap.has(id));
    if (missingProducts.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Some products are no longer available: ${missingProducts.join(", ")}`
      });
    }

    const itemsWithPrices = normalizedItems.map((item) => {
      const product = productMap.get(item.productId);
      const basePrice = toSafeNumber(product?.price, 0);
      const { selectedCustomFields, selectedOptions, optionAdjustment } = resolveSelectedOptions(
        product,
        item.selectedCustomFields
      );
      const originalPrice = toSafeNumber(basePrice + optionAdjustment, basePrice);

      return {
        productId: item.productId,
        name: product?.name || item.name,
        quantity: item.quantity,
        basePrice,
        optionAdjustment,
        originalPrice,
        offeredPrice: originalPrice,
        selectedCustomFields,
        selectedOptions,
      };
    });

    const token = crypto.randomBytes(12).toString('hex');

    const newQuote = new Quote({
      user: req.user._id,
      userDetails,
      requestedItems: itemsWithPrices,
      quoteToken: token, 
      status: "Pending"
    });

    await newQuote.save();

    // Clear the draft cart after successful submission
    await QuoteDraft.findOneAndUpdate({ user: req.user._id }, { items: [] });
    
    res.status(201).json({ success: true, message: "Quote submitted successfully!", quoteId: newQuote._id });
  } catch (error) {
    console.error("Create Quote Error:", error);
    if (
      error?.name === "ValidationError" ||
      error?.name === "CastError" ||
      error?.code === 11000 ||
      error?.message === "Invalid quote item data" ||
      String(error?.message || "").startsWith("Invalid productId:")
    ) {
      const statusCode = error?.code === 11000 ? 409 : 400;
      const message = error?.code === 11000 ? "Duplicate quote detected, please retry." : error.message;
      return res.status(statusCode).json({ success: false, message });
    }
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getMyQuotes = async (req, res) => {
  try {
    const quotes = await Quote.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, quotes });
  } catch (error) {
    console.error("Get My Quotes Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getQuoteById = async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id)
      .populate('user', 'name email')
      .populate('requestedItems.productId', 'name price customFields');
    if (!quote) return res.status(404).json({ success: false, message: "Quote not found" });
    res.status(200).json({ success: true, quote });
  } catch (error) {
    console.error("Get Quote By ID Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getAllQuotes = async (req, res) => {
  try {
    const quotes = await Quote.find().populate('user', 'name email').sort({ createdAt: -1 });
    res.status(200).json({ success: true, quotes });
  } catch (error) {
    console.error("Get All Quotes Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const respondToQuote = async (req, res) => {
  try {
    const { id } = req.params; 
    const { requestedItems, adminNotes, totalDiscount, shippingCharge, finalTotal, validUntil } = req.body;

    const existingQuote = await Quote.findById(id);
    if (!existingQuote) return res.status(404).json({ success: false, message: "Quote not found" });

    const normalizedItems = normalizeQuoteItems(requestedItems, existingQuote.requestedItems || []);
    const productIds = [...new Set(normalizedItems.map((item) => String(item.productId || "")))]
      .filter((prodId) => mongoose.Types.ObjectId.isValid(prodId))
      .map((prodId) => new mongoose.Types.ObjectId(prodId));
    const products = await Product.find({ _id: { $in: productIds } }).select("_id name price customFields");
    const productMap = new Map(products.map((p) => [String(p._id), p]));

    const enrichedItems = normalizedItems.map((item) => {
      const product = productMap.get(String(item.productId));
      if (!product) return item;

      const basePrice = toSafeNumber(product.price, toSafeNumber(item.basePrice, 0));
      const { selectedCustomFields, selectedOptions, optionAdjustment } = resolveSelectedOptions(
        product,
        item.selectedCustomFields
      );

      const rawOriginal = item.originalPrice;
      const originalPrice = Number.isFinite(Number(rawOriginal))
        ? Number(rawOriginal)
        : basePrice + optionAdjustment;
      const rawOffered = item.offeredPrice;
      const offeredPrice = Number.isFinite(Number(rawOffered)) ? Number(rawOffered) : originalPrice;

      return {
        ...item,
        basePrice,
        optionAdjustment,
        originalPrice,
        offeredPrice,
        selectedCustomFields,
        selectedOptions,
      };
    });

    const safeDiscount = Math.max(0, toSafeNumber(totalDiscount, existingQuote.totalDiscount || 0));
    const safeShipping = Math.max(0, toSafeNumber(shippingCharge, existingQuote.shippingCharge || 0));
    const computedSubTotal = enrichedItems.reduce(
      (sum, item) => sum + toSafeNumber(item.offeredPrice, 0) * toSafeNumber(item.quantity, 0),
      0
    );
    const computedFinal = Math.max(0, toSafeNumber(finalTotal, computedSubTotal - safeDiscount + safeShipping));

    const updatedQuote = await Quote.findByIdAndUpdate(
      id,
      {
        requestedItems: enrichedItems,
        adminNotes,
        totalDiscount: safeDiscount,
        shippingCharge: safeShipping,
        finalTotal: computedFinal,
        validUntil,
        status: "Responded",
      },
      { new: true }
    );

    if (!updatedQuote) return res.status(404).json({ success: false, message: "Quote not found" });

    const shareableLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/quote/${updatedQuote.quoteToken}`;
    
    res.status(200).json({ 
      success: true, 
      message: "Quote updated and responded successfully!", 
      link: shareableLink, 
      quote: updatedQuote 
    });
  } catch (error) {
    console.error("Respond To Quote Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getQuoteByToken = async (req, res) => {
  try {
    const quote = await Quote.findOne({ quoteToken: req.params.token })
      .populate('user', 'name email')
      .populate('requestedItems.productId', 'name price customFields');
    if (!quote) return res.status(404).json({ success: false, message: "Invalid or expired link" });
    res.status(200).json({ success: true, quote });
  } catch (error) {
    console.error("Get Quote By Token Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const updateQuoteStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["Accepted", "Rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status provided" });
    }

    const quote = await Quote.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!quote) return res.status(404).json({ success: false, message: "Quote not found" });

    res.status(200).json({ success: true, status: quote.status, message: `Quote marked as ${quote.status}` });
  } catch (error) {
    console.error("Update Quote Status Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

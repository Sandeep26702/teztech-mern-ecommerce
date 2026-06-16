import Quote from '../models/Quote.js';
import QuoteDraft from '../models/QuoteDraft.js'; 
import Product from '../models/Product.js'; 
import crypto from 'crypto';
import mongoose from 'mongoose';

const toSafeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getQuoteVersionNumber = (quote) => {
  const num = Number(quote?.version);
  return Number.isFinite(num) && num > 0 ? num : 1;
};

const getParentQuoteId = (quote) => quote?.parentQuoteId || quote?._id;

const buildLogEntry = (action, actor = "", note = "") => ({
  action,
  actor,
  note,
  at: new Date(),
});

const ensureBaseLogs = (quote) => {
  if (Array.isArray(quote?.quoteLogs) && quote.quoteLogs.length > 0) return quote.quoteLogs;
  const createdAt = quote?.createdAt ? new Date(quote.createdAt) : new Date();
  const actor = quote?.isManual ? "Admin" : "Client";
  return [buildLogEntry("Created", actor, "Initial quotation created")].map((entry) => ({
    ...entry,
    at: createdAt,
  }));
};

const fetchQuoteGroup = async (parentId) => {
  if (!parentId) return [];
  return Quote.find({ $or: [{ _id: parentId }, { parentQuoteId: parentId }] });
};

const getLatestQuoteFromGroup = (quotes) => {
  if (!quotes || quotes.length === 0) return null;
  return quotes.reduce((latest, current) => {
    if (!latest) return current;
    const latestVersion = getQuoteVersionNumber(latest);
    const currentVersion = getQuoteVersionNumber(current);
    if (currentVersion > latestVersion) return current;
    if (currentVersion === latestVersion) {
      return new Date(current.createdAt || 0) > new Date(latest.createdAt || 0) ? current : latest;
    }
    return latest;
  }, null);
};

const getPreviousQuoteFromGroup = (quotes, currentVersion) => {
  if (!quotes || quotes.length === 0) return null;
  const candidates = quotes.filter((item) => getQuoteVersionNumber(item) < currentVersion);
  return getLatestQuoteFromGroup(candidates);
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

      // 🔥 FIX: Naye attributes aur variants yahan map honge
      const selectedVariant = item.selectedVariant || fallback.selectedVariant || null;
      const selectedAttributes = item.selectedAttributes || fallback.selectedAttributes || {};

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
        selectedVariant,       // 🔥 NEW
        selectedAttributes,    // 🔥 NEW
      };
    })
    .filter(Boolean);
};

/* ============================================================
   🛒 A. QUOTE DRAFT SYSTEM
============================================================ */
export const getQuoteDraft = async (req, res) => {
  try {
    const draft = await QuoteDraft.findOne({ user: req.user._id }).populate(
      "items.productId",
      "name price image stock customFields"
    );
    if (!draft) return res.status(200).json({ success: true, quote: { items: [] } });
    
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
    const { productId, quantity, selectedCustomFields, selectedVariant, selectedAttributes } = req.body; // 🔥 Added new fields
    
    if (!productId) return res.status(400).json({ success: false, message: "Product ID is required" });

    const normalizedSelections = normalizeSelectedCustomFields(selectedCustomFields);
    let draft = await QuoteDraft.findOne({ user: req.user._id });

    if (!draft) {
      draft = new QuoteDraft({
        user: req.user._id,
        items: [{ 
            productId, 
            quantity: quantity || 1, 
            selectedCustomFields: normalizedSelections,
            selectedVariant: selectedVariant || null,
            selectedAttributes: selectedAttributes || {}
        }],
      });
    } else {
      const itemIndex = draft.items.findIndex(item => item.productId.toString() === productId);
      if (itemIndex > -1) {
        draft.items[itemIndex].quantity += (quantity || 1);
        draft.items[itemIndex].selectedCustomFields = normalizedSelections;
        draft.items[itemIndex].selectedVariant = selectedVariant || null;
        draft.items[itemIndex].selectedAttributes = selectedAttributes || {};
      } else {
        draft.items.push({ 
            productId, 
            quantity: quantity || 1, 
            selectedCustomFields: normalizedSelections,
            selectedVariant: selectedVariant || null,
            selectedAttributes: selectedAttributes || {}
        });
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
          selectedVariant: item.selectedVariant || null,
          selectedAttributes: item.selectedAttributes || {}
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
          draft.items[itemIndex].selectedVariant = localItem.selectedVariant || null;
          draft.items[itemIndex].selectedAttributes = localItem.selectedAttributes || {};
        } else {
          draft.items.push({ 
              productId: prodId, 
              quantity: qty, 
              selectedCustomFields: normalizedSelections,
              selectedVariant: localItem.selectedVariant || null,
              selectedAttributes: localItem.selectedAttributes || {}
          });
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

    // 🔥 FIX: Extracting variant and attributes
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
        selectedVariant: item.selectedVariant || null,         // 🔥 ADDED
        selectedAttributes: item.selectedAttributes || {},     // 🔥 ADDED
      };
    });

    const productIds = [...new Set(normalizedItems.map((item) => item.productId))];
    const products = await Product.find({ _id: { $in: productIds } }).select("_id name price customFields attributes variants");
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
      
      // Calculate Extra price from selectedAttributes (CSV)
      let attributeExtraPrice = 0;
      if (item.selectedAttributes && typeof item.selectedAttributes === 'object') {
          Object.values(item.selectedAttributes).forEach(attr => {
              if (attr && attr.priceAdjustment) attributeExtraPrice += Number(attr.priceAdjustment);
          });
      }

      const basePrice = toSafeNumber(product?.price, 0);
      const { selectedCustomFields, selectedOptions, optionAdjustment } = resolveSelectedOptions(
        product,
        item.selectedCustomFields
      );
      
      const originalPrice = toSafeNumber(basePrice + optionAdjustment + attributeExtraPrice, basePrice);

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
        selectedVariant: item.selectedVariant,       // 🔥 ADDED
        selectedAttributes: item.selectedAttributes, // 🔥 ADDED
      };
    });

    const token = crypto.randomBytes(12).toString('hex');

    const newQuote = new Quote({
      user: req.user._id,
      userDetails,
      requestedItems: itemsWithPrices,
      quoteToken: token, 
      status: "Pending",
      version: 1,
      parentQuoteId: null,
      quoteLogs: [buildLogEntry("Created", "Client", "Quotation requested by client")],
    });

    await newQuote.save();

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

const filterClientNotes = (quote) => {
  if (!quote) return quote;
  const quoteObj = quote.toObject ? quote.toObject() : quote;
  if (quoteObj.crmNotes) {
    quoteObj.crmNotes = quoteObj.crmNotes.filter(note => note.isPublic === true);
  }
  return quoteObj;
};

export const getMyQuotes = async (req, res) => {
  try {
    const quotes = await Quote.find({ user: req.user._id }).sort({ createdAt: -1 });
    const filteredQuotes = quotes.map(q => filterClientNotes(q));
    res.status(200).json({ success: true, quotes: filteredQuotes });
  } catch (error) {
    console.error("Get My Quotes Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getQuoteById = async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id)
      .populate('user', 'name email')
      .populate('assignedTo', 'name email role')
      .populate('requestedItems.productId', 'name price sellingPrice customFields image images sku details description category categoryPath variants attributes weightKg');
    if (!quote) return res.status(404).json({ success: false, message: "Quote not found" });
    const parentId = getParentQuoteId(quote);
    const groupQuotes = await fetchQuoteGroup(parentId);
    const latestQuote = getLatestQuoteFromGroup(groupQuotes);
    const versions = groupQuotes
      .map((item) => ({
        _id: item._id,
        version: getQuoteVersionNumber(item),
        status: item.status,
        updatedAt: item.updatedAt,
        quoteNumber: item.quoteNumber,
        requestedItems: (item.requestedItems || []).map((line) => ({
          productId: line.productId,
          name: line.name,
          quantity: line.quantity,
          originalPrice: line.originalPrice,
          offeredPrice: line.offeredPrice,
        })),
        totalDiscount: item.totalDiscount,
        extraDiscountType: item.extraDiscountType,
        extraDiscountValue: item.extraDiscountValue,
        shippingCharge: item.shippingCharge,
        gstPercentage: item.gstPercentage,
        additionalChargeName: item.additionalChargeName,
        additionalChargeAmount: item.additionalChargeAmount,
        finalTotal: item.finalTotal,
        adminNotes: item.adminNotes,
      }))
      .sort((a, b) => a.version - b.version);
    const latestVersion = latestQuote ? getQuoteVersionNumber(latestQuote) : getQuoteVersionNumber(quote);
    const isLatest = latestQuote ? String(latestQuote._id) === String(quote._id) : true;
    res.status(200).json({
      success: true,
      quote,
      isLatest,
      latestQuoteId: latestQuote?._id || quote._id,
      latestVersion,
      versions,
    });
  } catch (error) {
    console.error("Get Quote By ID Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getAllQuotes = async (req, res) => {
  try {
    const quotes = await Quote.find().populate('user', 'name email').populate('assignedTo', 'name email role').sort({ createdAt: -1 });
    res.status(200).json({ success: true, quotes });
  } catch (error) {
    console.error("Get All Quotes Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const respondToQuote = async (req, res) => {
  try {
    const { id } = req.params; 
    const {
      requestedItems,
      adminNotes,
      totalDiscount,
      shippingCharge,
      finalTotal,
      validUntil,
      extraDiscountType,
      extraDiscountValue,
      gstPercentage,
      additionalChargeName,
      additionalChargeAmount,
      assignedTo,
    } = req.body;

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
        selectedVariant: item.selectedVariant,       // 🔥 ADDED
        selectedAttributes: item.selectedAttributes, // 🔥 ADDED
      };
    });

    const incomingDiscountType =
      extraDiscountType === "percent" ? "percent" : extraDiscountType === "flat" ? "flat" : null;
    const safeDiscountType =
      incomingDiscountType || (existingQuote.extraDiscountType === "percent" ? "percent" : "flat");
    const fallbackDiscountValue =
      extraDiscountValue === undefined || extraDiscountValue === null
        ? toSafeNumber(totalDiscount, existingQuote.extraDiscountValue ?? existingQuote.totalDiscount ?? 0)
        : extraDiscountValue;
    const rawDiscountValue = toSafeNumber(
      fallbackDiscountValue,
      existingQuote.extraDiscountValue ?? existingQuote.totalDiscount ?? 0
    );
    const safeDiscountValue =
      safeDiscountType === "percent"
        ? Math.min(100, Math.max(0, rawDiscountValue))
        : Math.max(0, rawDiscountValue);
    const safeShipping = Math.max(0, toSafeNumber(shippingCharge, existingQuote.shippingCharge || 0));
    const computedSubTotal = enrichedItems.reduce(
      (sum, item) => sum + toSafeNumber(item.offeredPrice, 0) * toSafeNumber(item.quantity, 0),
      0
    );
    const round2 = (num) => Math.round(num * 100) / 100;
    
    const discountAmount =
      safeDiscountType === "percent"
        ? round2(computedSubTotal * (safeDiscountValue / 100))
        : safeDiscountValue;
    const safeGst = Math.min(100, Math.max(0, toSafeNumber(gstPercentage, existingQuote.gstPercentage || 0)));
    const gstAmount = round2((computedSubTotal - discountAmount + safeShipping) * (safeGst / 100));
    const safeAdditional = Math.max(0, toSafeNumber(additionalChargeAmount, existingQuote.additionalChargeAmount || 0));
    const computedFinal = Math.max(
      0,
      toSafeNumber(finalTotal, computedSubTotal - discountAmount + safeShipping + gstAmount + safeAdditional)
    );
    const parentId = getParentQuoteId(existingQuote);
    const groupQuotes = await fetchQuoteGroup(parentId);
    const latestQuote = getLatestQuoteFromGroup(groupQuotes);
    if (latestQuote && String(latestQuote._id) !== String(existingQuote._id)) {
      return res.status(409).json({
        success: false,
        message: "Cannot update an older version of this quote.",
        latestQuoteId: latestQuote._id,
        latestQuoteToken: latestQuote.quoteToken,
      });
    }

    const currentVersion = getQuoteVersionNumber(latestQuote || existingQuote);
    const nextVersion = currentVersion + 1;
    const nextStatus = existingQuote.status === "Pending" ? "Offered" : "Updated";
    const updateLog = `Quote updated by Admin on ${new Date().toISOString()}`;
    const baseLogs = ensureBaseLogs(existingQuote);
    const nextLogs = [
      ...baseLogs,
      buildLogEntry(`V${nextVersion} Created`, "Admin", "Admin created a new version"),
    ];

    const newQuote = new Quote({
      user: existingQuote.user,
      userDetails: existingQuote.userDetails,
      requestedItems: enrichedItems,
      adminNotes,
      totalDiscount: discountAmount,
      extraDiscountType: safeDiscountType,
      extraDiscountValue: safeDiscountValue,
      shippingCharge: safeShipping,
      selectedShippingProvider: req.body.selectedShippingProvider !== undefined ? req.body.selectedShippingProvider : (existingQuote.selectedShippingProvider || ""),
      courierPartner: req.body.selectedShippingProvider !== undefined ? req.body.selectedShippingProvider : (existingQuote.courierPartner || ""),
      ratePerKg: Number(req.body.ratePerKg !== undefined ? req.body.ratePerKg : (existingQuote.ratePerKg || 0)),
      shippingWeightKg: Number(req.body.shippingWeightKg !== undefined ? req.body.shippingWeightKg : (existingQuote.shippingWeightKg || 0)),
      gstPercentage: safeGst,
      additionalChargeName: String(additionalChargeName || existingQuote.additionalChargeName || "").trim(),
      additionalChargeAmount: safeAdditional,
      finalTotal: computedFinal,
      validUntil,
      status: nextStatus,
      isManual: existingQuote.isManual,
      quoteToken: crypto.randomBytes(12).toString("hex"),
      parentQuoteId: parentId,
      version: nextVersion,
      adminUpdateLogs: [...(existingQuote.adminUpdateLogs || []), updateLog],
      quoteLogs: nextLogs,
      assignedTo: assignedTo !== undefined ? (assignedTo || null) : existingQuote.assignedTo,
      crmNotes: existingQuote.crmNotes || [],
    });

    const savedQuote = await newQuote.save();

    const shareableLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/quote/${savedQuote.quoteToken}`;
    
    res.status(200).json({ 
      success: true, 
      message: "Quote updated and responded successfully!", 
      link: shareableLink, 
      quote: savedQuote 
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
      .populate('requestedItems.productId', 'name price sellingPrice customFields image images sku details description category categoryPath variants attributes weightKg');
    if (!quote) return res.status(404).json({ success: false, message: "Invalid or expired link" });
    const parentId = getParentQuoteId(quote);
    const groupQuotes = await fetchQuoteGroup(parentId);
    const latestQuote = getLatestQuoteFromGroup(groupQuotes);
    const currentVersion = getQuoteVersionNumber(quote);
    const isLatest = latestQuote ? String(latestQuote._id) === String(quote._id) : true;
    const latestVersion = latestQuote ? getQuoteVersionNumber(latestQuote) : currentVersion;
    const previousQuote = getPreviousQuoteFromGroup(groupQuotes, currentVersion);
    const parentQuote = groupQuotes.find((item) => String(item._id) === String(parentId)) || quote;

    await Quote.findByIdAndUpdate(quote._id, {
      $push: { quoteLogs: buildLogEntry("Viewed by Client", "Client", "Quote viewed by client") },
    });

    const filteredQuote = filterClientNotes(quote);

    res.status(200).json({
      success: true,
      quote: filteredQuote,
      isLatest,
      latestQuoteToken: latestQuote?.quoteToken || null,
      latestQuoteId: latestQuote?._id || null,
      latestVersion,
      previousQuote: previousQuote
        ? {
            _id: previousQuote._id,
            version: getQuoteVersionNumber(previousQuote),
            requestedItems: previousQuote.requestedItems,
            totalDiscount: previousQuote.totalDiscount,
            shippingCharge: previousQuote.shippingCharge,
            gstPercentage: previousQuote.gstPercentage,
            additionalChargeName: previousQuote.additionalChargeName,
            additionalChargeAmount: previousQuote.additionalChargeAmount,
            finalTotal: previousQuote.finalTotal,
            updatedAt: previousQuote.updatedAt,
          }
        : null,
      parentQuoteNumber: parentQuote?.quoteNumber || null,
    });
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

    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ success: false, message: "Quote not found" });

    const parentId = getParentQuoteId(quote);
    const groupQuotes = await fetchQuoteGroup(parentId);
    const latestQuote = getLatestQuoteFromGroup(groupQuotes);
    if (latestQuote && String(latestQuote._id) !== String(quote._id)) {
      return res.status(409).json({
        success: false,
        message: "Only the latest quote version can be updated.",
        latestQuoteId: latestQuote._id,
        latestQuoteToken: latestQuote.quoteToken,
      });
    }

    const logAction = status === "Accepted" ? "Accepted" : "Revision Requested";
    const updatedQuote = await Quote.findByIdAndUpdate(
      req.params.id,
      {
        $set: { status },
        $push: { quoteLogs: buildLogEntry(logAction, "Client", `Client ${status.toLowerCase()} the quote`) },
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      status: updatedQuote.status,
      message: `Quote marked as ${updatedQuote.status}`,
    });
  } catch (error) {
    console.error("Update Quote Status Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const createManualQuote = async (req, res) => {
  try {
    const {
      userDetails: payloadUserDetails,
      clientDetails,
      requestedItems: payloadItems,
      items,
      shippingCharge = 0,
      additionalChargeName = "",
      additionalChargeAmount = 0,
      gstPercentage = 0,
      extraDiscountType = "flat",
      extraDiscountValue = 0,
      totalDiscount = 0,
      finalTotal = 0,
    } = req.body;
    const userDetails = payloadUserDetails || clientDetails || {};
    const requestedItems = payloadItems || items || [];

    if (!requestedItems || requestedItems.length === 0) {
      return res.status(400).json({ success: false, message: "No items provided in the manual quotation" });
    }
    if (!userDetails?.name || !userDetails?.phone) {
      return res.status(400).json({ success: false, message: "Client name and phone are required for manual quote" });
    }

    const normalizedItems = requestedItems.map((item) => {
      const prodId = item.productId?._id || item.productId;
      if (!prodId || !Number.isFinite(Number(item.quantity)) || Number(item.quantity) < 1) {
        throw new Error("Invalid manual quote item data");
      }
      if (!mongoose.Types.ObjectId.isValid(prodId)) {
        throw new Error(`Invalid productId: ${prodId}`);
      }
      return {
        productId: prodId.toString(),
        quantity: Number(item.quantity),
        name: item.name || "Unknown Product",
        offeredPrice: toSafeNumber(item.offeredPrice, 0),
        selectedCustomFields: normalizeSelectedCustomFields(item.selectedCustomFields || {}),
        selectedVariant: item.selectedVariant || null,       // 🔥 ADDED
        selectedAttributes: item.selectedAttributes || {},   // 🔥 ADDED
      };
    });

    const productIds = [...new Set(normalizedItems.map((item) => item.productId))];
    const products = await Product.find({ _id: { $in: productIds } }).select("_id name sku image sellingPrice price customFields");
    const productMap = new Map(products.map((p) => [String(p._id), p]));

    const itemsWithPrices = normalizedItems.map((item) => {
      const product = productMap.get(item.productId);
      return {
        ...item,
        basePrice: product ? product.price : 0,
        originalPrice: item.offeredPrice || product?.price || 0,
        selectedVariant: item.selectedVariant,       
        selectedAttributes: item.selectedAttributes, 
      };
    });

    const token = crypto.randomBytes(12).toString('hex');

    const safeDiscountType = extraDiscountType === "percent" ? "percent" : "flat";
    const rawDiscountValue = toSafeNumber(extraDiscountValue, 0);
    const safeDiscountValue = safeDiscountType === "percent" ? Math.min(100, Math.max(0, rawDiscountValue)) : Math.max(0, rawDiscountValue);

    const computedSubTotal = itemsWithPrices.reduce(
      (sum, item) => sum + toSafeNumber(item.offeredPrice, 0) * toSafeNumber(item.quantity, 0),
      0
    );
    const discountAmount = safeDiscountType === "percent" ? Math.round(computedSubTotal * (safeDiscountValue / 100) * 100) / 100 : safeDiscountValue;
    const safeShipping = Math.max(0, toSafeNumber(shippingCharge, 0));
    const safeGst = Math.min(100, Math.max(0, toSafeNumber(gstPercentage, 0)));
    const gstAmount = Math.round((computedSubTotal - discountAmount + safeShipping) * (safeGst / 100) * 100) / 100;
    const safeAdditional = Math.max(0, toSafeNumber(additionalChargeAmount, 0));
    const computedFinal = Math.max(0, computedSubTotal - discountAmount + safeShipping + gstAmount + safeAdditional);

    const newQuote = new Quote({
      user: req.user ? req.user._id : null,
      userDetails,
      requestedItems: itemsWithPrices,
      quoteToken: token,
      status: "Offered", 
      version: 1,
      isManual: true,
      shippingCharge: safeShipping,
      selectedShippingProvider: req.body.selectedShippingProvider || "",
      courierPartner: req.body.selectedShippingProvider || "",
      ratePerKg: Number(req.body.ratePerKg) || 0,
      shippingWeightKg: Number(req.body.shippingWeightKg) || 0,
      additionalChargeName,
      additionalChargeAmount: safeAdditional,
      gstPercentage: safeGst,
      extraDiscountType: safeDiscountType,
      extraDiscountValue: safeDiscountValue,
      totalDiscount: toSafeNumber(totalDiscount, discountAmount),
      finalTotal: toSafeNumber(finalTotal, computedFinal),
      quoteLogs: [buildLogEntry("Created", "Admin", "Manual quotation created by Admin")],
    });

    await newQuote.save();

    res.status(201).json({ success: true, message: "Manual Quote created successfully!", quoteId: newQuote._id, quoteToken: newQuote.quoteToken, quote: newQuote });
  } catch (error) {
    console.error("Create Manual Quote Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Assign quote to a sales person
export const assignQuote = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body; // User ID

    const quote = await Quote.findById(id);
    if (!quote) return res.status(404).json({ success: false, message: "Quote not found" });

    quote.assignedTo = assignedTo || null;
    await quote.save();

    const updatedQuote = await Quote.findById(id)
      .populate('user', 'name email')
      .populate('assignedTo', 'name email role')
      .populate('requestedItems.productId', 'name price customFields image images sku details description category categoryPath variants attributes weightKg');

    res.status(200).json({ success: true, message: "Quote assigned successfully!", quote: updatedQuote });
  } catch (error) {
    console.error("Assign Quote Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Add a CRM note to a quote
export const addQuoteCrmNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    if (!remarks || !remarks.trim()) {
      return res.status(400).json({ success: false, message: "Remarks are required" });
    }

    const quote = await Quote.findById(id);
    if (!quote) return res.status(404).json({ success: false, message: "Quote not found" });

    if (!quote.crmNotes) quote.crmNotes = [];
    quote.crmNotes.push({
      author: req.user.name || "Sales Team",
      remarks: remarks.trim(),
      createdAt: new Date(),
      isPublic: true, // Always public for direct chat
      role: "admin",
    });

    await quote.save();

    const updatedQuote = await Quote.findById(id)
      .populate('user', 'name email')
      .populate('assignedTo', 'name email role')
      .populate('requestedItems.productId', 'name price customFields image images sku details description category categoryPath variants attributes weightKg');

    res.status(200).json({ success: true, message: "CRM comment added successfully!", quote: updatedQuote });
  } catch (error) {
    console.error("Add Quote CRM Note Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Add client comment (public only, owner only)
export const addClientQuoteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    if (!remarks || !remarks.trim()) {
      return res.status(400).json({ success: false, message: "Remarks are required" });
    }

    const quote = await Quote.findById(id);
    if (!quote) return res.status(404).json({ success: false, message: "Quote not found" });

    // Security check: only the owner can comment
    if (quote.user && quote.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to comment on this quote" });
    }

    if (!quote.crmNotes) quote.crmNotes = [];
    quote.crmNotes.push({
      author: "Client",
      remarks: remarks.trim(),
      createdAt: new Date(),
      isPublic: true,
      role: "client",
    });

    await quote.save();

    const updatedQuote = await Quote.findById(id)
      .populate('user', 'name email')
      .populate('assignedTo', 'name email role')
      .populate('requestedItems.productId', 'name price customFields image images sku details description category categoryPath variants attributes weightKg');

    const quoteObj = updatedQuote.toObject ? updatedQuote.toObject() : updatedQuote;
    if (quoteObj.crmNotes) {
      quoteObj.crmNotes = quoteObj.crmNotes.filter(note => note.isPublic === true);
    }

    res.status(200).json({ success: true, message: "Comment added successfully!", quote: quoteObj });
  } catch (error) {
    console.error("Add Client Quote Comment Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
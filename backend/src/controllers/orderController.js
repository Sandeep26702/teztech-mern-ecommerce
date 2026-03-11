import mongoose from "mongoose";
import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";

const ORDER_COUNTER_KEY = "order_number_seq";
const ORDER_NUMBER_START = 100000;

const round2 = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

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
    optionAdjustment: round2(optionAdjustment),
  };
};

const getNextOrderNumber = async () => {
  const counters = mongoose.connection.collection("counters");
  const result = await counters.findOneAndUpdate(
    { _id: ORDER_COUNTER_KEY },
    { $inc: { seq: 1 }, $setOnInsert: { seq: ORDER_NUMBER_START } },
    { upsert: true, returnDocument: "after" }
  );

  if (result?.value?.seq) return Number(result.value.seq);

  const currentCounter = await counters.findOne({ _id: ORDER_COUNTER_KEY });
  return Number(currentCounter?.seq || ORDER_NUMBER_START);
};

const getFallbackOrderNumber = async () => {
  const latest = await Order.findOne({ orderNumber: { $exists: true } })
    .sort({ orderNumber: -1 })
    .select("orderNumber")
    .lean();

  if (!latest?.orderNumber || !Number.isFinite(Number(latest.orderNumber))) {
    return ORDER_NUMBER_START;
  }

  return Number(latest.orderNumber) + 1;
};

const allocateOrderNumber = async () => {
  try {
    const next = await getNextOrderNumber();
    if (Number.isFinite(next)) return next;
  } catch (error) {
    console.error("Primary order number generator failed:", error.message);
  }
  return getFallbackOrderNumber();
};

const buildOrderCode = (orderNumber) => `TZ-${String(orderNumber).padStart(6, "0")}`;

const backfillOrderIdentity = async () => {
  const orders = await Order.find({
    $or: [{ orderNumber: { $exists: false } }, { orderCode: { $exists: false } }],
  })
    .sort({ createdAt: 1 })
    .select("_id orderNumber");

  if (!orders.length) return;

  const bulkOps = [];
  for (const order of orders) {
    let nextOrderNumber = order.orderNumber;
    if (!nextOrderNumber) {
      nextOrderNumber = await getNextOrderNumber();
    }
    bulkOps.push({
      updateOne: {
        filter: { _id: order._id },
        update: {
          $set: {
            orderNumber: nextOrderNumber,
            orderCode: buildOrderCode(nextOrderNumber),
          },
        },
      },
    });
  }

  if (bulkOps.length) {
    await Order.bulkWrite(bulkOps);
  }
};

const safeBackfillOrderIdentity = async () => {
  try {
    await backfillOrderIdentity();
  } catch (error) {
    console.error("Order identity backfill skipped:", error.message);
  }
};

const withNormalizedItems = (orderDoc) => {
  const order = orderDoc.toObject ? orderDoc.toObject() : orderDoc;
  if (order.orderStatus === "Shipped") {
    order.orderStatus = "Shipping";
  }
  order.items = (order.items || []).map((item) => {
    const populatedProduct =
      item?.productId && typeof item.productId === "object" && !Array.isArray(item.productId)
        ? item.productId
        : null;

    const basePrice = toSafeNumber(item.basePrice, toSafeNumber(item.price, toSafeNumber(populatedProduct?.price, 0)));
    const optionAdjustment = toSafeNumber(item.optionAdjustment, 0);
    const gstRate = toSafeNumber(item.gstRate, 0);
    const unitPrice = toSafeNumber(item.unitPrice, toSafeNumber(item.price, basePrice + optionAdjustment));
    const gstAmount = toSafeNumber(item.gstAmount, round2(unitPrice - (basePrice + optionAdjustment)));
    const shippingCharge = toSafeNumber(item.shippingCharge, toSafeNumber(populatedProduct?.shippingCharge, 0));
    const lineShippingTotal = toSafeNumber(
      item.lineShippingTotal,
      round2(shippingCharge * toSafeNumber(item.quantity, 1))
    );

    return {
      ...item,
      productId: populatedProduct?._id || item.productId,
      image: item.image || populatedProduct?.image || "https://placehold.co/600x600?text=Product",
      category: item.category || populatedProduct?.category || "Uncategorized",
      name: item.name || populatedProduct?.name || "Product",
      basePrice,
      optionAdjustment,
      gstRate,
      unitPrice,
      gstAmount,
      price: toSafeNumber(item.price, unitPrice),
      shippingCharge,
      lineShippingTotal,
    };
  });

  if (!order.orderCode && order.orderNumber) {
    order.orderCode = buildOrderCode(order.orderNumber);
  }
  if (!Number.isFinite(toSafeNumber(order.subtotalAmount))) {
    order.subtotalAmount = round2(
      (order.items || []).reduce((sum, item) => sum + toSafeNumber(item.lineSubtotal, 0), 0)
    );
  }
  if (!Number.isFinite(toSafeNumber(order.gstAmount))) {
    order.gstAmount = round2(
      (order.items || []).reduce((sum, item) => sum + toSafeNumber(item.lineGstTotal, 0), 0)
    );
  }
  if (!Number.isFinite(toSafeNumber(order.shippingAmount))) {
    order.shippingAmount = round2(
      (order.items || []).reduce((sum, item) => sum + toSafeNumber(item.lineShippingTotal, 0), 0)
    );
  }
  if (!Number.isFinite(toSafeNumber(order.totalAmount))) {
    order.totalAmount = round2(
      toSafeNumber(order.subtotalAmount, 0) + toSafeNumber(order.gstAmount, 0) + toSafeNumber(order.shippingAmount, 0)
    );
  }

  return order;
};

export const createOrder = async (req, res) => {
  try {
    const { items, shippingInfo, paymentMethod, addressId, saveNewAddress } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty or shipping address is missing" });
    }

    if (!["COD", "ONLINE"].includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: "Invalid payment method" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    let finalShippingInfo = shippingInfo;
    if (addressId) {
      const savedAddress = user.addresses.id(addressId);
      if (!savedAddress) {
        return res.status(404).json({ success: false, message: "Selected address not found" });
      }
      finalShippingInfo = {
        fullName: savedAddress.fullName,
        phone: savedAddress.phone,
        address: [savedAddress.address, savedAddress.locality].filter(Boolean).join(", "),
        city: savedAddress.city,
        state: savedAddress.state || "",
        pincode: savedAddress.pincode,
      };
    }

    if (
      !finalShippingInfo ||
      !finalShippingInfo.fullName ||
      !finalShippingInfo.phone ||
      !finalShippingInfo.address ||
      !finalShippingInfo.city ||
      !finalShippingInfo.pincode
    ) {
      return res.status(400).json({ success: false, message: "Please provide complete shipping information" });
    }

    const finalOrderItems = [];
    let subtotalAmount = 0;
    let gstAmount = 0;
    let shippingAmount = 0;

    for (const rawItem of items) {
      const productId = rawItem?.productId?._id || rawItem?.productId;
      const quantity = Math.floor(toSafeNumber(rawItem?.quantity, 0));

      if (!productId || !Number.isFinite(quantity) || quantity < 1) {
        return res.status(400).json({ success: false, message: "Each order item must include valid productId and quantity" });
      }

      if (!mongoose.Types.ObjectId.isValid(String(productId))) {
        return res.status(400).json({ success: false, message: `Invalid productId: ${productId}` });
      }

      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product not found: ${productId}` });
      }

      if (product.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} units of ${product.name} are available.`,
        });
      }

      const { selectedCustomFields, selectedOptions, optionAdjustment } = resolveSelectedOptions(
        product,
        rawItem.selectedCustomFields
      );

      const basePrice = round2(toSafeNumber(product.price, 0));
      const gstRate = Math.max(0, Math.min(100, toSafeNumber(product.gstRate, 0)));
      const taxableUnit = round2(Math.max(0, basePrice + optionAdjustment));
      const unitGst = round2((taxableUnit * gstRate) / 100);
      const unitPrice = round2(taxableUnit + unitGst);
      const lineSubtotal = round2(taxableUnit * quantity);
      const lineGstTotal = round2(unitGst * quantity);
      const lineTotal = round2(unitPrice * quantity);
      const shippingCharge = Math.max(0, toSafeNumber(product.shippingCharge, 0));
      const lineShippingTotal = round2(shippingCharge * quantity);

      finalOrderItems.push({
        productId: product._id,
        name: product.name,
        category: product.category || "Uncategorized",
        image: product.image || "https://placehold.co/600x600?text=Product",
        quantity,
        basePrice,
        optionAdjustment,
        gstRate,
        unitPrice,
        gstAmount: unitGst,
        price: unitPrice,
        shippingCharge,
        selectedCustomFields,
        selectedOptions,
        lineSubtotal,
        lineGstTotal,
        lineShippingTotal,
        lineTotal,
      });

      product.stock -= quantity;
      await product.save();

      subtotalAmount += lineSubtotal;
      gstAmount += lineGstTotal;
      shippingAmount += lineShippingTotal;
    }

    let savedOrder = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const orderNumber = await allocateOrderNumber();
        const order = new Order({
          orderNumber,
          orderCode: buildOrderCode(orderNumber),
          user: req.user._id,
          items: finalOrderItems,
          shippingInfo: {
            fullName: String(finalShippingInfo.fullName).trim(),
            phone: String(finalShippingInfo.phone).trim(),
            address: String(finalShippingInfo.address).trim(),
            city: String(finalShippingInfo.city).trim(),
            state: String(finalShippingInfo.state || "").trim(),
            pincode: String(finalShippingInfo.pincode).trim(),
          },
          paymentMethod,
          paymentStatus: paymentMethod === "COD" ? "Pending" : "Paid",
          subtotalAmount: round2(subtotalAmount),
          gstAmount: round2(gstAmount),
          shippingAmount: round2(shippingAmount),
          totalAmount: round2(subtotalAmount + gstAmount + shippingAmount),
        });

        savedOrder = await order.save();
        break;
      } catch (saveError) {
        if (saveError?.code === 11000 && (saveError?.keyPattern?.orderNumber || saveError?.keyPattern?.orderCode)) {
          continue;
        }
        throw saveError;
      }
    }

    if (!savedOrder) {
      return res.status(500).json({
        success: false,
        message: "Could not generate unique order id. Please try again.",
      });
    }

    if (!addressId && saveNewAddress && shippingInfo) {
      const exists = (user.addresses || []).some((addr) => {
        const normalizedAddress = [addr.address, addr.locality].filter(Boolean).join(", ").trim().toLowerCase();
        return (
          addr.fullName.trim().toLowerCase() === String(shippingInfo.fullName).trim().toLowerCase() &&
          addr.phone.trim() === String(shippingInfo.phone).trim() &&
          normalizedAddress === String(shippingInfo.address).trim().toLowerCase() &&
          addr.city.trim().toLowerCase() === String(shippingInfo.city).trim().toLowerCase() &&
          addr.pincode.trim() === String(shippingInfo.pincode).trim()
        );
      });

      if (!exists) {
        user.addresses.push({
          fullName: String(shippingInfo.fullName).trim(),
          phone: String(shippingInfo.phone).trim(),
          pincode: String(shippingInfo.pincode).trim(),
          locality: "",
          address: String(shippingInfo.address).trim(),
          city: String(shippingInfo.city).trim(),
          state: String(shippingInfo.state || "").trim(),
          landmark: "",
          altPhone: "",
          type: "HOME",
          label: "Saved from checkout",
          isDefault: !user.addresses.length,
        });
        await user.save();
      }
    }

    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order: withNormalizedItems(savedOrder),
    });
  } catch (error) {
    console.error("Order Creation Error:", error);
    if (error?.name === "ValidationError") {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error?.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid request data format" });
    }
    res.status(500).json({ success: false, message: "Server error while placing order" });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    await safeBackfillOrderIdentity();
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, orders: orders.map(withNormalizedItems) });
  } catch (error) {
    console.error("Get My Orders Error:", error);
    res.status(500).json({ success: false, message: "Error fetching your orders" });
  }
};

export const getAllOrdersForAdmin = async (req, res) => {
  try {
    await safeBackfillOrderIdentity();
    const orders = await Order.find().populate("user", "name email").sort({ createdAt: -1 });
    res.status(200).json({ success: true, orders: orders.map(withNormalizedItems) });
  } catch (error) {
    console.error("Fetch Admin Orders Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
};

export const getOrderDetail = async (req, res) => {
  try {
    await safeBackfillOrderIdentity();
    const order = await Order.findById(req.params.id).populate("user", "name email");
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    res.status(200).json({ success: true, order: withNormalizedItems(order) });
  } catch (error) {
    console.error("Order Detail Error:", error);
    res.status(500).json({ success: false, message: "Error fetching order details" });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus, paymentStatus } = req.body;

    const validOrderStatuses = ["Confirmed", "Processing", "Shipping", "Out for Delivery", "Delivered", "Cancelled", "Returned", "Shipped"];
    const validPaymentStatuses = ["Pending", "Paid", "Failed", "Refunded"];

    if (orderStatus && !validOrderStatuses.includes(orderStatus)) {
      return res.status(400).json({ success: false, message: "Invalid order status" });
    }
    if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
      return res.status(400).json({ success: false, message: "Invalid payment status" });
    }

    const updatePayload = {};
    if (orderStatus) updatePayload.orderStatus = orderStatus;
    if (paymentStatus) updatePayload.paymentStatus = paymentStatus;

    if (orderStatus === "Shipped" || orderStatus === "Shipping" || orderStatus === "Out for Delivery") {
      updatePayload.shippedAt = new Date();
    }
    if (orderStatus === "Delivered") {
      updatePayload.deliveredAt = new Date();
      updatePayload.shippedAt = updatePayload.shippedAt || new Date();
    }

    if (!Object.keys(updatePayload).length) {
      return res.status(400).json({ success: false, message: "No valid status fields provided" });
    }

    const order = await Order.findByIdAndUpdate(req.params.orderId, updatePayload, { new: true });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.status(200).json({
      success: true,
      message: orderStatus ? `Order marked as ${orderStatus}` : `Payment marked as ${paymentStatus}`,
      order: withNormalizedItems(order),
    });
  } catch (error) {
    console.error("Update Order Error:", error);
    res.status(500).json({ success: false, message: "Failed to update order status" });
  }
};

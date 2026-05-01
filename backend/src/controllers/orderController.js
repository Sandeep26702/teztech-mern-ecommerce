import mongoose from "mongoose";
import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import ShippingProvider from "../models/ShippingProvider.js";

const ORDER_COUNTER_KEY = "order_number_seq";
const ORDER_NUMBER_START = 100000;
const round2 = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;
const toSafeNumber = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

// 🔢 Safe Order Number Generator (Fixed logic)
const getNextOrderNumber = async () => {
  const counters = mongoose.connection.collection("counters");
  const result = await counters.findOneAndUpdate(
    { _id: ORDER_COUNTER_KEY },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after" }
  );

  let seqVal = result?.value?.seq !== undefined ? result.value.seq : result?.seq;
  let currentSeq = Number(seqVal);

  if (!currentSeq || currentSeq < ORDER_NUMBER_START) {
    const reset = await counters.findOneAndUpdate(
      { _id: ORDER_COUNTER_KEY },
      { $set: { seq: ORDER_NUMBER_START + 1 } },
      { upsert: true, returnDocument: "after" }
    );
    return ORDER_NUMBER_START;
  }
  return currentSeq;
};

const buildOrderCode = (orderNumber) => `TZ-${String(orderNumber).padStart(6, "0")}`;

// ==========================================
// 🛒 ORIGINAL: USER CREATE ORDER 
// ==========================================
export const createOrder = async (req, res) => {
  try {
    let orderPayload = req.body.orderData ? JSON.parse(req.body.orderData) : req.body;

    const {
      items,
      shippingInfo,
      paymentMethod,
      addressId,
      utrNumber,
      orderNotes,
      shippingCost,
      totalAmount,
      courierPartner 
    } = orderPayload;

    const paymentScreenshot = req.file ? req.file.path : null;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    let finalShippingInfo = shippingInfo || {};

    if (addressId) {
      const savedAddress = user.addresses ? user.addresses.id(addressId) : null;
      if (savedAddress) {
        finalShippingInfo = {
          fullName: savedAddress.fullName || user.name,
          phone: savedAddress.phone || user.phone,
          address: `${savedAddress.address}, ${savedAddress.locality || ""}`.trim(),
          city: savedAddress.city,
          state: savedAddress.state || "",
          pincode: savedAddress.pincode,
        };
      }
    }

    const finalOrderItems = [];
    let calcSubtotal = 0;
    let calcGst = 0;
    let calcWeight = 0;

    for (const rawItem of items) {
      const productId = rawItem.productId?._id || rawItem.productId;
      const quantity = Math.max(1, Math.floor(toSafeNumber(rawItem.quantity, 1)));

      const product = await Product.findById(productId);
      if (!product) continue;

      let itemSku = product.sku || "N/A";
      let itemImage = product.image || "https://placehold.co/600x600?text=Product";
      const selectedVariant = rawItem.variant || rawItem.selectedVariant || null;

      if (selectedVariant) {
        if (selectedVariant.sku) itemSku = selectedVariant.sku;
        if (selectedVariant.image) itemImage = selectedVariant.image;
      }

      const unitPrice = toSafeNumber(rawItem.unitPrice || rawItem.price || rawItem.selectedCustomFields?._finalPrice, product.price);
      const gstRate = toSafeNumber(product.gstRate || product.GST, 18);
      const basePrice = round2(unitPrice / (1 + (gstRate / 100)));
      const unitGst = round2(unitPrice - basePrice);

      const lineTotal = round2(unitPrice * quantity);
      const shippingCharge = toSafeNumber(product.shippingCharge, 0);

      finalOrderItems.push({
        productId: product._id,
        sku: itemSku,
        name: product.name,
        image: itemImage,
        quantity,
        basePrice,
        gstRate,
        unitPrice,
        gstAmount: unitGst,
        price: unitPrice,
        shippingCharge,
        lineSubtotal: round2(basePrice * quantity),
        lineGstTotal: round2(unitGst * quantity),
        lineShippingTotal: round2(shippingCharge * quantity),
        lineTotal,
        selectedCustomFields: rawItem.selectedCustomFields || {},
        variant: selectedVariant,
      });

      calcSubtotal += round2(basePrice * quantity);
      calcGst += round2(unitGst * quantity);

      const productWeight = product.weightKg || 0;
      calcWeight += productWeight * quantity;

      product.stock -= quantity;
      await product.save();
    }

    if (calcWeight === 0 && items.length > 0) calcWeight = 1;

    let secureShippingCost = 0;
    let actualCourierPartner = courierPartner || orderPayload.selectedCourier?.name || "Standard Courier";

    if (orderPayload.deliveryType !== 'pickup') {
      let provider = await ShippingProvider.findOne({ name: actualCourierPartner });

      if (!provider) {
        provider = await ShippingProvider.findOne({ isDefault: true }) || await ShippingProvider.findOne({ isActive: true });
      }

      if (provider) {
        actualCourierPartner = provider.name;
        const rate = provider.ratePerKg ?? provider.baseRate ?? 0;
        secureShippingCost = Math.round(calcWeight * rate);
      } else {
        secureShippingCost = toSafeNumber(shippingCost, 0);
      }
    }

    const secureTotalAmount = round2(calcSubtotal + calcGst + secureShippingCost);
    const orderNumber = await getNextOrderNumber();

    const order = new Order({
      orderNumber,
      orderCode: buildOrderCode(orderNumber),
      user: req.user._id,
      items: finalOrderItems,
      shippingInfo: finalShippingInfo,
      paymentMethod,
      paymentStatus: (paymentMethod === "COD" || paymentMethod === "MANUAL") ? "Pending" : "Paid",
      utrNumber: utrNumber || "",
      paymentScreenshot: paymentScreenshot || "",
      orderNotes: orderNotes || "",
      courierPartner: actualCourierPartner,
      selectedShippingProvider: actualCourierPartner,
      subtotalAmount: round2(calcSubtotal),
      gstAmount: round2(calcGst),
      shippingAmount: round2(secureShippingCost),
      totalAmount: secureTotalAmount, 
    });

    const savedOrder = await order.save();
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

    res.status(201).json({ success: true, message: "Order placed successfully", order: savedOrder });
  } catch (error) {
    console.error("Order Creation Error:", error);
    res.status(500).json({ success: false, message: "Server error while placing order" });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, orders });
  } catch (error) { res.status(500).json({ success: false, message: "Error" }); }
};

export const getAllOrdersForAdmin = async (req, res) => {
  try {
    const orders = await Order.find().populate("user", "name email phone").sort({ createdAt: -1 });
    res.status(200).json({ success: true, orders });
  } catch (error) { res.status(500).json({ success: false, message: "Error" }); }
};

export const getOrderDetail = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email phone");
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    res.status(200).json({ success: true, order });
  } catch (error) { res.status(500).json({ success: false, message: "Server Error" }); }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus, paymentStatus } = req.body;
    const updatePayload = {};
    if (orderStatus) updatePayload.orderStatus = orderStatus;
    if (paymentStatus) updatePayload.paymentStatus = paymentStatus;

    const order = await Order.findByIdAndUpdate(req.params.orderId, updatePayload, { new: true });
    res.status(200).json({ success: true, order });
  } catch (error) { res.status(500).json({ success: false }); }
};


// ==========================================
// 🚀 NEW: CREATE ADMIN ORDER (Custom Logic)
// ==========================================
export const createAdminOrder = async (req, res) => {
  try {
    const {
      user, // Optional (offline customer ID)
      items,
      shippingInfo,
      billingInfo,
      paymentMethod,
      paymentStatus,
      deliveryType,
      selectedShippingProvider,
      ratePerKg, 
      shippingWeightKg,
      discount,
      discountType,
      isTaxExempt,
      generateTaxInvoice,
      orderNotes
    } = req.body;

    // 1. Calculate Subtotal from Items
    let subtotalAmount = 0;
    const processedItems = items.map(item => {
      // In admin orders, we trust the unitPrice sent by the admin (custom price override)
      const lineSubtotal = item.unitPrice * item.quantity;
      subtotalAmount += lineSubtotal;
      return { ...item, lineSubtotal, lineTotal: lineSubtotal };
    });

    // 2. Apply Discount
    let discountAmount = 0;
    if (discount > 0) {
      if (discountType === 'PERCENTAGE') {
        discountAmount = (subtotalAmount * discount) / 100;
      } else {
        discountAmount = discount; // FLAT discount
      }
    }
    let discountedSubtotal = subtotalAmount - discountAmount;
    if (discountedSubtotal < 0) discountedSubtotal = 0;

    // 3. Tax Calculation (Gujarat State Logic)
    let gstAmount = 0;
    let taxType = "IGST";
    
    if (!isTaxExempt) {
      const stateStr = shippingInfo?.state ? shippingInfo.state.toLowerCase().trim() : "";
      
      // If state is Gujarat, split into CGST & SGST. Otherwise IGST.
      if (stateStr === 'gujarat' || stateStr === 'gj') {
        gstAmount = discountedSubtotal * 0.18; // 9% CGST + 9% SGST = 18% Total
        taxType = "CGST_SGST";
      } else {
        gstAmount = discountedSubtotal * 0.18; // 18% IGST
        taxType = "IGST";
      }
    }

    // 4. Shipping Calculation (Weight * ratePerKg)
    let shippingAmount = 0;
    if (paymentMethod === 'STORE_PICKUP' || deliveryType === 'pickup') {
      shippingAmount = 0; // Free shipping for pickup
    } else if (ratePerKg && shippingWeightKg) {
      shippingAmount = shippingWeightKg * ratePerKg; // The agreed formula!
    } else {
      shippingAmount = req.body.shippingAmount || 0; // Fallback
    }

    // 5. Final Total Calculation
    const totalAmount = discountedSubtotal + gstAmount + shippingAmount;

    // 6. Generate Unique Order Code (#TZ-XXXXXX)
    const orderNumber = await getNextOrderNumber(); 
    const orderCode = buildOrderCode(orderNumber);

    // 7. Save to Database
    const newOrder = new Order({
      orderNumber,
      orderCode,
      user: user || null,
      createdBy: req.user ? req.user._id : null, // Track the admin who created this
      items: processedItems,
      shippingInfo: shippingInfo || {},
      billingInfo: billingInfo || {},
      paymentMethod,
      paymentStatus: paymentStatus || "Paid",
      deliveryType: deliveryType || 'ship',
      selectedShippingProvider,
      courierPartner: selectedShippingProvider,
      shippingWeightKg,
      subtotalAmount: round2(subtotalAmount),
      discount,
      discountType,
      isTaxExempt,
      generateTaxInvoice,
      gstAmount: round2(gstAmount),
      taxType,
      shippingAmount: round2(shippingAmount),
      totalAmount: round2(totalAmount),
      orderNotes: orderNotes || ""
    });

    const savedOrder = await newOrder.save();

    res.status(201).json({
      success: true,
      message: "Admin Order created successfully!",
      order: savedOrder
    });

  } catch (error) {
    console.error("Admin Create Order Error:", error);
    res.status(500).json({ success: false, message: "Failed to create admin order", error: error.message });
  }
};
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

// 🔢 Safe Order Number Generator
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

// 🛠️ UNIVERSAL PAYMENT FORMATTER (Frontend ko Database ke hisaab se theek karega)
const formatPaymentMethod = (method) => {
  if (!method) return "ONLINE";
  const pmUpper = method.toUpperCase();
  if (pmUpper.includes("COD") || pmUpper.includes("CASH")) return "COD";
  if (pmUpper.includes("MANUAL")) return "MANUAL TRANSFER";
  if (pmUpper.includes("STORE") || pmUpper.includes("PICK")) return "STORE_PICKUP";
  if (pmUpper.includes("CARD")) return "Card";
  return "ONLINE";
};

// ==========================================
// 🛒 USER CREATE ORDER (FRONTEND CHECKOUT)
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
      courierPartner,
      billingInfo
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

    const stateStr = finalShippingInfo?.state ? finalShippingInfo.state.toLowerCase().trim() : "";
    const taxType = (stateStr === 'gujarat' || stateStr === 'gj') ? "CGST_SGST" : "IGST";

    // 🔥 FIX: Safe Payment Mapping
    const safeMethod = formatPaymentMethod(paymentMethod);
    const safeStatus = (safeMethod === "COD" || safeMethod === "MANUAL TRANSFER" || safeMethod === "STORE_PICKUP") 
                        ? "Awaiting Payment" : "Paid";

    const order = new Order({
      orderNumber,
      orderCode: buildOrderCode(orderNumber),
      user: req.user._id,
      items: finalOrderItems,
      shippingInfo: finalShippingInfo,
      billingInfo: billingInfo || finalShippingInfo,
      paymentMethod: safeMethod, // Mapped according to Schema
      paymentStatus: safeStatus, // Mapped according to Schema
      utrNumber: utrNumber || "",
      paymentScreenshot: paymentScreenshot || "",
      orderNotes: orderNotes || "",
      courierPartner: actualCourierPartner,
      selectedShippingProvider: actualCourierPartner,
      subtotalAmount: round2(calcSubtotal),
      gstAmount: round2(calcGst),
      shippingAmount: round2(secureShippingCost),
      totalAmount: secureTotalAmount,
      taxType: taxType,
      discount: 0,
      discountType: "FLAT",
      isTaxExempt: false,
      generateTaxInvoice: false
    });

    const savedOrder = await order.save();
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

    res.status(201).json({ success: true, message: "Order placed successfully", order: savedOrder });
  } catch (error) {
    console.error("❌ USER Order Creation Error:", error);
    res.status(500).json({ success: false, message: "Server error while placing order", error: error.message });
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
    const {
      paymentStatus,
      orderStatus,
      paymentMethod,
      courierPartner,
      startDate,
      endDate,
      search,
      minTotal,
      maxTotal
    } = req.query;

    const query = {};

    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (orderStatus) query.orderStatus = orderStatus;
    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (courierPartner) query.courierPartner = courierPartner;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    if (minTotal || maxTotal) {
      query.totalAmount = {};
      if (minTotal) query.totalAmount.$gte = Number(minTotal);
      if (maxTotal) query.totalAmount.$lte = Number(maxTotal);
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { orderCode: searchRegex },
        { "items.name": searchRegex },
        { "items.sku": searchRegex },
        { "shippingInfo.fullName": searchRegex },
        { "shippingInfo.email": searchRegex },
        { "shippingInfo.phone": searchRegex }
      ];
      if (!isNaN(search)) {
        query.$or.push({ orderNumber: Number(search) });
      }
    }

    const [orders, totalOrders, unpaidUnshipped, paidUnshipped, inProcess, shippingMethods] = await Promise.all([
      Order.find(query).populate("user", "name email phone").sort({ createdAt: -1 }),
      Order.countDocuments({}),
      Order.countDocuments({ paymentStatus: 'Awaiting Payment', orderStatus: 'Awaiting Processing' }),
      Order.countDocuments({ paymentStatus: 'Paid', orderStatus: 'Awaiting Processing' }),
      Order.countDocuments({ orderStatus: { $in: ['Processing', 'Ready For Pickup'] } }),
      Order.distinct('courierPartner')
    ]);

    const counts = {
      all: totalOrders,
      unpaid_unshipped: unpaidUnshipped,
      paid_unshipped: paidUnshipped,
      fulfillment: inProcess
    };

    res.status(200).json({ 
      success: true, 
      counts, 
      shippingMethods: shippingMethods.filter(Boolean), 
      orders 
    });
  } catch (error) { 
    console.error("Error in getAllOrdersForAdmin:", error);
    res.status(500).json({ success: false, message: "Error fetching orders", error: error.message }); 
  }
};

export const getOrderDetail = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email phone")
      .populate("items.productId", "sku baseSku name");
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
// 🚀 ADMIN CREATE ORDER
// ==========================================
export const createAdminOrder = async (req, res) => {
  try {
    const {
      user, 
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

    let subtotalAmount = 0;
    
    const processedItems = items.map(item => {
      const safePrice = Number(item.unitPrice) || 0;
      const safeQty = Number(item.quantity) || 1;
      
      const itemGstRate = isTaxExempt ? 0 : 18;
      const basePrice = Number((safePrice / (1 + (itemGstRate / 100))).toFixed(2));
      const gstAmount = Number((safePrice - basePrice).toFixed(2));
      
      const lineTotal = safePrice * safeQty;
      const lineGstTotal = Number((gstAmount * safeQty).toFixed(2));
      
      subtotalAmount += lineTotal;
      
      return { 
          ...item, 
          price: safePrice, 
          basePrice: basePrice,       
          unitPrice: safePrice,
          gstAmount: gstAmount,       
          gstRate: itemGstRate,
          lineGstTotal: lineGstTotal, 
          lineSubtotal: Number((basePrice * safeQty).toFixed(2)), 
          lineTotal: lineTotal 
      };
    });

    let discountAmount = 0;
    if (discount > 0) {
      discountAmount = discountType === 'PERCENTAGE' ? (subtotalAmount * discount) / 100 : discount;
    }
    let discountedSubtotal = Math.max(0, subtotalAmount - discountAmount);

    let gstAmount = 0;
    let taxType = "IGST";
    
    if (!isTaxExempt) {
      const stateStr = shippingInfo?.state ? shippingInfo.state.toLowerCase().trim() : "";
      if (stateStr === 'gujarat' || stateStr === 'gj') {
        gstAmount = discountedSubtotal * 0.18; 
        taxType = "CGST_SGST";
      } else {
        gstAmount = discountedSubtotal * 0.18; 
        taxType = "IGST";
      }
    }

    let shippingAmount = 0;
    if (paymentMethod === 'STORE_PICKUP' || deliveryType === 'pickup') {
      shippingAmount = 0; 
    } else if (ratePerKg && shippingWeightKg) {
      shippingAmount = shippingWeightKg * ratePerKg; 
    } else {
      shippingAmount = req.body.shippingAmount || 0; 
    }

    const totalAmount = discountedSubtotal + gstAmount + shippingAmount;
    const orderNumber = await getNextOrderNumber(); 
    const orderCode = buildOrderCode(orderNumber);

    // 🔥 FIX: Safe Payment Mapping for Admin too
    const safeMethod = formatPaymentMethod(paymentMethod);
    let safeStatus = paymentStatus || "Paid";
    if (safeStatus === "Pending") safeStatus = "Awaiting Payment";

    const adminId = req.user && req.user._id ? req.user._id : null;
    const customerId = user || adminId; 

    const newOrder = new Order({
      orderNumber,
      orderCode,
      user: customerId, 
      createdBy: adminId,
      items: processedItems, 
      shippingInfo: shippingInfo || {},
      billingInfo: billingInfo || {},
      paymentMethod: safeMethod,
      paymentStatus: safeStatus,
      deliveryType: deliveryType || 'ship',
      selectedShippingProvider: selectedShippingProvider || "Manual",
      courierPartner: selectedShippingProvider || "Manual",
      shippingWeightKg: shippingWeightKg || 1,
      subtotalAmount: round2(subtotalAmount),
      discount: discount || 0,
      discountType: discountType || "FLAT",
      isTaxExempt: isTaxExempt || false,
      generateTaxInvoice: generateTaxInvoice || false,
      gstAmount: round2(gstAmount),
      taxType,
      shippingAmount: round2(shippingAmount),
      totalAmount: round2(totalAmount),
      orderNotes: orderNotes || "Created via Admin Panel"
    });

    const savedOrder = await newOrder.save();

    res.status(201).json({ success: true, message: "Admin Order created successfully!", order: savedOrder });
  } catch (error) {
    console.error("❌ ADMIN Order Creation Error:", error);
    res.status(500).json({ success: false, message: "Database Save Failed", error: error.message });
  }
};

// ==========================================
// 📝 ADMIN EDIT ORDER
// ==========================================
export const editAdminOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const {
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

    let subtotalAmount = 0;
    
    const processedItems = items.map(item => {
      const safePrice = Number(item.unitPrice) || 0;
      const safeQty = Number(item.quantity) || 1;
      
      const itemGstRate = isTaxExempt ? 0 : 18;
      const basePrice = Number((safePrice / (1 + (itemGstRate / 100))).toFixed(2));
      const gstAmount = Number((safePrice - basePrice).toFixed(2));
      
      const lineTotal = safePrice * safeQty;
      const lineGstTotal = Number((gstAmount * safeQty).toFixed(2));
      
      subtotalAmount += lineTotal;
      
      return { 
          ...item, 
          price: safePrice, 
          basePrice: basePrice,       
          unitPrice: safePrice,
          gstAmount: gstAmount,       
          gstRate: itemGstRate,
          lineGstTotal: lineGstTotal, 
          lineSubtotal: Number((basePrice * safeQty).toFixed(2)), 
          lineTotal: lineTotal 
      };
    });

    let discountAmount = 0;
    if (discount > 0) {
      discountAmount = discountType === 'PERCENTAGE' ? (subtotalAmount * discount) / 100 : discount;
    }
    let discountedSubtotal = Math.max(0, subtotalAmount - discountAmount);

    let gstAmount = 0;
    let taxType = "IGST";
    
    if (!isTaxExempt) {
      const stateStr = shippingInfo?.state ? shippingInfo.state.toLowerCase().trim() : "";
      if (stateStr === 'gujarat' || stateStr === 'gj') {
        gstAmount = discountedSubtotal * 0.18; 
        taxType = "CGST_SGST";
      } else {
        gstAmount = discountedSubtotal * 0.18; 
        taxType = "IGST";
      }
    }

    let shippingAmount = 0;
    if (paymentMethod === 'STORE_PICKUP' || deliveryType === 'pickup') {
      shippingAmount = 0; 
    } else if (ratePerKg && shippingWeightKg) {
      shippingAmount = shippingWeightKg * ratePerKg; 
    } else {
      shippingAmount = req.body.shippingAmount || 0; 
    }

    const totalAmount = discountedSubtotal + gstAmount + shippingAmount;

    const safeMethod = formatPaymentMethod(paymentMethod);
    let safeStatus = paymentStatus || "Paid";
    if (safeStatus === "Pending") safeStatus = "Awaiting Payment";

    const updatePayload = {
      items: processedItems, 
      shippingInfo: shippingInfo || {},
      billingInfo: billingInfo || {},
      paymentMethod: safeMethod,
      paymentStatus: safeStatus,
      deliveryType: deliveryType || 'ship',
      selectedShippingProvider: selectedShippingProvider || "Manual",
      courierPartner: selectedShippingProvider || "Manual",
      shippingWeightKg: shippingWeightKg || 1,
      subtotalAmount: round2(subtotalAmount),
      discount: discount || 0,
      discountType: discountType || "FLAT",
      isTaxExempt: isTaxExempt || false,
      generateTaxInvoice: generateTaxInvoice || false,
      gstAmount: round2(gstAmount),
      taxType,
      shippingAmount: round2(shippingAmount),
      totalAmount: round2(totalAmount),
      orderNotes: orderNotes || ""
    };

    const updatedOrder = await Order.findByIdAndUpdate(orderId, updatePayload, { new: true });
    
    if (!updatedOrder) {
        return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.status(200).json({ success: true, message: "Admin Order updated successfully!", order: updatedOrder });
  } catch (error) {
    console.error("❌ ADMIN Order Update Error:", error);
    res.status(500).json({ success: false, message: "Database Update Failed", error: error.message });
  }
};
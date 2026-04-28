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
// 🔥 CREATE ORDER (FIXED COURIER & MATH)
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
      courierPartner // 👈 Frontend se direct courier name
    } = orderPayload;
    
    const paymentScreenshot = req.file ? req.file.path : null;

    if (!items || items.length === 0) return res.status(400).json({ success: false, message: "Cart is empty." });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Address Logic
    let finalShippingInfo = shippingInfo;
    if (addressId) {
      const savedAddress = user.addresses.id(addressId);
      if (savedAddress) {
        finalShippingInfo = {
          fullName: savedAddress.fullName, 
          phone: savedAddress.phone,
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

      // Math Fix: Price logic for Admin Dashboard alignment
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
      calcWeight += (product.weightKg || 0) * quantity;

      // Stock update
      product.stock -= quantity;
      await product.save();
    }

    // 🚀 SECURE SHIPPING RECALCULATION
    let secureShippingCost = 0;
    let actualCourierPartner = courierPartner || orderPayload.selectedCourier?.name || "Standard Courier";
    
    // Sirf ship mode me shipping cost charge hoga
    if (orderPayload.deliveryType !== 'pickup') {
      let provider = await ShippingProvider.findOne({ name: actualCourierPartner });
      
      // Agar provider delete ho gaya ho, toh default uthao
      if (!provider) {
        provider = await ShippingProvider.findOne({ isDefault: true }) || await ShippingProvider.findOne({ isActive: true });
      }

      if (provider) {
        actualCourierPartner = provider.name;
        secureShippingCost = provider.baseRate + (Math.max(0, calcWeight - 1) * provider.extraRatePerKg);
      } else {
        // Fallback agar koi provider na mile (though client frontend validation rok lega)
        secureShippingCost = toSafeNumber(shippingCost, 0); 
      }
    }
    
    // Secure Total Calculation
    const secureTotalAmount = round2(calcSubtotal + calcGst + secureShippingCost);

    const orderNumber = await getNextOrderNumber();
    
    // Order Object creation
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
      
      // 🔥 THE COURIER FIX: 
      // Pehle orderPayload.courierPartner check karega, fir selectedCourier.name
      courierPartner: actualCourierPartner,
      selectedShippingProvider: actualCourierPartner,
      
      subtotalAmount: round2(calcSubtotal), 
      gstAmount: round2(calcGst), 
      shippingAmount: round2(secureShippingCost), 
      totalAmount: secureTotalAmount, // 👈 Backend se fully secured total
    });

    const savedOrder = await order.save();
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
    
    res.status(201).json({ success: true, message: "Order placed successfully", order: savedOrder });
  } catch (error) {
    console.error("Order Creation Error:", error);
    res.status(500).json({ success: false, message: "Server error while placing order" });
  }
};

// ... baaki functions (getOrderDetail, updateOrderStatus) same rahenge
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
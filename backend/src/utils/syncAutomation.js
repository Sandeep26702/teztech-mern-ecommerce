/**
 * Mock sync automation utility for Zoho Books and Google Sheets.
 * Logs order details to database/console as requested by user.
 */

export const syncOrderToZohoAndSheets = async (order) => {
  try {
    console.log(`[MOCK SYNC] Triggering sync for Order: ${order.orderCode || order._id}`);
    
    // Simulate minor network/processing delay (100ms)
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Mock Google Sheets payload
    const sheetsRow = {
      orderCode: order.orderCode,
      date: order.createdAt,
      clientName: order.shippingInfo?.fullName || "N/A",
      phone: order.shippingInfo?.phone || "N/A",
      subtotal: order.subtotalAmount,
      gst: order.gstAmount,
      shipping: order.shippingAmount,
      total: order.totalAmount,
      paymentMethod: order.paymentMethod,
    };
    console.log("[MOCK SYNC] Google Sheets Appended Row:", JSON.stringify(sheetsRow, null, 2));

    // Mock Zoho Books invoice creation
    const zohoInvoice = {
      customer_name: order.shippingInfo?.fullName,
      invoice_number: order.orderCode,
      date: new Date().toISOString().split("T")[0],
      discount: order.discount,
      shipping_charge: order.shippingAmount,
      subtotal: order.subtotalAmount,
      tax_amount: order.gstAmount,
      total: order.totalAmount,
      payment_method: order.paymentMethod,
    };
    console.log("[MOCK SYNC] Zoho Books Invoice Created:", JSON.stringify(zohoInvoice, null, 2));

    // Update order status fields indicating successful sync
    order.syncStatus = {
      zoho: "Success (Mocked)",
      googleSheets: "Success (Mocked)",
      syncedAt: new Date(),
      error: "",
    };
    await order.save();
    console.log(`[MOCK SYNC] Order ${order.orderCode} sync status updated successfully.`);
  } catch (error) {
    console.error("[MOCK SYNC] Error in sync automation:", error);
    order.syncStatus = {
      zoho: "Failed (Mocked)",
      googleSheets: "Failed (Mocked)",
      syncedAt: new Date(),
      error: error.message,
    };
    await order.save();
  }
};

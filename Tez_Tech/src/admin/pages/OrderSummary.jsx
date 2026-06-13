import React from "react";
import { FaLock } from "react-icons/fa";

const OrderSummary = ({ 
  items = [], 
  quoteData = {}, 
  onUpdateQuoteField, 
  isViewOnly = false,
  calculatedSubTotal,
  calculatedDiscount,
  calculatedGst,
  calculatedFinalTotal
}) => {
  const {
    extraDiscountType = "flat",
    extraDiscountValue = 0,
    shippingCharge = 0,
    gstPercentage = 0,
    additionalChargeName = "",
    additionalChargeAmount = 0,
  } = quoteData;

  // 🧮 FIX 1: Robust Subtotal Calculation
  const subtotal = calculatedSubTotal !== undefined 
    ? calculatedSubTotal 
    : items.reduce((sum, item) => {
        const price = Number(item.offeredPrice) || Number(item.unitPrice) || Number(item.price) || 0;
        const qty = Number(item.quantity) || 1;
        return sum + (price * qty);
      }, 0);

  // 🧮 FIX 2: Safe Discount Calculation
  let discountAmount = calculatedDiscount !== undefined 
    ? calculatedDiscount 
    : (Number(extraDiscountValue) || 0);
  if (calculatedDiscount === undefined && extraDiscountType === "percent") {
    discountAmount = (subtotal * discountAmount) / 100;
  }

  // 🧮 FIX 3: GST Base Amount (Subtotal - Discount)
  const gstBaseAmount = Math.max(0, subtotal - discountAmount);

  // 🧮 FIX 4: Tax & Grand Total Math
  const shipping = Number(shippingCharge) || 0;
  const extraCharge = Number(additionalChargeAmount) || 0;

  const taxAmount = calculatedGst !== undefined 
    ? calculatedGst 
    : ((gstBaseAmount * Number(gstPercentage)) / 100 || 0);

  const grandTotal = calculatedFinalTotal !== undefined 
    ? calculatedFinalTotal 
    : (gstBaseAmount + shipping + extraCharge + taxAmount);

  return (
    <div className="w-full max-w-md p-6 mt-6 ml-auto bg-white border border-gray-200 shadow-sm rounded-2xl">
      <h3 className="flex items-center justify-between pb-3 mb-4 text-lg font-bold text-gray-900 border-b border-gray-100">
        <span className="flex items-center gap-2">
          Order Summary
          {isViewOnly && <FaLock className="text-sm text-gray-400" title="Read Only Mode" />}
        </span>
      </h3>

      <div className="space-y-4 text-sm text-gray-600">
        
        {/* Subtotal */}
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-700">Subtotal</span>
          <span className="font-semibold text-gray-900">
            ₹ {subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Extra Discount */}
        <div className="flex items-center justify-between group">
          <div className="flex flex-col gap-1">
            <span className="font-medium text-gray-700">Discount</span>
            {!isViewOnly && (
              <div className="flex items-center p-0.5 bg-gray-100 rounded-md w-fit border border-gray-200">
                <button
                  type="button"
                  onClick={() => onUpdateQuoteField("extraDiscountType", "flat")}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded ${extraDiscountType === "flat" ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                  ₹ Flat
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateQuoteField("extraDiscountType", "percent")}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded ${extraDiscountType === "percent" ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                  % Perc
                </button>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="relative flex items-center">
              <span className="absolute text-gray-400 text-[11px] left-2">
                {extraDiscountType === "percent" ? "%" : "₹"}
              </span>
              <input
                type="number"
                min="0"
                disabled={isViewOnly}
                value={extraDiscountValue === 0 ? "" : extraDiscountValue}
                onChange={(e) => onUpdateQuoteField("extraDiscountValue", e.target.value)}
                className="w-24 py-1.5 pl-6 pr-2 font-semibold text-right transition-all border border-gray-300 outline-none rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-transparent"
                placeholder="0"
              />
            </div>
            {discountAmount > 0 && (
              <span className="text-[10px] font-bold text-emerald-600">
                - ₹ {discountAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            )}
          </div>
        </div>

        {/* Shipping */}
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-700">Shipping</span>
          <div className="relative flex items-center">
            <span className="absolute text-gray-400 text-[11px] left-2">₹</span>
            <input
              type="number"
              min="0"
              disabled={isViewOnly}
              value={shippingCharge === 0 ? "" : shippingCharge}
              onChange={(e) => onUpdateQuoteField("shippingCharge", e.target.value)}
              className="w-24 py-1.5 pl-6 pr-2 font-semibold text-right transition-all border border-gray-300 outline-none rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-transparent"
              placeholder="0"
            />
          </div>
        </div>

        {/* Additional Charges */}
        <div className="flex items-center justify-between gap-3">
          <input
            type="text"
            disabled={isViewOnly}
            value={additionalChargeName || ""}
            onChange={(e) => onUpdateQuoteField("additionalChargeName", e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 transition-all outline-none rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-transparent disabled:font-medium disabled:text-gray-700 disabled:border-transparent disabled:p-0"
            placeholder={isViewOnly ? "No extra charges" : "Extra charge name (e.g., Setup Fee)"}
          />
          {(!isViewOnly || additionalChargeAmount > 0) && (
            <div className="relative flex items-center shrink-0">
              <span className="absolute text-gray-400 text-[11px] left-2">₹</span>
              <input
                type="number"
                min="0"
                disabled={isViewOnly}
                value={additionalChargeAmount === 0 ? "" : additionalChargeAmount}
                onChange={(e) => onUpdateQuoteField("additionalChargeAmount", e.target.value)}
                className="w-24 py-1.5 pl-6 pr-2 font-semibold text-right transition-all border border-gray-300 outline-none rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-transparent"
                placeholder="0"
              />
            </div>
          )}
        </div>

        {/* Tax / GST */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex flex-col">
            <span className="font-medium text-gray-700">GST / Tax</span>
            {taxAmount > 0 && (
              <span className="text-[10px] font-semibold text-gray-500 mt-0.5">
                On ₹{gstBaseAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="relative flex items-center">
              <span className="absolute text-gray-400 text-[11px] left-2">%</span>
              <input
                type="number"
                min="0"
                max="100"
                disabled={isViewOnly}
                value={gstPercentage === 0 ? "" : gstPercentage}
                onChange={(e) => onUpdateQuoteField("gstPercentage", e.target.value)}
                className="w-24 py-1.5 pl-6 pr-2 font-semibold text-right transition-all border border-gray-300 outline-none rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-transparent"
                placeholder="18"
              />
            </div>
            {taxAmount > 0 && (
              <span className="text-[11px] font-bold text-gray-600">
                + ₹ {taxAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            )}
          </div>
        </div>

        {/* Grand Total */}
        <div className="flex items-center justify-between p-4 mt-4 border border-blue-100 rounded-xl bg-blue-50">
          <span className="text-base font-black text-blue-900">Grand Total</span>
          <span className="text-xl font-black text-blue-700">
            ₹ {grandTotal > 0 ? grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
          </span>
        </div>

      </div>
    </div>
  );
};

export default OrderSummary;
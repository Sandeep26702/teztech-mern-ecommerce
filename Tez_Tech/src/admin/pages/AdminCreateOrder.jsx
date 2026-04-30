import React, { useState } from "react";
import { FaPlus, FaTrash, FaChevronRight } from "react-icons/fa";

const AdminCreateOrder = () => {
    const [isTaxExempt, setIsTaxExempt] = useState(true);
    const [createTaxInvoice, setCreateTaxInvoice] = useState(true);

    const ToggleSwitch = ({ isOn, handleToggle }) => {
        return (
            <div className="flex items-center cursor-pointer" onClick={handleToggle}>
                <div
                    className={`w-9 h-5 flex items-center rounded-full p-1 transition-colors duration-300 ease-in-out ${isOn ? "bg-[#008060]" : "bg-gray-300"
                        }`}
                >
                    <div
                        className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${isOn ? "translate-x-4" : "translate-x-0"
                            }`}
                    ></div>
                </div>
                <span className={`ml-2 text-sm font-medium ${isOn ? "text-[#008060]" : "text-gray-500"}`}>
                    {isOn ? "On" : "Off"}
                </span>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#f4f6f8] p-4 sm:p-6 lg:p-8 font-sans text-[#202223]">
            <div className="mb-6 max-w-6xl mx-auto">
                <h2 className="text-[24px] font-bold text-[#1a1a1a]">Create Order</h2>
            </div>

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* LEFT COLUMN */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    <div className="bg-white border border-[#d5dce4] rounded shadow-sm p-5">
                        <h3 className="text-[16px] font-semibold mb-4">Customer</h3>
                        <div className="flex flex-col gap-4">
                            <div className="relative">
                                <input type="text" placeholder="Name" className="w-full h-10 px-3 py-2 border border-[#c4cdd5] rounded text-[14px] focus:outline-none focus:border-[#2463d1]" />
                                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2463d1] text-[13px] hover:underline pl-3 border-l border-gray-300 h-6 flex items-center">
                                    Select from the list
                                </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <input type="email" placeholder="Email address" className="w-full h-10 px-3 py-2 border border-[#c4cdd5] rounded text-[14px] focus:outline-none focus:border-[#2463d1]" />
                                <input type="tel" placeholder="Phone number" className="w-full h-10 px-3 py-2 border border-[#c4cdd5] rounded text-[14px] focus:outline-none focus:border-[#2463d1]" />
                            </div>
                            <input type="text" placeholder="Company name" className="w-full h-10 px-3 py-2 border border-[#c4cdd5] rounded text-[14px] focus:outline-none focus:border-[#2463d1]" />
                            <div className="flex items-center gap-3 mt-2">
                                <span className="text-[14px] font-medium text-[#202223]">Mark customer's order as tax-exempt</span>
                                <ToggleSwitch isOn={isTaxExempt} handleToggle={() => setIsTaxExempt(!isTaxExempt)} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-[#d5dce4] rounded shadow-sm p-5">
                        <h3 className="text-[16px] font-semibold mb-4">Order items</h3>
                        <div className="flex items-center gap-4">
                            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#c4cdd5] text-[#202223] text-[14px] font-medium rounded hover:bg-gray-50 shadow-sm">
                                <FaPlus className="text-gray-500 text-[12px]" /> Add New Item
                            </button>
                            <button className="text-[#2463d1] text-[14px] hover:underline">Add custom item</button>
                        </div>
                    </div>

                    <div className="bg-white border border-[#d5dce4] rounded shadow-sm p-5">
                        <h3 className="text-[16px] font-semibold mb-4">Shipping and delivery</h3>
                        <div className="mb-4">
                            <select className="w-full h-10 px-3 py-2 border border-[#c4cdd5] rounded text-[14px] text-gray-500 focus:outline-none focus:border-[#2463d1] bg-white">
                                <option>Method:</option>
                                <option>Standard Shipping</option>
                                <option>Express Delivery</option>
                            </select>
                        </div>
                        <button className="flex items-center gap-1 text-[#2463d1] text-[14px] hover:underline">
                            <FaPlus className="text-[12px]" /> Add shipping address
                        </button>
                    </div>

                    <div className="bg-white border border-[#d5dce4] rounded shadow-sm p-5">
                        <h3 className="text-[16px] font-semibold mb-4">Discounts and surcharges</h3>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="flex flex-1 border border-[#c4cdd5] rounded overflow-hidden focus-within:border-[#2463d1]">
                                <input type="text" placeholder="Discount" className="flex-1 px-3 py-2 text-[14px] focus:outline-none" />
                                <div className="border-l border-[#c4cdd5] bg-gray-50">
                                    <select className="h-full pl-3 pr-2 py-2 text-[14px] text-[#2463d1] font-medium bg-transparent focus:outline-none">
                                        <option>₹</option>
                                        <option>%</option>
                                    </select>
                                </div>
                            </div>
                            <button className="p-2 text-[#2463d1] hover:bg-blue-50 rounded">
                                <FaTrash className="text-[14px]" />
                            </button>
                        </div>
                        <button className="flex items-center gap-1 text-[#2463d1] text-[14px] hover:underline">
                            <FaPlus className="text-[12px]" /> Add discount or surcharge
                        </button>
                    </div>

                    <div className="bg-white border border-[#d5dce4] rounded shadow-sm p-5">
                        <button className="flex items-center gap-1 text-[#2463d1] text-[14px] font-medium hover:underline mb-2">
                            Payment <FaChevronRight className="text-[10px] mt-0.5" />
                        </button>
                        <p className="text-[14px] text-[#202223]"><strong>Billing address:</strong> Billing address is the same as shipping</p>
                    </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="lg:col-span-4">
                    <div className="bg-white border border-[#d5dce4] rounded shadow-sm sticky top-6">
                        <div className="p-5 border-b border-[#d5dce4]">
                            <h3 className="text-[16px] font-semibold mb-4">Summary</h3>
                            <div className="flex justify-between text-[14px] text-[#6d7175] mb-2">
                                <span>Subtotal<br /><span className="text-[12px]">0 items</span></span>
                                <span>₹0.00</span>
                            </div>
                        </div>
                        <div className="p-5">
                            <div className="flex justify-between items-center text-[16px] font-bold text-[#202223] mb-6">
                                <span>Total</span>
                                <span>₹0.00</span>
                            </div>
                            <button className="w-full bg-[#2463d1] hover:bg-[#1c51b0] text-white font-medium py-2.5 px-4 rounded mb-6">
                                Create Order
                            </button>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-[14px] font-medium text-[#202223]">Create tax invoice</span>
                                <ToggleSwitch isOn={createTaxInvoice} handleToggle={() => setCreateTaxInvoice(!createTaxInvoice)} />
                            </div>
                            <p className="text-[13px] text-[#6d7175] mb-2">
                                Generate a tax invoice automatically once you create an order. The invoice will appear on the order details page.
                            </p>
                            <button className="text-[#2463d1] text-[13px] hover:underline">Preview invoice</button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AdminCreateOrder;
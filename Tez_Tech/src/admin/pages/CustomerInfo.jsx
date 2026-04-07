import React from "react";
import { FaLock, FaUserTie, FaBuilding, FaEnvelope, FaPhone, FaCommentAlt } from "react-icons/fa";

const CustomerInfo = ({
  customerData = {},
  onUpdateCustomerField,
  isViewOnly = false,
}) => {
  // ✅ Updated: Sirf wahi fields rakhi hain jo ab chahiye
  const {
    name: contactName = "",
    company: companyName = "",
    email = "",
    phone = "",
    message = "", // 🔥 Naya field add kiya
  } = customerData;

  const inputClasses = "w-full px-3 py-2 text-sm font-medium transition-all border border-gray-300 outline-none rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-50 disabled:text-gray-700 disabled:border-transparent placeholder:font-normal";
  const labelClasses = "block mb-1.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider";

  const handleUpdate = (field, value) => {
      const dbField = field === "contactName" ? "name" : field === "companyName" ? "company" : field;
      onUpdateCustomerField(dbField, value);
  };

  return (
    <div className="w-full p-6 bg-white border border-gray-200 shadow-sm rounded-2xl">
      
      {/* 🌟 Header Section */}
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-gray-100">
        <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900">
          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
            <FaUserTie className="text-blue-600" size={14} />
          </div>
          Customer Details
          {isViewOnly && <FaLock className="ml-2 text-sm text-gray-400" title="Read Only Mode" />}
        </h3>
      </div>

      {/* 📋 Form Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        
        {/* Contact Name */}
        <div>
          <label className={labelClasses}>Contact Person *</label>
          <div className="relative flex items-center">
            <span className="absolute text-gray-400 left-3"><FaUserTie /></span>
            <input
              type="text"
              value={contactName}
              disabled={isViewOnly}
              onChange={(e) => handleUpdate("contactName", e.target.value)}
              className={`${inputClasses} pl-9`}
              placeholder="e.g. Rahul Sharma"
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className={labelClasses}>Phone Number *</label>
          <div className="relative flex items-center">
            <span className="absolute text-gray-400 left-3"><FaPhone /></span>
            <input
              type="tel"
              value={phone}
              disabled={isViewOnly}
              onChange={(e) => handleUpdate("phone", e.target.value)}
              className={`${inputClasses} pl-9`}
              placeholder="+91 98765 43210"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className={labelClasses}>Email Address</label>
          <div className="relative flex items-center">
            <span className="absolute text-gray-400 left-3"><FaEnvelope /></span>
            <input
              type="email"
              value={email}
              disabled={isViewOnly}
              onChange={(e) => handleUpdate("email", e.target.value)}
              className={`${inputClasses} pl-9`}
              placeholder="rahul@acmecorp.com"
            />
          </div>
        </div>

        {/* Company Name */}
        <div>
          <label className={labelClasses}>Company Name</label>
          <div className="relative flex items-center">
            <span className="absolute text-gray-400 left-3"><FaBuilding /></span>
            <input
              type="text"
              value={companyName}
              disabled={isViewOnly}
              onChange={(e) => handleUpdate("companyName", e.target.value)}
              className={`${inputClasses} pl-9`}
              placeholder="e.g. Acme Corp Pvt Ltd"
            />
          </div>
        </div>

      </div>

      {/* 📝 Additional Message Section */}
      <div className="mt-6">
        <label className={labelClasses}>Additional Message / Notes</label>
        <div className="relative">
          <span className="absolute mt-3 text-gray-400 top-0.5 left-3"><FaCommentAlt /></span>
          <textarea
            rows="3"
            value={message}
            disabled={isViewOnly}
            onChange={(e) => handleUpdate("message", e.target.value)}
            className={`${inputClasses} pl-9 py-3 resize-none`}
            placeholder="Any specific requests, terms, or notes for the client..."
          ></textarea>
        </div>
      </div>

    </div>
  );
};

export default CustomerInfo;
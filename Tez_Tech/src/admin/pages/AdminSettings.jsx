import React, { useState } from "react";
import { FaStore, FaRupeeSign, FaTruck, FaLock, FaSave } from "react-icons/fa";

const AdminSettings = () => {
  // Tabs: 'general', 'payment', 'shipping', 'security'
  const [activeTab, setActiveTab] = useState("general");
  const [isSaving, setIsSaving] = useState(false);

  // Form States (Aap inhe backend se fetch karenge `useEffect` mein)
  const [settings, setSettings] = useState({
    storeName: "Sonani Electronics",
    supportEmail: "support@sonani.com",
    supportPhone: "+91 8936026702",
    gstNumber: "22AAAAA0000A1Z5",
    address: "Surat, Gujarat, India",
    
    upiId: "sonani@ybl",
    bankAccountName: "Sonani Enterprises",
    bankAccountNumber: "0000111122223333",
    ifscCode: "HDFC0001234",
    
    baseShippingRate: 1350,
    freeShippingThreshold: 50000,
  });

  const handleChange = (e) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    // Yahan Backend API call aayegi (e.g., axios.put('/api/admin/settings', settings))
    setTimeout(() => {
      alert("Settings saved successfully!");
      setIsSaving(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen px-4 py-8 mx-auto font-sans sm:px-6 lg:px-8 max-w-7xl sm:py-10 bg-slate-50">
      
      <div className="mb-8">
        <h2 className="text-2xl font-black tracking-tight sm:text-3xl text-slate-900">Admin Settings</h2>
        <p className="mt-1 text-sm text-slate-500">Manage your store configurations, payments, and shipping rules.</p>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        
        {/* SIDEBAR TABS */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0">
            <button 
              onClick={() => setActiveTab("general")}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${
                activeTab === "general" ? "bg-blue-600 text-white shadow-md" : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <FaStore className={activeTab === "general" ? "text-blue-200" : "text-slate-400"} /> Store Details
            </button>
            <button 
              onClick={() => setActiveTab("payment")}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${
                activeTab === "payment" ? "bg-blue-600 text-white shadow-md" : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <FaRupeeSign className={activeTab === "payment" ? "text-blue-200" : "text-slate-400"} /> Payment Info
            </button>
            <button 
              onClick={() => setActiveTab("shipping")}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${
                activeTab === "shipping" ? "bg-blue-600 text-white shadow-md" : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <FaTruck className={activeTab === "shipping" ? "text-blue-200" : "text-slate-400"} /> Shipping Rates
            </button>
            <button 
              onClick={() => setActiveTab("security")}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${
                activeTab === "security" ? "bg-blue-600 text-white shadow-md" : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <FaLock className={activeTab === "security" ? "text-blue-200" : "text-slate-400"} /> Security
            </button>
          </nav>
        </div>

        {/* SETTINGS FORM AREA */}
        <div className="flex-1">
          <form onSubmit={handleSave} className="bg-white border shadow-sm border-slate-200 rounded-2xl p-6 sm:p-8">
            
            {/* GENERAL SETTINGS */}
            {activeTab === "general" && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-lg font-black text-slate-900 border-b pb-3 mb-4">Store Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold tracking-widest text-slate-500 uppercase mb-2">Store Name</label>
                    <input type="text" name="storeName" value={settings.storeName} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold tracking-widest text-slate-500 uppercase mb-2">GST Number</label>
                    <input type="text" name="gstNumber" value={settings.gstNumber} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium uppercase" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold tracking-widest text-slate-500 uppercase mb-2">Support Email</label>
                    <input type="email" name="supportEmail" value={settings.supportEmail} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold tracking-widest text-slate-500 uppercase mb-2">Support Phone</label>
                    <input type="text" name="supportPhone" value={settings.supportPhone} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold tracking-widest text-slate-500 uppercase mb-2">Business Address</label>
                    <textarea name="address" value={settings.address} onChange={handleChange} rows="3" className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium resize-none"></textarea>
                  </div>
                </div>
              </div>
            )}

            {/* PAYMENT SETTINGS */}
            {activeTab === "payment" && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-lg font-black text-slate-900 border-b pb-3 mb-4">Manual Payment Details</h3>
                <p className="text-sm text-slate-500 mb-6">These details will be shown to customers at checkout when they select "Manual Transfer / UPI".</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold tracking-widest text-slate-500 uppercase mb-2">UPI ID</label>
                    <input type="text" name="upiId" value={settings.upiId} onChange={handleChange} placeholder="e.g., yourname@okaxis" className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold tracking-widest text-slate-500 uppercase mb-2">Bank Account Name</label>
                    <input type="text" name="bankAccountName" value={settings.bankAccountName} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold tracking-widest text-slate-500 uppercase mb-2">Account Number</label>
                    <input type="text" name="bankAccountNumber" value={settings.bankAccountNumber} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold tracking-widest text-slate-500 uppercase mb-2">IFSC Code</label>
                    <input type="text" name="ifscCode" value={settings.ifscCode} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium uppercase" />
                  </div>
                </div>
              </div>
            )}

            {/* SHIPPING SETTINGS */}
            {activeTab === "shipping" && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-lg font-black text-slate-900 border-b pb-3 mb-4">Shipping & Delivery Configuration</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold tracking-widest text-slate-500 uppercase mb-2">Base Shipping Rate (₹)</label>
                    <input type="number" name="baseShippingRate" value={settings.baseShippingRate} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none font-black" />
                    <p className="text-xs text-slate-400 mt-1">Standard delivery charge applied at checkout.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold tracking-widest text-slate-500 uppercase mb-2">Free Shipping Threshold (₹)</label>
                    <input type="number" name="freeShippingThreshold" value={settings.freeShippingThreshold} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none font-black" />
                    <p className="text-xs text-slate-400 mt-1">Make shipping free if cart value exceeds this amount.</p>
                  </div>
                </div>
              </div>
            )}

            {/* SECURITY SETTINGS */}
            {activeTab === "security" && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-lg font-black text-slate-900 border-b pb-3 mb-4">Admin Security</h3>
                <div className="grid grid-cols-1 gap-6 max-w-md">
                  <div>
                    <label className="block text-xs font-bold tracking-widest text-slate-500 uppercase mb-2">Current Password</label>
                    <input type="password" placeholder="••••••••" className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold tracking-widest text-slate-500 uppercase mb-2">New Password</label>
                    <input type="password" placeholder="••••••••" className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  </div>
                </div>
              </div>
            )}

            {/* SAVE BUTTON */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
              <button 
                type="submit" 
                disabled={isSaving}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSaving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <FaSave />}
                {isSaving ? "Saving..." : "Save Settings"}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
};

export default AdminSettings;
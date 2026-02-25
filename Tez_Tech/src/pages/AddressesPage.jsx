import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const AddressesPage = () => {
  const { user, logout } = useAuth();

  // 📝 Dummy addresses state
  const [addresses, setAddresses] = useState([
    {
      id: 1,
      name: "Sandeep Sharma",
      phone: "9876543210",
      pincode: "395006",
      locality: "Varachha",
      address: "101, Sonani Electronics, Main Road, Near Station",
      city: "Surat",
      state: "Gujarat",
      type: "HOME"
    }
  ]);

  // UI States
  const [showForm, setShowForm] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null); // Kiska menu khula hai track karne ke liye
  const [editingId, setEditingId] = useState(null); // Kaunsa address edit ho raha hai

  // Form Data State
  const [formData, setFormData] = useState({
    name: '', phone: '', pincode: '', locality: '', address: '', city: '', state: '', landmark: '', altPhone: '', type: 'HOME'
  });

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="w-10 h-10 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
    );
  }

  // Input Change Handle
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Add New Button Click
  const handleAddNew = () => {
    setFormData({ name: '', phone: '', pincode: '', locality: '', address: '', city: '', state: '', landmark: '', altPhone: '', type: 'HOME' });
    setEditingId(null);
    setShowForm(true);
  };

  // Edit Button Click (Menu ke andar se)
  const handleEdit = (address) => {
    setFormData(address); // Purana data form me bhar diya
    setEditingId(address.id); // Set kar diya ki ye wala edit ho raha hai
    setShowForm(true); // Form open kar diya
    setActiveMenuId(null); // Menu band kar diya
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Upar scroll kar diya
  };

  // Delete Button Click
  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this address?")) {
      setAddresses(addresses.filter(addr => addr.id !== id));
    }
    setActiveMenuId(null); // Menu band kar diya
  };

  // Save (Add New ya Edit Update)
  const handleSave = (e) => {
    e.preventDefault();
    
    if (editingId) {
      // Agar pehle se bana hua address edit ho raha hai
      setAddresses(addresses.map(addr => addr.id === editingId ? { ...formData, id: editingId } : addr));
    } else {
      // Naya address add ho raha hai
      const newAddress = { ...formData, id: Date.now() };
      setAddresses([...addresses, newAddress]);
    }
    
    setShowForm(false);
    setEditingId(null);
  };

  // Menu Toggle Handle
  const toggleMenu = (id) => {
    if (activeMenuId === id) {
      setActiveMenuId(null); // Agar same pe click kiya toh band kar do
    } else {
      setActiveMenuId(id); // Nahi toh naya khol do
    }
  };

  return (
    <div className="min-h-screen pt-6 pb-10 font-sans bg-gray-100">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        
        <div className="flex flex-col gap-4 md:flex-row">
          
          {/* ================= LEFT SIDEBAR ================= */}
          <div className="w-full md:w-[300px] flex-shrink-0 flex flex-col gap-4">
            <div className="flex items-center gap-4 p-4 bg-white rounded-sm shadow-sm">
              <div className="flex items-center justify-center w-12 h-12 text-xl font-bold text-blue-600 bg-blue-100 rounded-full">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <p className="text-xs text-gray-500">Hello,</p>
                <h2 className="text-base font-bold text-gray-800">{user.name}</h2>
              </div>
            </div>

            <div className="pb-4 bg-white rounded-sm shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 hover:text-blue-600 hover:bg-gray-50">
                <Link to="/orders" className="flex items-center justify-between w-full font-semibold text-gray-500">
                  <div className="flex items-center gap-4">
                    <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                    <span>MY ORDERS</span>
                  </div>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </Link>
              </div>

              <div className="px-5 pt-4 pb-2 border-b border-gray-100">
                <div className="flex items-center gap-4 mb-3 font-semibold text-gray-500">
                  <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  <span>ACCOUNT SETTINGS</span>
                </div>
                <div className="flex flex-col pb-2 space-y-3 text-sm pl-9">
                  <Link to="/profile" className="text-gray-600 transition-colors hover:text-blue-600">Profile Information</Link>
                  <Link to="/addresses" className="py-2 font-medium text-blue-600 border-l-4 border-blue-600 bg-blue-50 -ml-9 pl-9">Manage Addresses</Link>
                  <Link to="/pan-card" className="text-gray-600 transition-colors hover:text-blue-600">PAN Card Information</Link>
                </div>
              </div>

              <div className="px-5 py-4 font-semibold text-gray-500 cursor-pointer hover:text-blue-600 hover:bg-gray-50" onClick={logout}>
                <div className="flex items-center gap-4">
                  <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  <span>Logout</span>
                </div>
              </div>
            </div>
          </div>

          {/* ================= RIGHT MAIN CONTENT ================= */}
          <div className="flex-1 bg-white rounded-sm shadow-sm">
            <div className="p-6 md:p-8">
              <h3 className="mb-6 text-lg font-semibold text-gray-800">Manage Addresses</h3>

              {/* Add New Address Button (Tabhi dikhega jab form band ho) */}
              {!showForm && (
                <button 
                  onClick={handleAddNew}
                  className="flex items-center w-full gap-4 px-4 py-3 mb-6 font-semibold text-left text-blue-600 transition-colors bg-white border border-gray-200 rounded-sm hover:bg-gray-50"
                >
                  <span className="text-xl">+</span> ADD A NEW ADDRESS
                </button>
              )}

              {/* Address Form (Add ya Edit dono ke liye) */}
              {showForm && (
                <div className="p-6 mb-6 border border-blue-100 rounded-sm bg-blue-50/50">
                  <h4 className="mb-4 text-sm font-semibold text-blue-600 uppercase">
                    {editingId ? "Edit Address" : "Add a new address"}
                  </h4>
                  <form onSubmit={handleSave} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="Name" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-sm outline-none focus:border-blue-500" />
                      <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required placeholder="10-digit mobile number" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-sm outline-none focus:border-blue-500" />
                      <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} required placeholder="Pincode" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-sm outline-none focus:border-blue-500" />
                      <input type="text" name="locality" value={formData.locality} onChange={handleChange} required placeholder="Locality" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-sm outline-none focus:border-blue-500" />
                    </div>

                    <textarea name="address" value={formData.address} onChange={handleChange} required placeholder="Address (Area and Street)" rows="3" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-sm outline-none focus:border-blue-500 resize-none"></textarea>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <input type="text" name="city" value={formData.city} onChange={handleChange} required placeholder="City/District/Town" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-sm outline-none focus:border-blue-500" />
                      <input type="text" name="state" value={formData.state} onChange={handleChange} required placeholder="State" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-sm outline-none focus:border-blue-500" />
                      <input type="text" name="landmark" value={formData.landmark} onChange={handleChange} placeholder="Landmark (Optional)" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-sm outline-none focus:border-blue-500" />
                      <input type="tel" name="altPhone" value={formData.altPhone} onChange={handleChange} placeholder="Alternate Phone (Optional)" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-sm outline-none focus:border-blue-500" />
                    </div>

                    <div className="pt-2">
                      <p className="mb-2 text-sm text-gray-500">Address Type</p>
                      <div className="flex gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="type" value="HOME" checked={formData.type === 'HOME'} onChange={handleChange} className="w-4 h-4 text-blue-600" />
                          <span className="text-gray-800">Home (All day delivery)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="type" value="WORK" checked={formData.type === 'WORK'} onChange={handleChange} className="w-4 h-4 text-blue-600" />
                          <span className="text-gray-800">Work (Delivery between 10 AM - 5 PM)</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button type="submit" className="px-8 py-2.5 font-semibold text-white bg-blue-600 rounded-sm hover:bg-blue-700 shadow-md">
                        {editingId ? "UPDATE" : "SAVE"}
                      </button>
                      <button type="button" onClick={() => {setShowForm(false); setEditingId(null);}} className="px-8 py-2.5 font-semibold text-blue-600 hover:text-blue-800">CANCEL</button>
                    </div>
                  </form>
                </div>
              )}

              {/* Saved Addresses List */}
              <div className="space-y-4">
                {addresses.map((addr) => (
                  <div key={addr.id} className="relative p-5 transition-shadow border border-gray-200 rounded-sm group hover:shadow-sm">
                    
                    {/* 👇 Three dots Menu Button */}
                    <div className="absolute right-5 top-5">
                      <button 
                        onClick={() => toggleMenu(addr.id)}
                        className="p-1 text-gray-400 rounded-full hover:text-gray-800 hover:bg-gray-100"
                      >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                      </button>

                      {/* Dropdown Menu Box */}
                      {activeMenuId === addr.id && (
                        <div className="absolute right-0 z-10 w-32 py-2 mt-1 bg-white border border-gray-200 rounded-sm shadow-lg top-8">
                          <button 
                            onClick={() => handleEdit(addr)}
                            className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(addr.id)}
                            className="w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-2 py-0.5 text-[10px] font-bold text-gray-500 bg-gray-100 rounded-sm">{addr.type}</span>
                    </div>
                    
                    <div className="flex items-center gap-4 mb-1">
                      <span className="font-semibold text-gray-800">{addr.name}</span>
                      <span className="font-semibold text-gray-800">{addr.phone}</span>
                    </div>
                    
                    <p className="max-w-2xl mt-2 text-sm leading-relaxed text-gray-600">
                      {addr.address}, {addr.locality}, {addr.city}, {addr.state} - <span className="font-semibold">{addr.pincode}</span>
                    </p>
                  </div>
                ))}

                {/* Empty State (Agar koi address na bache toh) */}
                {addresses.length === 0 && !showForm && (
                  <div className="py-10 text-center border border-gray-200 border-dashed rounded-sm">
                    <p className="text-gray-500">No saved addresses found.</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddressesPage;
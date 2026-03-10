import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

const emptyForm = {
  fullName: "",
  phone: "",
  pincode: "",
  locality: "",
  address: "",
  city: "",
  state: "",
  landmark: "",
  altPhone: "",
  type: "HOME",
  label: "",
};

const AddressesPage = () => {
  const { user, logout } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const avatarText = useMemo(() => (user?.name ? user.name.charAt(0).toUpperCase() : "U"), [user?.name]);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/users/addresses");
      setAddresses(data.addresses || []);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to fetch addresses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const onChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const startAdd = () => {
    setEditingId(null);
    setFormData({ ...emptyForm, fullName: user?.name || "", phone: user?.phone || "" });
    setShowForm(true);
  };

  const startEdit = (address) => {
    setEditingId(address._id);
    setFormData({
      fullName: address.fullName || "",
      phone: address.phone || "",
      pincode: address.pincode || "",
      locality: address.locality || "",
      address: address.address || "",
      city: address.city || "",
      state: address.state || "",
      landmark: address.landmark || "",
      altPhone: address.altPhone || "",
      type: address.type || "HOME",
      label: address.label || "",
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(emptyForm);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      if (editingId) {
        await api.put(`/users/addresses/${editingId}`, formData);
      } else {
        await api.post("/users/addresses", formData);
      }
      await loadAddresses();
      closeForm();
      setMessage(editingId ? "Address updated." : "Address added.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to save address.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this address?")) return;
    try {
      await api.delete(`/users/addresses/${id}`);
      await loadAddresses();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to delete address.");
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await api.put(`/users/addresses/${id}/default`);
      await loadAddresses();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to set default address.");
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen pt-6 pb-10 bg-gray-100">
      <div className="px-4 mx-auto max-w-6xl">
        <div className="grid gap-4 md:grid-cols-[280px_1fr]">
          <aside className="p-4 bg-white border border-gray-100 shadow-sm rounded-xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center justify-center w-11 h-11 text-lg font-bold text-blue-700 bg-blue-100 rounded-full">
                {avatarText}
              </div>
              <div>
                <p className="text-xs text-gray-500">Hello,</p>
                <p className="font-semibold text-gray-800">{user.name}</p>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <Link to="/orders" className="block font-medium text-gray-700 hover:text-blue-600">
                My Orders
              </Link>
              <Link to="/profile" className="block font-medium text-gray-700 hover:text-blue-600">
                Profile Information
              </Link>
              <Link to="/addresses" className="block font-semibold text-blue-600">
                Manage Addresses
              </Link>
              <button onClick={logout} className="block pt-1 font-medium text-left text-red-600">
                Logout
              </button>
            </div>
          </aside>

          <main className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
            <div className="flex items-center justify-between mb-5">
              <h1 className="text-xl font-bold text-gray-900">Manage Addresses</h1>
              {!showForm && (
                <button onClick={startAdd} className="px-4 py-2 text-sm font-semibold text-blue-700 bg-blue-50 rounded-lg">
                  + Add New
                </button>
              )}
            </div>

            {message && <p className="p-3 mb-4 text-sm rounded-lg bg-gray-50 text-gray-700">{message}</p>}

            {showForm && (
              <form onSubmit={handleSave} className="p-4 mb-5 space-y-3 border border-gray-200 rounded-xl bg-gray-50">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input name="fullName" value={formData.fullName} onChange={onChange} placeholder="Full Name" required className="px-3 py-2 border rounded-lg" />
                  <input name="phone" value={formData.phone} onChange={onChange} placeholder="Phone" required className="px-3 py-2 border rounded-lg" />
                  <input name="pincode" value={formData.pincode} onChange={onChange} placeholder="Pincode" required className="px-3 py-2 border rounded-lg" />
                  <input name="locality" value={formData.locality} onChange={onChange} placeholder="Locality" className="px-3 py-2 border rounded-lg" />
                </div>
                <textarea name="address" value={formData.address} onChange={onChange} placeholder="Address" required rows={3} className="w-full px-3 py-2 border rounded-lg" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input name="city" value={formData.city} onChange={onChange} placeholder="City" required className="px-3 py-2 border rounded-lg" />
                  <input name="state" value={formData.state} onChange={onChange} placeholder="State" className="px-3 py-2 border rounded-lg" />
                  <input name="landmark" value={formData.landmark} onChange={onChange} placeholder="Landmark" className="px-3 py-2 border rounded-lg" />
                  <input name="altPhone" value={formData.altPhone} onChange={onChange} placeholder="Alternate Phone" className="px-3 py-2 border rounded-lg" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <select name="type" value={formData.type} onChange={onChange} className="px-3 py-2 border rounded-lg">
                    <option value="HOME">Home</option>
                    <option value="WORK">Work</option>
                    <option value="OTHER">Other</option>
                  </select>
                  <input name="label" value={formData.label} onChange={onChange} placeholder="Label (optional)" className="px-3 py-2 border rounded-lg" />
                </div>
                <div className="flex gap-3">
                  <button disabled={saving} className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-lg disabled:opacity-60">
                    {saving ? "Saving..." : editingId ? "Update Address" : "Save Address"}
                  </button>
                  <button type="button" onClick={closeForm} className="px-4 py-2 font-semibold text-gray-700 bg-white border rounded-lg">
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {loading ? (
              <p className="text-sm text-gray-500">Loading addresses...</p>
            ) : addresses.length === 0 ? (
              <p className="text-sm text-gray-500">No saved addresses yet.</p>
            ) : (
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <div key={addr._id} className="p-4 border border-gray-200 rounded-xl">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 text-xs font-semibold text-gray-700 bg-gray-100 rounded">{addr.type}</span>
                      {addr.isDefault && <span className="px-2 py-0.5 text-xs font-semibold text-green-700 bg-green-100 rounded">Default</span>}
                    </div>
                    <p className="font-semibold text-gray-900">{addr.fullName} - {addr.phone}</p>
                    <p className="mt-1 text-sm text-gray-600">
                      {addr.address}, {addr.locality ? `${addr.locality}, ` : ""}{addr.city}, {addr.state} - {addr.pincode}
                    </p>
                    <div className="flex flex-wrap gap-3 mt-3 text-sm">
                      {!addr.isDefault && (
                        <button onClick={() => handleSetDefault(addr._id)} className="font-medium text-blue-600">
                          Set Default
                        </button>
                      )}
                      <button onClick={() => startEdit(addr)} className="font-medium text-gray-700">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(addr._id)} className="font-medium text-red-600">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AddressesPage;

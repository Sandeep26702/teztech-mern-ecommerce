import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

const ProfilePage = () => {
  const { user, logout, refreshUser, updateCurrentUser } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const avatarText = useMemo(() => (user?.name ? user.name.charAt(0).toUpperCase() : "U"), [user?.name]);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
    }
  }, [user]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage("");

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    if (trimmedName.length < 2) {
      setMessage("Name must be at least 2 characters.");
      return;
    }
    if (trimmedPhone && !/^\d{10}$/.test(trimmedPhone)) {
      setMessage("Phone must be exactly 10 digits.");
      return;
    }

    setSaving(true);
    try {
      const { data } = await api.put("/users/profile", {
        name: trimmedName,
        phone: trimmedPhone,
      });
      if (data?.success) {
        updateCurrentUser(data.user);
        setMessage("Profile updated successfully.");
      }
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
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
              <Link to="/profile" className="block font-semibold text-blue-600">
                Profile Information
              </Link>
              <Link to="/addresses" className="block font-medium text-gray-700 hover:text-blue-600">
                Manage Addresses
              </Link>
              <button onClick={logout} className="block pt-1 font-medium text-left text-red-600">
                Logout
              </button>
            </div>
          </aside>

          <main className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
            <h1 className="mb-1 text-xl font-bold text-gray-900">Profile Information</h1>
            <p className="mb-6 text-sm text-gray-500">Data refresh ke baad bhi yahi se load hoga.</p>

            {message && <p className="p-3 mb-5 text-sm rounded-lg bg-gray-50 text-gray-700">{message}</p>}

            <form onSubmit={handleSave} className="max-w-2xl space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Full Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Email</label>
                <input
                  value={user.email || ""}
                  disabled
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Phone</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="10 digit phone"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </main>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

import { useEffect, useState, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { FaTrash, FaSearch, FaUserShield, FaUserFriends } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";

const API_BASE = "https://sonani-backend.onrender.com/api/admin";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailStats, setDetailStats] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "" });
  const { user: currentUser } = useAuth();
  const location = useLocation();
  const isSubadminsPage = location.pathname.includes("/admin/subadmins");

  const token = localStorage.getItem("token");
  const canChangeRoles = currentUser?.role === "admin";
  const canDeleteUsers = currentUser?.role === "admin";
  const canEditUsers = currentUser?.role === "admin" || currentUser?.role === "subadmin";

  const authConfig = { headers: { Authorization: `Bearer ${token}` } };

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/users`, authConfig);
      if (res.data.success) setUsers(res.data.users || []);
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openDetails = async (id) => {
    try {
      const res = await axios.get(`${API_BASE}/users/${id}`, authConfig);
      const payload = res.data;
      setSelectedUser(payload.user);
      setDetailStats(payload.stats || null);
      setEditForm({
        name: payload.user?.name || "",
        email: payload.user?.email || "",
        phone: payload.user?.phone || "",
      });
    } catch (error) {
      alert(error.response?.data?.message || "Failed to load user details");
    }
  };

  const closeDetails = () => {
    setSelectedUser(null);
    setDetailStats(null);
  };

  const handleDelete = async (id) => {
    if (!canDeleteUsers) return alert("Only admin can delete users.");
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await axios.delete(`${API_BASE}/users/${id}`, authConfig);
      fetchUsers();
      if (selectedUser?._id === id) closeDetails();
    } catch (err) {
      alert(err.response?.data?.message || "Error deleting user");
    }
  };

  const handleRoleUpdate = async (id, newRole) => {
    if (!canChangeRoles) return alert("Only admin can change roles.");
    try {
      await axios.put(`${API_BASE}/users/${id}`, { role: newRole }, authConfig);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Role update failed");
      fetchUsers();
    }
  };

  const handleBlockToggle = async (userObj) => {
    if (!canEditUsers) return;
    const isActive = !userObj.isActive;
    const reason = !isActive ? prompt("Block reason:", "Suspicious account") || "Blocked by admin" : "";
    try {
      await axios.patch(`${API_BASE}/users/${userObj._id}/block`, { isActive, blockedReason: reason }, authConfig);
      fetchUsers();
      if (selectedUser?._id === userObj._id) {
        openDetails(userObj._id);
      }
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update block status");
    }
  };

  const handleSaveUserProfile = async () => {
    if (!selectedUser || !canEditUsers) return;
    try {
      await axios.put(`${API_BASE}/users/${selectedUser._id}/profile`, editForm, authConfig);
      alert("User profile updated.");
      fetchUsers();
      openDetails(selectedUser._id);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update user profile");
    }
  };

  const filteredUsers = users.filter(
    (u) => u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const roleBuckets = useMemo(() => {
    const bucket = {
      user: [],
      subadmin: [],
      admin: [],
    };
    filteredUsers.forEach((u) => {
      const roleKey = String(u.role || "user").toLowerCase();
      if (roleKey === "admin") bucket.admin.push(u);
      else if (roleKey === "subadmin") bucket.subadmin.push(u);
      else bucket.user.push(u);
    });
    return bucket;
  }, [filteredUsers]);
  const adminTeamUsers = [...roleBuckets.admin, ...roleBuckets.subadmin];
  const tableUsers = isSubadminsPage ? adminTeamUsers : roleBuckets.user;

  const getRoleStyle = (role) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "subadmin":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
  };

  const getCountBadgeStyle = (accent) => {
    if (accent === "emerald") return "bg-emerald-50 text-emerald-700";
    if (accent === "blue") return "bg-blue-50 text-blue-700";
    if (accent === "purple") return "bg-purple-50 text-purple-700";
    return "bg-indigo-50 text-indigo-700";
  };

  const renderUsersTable = (title, list, accentClass = "indigo") => (
    <div className="overflow-hidden bg-white border border-gray-100 shadow-sm rounded-2xl">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
        <h3 className="text-sm font-bold tracking-wide text-gray-800 uppercase">{title}</h3>
        <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${getCountBadgeStyle(accentClass)}`}>
          {list.length}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">User</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Email</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Role</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-right text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan="5" className="px-6 py-8 text-sm text-center text-gray-500">Loading users...</td></tr>
            ) : list.length ? (
              list.map((u) => (
                <tr key={u._id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-semibold text-gray-900">{u.name || "Unknown User"}</td>
                  <td className="px-6 py-4 text-gray-600">{u.email}</td>
                  <td className="px-6 py-4">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleUpdate(u._id, e.target.value)}
                      disabled={!canChangeRoles}
                      className={`text-sm font-semibold rounded-lg border px-3 py-1.5 ${getRoleStyle(u.role)}`}
                    >
                      <option value="user">User</option>
                      <option value="subadmin">Sub-Admin</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${u.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {u.isActive ? "Active" : "Blocked"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openDetails(u._id)} className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 rounded-lg">
                        View
                      </button>
                      {canEditUsers && (
                        <button onClick={() => handleBlockToggle(u)} className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${u.isActive ? "text-orange-700 bg-orange-50" : "text-green-700 bg-green-50"}`}>
                          {u.isActive ? "Block" : "Unblock"}
                        </button>
                      )}
                      {canDeleteUsers && (
                        <button onClick={() => handleDelete(u._id)} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 rounded-lg">
                          <FaTrash /> Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center">
                  <p className="text-gray-500">No records in this role.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 p-6 bg-white border border-gray-100 shadow-sm sm:flex-row sm:items-center rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 text-xl text-indigo-600 bg-indigo-50 rounded-xl">
            <FaUserShield />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{isSubadminsPage ? "Sub Admin Management" : "Users Management"}</h2>
            <p className="text-sm text-gray-500">
              {isSubadminsPage
                ? "Admin + Sub-admin accounts ko yahan manage karein."
                : "Admin can view, edit, block/unblock and delete users."}
            </p>
          </div>
        </div>
        <div className="relative w-full sm:w-72">
          <FaSearch className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full py-2 pl-10 pr-4 text-sm border border-gray-200 bg-gray-50 rounded-xl"
          />
        </div>
      </div>

      {!loading && filteredUsers.length === 0 ? (
        <div className="px-6 py-12 text-center bg-white border border-gray-100 shadow-sm rounded-2xl">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-gray-100 rounded-full">
            <FaUserFriends className="text-2xl text-gray-400" />
          </div>
          <p className="text-gray-500">No users matched your search.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {renderUsersTable(
            isSubadminsPage ? "Admin Team (Admin + Sub Admin)" : "Users",
            tableUsers,
            isSubadminsPage ? "blue" : "emerald"
          )}
        </div>
      )}

      {selectedUser && (
        <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">User Details</h3>
              <p className="text-sm text-gray-500">User ID: {selectedUser.userId || selectedUser.phone || selectedUser._id}</p>
            </div>
            <button onClick={closeDetails} className="text-sm font-semibold text-gray-600">Close</button>
          </div>

          {detailStats && (
            <p className="mb-4 text-sm text-gray-600">
              Orders: <strong>{detailStats.ordersCount}</strong> | Total Spent: <strong>Rs {detailStats.totalSpent}</strong>
            </p>
          )}

          <div className="grid gap-3 mb-4 sm:grid-cols-3">
            <input value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} className="px-3 py-2 border rounded-lg" placeholder="Name" />
            <input value={editForm.email} onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))} className="px-3 py-2 border rounded-lg" placeholder="Email" />
            <input value={editForm.phone} onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))} className="px-3 py-2 border rounded-lg" placeholder="Phone" />
          </div>
          {canEditUsers && (
            <button onClick={handleSaveUserProfile} className="px-4 py-2 font-semibold text-white bg-indigo-600 rounded-lg">
              Save User Data
            </button>
          )}

          {selectedUser.addresses?.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-sm font-semibold text-gray-700">Saved Addresses</p>
              <div className="space-y-2">
                {selectedUser.addresses.map((addr) => (
                  <div key={addr._id} className="p-3 text-sm border rounded-lg bg-gray-50">
                    {addr.fullName} - {addr.phone} | {addr.address}, {addr.locality}, {addr.city}, {addr.state} - {addr.pincode}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminUsers;

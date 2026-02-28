import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { FaTrash, FaSearch, FaUserShield, FaUserFriends } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { user: currentUser } = useAuth();

  const token = localStorage.getItem("token");
  const canChangeRoles = currentUser?.role === "admin";
  const canDeleteUsers = currentUser?.role === "admin";

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get("http://localhost:5000/api/admin/users", config);
      if (res.data.success) {
        setUsers(res.data.users);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async (id) => {
    if (!canDeleteUsers) {
      alert("Only admin can delete users.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(`http://localhost:5000/api/admin/users/${id}`, config);
      alert("User deleted successfully.");
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Error deleting user");
    }
  };

  const handleRoleUpdate = async (id, newRole) => {
    if (!canChangeRoles) {
      alert("Only admin can change roles.");
      fetchUsers();
      return;
    }

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`http://localhost:5000/api/admin/users/${id}`, { role: newRole }, config);
      alert(`Role updated to ${newRole.toUpperCase()}.`);
      fetchUsers();
    } catch (err) {
      console.error("Role update error:", err);
      alert(err.response?.data?.message || "Role update failed");
      fetchUsers();
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleStyle = (role) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return "bg-purple-50 text-purple-700 border-purple-200 focus:ring-purple-500";
      case "subadmin":
        return "bg-blue-50 text-blue-700 border-blue-200 focus:ring-blue-500";
      default:
        return "bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-500";
    }
  };

  const getAvatarColor = (name) => {
    const colors = [
      "bg-red-100 text-red-600",
      "bg-yellow-100 text-yellow-600",
      "bg-green-100 text-green-600",
      "bg-blue-100 text-blue-600",
      "bg-indigo-100 text-indigo-600",
      "bg-pink-100 text-pink-600",
    ];
    const index = name ? name.charCodeAt(0) % colors.length : 0;
    return colors[index];
  };

  return (
    <div className="mx-auto space-y-6 font-sans max-w-7xl">
      <div className="flex flex-col items-start justify-between gap-4 p-6 bg-white border border-gray-100 shadow-sm sm:flex-row sm:items-center rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 text-xl text-indigo-600 bg-indigo-50 rounded-xl">
            <FaUserShield />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Users Management</h2>
            <p className="text-sm text-gray-500">Subadmin can manage users, but only admin can change roles.</p>
          </div>
        </div>

        <div className="w-full sm:w-auto">
          <div className="relative">
            <FaSearch className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-2 pl-10 pr-4 text-sm transition-all border border-gray-200 sm:w-72 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden bg-white border border-gray-100 shadow-sm rounded-2xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-6 py-4 text-xs font-bold tracking-wider text-gray-500 uppercase">User Details</th>
                <th className="px-6 py-4 text-xs font-bold tracking-wider text-gray-500 uppercase">Email Address</th>
                <th className="px-6 py-4 text-xs font-bold tracking-wider text-gray-500 uppercase">Access Role</th>
                <th className="px-6 py-4 text-xs font-bold tracking-wider text-right text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full" />
                        <div className="w-24 h-4 bg-gray-200 rounded" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-40 h-4 bg-gray-200 rounded" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-8 bg-gray-200 rounded-lg w-28" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="w-20 h-8 ml-auto bg-gray-200 rounded-lg" />
                    </td>
                  </tr>
                ))
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user._id} className="transition-colors hover:bg-gray-50/50 group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-sm ${getAvatarColor(user.name)}`}>
                          {user.name ? user.name.charAt(0).toUpperCase() : "?"}
                        </div>
                        <span className="font-bold text-gray-900">{user.name || "Unknown User"}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{user.email}</td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleUpdate(user._id, e.target.value)}
                        disabled={!canChangeRoles}
                        title={!canChangeRoles ? "Only admin can change roles" : "Change user role"}
                        className={`text-sm font-semibold rounded-lg border px-3 py-1.5 focus:outline-none focus:ring-2 transition-colors ${getRoleStyle(user.role)} ${!canChangeRoles ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                      >
                        <option value="user" className="text-gray-900 bg-white">
                          User
                        </option>
                        <option value="admin" className="text-gray-900 bg-white">
                          Admin
                        </option>
                        <option value="subadmin" className="text-gray-900 bg-white">
                          Sub-Admin
                        </option>
                      </select>
                    </td>

                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      {canDeleteUsers ? (
                        <button
                          onClick={() => handleDelete(user._id)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 bg-red-50 hover:bg-red-600 hover:text-white rounded-lg transition-colors border border-red-100"
                          title="Delete User"
                        >
                          <FaTrash /> <span className="hidden sm:inline">Delete</span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-gray-500 bg-gray-100 rounded-lg border border-gray-200">
                          Delete Disabled
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-gray-100 rounded-full">
                      <FaUserFriends className="text-2xl text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No users found</h3>
                    <p className="mt-1 text-gray-500">No users matched your search.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;

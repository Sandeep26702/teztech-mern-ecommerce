import { useState } from "react";
import { updateProfile } from "../../api/user.api";

const EditProfileModal = ({ user, onClose, onUpdate }) => {
  const [form, setForm] = useState({
    name: user.name || "",
    mobile: user.mobile || ""
  });

  const [loading, setLoading] = useState(false);

  // 🔁 Input change
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ✅ Save profile
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await updateProfile(form);
      onUpdate(res.data); // send the updated user to the parent component
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h2>Edit Profile</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Mobile</label>
            <input
              name="mobile"
              value={form.mobile}
              onChange={handleChange}
              maxLength={10}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>

            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;

import { useEffect, useState } from "react";
import { getProfile } from "../../api/user.api";

const ProfileDetails = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    getProfile().then((res) => setUser(res.data));
  }, []);

  if (!user) return <p>Loading...</p>;

  return (
    <div className="profile-content">
      <h2>Personal Information</h2>

      <div className="profile-card">
        <img
          src={user.avatar || "/user.png"}
          alt="profile"
          className="profile-img"
        />

        <div>
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Mobile:</strong> {user.mobile || "Not Added"}</p>
        </div>
      </div>

      <button className="edit-btn">Edit Profile</button>
    </div>
  );
};

export default ProfileDetails;

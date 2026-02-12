const ProfileSidebar = () => {
  return (
    <div className="profile-sidebar">
      <h3>Hello 👋</h3>

      <ul>
        <li className="active">My Profile</li>
        <li>My Orders</li>
        <li>Addresses</li>
        <li>Change Password</li>
        <li className="logout">Logout</li>
      </ul>
    </div>
  );
};

export default ProfileSidebar;

import React from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/components/Profile.css';

const ProfilePage = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="profile-container">
        <div className="loading">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>My Profile</h1>
        <button className="edit-btn">Edit Profile</button>
      </div>

      <div className="profile-card">
        <div className="profile-section">
          <div className="profile-avatar-large">
            {user.profileImage ? (
              <img src={`http://localhost:5000${user.profileImage}`} alt={user.name} />
            ) : (
              <div className="avatar-placeholder">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
          </div>
          
          <div className="profile-info">
            <h2>{user.name}</h2>
            <p className="email">{user.email}</p>
            <p className="member-since">
              Member since: {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="profile-details">
          <div className="detail-section">
            <h3>Personal Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="label">Full Name</span>
                <span className="value">{user.name}</span>
              </div>
              
              <div className="detail-item">
                <span className="label">Email Address</span>
                <span className="value">{user.email}</span>
              </div>
              
              <div className="detail-item">
                <span className="label">Phone Number</span>
                <span className="value">{user.phone || 'Not provided'}</span>
              </div>
            </div>
          </div>

          {user.address && (
            <div className="detail-section">
              <h3>Address</h3>
              <div className="detail-grid">
                {user.address.street && (
                  <div className="detail-item">
                    <span className="label">Street</span>
                    <span className="value">{user.address.street}</span>
                  </div>
                )}
                
                {user.address.city && (
                  <div className="detail-item">
                    <span className="label">City</span>
                    <span className="value">{user.address.city}</span>
                  </div>
                )}
                
                {user.address.state && (
                  <div className="detail-item">
                    <span className="label">State</span>
                    <span className="value">{user.address.state}</span>
                  </div>
                )}
                
                {user.address.zipCode && (
                  <div className="detail-item">
                    <span className="label">ZIP Code</span>
                    <span className="value">{user.address.zipCode}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="detail-section">
            <h3>Account Details</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="label">User ID</span>
                <span className="value">{user._id}</span>
              </div>
              
              <div className="detail-item">
                <span className="label">Account Status</span>
                <span className="value status-active">Active</span>
              </div>
              
              <div className="detail-item">
                <span className="label">Email Verified</span>
                <span className="value">
                  {user.isEmailVerified ? 'Verified' : 'Not Verified'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
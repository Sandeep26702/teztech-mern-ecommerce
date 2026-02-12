import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
//import { useAuth } from '../context/AuthContext';
import { useAuth } from '../../context/AuthContext';
import '../../styles/components/ProfileDropdown.css';

const ProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleItemClick = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.name) return 'U';
    return user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="profile-dropdown-container" ref={dropdownRef}>
      <button
        className="profile-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        {user?.profileImage ? (
          <img
            src={`http://localhost:5000${user.profileImage}`}
            alt={user.name}
            className="profile-avatar-img"
          />
        ) : (
          <div className="profile-avatar">
            {getUserInitials()}
          </div>
        )}
        <span className="profile-name">
          {user?.name?.split(' ')[0] || 'User'}
        </span>
        <svg
          className={`dropdown-arrow ${isOpen ? 'rotate' : ''}`}
          width="12"
          height="8"
          viewBox="0 0 12 8"
          fill="none"
        >
          <path
            d="M1 1.5L6 6.5L11 1.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="dropdown-menu">
          <div className="dropdown-header">
            {user?.profileImage ? (
              <img
                src={`http://localhost:5000${user.profileImage}`}
                alt={user.name}
                className="header-avatar-img"
              />
            ) : (
              <div className="header-avatar">
                {getUserInitials()}
              </div>
            )}
            <div className="header-info">
              <h4>{user?.name || 'User'}</h4>
              <p>{user?.email || ''}</p>
            </div>
          </div>

          <div className="dropdown-divider"></div>

          <div className="dropdown-items">
            <button
              className="dropdown-item"
              onClick={() => handleItemClick('/profile')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor"/>
              </svg>
              <span>My Profile</span>
            </button>

            <button
              className="dropdown-item"
              onClick={() => handleItemClick('/orders')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M16 11V7C16 4.79 14.21 3 12 3C9.79 3 8 4.79 8 7V11C6.9 11 6 11.9 6 13V20C6 21.1 6.9 22 8 22H16C17.1 22 18 21.1 18 20V13C18 11.9 17.1 11 16 11ZM10 7C10 5.9 10.9 5 12 5C13.1 5 14 5.9 14 7V11H10V7ZM16 20H8V13H16V20Z" fill="currentColor"/>
              </svg>
              <span>My Orders</span>
            </button>

            <button
              className="dropdown-item"
              onClick={() => handleItemClick('/wishlist')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z" fill="currentColor"/>
              </svg>
              <span>Wishlist</span>
            </button>

            <button
              className="dropdown-item"
              onClick={() => handleItemClick('/settings')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M19.14 12.94C19.18 12.64 19.2 12.33 19.2 12C19.2 11.67 19.18 11.36 19.14 11.06L21.16 9.56C21.37 9.38 21.42 9.07 21.28 8.83L19.28 5.83C19.14 5.59 18.83 5.52 18.58 5.6L16.18 6.53C15.67 6.21 15.11 5.95 14.52 5.76L14.16 3.19C14.1 2.92 13.87 2.73 13.6 2.73H10.4C10.13 2.73 9.9 2.92 9.84 3.19L9.48 5.76C8.89 5.95 8.33 6.21 7.82 6.53L5.42 5.6C5.17 5.52 4.86 5.59 4.72 5.83L2.72 8.83C2.58 9.07 2.63 9.38 2.84 9.56L4.86 11.06C4.82 11.36 4.8 11.67 4.8 12C4.8 12.33 4.82 12.64 4.86 12.94L2.84 14.44C2.63 14.62 2.58 14.93 2.72 15.17L4.72 18.17C4.86 18.41 5.17 18.48 5.42 18.4L7.82 17.47C8.33 17.79 8.89 18.05 9.48 18.24L9.84 20.81C9.9 21.08 10.13 21.27 10.4 21.27H13.6C13.87 21.27 14.1 21.08 14.16 20.81L14.52 18.24C15.11 18.05 15.67 17.79 16.18 17.47L18.58 18.4C18.83 18.48 19.14 18.41 19.28 18.17L21.28 15.17C21.42 14.93 21.37 14.62 21.16 14.44L19.14 12.94ZM12 15.6C10.29 15.6 8.9 14.21 8.9 12.5C8.9 10.79 10.29 9.4 12 9.4C13.71 9.4 15.1 10.79 15.1 12.5C15.1 14.21 13.71 15.6 12 15.6Z" fill="currentColor"/>
              </svg>
              <span>Settings</span>
            </button>
          </div>

          <div className="dropdown-divider"></div>

          <button className="dropdown-item logout" onClick={handleLogout}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M17 7L15.59 8.41L18.17 11H8V13H18.17L15.59 15.58L17 17L22 12L17 7ZM4 5H12V3H4C2.9 3 2 3.9 2 5V19C2 20.1 2.9 21 4 21H12V19H4V5Z" fill="currentColor"/>
            </svg>
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
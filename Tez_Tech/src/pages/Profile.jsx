import React from 'react';
import { useAuth } from '../context/AuthContext';

const ProfilePage = () => {
  const { user } = useAuth();

  // 🌀 Premium Loading State
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen font-sans bg-gray-50">
        <svg className="w-10 h-10 mb-4 text-blue-600 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="font-medium text-gray-500">Loading your profile...</p>
      </div>
    );
  }

  // 📝 Helper component for detail items to keep code DRY
  const DetailItem = ({ label, value }) => (
    <div className="px-6 py-4 border-b border-gray-100 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 last:border-0">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-gray-900 sm:mt-0 sm:col-span-2">{value}</dd>
    </div>
  );

  return (
    <div className="min-h-screen px-4 py-10 font-sans bg-gray-50 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* 🌟 Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">My Profile</h1>
            <p className="mt-1 text-sm text-gray-500">Manage your account settings and personal info.</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 transition-all bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 hover:text-blue-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
            Edit Profile
          </button>
        </div>

        {/* 💳 Main Profile Card */}
        <div className="overflow-hidden transition-all duration-300 bg-white border border-gray-100 shadow-xl rounded-2xl hover:shadow-2xl">
          
          {/* 🎨 Cover Gradient Banner */}
          <div className="relative w-full h-32 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-500"></div>

          {/* 👤 Avatar & Basic Info */}
          <div className="relative px-6 pb-8 sm:px-8">
            <div className="flex flex-col justify-between gap-4 mb-6 -mt-12 sm:flex-row sm:items-end sm:-mt-16">
              
              {/* Avatar Picture */}
              <div className="relative inline-block">
                {user.profileImage ? (
                  <img 
                    src={`http://localhost:5000${user.profileImage}`} 
                    alt={user.name} 
                    className="object-cover w-24 h-24 bg-white border-4 border-white rounded-full shadow-lg sm:h-32 sm:w-32"
                  />
                ) : (
                  <div className="flex items-center justify-center w-24 h-24 text-4xl font-bold text-blue-600 border-4 border-white rounded-full shadow-lg sm:h-32 sm:w-32 bg-gradient-to-br from-gray-100 to-gray-200 sm:text-5xl">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                {/* Online Indicator */}
                <span className="absolute block w-4 h-4 bg-green-400 rounded-full bottom-2 right-2 ring-2 ring-white"></span>
              </div>

              {/* Quick Info */}
              <div className="pb-2 text-left sm:text-right">
                <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                <p className="text-sm font-medium text-gray-500">{user.email}</p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path></svg>
                  Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </div>
              </div>
            </div>

            <hr className="mb-8 border-gray-100" />

            {/* 📋 Detail Sections Grid */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              
              {/* Section 1: Personal Info */}
              <div>
                <h3 className="flex items-center gap-2 mb-4 text-lg font-bold leading-6 text-gray-900">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                  Personal Information
                </h3>
                <div className="border border-gray-100 bg-gray-50 rounded-xl">
                  <DetailItem label="Full Name" value={user.name} />
                  <DetailItem label="Email Address" value={user.email} />
                  <DetailItem label="Phone Number" value={user.phone || 'Not provided'} />
                </div>
              </div>

              {/* Section 2: Account Details */}
              <div>
                <h3 className="flex items-center gap-2 mb-4 text-lg font-bold leading-6 text-gray-900">
                  <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                  Account Status
                </h3>
                <div className="border border-gray-100 bg-gray-50 rounded-xl">
                  <DetailItem label="User ID" value={<span className="px-2 py-1 font-mono text-xs text-gray-600 bg-gray-200 rounded">{user._id}</span>} />
                  <DetailItem 
                    label="Account Status" 
                    value={<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800">Active</span>} 
                  />
                  <DetailItem 
                    label="Email Verified" 
                    value={
                      user.isEmailVerified ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">Verified</span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800">Pending Verification</span>
                      )
                    } 
                  />
                </div>
              </div>

              {/* Section 3: Address (Full Width if present) */}
              {user.address && (
                <div className="mt-4 lg:col-span-2 lg:mt-0">
                  <h3 className="flex items-center gap-2 mb-4 text-lg font-bold leading-6 text-gray-900">
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    Saved Address
                  </h3>
                  <div className="grid grid-cols-1 border border-gray-100 bg-gray-50 rounded-xl sm:grid-cols-2">
                    {user.address.street && <DetailItem label="Street" value={user.address.street} />}
                    {user.address.city && <DetailItem label="City" value={user.address.city} />}
                    {user.address.state && <DetailItem label="State" value={user.address.state} />}
                    {user.address.zipCode && <DetailItem label="ZIP Code" value={user.address.zipCode} />}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProfilePage;
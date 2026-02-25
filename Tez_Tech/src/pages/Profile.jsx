import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const ProfilePage = () => {
  const { user, logout } = useAuth();

  // 📝 Edit states track karne ke liye
  const [editSection, setEditSection] = useState({
    personal: false,
    email: false,
    phone: false,
  });

  // 📝 Form Data State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: 'male',
    email: '',
    phone: ''
  });

  // ⏳ Loading aur Status States
  const [isLoading, setIsLoading] = useState({
    personal: false,
    email: false,
    phone: false,
    image: false
  });
  const [message, setMessage] = useState({ type: '', text: '' }); // type: 'success' | 'error'

  // 🖼️ Profile Image State & Ref
  const [profileImage, setProfileImage] = useState(null); 
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      const nameParts = user.name ? user.name.split(' ') : [''];
      setFormData({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        gender: user.gender || 'male',
        email: user.email || '',
        phone: user.phone || ''
      });
      if (user.profilePic) setProfileImage(user.profilePic);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="w-10 h-10 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
    );
  }

  // --- Utility: Show Message ---
  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000); // 3 seconds baad hide
  };

  // --- Input handlers ---
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleEdit = (section) => {
    setEditSection({ ...editSection, [section]: !editSection[section] });
  };

  // --- 🔒 API Call Simulation & Validation ---
  const handleSave = async (section) => {
    // 1. Basic Validation
    if (section === 'personal' && (!formData.firstName.trim() || !formData.lastName.trim())) {
      showMessage("First Name and Last Name cannot be empty.", "error");
      return;
    }
    if (section === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      showMessage("Please enter a valid email address.", "error");
      return;
    }
    if (section === 'phone' && (formData.phone.length < 10 || !/^\d+$/.test(formData.phone))) {
       showMessage("Please enter a valid 10-digit phone number.", "error");
       return;
    }

    // 2. Start Loading
    setIsLoading({ ...isLoading, [section]: true });
    setMessage({ type: '', text: '' });

    try {
      // 🚀 REAL BACKEND KE LIYE: Yahan aap axios.put('/api/users/profile', data) chalayenge
      
      // Dummy API Delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log(`Saved ${section} data:`, formData);
      showMessage(`${section.charAt(0).toUpperCase() + section.slice(1)} information updated successfully!`);
      toggleEdit(section);
      
      // Yahan aap AuthContext ka update function bhi call kar sakte hain (e.g., updateUser(newData))
      
    } catch (error) {
      console.error(`Error saving ${section}:`, error);
      showMessage("Failed to update information. Please try again.", "error");
    } finally {
      setIsLoading({ ...isLoading, [section]: false });
    }
  };

  // --- Profile Image Handlers ---
  const handleImageClick = () => {
    fileInputRef.current.click(); 
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (e.g., max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        showMessage("File size exceeds 2MB limit.", "error");
        return;
      }

      setIsLoading({ ...isLoading, image: true });
      
      try {
        const imageUrl = URL.createObjectURL(file);
        setProfileImage(imageUrl);
        
        // 🚀 REAL BACKEND: Yahan FormData banakar axios.post se image upload hogi
        await new Promise(resolve => setTimeout(resolve, 1500)); // Dummy delay
        
        console.log("Image uploaded successfully:", file.name);
        showMessage("Profile picture updated successfully!");
      } catch (error) {
         showMessage("Failed to upload image.", "error");
      } finally {
        setIsLoading({ ...isLoading, image: false });
      }
    }
  };

  const handleRemoveImage = async () => {
     setIsLoading({ ...isLoading, image: true });
     try {
       // 🚀 REAL BACKEND API call to remove image
       await new Promise(resolve => setTimeout(resolve, 800));
       
       setProfileImage(null);
       if (fileInputRef.current) fileInputRef.current.value = ""; 
       showMessage("Profile picture removed.");
     } catch (error) {
        showMessage("Failed to remove image.", "error");
     } finally {
         setIsLoading({ ...isLoading, image: false });
     }
  };

  return (
    <div className="min-h-screen pt-6 pb-10 font-sans bg-gray-100">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        
        {/* Toast Message Display (Global for the page) */}
        {message.text && (
          <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded shadow-lg text-white font-medium transition-all duration-300 ${message.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
            {message.text}
          </div>
        )}

        <div className="flex flex-col gap-4 md:flex-row">
          
          {/* ================= LEFT SIDEBAR (No major changes here) ================= */}
          <div className="w-full md:w-[300px] flex-shrink-0 flex flex-col gap-4">
             {/* ... (Aapka purana Sidebar code yahan rahega, same as before) ... */}
             <div className="flex items-center gap-4 p-4 bg-white rounded-sm shadow-sm">
              <div className="flex items-center justify-center w-12 h-12 overflow-hidden text-xl font-bold text-blue-600 bg-blue-100 rounded-full shrink-0">
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="object-cover w-full h-full" />
                ) : (
                  user.name?.charAt(0).toUpperCase() || 'U'
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500">Hello,</p>
                <h2 className="text-base font-bold text-gray-800">{user.name}</h2>
              </div>
            </div>

            <div className="pb-4 bg-white rounded-sm shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 hover:text-blue-600 hover:bg-gray-50">
                <Link to="/orders" className="flex items-center justify-between w-full font-semibold text-gray-500">
                  <div className="flex items-center gap-4">
                    <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                    <span>MY ORDERS</span>
                  </div>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </Link>
              </div>

              <div className="px-5 pt-4 pb-2 border-b border-gray-100">
                <div className="flex items-center gap-4 mb-3 font-semibold text-gray-500">
                  <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  <span>ACCOUNT SETTINGS</span>
                </div>
                <div className="flex flex-col pb-2 space-y-3 text-sm pl-9">
                  <Link to="/profile" className="py-2 font-medium text-blue-600 border-l-4 border-blue-600 bg-blue-50 -ml-9 pl-9">Profile Information</Link>
                  <Link to="/addresses" className="text-gray-600 transition-colors hover:text-blue-600">Manage Addresses</Link>
                  <Link to="/pan-card" className="text-gray-600 transition-colors hover:text-blue-600">PAN Card Information</Link>
                </div>
              </div>

              <div className="px-5 py-4 font-semibold text-gray-500 cursor-pointer hover:text-blue-600 hover:bg-gray-50" onClick={logout}>
                <div className="flex items-center gap-4">
                  <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  <span>Logout</span>
                </div>
              </div>
            </div>
          </div>

          {/* ================= RIGHT MAIN CONTENT ================= */}
          <div className="flex-1 p-6 bg-white rounded-sm shadow-sm md:p-8">
            
            {/* --- 0. Profile Image Section --- */}
            <div className="flex items-center gap-6 mb-8">
              <div className="relative flex items-center justify-center w-24 h-24 overflow-hidden border-2 border-blue-100 rounded-full shrink-0 bg-blue-50">
                {isLoading.image ? (
                   <div className="w-8 h-8 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                ) : profileImage ? (
                  <img src={profileImage} alt="Profile" className="object-cover w-full h-full" />
                ) : (
                  <span className="text-3xl font-bold text-blue-600">{user.name?.charAt(0).toUpperCase() || 'U'}</span>
                )}
              </div>
              
              <div className="flex flex-col gap-3">
                <input 
                  type="file" 
                  accept="image/jpeg, image/png" 
                  ref={fileInputRef} 
                  onChange={handleImageChange} 
                  className="hidden" 
                />
                
                <div className="flex gap-3">
                  <button 
                    onClick={handleImageClick} 
                    disabled={isLoading.image}
                    className="px-5 py-2 text-sm font-semibold text-white transition-colors bg-blue-600 rounded-sm shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {profileImage ? 'Change Photo' : 'Upload Photo'}
                  </button>
                  
                  {profileImage && (
                    <button 
                      onClick={handleRemoveImage} 
                      disabled={isLoading.image}
                      className="px-5 py-2 text-sm font-semibold text-red-600 transition-colors border border-red-200 rounded-sm hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500">Max file size: 2MB. Format: JPG, PNG.</p>
              </div>
            </div>

            <hr className="mb-8 border-gray-100" />

            {/* 1. Personal Information */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Personal Information</h3>
                {!editSection.personal && (
                  <button onClick={() => toggleEdit('personal')} className="text-sm font-medium text-blue-600 hover:text-blue-800">Edit</button>
                )}
              </div>

              <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:gap-6">
                <div className="flex-1">
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} disabled={!editSection.personal} className={`w-full px-4 py-2.5 outline-none rounded-sm transition-colors ${editSection.personal ? 'border border-blue-500 bg-white text-black' : 'bg-gray-50 text-gray-500 cursor-not-allowed border border-gray-200'}`} placeholder="First Name" />
                </div>
                <div className="flex-1">
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} disabled={!editSection.personal} className={`w-full px-4 py-2.5 outline-none rounded-sm transition-colors ${editSection.personal ? 'border border-blue-500 bg-white text-black' : 'bg-gray-50 text-gray-500 cursor-not-allowed border border-gray-200'}`} placeholder="Last Name" />
                </div>
              </div>

              <div className="mb-4">
                <p className="mb-2 text-sm text-gray-500">Your Gender</p>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="gender" value="male" checked={formData.gender === 'male'} onChange={handleChange} disabled={!editSection.personal} className="w-4 h-4 text-blue-600 cursor-pointer" />
                    <span className={!editSection.personal ? 'text-gray-500' : 'text-gray-800'}>Male</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="gender" value="female" checked={formData.gender === 'female'} onChange={handleChange} disabled={!editSection.personal} className="w-4 h-4 text-blue-600 cursor-pointer" />
                    <span className={!editSection.personal ? 'text-gray-500' : 'text-gray-800'}>Female</span>
                  </label>
                </div>
              </div>

              {editSection.personal && (
                <div className="flex gap-4 mt-4">
                  <button 
                    onClick={() => handleSave('personal')} 
                    disabled={isLoading.personal}
                    className="px-8 py-2.5 font-semibold text-white bg-blue-600 rounded-sm hover:bg-blue-700 shadow-md flex items-center justify-center min-w-[120px]"
                  >
                    {isLoading.personal ? <span className="w-5 h-5 border-2 border-white rounded-full border-t-transparent animate-spin"></span> : 'SAVE'}
                  </button>
                  <button onClick={() => toggleEdit('personal')} disabled={isLoading.personal} className="px-8 py-2.5 font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50">Cancel</button>
                </div>
              )}
            </div>

            <hr className="mb-8 border-gray-100" />

            {/* 2. Email Address */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Email Address</h3>
                {!editSection.email && (
                  <button onClick={() => toggleEdit('email')} className="text-sm font-medium text-blue-600 hover:text-blue-800">Edit</button>
                )}
              </div>
              <div className="w-full sm:w-1/2">
                <input type="email" name="email" value={formData.email} onChange={handleChange} disabled={!editSection.email} className={`w-full px-4 py-2.5 outline-none rounded-sm transition-colors ${editSection.email ? 'border border-blue-500 bg-white text-black' : 'bg-gray-50 text-gray-500 cursor-not-allowed border border-gray-200'}`} />
              </div>
              {editSection.email && (
                <div className="flex gap-4 mt-4">
                  <button 
                    onClick={() => handleSave('email')} 
                    disabled={isLoading.email}
                    className="px-8 py-2.5 font-semibold text-white bg-blue-600 rounded-sm hover:bg-blue-700 shadow-md flex items-center justify-center min-w-[120px]"
                  >
                     {isLoading.email ? <span className="w-5 h-5 border-2 border-white rounded-full border-t-transparent animate-spin"></span> : 'SAVE'}
                  </button>
                  <button onClick={() => toggleEdit('email')} disabled={isLoading.email} className="px-8 py-2.5 font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50">Cancel</button>
                </div>
              )}
            </div>

            <hr className="mb-8 border-gray-100" />

            {/* 3. Mobile Number */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Mobile Number</h3>
                {!editSection.phone && (
                  <button onClick={() => toggleEdit('phone')} className="text-sm font-medium text-blue-600 hover:text-blue-800">Edit</button>
                )}
              </div>
              <div className="w-full sm:w-1/2">
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} disabled={!editSection.phone} maxLength="10" className={`w-full px-4 py-2.5 outline-none rounded-sm transition-colors ${editSection.phone ? 'border border-blue-500 bg-white text-black' : 'bg-gray-50 text-gray-500 cursor-not-allowed border border-gray-200'}`} placeholder="Enter Mobile Number" />
              </div>
              {editSection.phone && (
                <div className="flex gap-4 mt-4">
                   <button 
                    onClick={() => handleSave('phone')} 
                    disabled={isLoading.phone}
                    className="px-8 py-2.5 font-semibold text-white bg-blue-600 rounded-sm hover:bg-blue-700 shadow-md flex items-center justify-center min-w-[120px]"
                  >
                     {isLoading.phone ? <span className="w-5 h-5 border-2 border-white rounded-full border-t-transparent animate-spin"></span> : 'SAVE'}
                  </button>
                  <button onClick={() => toggleEdit('phone')} disabled={isLoading.phone} className="px-8 py-2.5 font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50">Cancel</button>
                </div>
              )}
            </div>

            <hr className="mb-8 border-gray-100" />

            {/* 4. FAQs Section */}
            <div>
               {/* ... (FAQs wahi same rahenge) ... */}
              <h3 className="mb-6 text-lg font-semibold text-gray-800">FAQs</h3>
              <div className="mb-6">
                <h4 className="mb-2 text-sm font-semibold text-gray-800">What happens when I update my email address (or mobile number)?</h4>
                <p className="text-sm leading-relaxed text-gray-600">Your login email id (or mobile number) changes, likewise. You'll receive all your account related communication on your updated email address (or mobile number).</p>
              </div>
              <div className="mb-6">
                <h4 className="mb-2 text-sm font-semibold text-gray-800">When will my account be updated with the new email address (or mobile number)?</h4>
                <p className="text-sm leading-relaxed text-gray-600">It happens as soon as you confirm the verification code sent to your email (or mobile) and save the changes.</p>
              </div>
              <div>
                <h4 className="mb-2 text-sm font-semibold text-gray-800">What happens to my existing account when I update my email address (or mobile number)?</h4>
                <p className="text-sm leading-relaxed text-gray-600">Updating your email address (or mobile number) doesn't invalidate your account. Your account remains fully functional. You'll continue seeing your Order history, saved information and personal details.</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
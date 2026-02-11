import User from '../models/User.js';
import bcrypt from 'bcryptjs';

// ✅ TEST FUNCTION (No auth needed)
export const testGetProfile = async (req, res) => {
  try {
    console.log('✅ Test profile route called');
    
    const user = await User.findOne().select('-password -__v');
    
    if (user) {
      return res.status(200).json({
        success: true,
        message: 'Found user in database',
        user
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'No users in database. Register first.',
      user: null
    });
    
  } catch (error) {
    console.error('Test profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getProfile = async (req, res) => {
  try {
    console.log('📋 Get Profile - req.user exists?', !!req.user);
    
    let userId;
    
    // Check if req.user exists (from middleware)
    if (req.user && req.user._id) {
      userId = req.user._id;
      console.log('Using req.user._id:', userId);
    } else {
      // For testing: get first user
      console.log('No req.user, getting first user from DB');
      const firstUser = await User.findOne().select('_id');
      if (firstUser) {
        userId = firstUser._id;
      } else {
        return res.status(404).json({
          success: false,
          message: 'No users found. Please register first.'
        });
      }
    }
    
    const user = await User.findById(userId).select('-password -__v');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile retrieved',
      user
    });
    
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const { name, phone, address, userId } = req.body;
    
    let targetUserId;
    
    // Determine which user to update
    if (req.user && req.user._id) {
      targetUserId = req.user._id;
    } else if (userId) {
      targetUserId = userId;
    } else {
      // Get first user for testing
      const firstUser = await User.findOne().select('_id');
      if (!firstUser) {
        return res.status(404).json({
          success: false,
          message: 'No users found'
        });
      }
      targetUserId = firstUser._id;
    }
    
    const updateData = {};
    
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    
    if (address) {
      try {
        const parsedAddress = typeof address === 'string' 
          ? JSON.parse(address) 
          : address;
        updateData.address = parsedAddress;
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: 'Invalid address format'
        });
      }
    }
    
    if (req.file) {
      updateData.profileImage = `/uploads/${req.file.filename}`;
    }

    const user = await User.findByIdAndUpdate(
      targetUserId,
      { $set: updateData },
      { 
        new: true,
        runValidators: true 
      }
    ).select('-password -__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
    
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Export other functions as-is or comment out for now
export const uploadProfilePhoto = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Upload photo endpoint (not implemented yet)'
  });
};

export const changePassword = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Change password endpoint (not implemented yet)'
  });
};

export default {
  testGetProfile,
  getProfile,
  updateProfile,
  uploadProfilePhoto,
  changePassword
};
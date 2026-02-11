import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please enter your name']
  },
  email: {
    type: String,
    required: [true, 'Please enter your email'],
    unique: true,
    lowercase: true
  },
 password: {
  type: String,
  required: true,
  minlength: 6,
  select: false
 },
 resetPasswordToken: {
  type: String
 },
 resetPasswordExpire: {
  type: Date
 },
  phone: {
    type: String,
    default: ''
  },
  address: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    zipCode: { type: String, default: '' },
    country: { type: String, default: 'India' }
  },
  profileImage: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true // ✅ This handles createdAt and updatedAt automatically
});

// ❌ REMOVE THIS (it's redundant with timestamps: true)
// userSchema.pre('save', function(next) {
//   this.updatedAt = Date.now();
//   next();
// });

const User = mongoose.model('User', userSchema);
export default User;
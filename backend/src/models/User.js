import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const savedAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    locality: { type: String, default: "", trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, default: "", trim: true },
    landmark: { type: String, default: "", trim: true },
    altPhone: { type: String, default: "", trim: true },
    type: { type: String, enum: ["HOME", "WORK", "OTHER"], default: "HOME" },
    label: { type: String, default: "", trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Please enter your name"], trim: true },
    email: { 
      type: String, 
      required: [true, "Please enter your email"], 
      unique: true, 
      lowercase: true, 
      trim: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Please fill a valid email address"]
    },
    password: { type: String, required: [true, "Please enter your password"], minlength: 6, select: false },
    role: { type: String, enum: ["user", "admin", "subadmin"], default: "user" },
    userId: { type: String, unique: true, sparse: true, index: true, trim: true },
    phone: { type: String, unique: true, sparse: true, trim: true },
    address: {
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      zipCode: { type: String, default: "" },
      country: { type: String, default: "India" },
    },
    addresses: {
      type: [savedAddressSchema],
      default: [],
    },
    profileImage: { type: String, default: "" },
    isEmailVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    blockedReason: { type: String, default: "" },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true }
);

/* ================= MIDDLEWARE: Password Hashing ================= */
// ⚡ Humne 'next' hata diya hai, Async/Await khud handle karega
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

/* ================= METHOD: Compare Password ================= */
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;

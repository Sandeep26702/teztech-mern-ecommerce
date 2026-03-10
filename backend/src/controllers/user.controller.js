import User from "../models/User.js";
import bcrypt from "bcryptjs";

const PHONE_REGEX = /^\d{10}$/;
const PINCODE_REGEX = /^\d{6}$/;

const toTrimmed = (value) => String(value || "").trim();
const buildAddressText = (addr) =>
  [toTrimmed(addr.address), toTrimmed(addr.locality), toTrimmed(addr.city), toTrimmed(addr.state), toTrimmed(addr.pincode)]
    .filter(Boolean)
    .join(", ");

const normalizeAddress = (payload = {}) => {
  const fullName = toTrimmed(payload.fullName || payload.name);
  const phone = toTrimmed(payload.phone);
  const pincode = toTrimmed(payload.pincode);
  const locality = toTrimmed(payload.locality);
  const address = toTrimmed(payload.address);
  const city = toTrimmed(payload.city);
  const state = toTrimmed(payload.state);
  const landmark = toTrimmed(payload.landmark);
  const altPhone = toTrimmed(payload.altPhone);
  const type = ["HOME", "WORK", "OTHER"].includes(payload.type) ? payload.type : "HOME";
  const label = toTrimmed(payload.label);

  return { fullName, phone, pincode, locality, address, city, state, landmark, altPhone, type, label };
};

const validateAddress = (address) => {
  if (!address.fullName || address.fullName.length < 2) return "Full name is required";
  if (!PHONE_REGEX.test(address.phone)) return "Phone must be 10 digits";
  if (!address.address || address.address.length < 5) return "Address is required";
  if (!address.city) return "City is required";
  if (!PINCODE_REGEX.test(address.pincode)) return "Pincode must be 6 digits";
  if (address.altPhone && !PHONE_REGEX.test(address.altPhone)) return "Alternate phone must be 10 digits";
  return null;
};

const syncLegacyAddressFromDefault = (userDoc) => {
  const defaultAddress =
    (userDoc.addresses || []).find((item) => item.isDefault) || (userDoc.addresses || [])[0] || null;

  if (!defaultAddress) {
    userDoc.address = {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "India",
    };
    return;
  }

  userDoc.address = {
    street: buildAddressText(defaultAddress),
    city: defaultAddress.city || "",
    state: defaultAddress.state || "",
    zipCode: defaultAddress.pincode || "",
    country: "India",
  };
};

/* ============================================================
    1. GET LOGGED IN USER PROFILE
============================================================ */
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password -__v");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ============================================================
    2. UPDATE PROFILE
============================================================ */
export const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const updateData = {};

    if (name !== undefined) {
      const cleanedName = toTrimmed(name);
      if (cleanedName.length < 2) {
        return res.status(400).json({ success: false, message: "Name must be at least 2 characters" });
      }
      updateData.name = cleanedName;
    }

    if (phone !== undefined) {
      const cleanedPhone = toTrimmed(phone);
      if (!PHONE_REGEX.test(cleanedPhone)) {
        return res.status(400).json({ success: false, message: "Phone must be 10 digits" });
      }
      updateData.phone = cleanedPhone;
      updateData.userId = cleanedPhone;
    }

    if (req.file) {
      updateData.profileImage = `/uploads/${req.file.filename}`;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password -__v");

    res.status(200).json({ success: true, message: "Profile updated successfully", user });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ success: false, message: "Mobile number already exists" });
    }
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ============================================================
    3. CHANGE PASSWORD
============================================================ */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select("+password");

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: "Current password incorrect" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ============================================================
    4. USER ADDRESS BOOK
============================================================ */
export const getUserAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("addresses");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.status(200).json({ success: true, addresses: user.addresses || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const addUserAddress = async (req, res) => {
  try {
    const normalized = normalizeAddress(req.body);
    const validationError = validateAddress(normalized);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const shouldSetDefault = !user.addresses?.length || Boolean(req.body.isDefault);
    const nextAddress = { ...normalized, isDefault: shouldSetDefault };

    if (shouldSetDefault) {
      user.addresses = (user.addresses || []).map((addr) => ({ ...addr.toObject(), isDefault: false }));
    }

    user.addresses.push(nextAddress);
    syncLegacyAddressFromDefault(user);
    await user.save();

    res.status(201).json({ success: true, addresses: user.addresses, message: "Address added" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateUserAddress = async (req, res) => {
  try {
    const normalized = normalizeAddress(req.body);
    const validationError = validateAddress(normalized);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const target = user.addresses.id(req.params.addressId);
    if (!target) return res.status(404).json({ success: false, message: "Address not found" });

    const preserveDefault = target.isDefault;
    Object.assign(target, normalized, { isDefault: preserveDefault });
    syncLegacyAddressFromDefault(user);
    await user.save();

    res.status(200).json({ success: true, addresses: user.addresses, message: "Address updated" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteUserAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const target = user.addresses.id(req.params.addressId);
    if (!target) return res.status(404).json({ success: false, message: "Address not found" });

    const wasDefault = target.isDefault;
    target.deleteOne();

    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    syncLegacyAddressFromDefault(user);
    await user.save();
    res.status(200).json({ success: true, addresses: user.addresses, message: "Address removed" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const setDefaultAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const targetId = String(req.params.addressId);
    let found = false;
    user.addresses = (user.addresses || []).map((addr) => {
      const isDefault = String(addr._id) === targetId;
      if (isDefault) found = true;
      return { ...addr.toObject(), isDefault };
    });

    if (!found) return res.status(404).json({ success: false, message: "Address not found" });

    syncLegacyAddressFromDefault(user);
    await user.save();
    res.status(200).json({ success: true, addresses: user.addresses, message: "Default address updated" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

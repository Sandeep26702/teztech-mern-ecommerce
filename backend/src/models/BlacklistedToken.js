import mongoose from "mongoose";

const blacklistedTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true
  }
});

// 🔥 Auto-delete token after expiry
blacklistedTokenSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

const BlacklistedToken = mongoose.model(
  "BlacklistedToken",
  blacklistedTokenSchema
);

export default BlacklistedToken;

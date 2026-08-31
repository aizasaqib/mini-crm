const mongoose = require("mongoose");
const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    
    otp: {
      type: String,
      default: null
    },
    otpExpiresAt: {
      type: Date,
      default: null
    },
    otpLastSentAt: {
      type: Date,
      default: null
    },
    otpRequestCount: {
      type: Number,
      default: 0
    },
    otpCooldownUntil: {
  type: Date,
  default: null,
},
otpPurpose: {
  type: String,
  enum: ["signup", "password-reset", null],
  default: null
},

otpVerified: {
  type: Boolean,
  default: false
}
  },
  {
    timestamps: true
  }
);
const User = mongoose.model("User", userSchema);

module.exports = User;
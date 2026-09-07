const User = require("../models/User");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const jwt = require("jsonwebtoken");

// ======================================================
// REGISTER USER
// ======================================================

const registerUser = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      password,
      confirmPassword,
    } = req.body;

    if (
      !fullName ||
      !email ||
      !phone ||
      !password ||
      !confirmPassword
    ) {
      return res.status(400).json({
        message: "Please fill in all fields",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match",
      });
    }

    const existingUser = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Email is already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = crypto.randomInt(100000, 1000000).toString();

    // OTP expires in 10 minutes
    const otpExpiresAt = new Date(
      Date.now() + 10 * 60 * 1000
    );

    const user = new User({
      fullName,
      email: email.trim().toLowerCase(),
      phone,
      password: hashedPassword,

      otp,
      otpExpiresAt,

      otpLastSentAt: new Date(),
      otpRequestCount: 1,

      otpPurpose: "signup",
      otpVerified: false,

      isVerified: false,
    });

    await user.save();

    await sendEmail(
      "Mini-crm Account Verification",
      email,
      otp,
      fullName
    );

    return res.status(201).json({
      message:
        "User registered successfully. OTP has been sent to your email.",
    });

  } catch (error) {
    console.error("Error registering user:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// ======================================================
// VERIFY OTP
// ======================================================

const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      message: "Please provide email and OTP",
    });
  }

  try {
    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (!user.otp) {
      return res.status(400).json({
        message: "No OTP found. Please request a new OTP.",
      });
    }

    // Check OTP
    if (user.otp !== otp) {
      return res.status(400).json({
        message: "Invalid OTP. Please try again.",
      });
    }

    // Check expiration
    if (user.otpExpiresAt < new Date()) {
      return res.status(400).json({
        message: "OTP has expired. Please request a new OTP.",
      });
    }

    // OTP is valid
    user.otpVerified = true;

    // If OTP is for signup
    if (user.otpPurpose === "signup") {
      user.isVerified = true;
    }

    // Clear OTP
    user.otp = null;
    user.otpExpiresAt = null;

    await user.save();

    return res.status(200).json({
      message: "OTP verified successfully",
      purpose: user.otpPurpose,
    });

  } catch (error) {
    console.error("Error verifying OTP:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// ======================================================
// FORGOT PASSWORD / SEND OTP
// ======================================================

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      message: "Please provide an email address",
    });
  }

  try {
    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const now = new Date();

    // ==================================================
    // CHECK 15-MINUTE COOLDOWN
    // ==================================================

    if (
      user.otpCooldownUntil &&
      user.otpCooldownUntil > now
    ) {
      const remainingCooldown = Math.ceil(
        (user.otpCooldownUntil - now) / 1000
      );

      return res.status(429).json({
        message: `Please wait ${remainingCooldown} seconds before requesting a new OTP.`,
        remainingCooldown,
      });
    }

    // ==================================================
    // RESET EXPIRED COOLDOWN
    // ==================================================

    if (
      user.otpCooldownUntil &&
      user.otpCooldownUntil <= now
    ) {
      user.otpRequestCount = 0;
      user.otpCooldownUntil = null;

      await user.save();
    }

    // ==================================================
    // CHECK 60-SECOND COOLDOWN
    // ==================================================

    if (user.otpLastSentAt) {
      const elapsedTime = now - user.otpLastSentAt;

      if (elapsedTime < 60 * 1000) {
        const remainingCooldown = Math.ceil(
          (60 * 1000 - elapsedTime) / 1000
        );

        return res.status(429).json({
          message: `Please wait ${remainingCooldown} seconds before requesting a new OTP.`,
          remainingCooldown,
        });
      }
    }

    // ==================================================
    // CHECK 5 ATTEMPT LIMIT
    // ==================================================

    if (user.otpRequestCount >= 5) {
      user.otpCooldownUntil = new Date(
        now.getTime() + 10 * 60 * 1000
      );

      await user.save();

      return res.status(429).json({
        message:
          "You have reached the maximum number of OTP requests. Please try again in 10 minutes.",
        remainingCooldown: 10 * 60,
      });
    }

    // ==================================================
    // GENERATE OTP
    // ==================================================

    const otp = crypto
      .randomInt(100000, 1000000)
      .toString();

    // ==================================================
    // OTP EXPIRATION
    // ==================================================

    const otpExpiresAt = new Date(
      Date.now() + 15 * 60 * 1000
    );

    // ==================================================
    // UPDATE USER
    // ==================================================

    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;
    user.otpLastSentAt = now;
    user.otpRequestCount += 1;

    user.otpPurpose = "password-reset";
    user.otpVerified = false;

    await user.save();

    // Send password reset OTP
    await sendEmail(
      "Mini-crm Password Reset",
      user.email,
      otp,
      user.fullName
    );

    return res.status(200).json({
      message: "OTP has been sent to your email.",
    });

  } catch (error) {
    console.error("Error generating OTP:", error);

    return res.status(500).json({
      message: "Unable to process your request",
    });
  }
};

// ======================================================
// LOGIN USER
// ======================================================

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate input
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // 2. Find user
    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // 3. Compare password
    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // 4. Check email verification
    if (!user.isVerified) {
      return res.status(403).json({
        message: "Please verify your email first",
        requiresVerification: true,
        email: user.email,
      });
    }

    // 5. Generate JWT
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        token,
        email: user.email,
        fullName: user.fullName,
      },
    });

  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// ======================================================
// RESET PASSWORD
// ======================================================

const resetPassword = async (req, res) => {
  try {
    const {
      email,
      password,
      confirmPassword,
    } = req.body;

    // Validate input
    if (!email || !password || !confirmPassword) {
      return res.status(400).json({
        message: "Please fill in all fields",
      });
    }

    // Check password match
    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match",
      });
    }

    // Find user
    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Check OTP verification
    if (
      user.otpPurpose !== "password-reset" ||
      user.otpVerified !== true
    ) {
      return res.status(403).json({
        message:
          "Please verify the password reset OTP first.",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    // Update password
    user.password = hashedPassword;

    // Clear reset session
    user.otpVerified = false;
    user.otpPurpose = null;

    await user.save();

    return res.status(200).json({
      message: "Password reset successfully.",
    });

  } catch (error) {
    console.error("Reset password error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// ======================================================
// EXPORT
// ======================================================

module.exports = {
  registerUser,
  verifyOtp,
  forgotPassword,
  loginUser,
  resetPassword,
};
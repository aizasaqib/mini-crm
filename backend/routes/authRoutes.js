const express = require("express");
const router = express.Router();
const { registerUser } = require("../controllers/authController");
const { verifyOtp } = require("../controllers/authController");
const { forgotPassword} = require("../controllers/authController");
const {loginUser} = require("../controllers/authController");
const {resetPassword} = require("../controllers/authController");

router.post("/register", registerUser);
router.post("/verify-otp", verifyOtp);
router.post("/forgot-password", forgotPassword);
router.post("/login", loginUser);
router.post("/reset-password", resetPassword);


module.exports = router;
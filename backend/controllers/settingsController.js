const User = require('../models/User');
const bcrypt = require('bcryptjs');

// GET /api/profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('fullName email phone createdAt');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/profile  — update name + phone
exports.updateProfile = async (req, res) => {
  try {
    const { fullName, phone } = req.body;
    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ message: 'Full name is required' });
    }
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { fullName: fullName.trim(), phone: (phone || '').trim() },
      { new: true, runValidators: true }
    ).select('fullName email phone');

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({ message: 'Profile updated successfully', user });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// PUT /api/profile/password  — change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'All password fields are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

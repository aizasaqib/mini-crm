const Activity = require('../models/Activity');

// Create a new activity
exports.createActivity = async (req, res) => {
  try {
    const activity = new Activity(req.body);
    const savedActivity = await activity.save();
    res.status(201).json(savedActivity);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all activities (newest first)
exports.getActivities = async (req, res) => {
  try {
    const activities = await Activity.find().sort({ createdAt: -1 });
    res.status(200).json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single activity by ID
exports.getActivityById = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ message: 'Activity not found' });
    res.status(200).json(activity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update an activity
exports.updateActivity = async (req, res) => {
  try {
    const updatedActivity = await Activity.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedActivity) return res.status(404).json({ message: 'Activity not found' });
    res.status(200).json(updatedActivity);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete an activity
exports.deleteActivity = async (req, res) => {
  try {
    const deletedActivity = await Activity.findByIdAndDelete(req.params.id);
    if (!deletedActivity) return res.status(404).json({ message: 'Activity not found' });
    res.status(200).json({ message: 'Activity deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

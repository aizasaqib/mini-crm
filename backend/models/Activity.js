const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Call', 'Email', 'Meeting', 'Note', 'Follow-up'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  contactName: {
    type: String,
    trim: true,
    default: ''
  },
  date: {
    type: Date,
    default: Date.now
  },
  outcome: {
    type: String,
    enum: ['Positive', 'Neutral', 'Negative', ''],
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('Activity', activitySchema);

const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  value: {
    type: Number,
    required: true,
    min: 0
  },
  previousValue: {
    type: Number,
    min: 0,
    default: null
  },
  stage: {
    type: String,
    enum: ['Prospecting', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'],
    default: 'Prospecting'
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  }
}, { timestamps: true });

module.exports = mongoose.model('Deal', dealSchema);

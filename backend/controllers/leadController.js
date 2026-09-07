const Lead = require('../models/Lead');

exports.createLead = async (req, res) => {
  try {
    const leadData = { ...req.body };
    if (leadData.status === 'Negotiation' && !leadData.negotiationDate) {
      return res.status(400).json({ message: 'Negotiation date and time are required' });
    }
    if (leadData.status !== 'Negotiation') delete leadData.negotiationDate;

    const lead = new Lead(leadData);
    const savedLead = await lead.save();
    res.status(201).json(savedLead);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getLeads = async (req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 });
    res.status(200).json(leads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getLeadById = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    res.status(200).json(lead);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateLead = async (req, res) => {
  try {
    const leadData = { ...req.body };
    if (leadData.status === 'Negotiation' && !leadData.negotiationDate) {
      return res.status(400).json({ message: 'Negotiation date and time are required' });
    }
    if (leadData.status !== 'Negotiation') delete leadData.negotiationDate;

    const updatedLead = await Lead.findByIdAndUpdate(
      req.params.id,
      leadData,
      { new: true, runValidators: true }
    );
    if (!updatedLead) return res.status(404).json({ message: 'Lead not found' });
    res.status(200).json(updatedLead);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteLead = async (req, res) => {
  try {
    const deletedLead = await Lead.findByIdAndDelete(req.params.id);
    if (!deletedLead) return res.status(404).json({ message: 'Lead not found' });
    res.status(200).json({ message: 'Lead deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

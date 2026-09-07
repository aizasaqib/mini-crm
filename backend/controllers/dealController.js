const Deal = require('../models/Deal');

exports.createDeal = async (req, res) => {
  try {
    const deal = new Deal(req.body);
    const savedDeal = await deal.save();
    res.status(201).json(savedDeal);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getDeals = async (req, res) => {
  try {
    const deals = await Deal.find().populate('customer', 'name email').sort({ createdAt: -1 });
    res.status(200).json(deals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDealById = async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id).populate('customer', 'name email');
    if (!deal) return res.status(404).json({ message: 'Deal not found' });
    res.status(200).json(deal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateDeal = async (req, res) => {
  try {
    const existingDeal = await Deal.findById(req.params.id);
    if (!existingDeal) return res.status(404).json({ message: 'Deal not found' });

    const updateData = { ...req.body };
    if (updateData.value !== undefined && Number(updateData.value) !== existingDeal.value) {
      updateData.previousValue = existingDeal.value;
    }

    const updatedDeal = await Deal.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('customer', 'name email');
    res.status(200).json(updatedDeal);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteDeal = async (req, res) => {
  try {
    const deletedDeal = await Deal.findByIdAndDelete(req.params.id);
    if (!deletedDeal) return res.status(404).json({ message: 'Deal not found' });
    res.status(200).json({ message: 'Deal deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

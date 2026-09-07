const Customer = require('../models/Customer');
const Purchase = require('../models/Purchase');

// Create a new customer
exports.createCustomer = async (req, res) => {
  try {
    const customer = new Customer(req.body);
    const savedCustomer = await customer.save();
    res.status(201).json(savedCustomer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all customers
exports.getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 }).lean();
    const purchases = await Purchase.find({ customer: { $in: customers.map(customer => customer._id) } })
      .sort({ createdAt: -1 })
      .lean();
    const purchasesByCustomer = purchases.reduce((grouped, purchase) => {
      const customerId = purchase.customer.toString();
      if (!grouped[customerId]) grouped[customerId] = [];
      grouped[customerId].push(purchase);
      return grouped;
    }, {});

    customers.forEach(customer => {
      customer.purchases = purchasesByCustomer[customer._id.toString()] || [];
      customer.balance = customer.purchases.reduce((total, purchase) => total + purchase.amount, 0);
    });
    res.status(200).json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCustomerPurchases = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).select('_id');
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    const purchases = await Purchase.find({ customer: customer._id }).sort({ createdAt: -1 });
    res.status(200).json(purchases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createCustomerPurchase = async (req, res) => {
  try {
    const { title, amount } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ message: 'Purchase title is required' });
    if (amount === undefined || amount === '' || Number.isNaN(Number(amount)) || Number(amount) < 0) {
      return res.status(400).json({ message: 'A valid purchase amount is required' });
    }

    const customer = await Customer.findById(req.params.id).select('_id');
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const purchase = await Purchase.create({
      customer: customer._id,
      title: title.trim(),
      amount: Number(amount)
    });
    res.status(201).json(purchase);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get a single customer
exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.status(200).json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a customer
exports.updateCustomer = async (req, res) => {
  try {
    const updatedCustomer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedCustomer) return res.status(404).json({ message: 'Customer not found' });
    res.status(200).json(updatedCustomer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a customer
exports.deleteCustomer = async (req, res) => {
  try {
    const deletedCustomer = await Customer.findByIdAndDelete(req.params.id);
    if (!deletedCustomer) return res.status(404).json({ message: 'Customer not found' });
    res.status(200).json({ message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

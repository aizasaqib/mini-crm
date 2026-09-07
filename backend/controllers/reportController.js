const Customer = require('../models/Customer');
const Lead     = require('../models/Lead');
const Deal     = require('../models/Deal');
const Task     = require('../models/Task');
const Activity = require('../models/Activity');

// GET /api/reports  — aggregates all key metrics in one request
exports.getReport = async (req, res) => {
  try {

    // ── Customers ──────────────────────────────────────────
    const totalCustomers  = await Customer.countDocuments();
    const activeCustomers = await Customer.countDocuments({ status: 'Active' });

    // ── Leads ──────────────────────────────────────────────
    const totalLeads  = await Lead.countDocuments();
    const leadsByStatus = await Lead.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // ── Deals ──────────────────────────────────────────────
    const totalDeals = await Deal.countDocuments();
    const wonDeals   = await Deal.countDocuments({ stage: 'Closed Won' });
    const lostDeals  = await Deal.countDocuments({ stage: 'Closed Lost' });

    const revenueAgg = await Deal.aggregate([
      { $match: { stage: 'Closed Won' } },
      { $group: { _id: null, total: { $sum: '$value' } } }
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    const pipelineAgg = await Deal.aggregate([
      { $match: { stage: { $nin: ['Closed Won', 'Closed Lost'] } } },
      { $group: { _id: null, total: { $sum: '$value' } } }
    ]);
    const pipelineValue = pipelineAgg[0]?.total || 0;

    const dealsByStage = await Deal.aggregate([
      { $group: { _id: '$stage', count: { $sum: 1 }, value: { $sum: '$value' } } },
      { $sort: { count: -1 } }
    ]);

    // ── Tasks ──────────────────────────────────────────────
    const totalTasks     = await Task.countDocuments();
    const completedTasks = await Task.countDocuments({ status: 'Completed' });
    const pendingTasks   = await Task.countDocuments({ status: 'Pending' });
    const inProgressTasks = await Task.countDocuments({ status: 'In Progress' });

    const tasksByPriority = await Task.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    // ── Activities ─────────────────────────────────────────
    const totalActivities = await Activity.countDocuments();
    const activitiesByType = await Activity.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // ── Compose response ───────────────────────────────────
    res.status(200).json({
      customers: {
        total:  totalCustomers,
        active: activeCustomers
      },
      leads: {
        total:    totalLeads,
        byStatus: leadsByStatus
      },
      deals: {
        total:         totalDeals,
        won:           wonDeals,
        lost:          lostDeals,
        revenue:       totalRevenue,
        pipelineValue: pipelineValue,
        byStage:       dealsByStage
      },
      tasks: {
        total:      totalTasks,
        completed:  completedTasks,
        pending:    pendingTasks,
        inProgress: inProgressTasks,
        byPriority: tasksByPriority
      },
      activities: {
        total:  totalActivities,
        byType: activitiesByType
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

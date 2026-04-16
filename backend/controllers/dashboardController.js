const User = require('../models/User');
const Lead = require('../models/Lead');
const Contact = require('../models/Contact');
const Account = require('../models/Account');
const Ticket = require('../models/Ticket');
const Task = require('../models/Task');
const Deal = require('../models/Deal');
const Project = require('../models/Project');
const CustomerActivity = require('../models/CustomerActivity');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
exports.getStats = async (req, res, next) => {
  try {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const [
      counts,
      recentLeads,
      recentUpdates,
      pipeline,
      wonRevenueData,
      leadsByStatus,
      leadsBySource,
       industryValue,
      activityTrend,
      stallingLeads,
      hotLeads,
      overdueTasksCount,
      activeDealsCount,
      projectsCount
    ] = await Promise.all([
      // 1. Basic Counts
      Promise.all([
        User.countDocuments(),
        Lead.countDocuments(),
        Contact.countDocuments(),
        Account.countDocuments(),
        Ticket.countDocuments({ status: 'open' }),
      ]),

      // 2. Recent Items
      Lead.find()
        .sort('-createdAt')
        .limit(5)
        .populate('assignedTo', 'name')
        .populate('account', 'name'),

      // 3. Recent Feed
      CustomerActivity.find()
        .sort('-createdAt')
        .limit(8)
        .populate('createdBy', 'name'),

      // 4. Global Pipeline Value
      Lead.aggregate([{ $group: { _id: null, total: { $sum: '$value' } } }]),

      // 5. Won Revenue (from Deals)
      Deal.aggregate([
        { $match: { stage: 'won' } },
        { $group: { _id: null, total: { $sum: '$value' } } }
      ]),

      // 6. Distribution Charts
      Lead.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Lead.aggregate([{ $group: { _id: '$source', count: { $sum: 1 } } }]),

      // 7. Industry Breakdown
      Lead.aggregate([
        { $lookup: { from: 'accounts', localField: 'account', foreignField: '_id', as: 'acc' } },
        { $unwind: '$acc' },
        { $group: { _id: '$acc.industry', totalValue: { $sum: '$value' } } },
        { $sort: { totalValue: -1 } },
        { $limit: 5 }
      ]),

      // 8. Activity Trend (Last 14 Days)
      CustomerActivity.aggregate([
        { $match: { activityDate: { $gte: fourteenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$activityDate' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // 9. Smart Insights: Stalling Leads (Value > 5000, no activity in 7 days)
      Lead.find({
        value: { $gt: 5000 },
        status: { $nin: ['won', 'lost'] },
        updatedAt: { $lte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }).limit(3).select('name value status'),

      // 10. Smart Insights: Hot Leads (Value > 15000)
      Lead.find({ value: { $gt: 15000 }, status: { $nin: ['won', 'lost'] } })
        .sort('-value')
        .limit(3)
        .select('name value'),

      // 11. Overdue Tasks
      Task.countDocuments({
        status: { $ne: 'completed' },
        dueDate: { $lt: new Date() }
      }),

      // 12. Active Deals Count
      Deal.countDocuments({ stage: { $nin: ['won', 'lost'] } }),

      // 13. Projects Count
      Project.countDocuments()
    ]);

    const [
      users, leads, contacts, accounts, openTickets
    ] = counts;

    res.json({
      success: true,
      data: {
        summary: { 
          users, 
          leads, 
          contacts, 
          accounts, 
          openTickets, 
          pendingTasks: overdueTasksCount, // Using overdue tasks as pending tasks for impact
          wonRevenue: wonRevenueData[0]?.total || 0,
          activeDeals: activeDealsCount,
          projects: projectsCount,
          pipelineValue: pipeline[0]?.total || 0 
        },
        recentLeads,
        recentUpdates,
        charts: {
          leadsByStatus,
          leadsBySource,
          industryValue,
          activityTrend
        },
        insights: {
          stallingLeads,
          hotLeads,
          overdueTasks: overdueTasksCount
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

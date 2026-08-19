import Report from '../models/Report.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { logEvent } from '../utils/logger.js';

// @desc    Submit a new report
// @route   POST /api/reports
export const createReport = async (req, res) => {
  try {
    const { targetType, targetId, reason } = req.body;
    const report = new Report({
      reporterId: req.user._id,
      targetType,
      targetId,
      reason
    });
    
    await report.save();
    await logEvent('moderation', 'report_submitted', req.user._id, targetId, { targetType, reason });
    
    // Notify Admins
    const admins = await User.find({ role: 'admin' });
    const adminNotifs = admins.map(admin => ({
      userId: admin._id,
      type: 'alert',
      message: `🚩 A new report was filed regarding a ${targetType}.`,
      link: '/admin/disputes'
    }));

    if (adminNotifs.length > 0) {
      const insertedNotifs = await Notification.insertMany(adminNotifs);
      const io = req.app.get('io');
      if (io) {
        insertedNotifs.forEach(notif => {
          io.to(notif.userId.toString()).emit('new_notification', notif);
        });
      }
    }

    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all reports
// @route   GET /api/reports
// @access  Admin
export const getReports = async (req, res) => {
  try {
    const reports = await Report.find({})
      .populate('reporterId', 'name email')
      .populate('targetId', 'title name') // Will attempt to populate title for Property, name for User
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update report status
// @route   PUT /api/reports/:id/status
// @access  Admin
export const updateReportStatus = async (req, res) => {
  try {
    const { status } = req.body; // 'Resolved' or 'Dismissed'
    const report = await Report.findById(req.params.id);
    
    if (!report) return res.status(404).json({ message: 'Report not found' });
    
    report.status = status;
    const updatedReport = await report.save();
    
    await logEvent('moderation', `report_${status.toLowerCase()}`, req.user._id, report._id, { targetId: report.targetId });
    
    // Notify the user who filed the report
    const io = req.app.get('io');
    if (io) {
      const userNotif = await Notification.create({
        userId: report.reporterId,
        type: 'alert',
        message: `🛡️ Your report regarding a ${report.targetType} has been marked as ${status}.`,
        link: '/'
      });
      io.to(report.reporterId.toString()).emit('new_notification', userNotif);
    }

    res.json(updatedReport);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

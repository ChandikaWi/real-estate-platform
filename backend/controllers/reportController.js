import Report from '../models/Report.js';
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
    
    res.json(updatedReport);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

import SystemLog from '../models/SystemLog.js';

// @desc    Get system logs with optional type filter
// @route   GET /api/logs
// @access  Admin only
export const getLogs = async (req, res) => {
  try {
    const { type } = req.query;
    let query = {};
    
    if (type && type !== 'all') {
      query.type = type;
    }

    const logs = await SystemLog.find(query)
      .populate('performedBy', 'name email role')
      .sort({ createdAt: -1 })
      .limit(500); // Prevent massive payloads, admin needs most recent

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch system logs' });
  }
};

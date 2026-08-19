import Settings from '../models/Settings.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { logEvent } from '../utils/logger.js';

// Helper to get or create settings singleton
const getOrCreateSettings = async () => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({
      aiValuationThreshold: 15,
      maintenanceMode: false
    });
  }
  return settings;
};

// @desc    Get platform settings (Public - used by frontend to check maintenance mode)
// @route   GET /api/settings
export const getSettings = async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update platform settings (Admin only)
// @route   PUT /api/settings
export const updateSettings = async (req, res) => {
  try {
    const { aiValuationThreshold, maintenanceMode } = req.body;
    let settings = await getOrCreateSettings();

    if (aiValuationThreshold !== undefined) settings.aiValuationThreshold = aiValuationThreshold;
    if (maintenanceMode !== undefined) {
      if (settings.maintenanceMode !== maintenanceMode) {
        // Log the maintenance mode toggle
        await logEvent('system', 'maintenance_mode_toggled', req.user._id, req.user._id, { 
          enabled: maintenanceMode 
        });
      }
      settings.maintenanceMode = maintenanceMode;
    }

    const updatedSettings = await settings.save();
    
    // Notify Admins
    const otherAdmins = await User.find({ role: 'admin', _id: { $ne: req.user._id } });
    let adminNotifs = [];

    if (maintenanceMode !== undefined) {
      adminNotifs = otherAdmins.map(admin => ({
        userId: admin._id,
        type: 'system',
        message: `⚙️ Platform Maintenance Mode has been turned ${maintenanceMode ? 'ON' : 'OFF'} by ${req.user.name}.`,
        link: '/admin/settings'
      }));
    } else if (aiValuationThreshold !== undefined) {
      adminNotifs = otherAdmins.map(admin => ({
        userId: admin._id,
        type: 'system',
        message: `⚙️ AI Valuation Threshold was updated to ±${aiValuationThreshold}% by ${req.user.name}.`,
        link: '/admin/settings'
      }));
    }

    const io = req.app.get('io');
    if (adminNotifs.length > 0) {
      const insertedNotifs = await Notification.insertMany(adminNotifs);
      if (io) {
        insertedNotifs.forEach(notif => {
          io.to(notif.userId.toString()).emit('new_notification', notif);
        });
      }
    }

    if (maintenanceMode !== undefined && maintenanceMode === true && io) {
      // Global broadcast to all online users (not stored in DB, just an instant toast)
      io.emit('maintenance_alert', { message: '🚧 The platform is entering maintenance mode. Some features may be restricted.' });
    }

    res.json(updatedSettings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

import Settings from '../models/Settings.js';
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
    res.json(updatedSettings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

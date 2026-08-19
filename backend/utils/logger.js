import SystemLog from '../models/SystemLog.js';

/**
 * Logs a system event.
 * @param {string} type - 'auth', 'moderation', 'transaction', or 'system'
 * @param {string} action - Action name e.g., 'login', 'property_approved'
 * @param {string|null} performedBy - User ID performing the action
 * @param {string|null} targetId - ID of the affected resource (User, Property, Order)
 * @param {object} details - Additional contextual data
 */
export const logEvent = async (type, action, performedBy = null, targetId = null, details = {}) => {
  try {
    const log = new SystemLog({
      type,
      action,
      performedBy,
      targetId,
      details,
    });
    await log.save();
  } catch (error) {
    console.error(`Failed to create system log (${type}:${action}):`, error);
  }
};

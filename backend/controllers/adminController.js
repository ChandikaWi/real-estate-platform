import User from '../models/User.js';
import Property from '../models/Property.js';
import Order from '../models/Order.js';
import Payment from '../models/Payment.js';
import Review from '../models/Review.js';
import { logEvent } from '../utils/logger.js';
import generateToken from '../utils/generateToken.js';
import Notification from '../models/Notification.js';

// @desc    Get all users
// @route   GET /api/admin/users
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // MASTER ADMIN PROTECTION - Find the oldest admin in the system
    if (user.role === 'admin') {
      const oldestAdmin = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 });
      if (oldestAdmin && oldestAdmin._id.toString() === user._id.toString()) {
        return res.status(403).json({ message: 'Action Denied: You cannot delete the original Master Admin account.' });
      }
    }

    await user.deleteOne();
    await logEvent('moderation', 'delete_user', req.user._id, user._id, { deletedUserEmail: user.email });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new admin user
// @route   POST /api/admin/users
export const createAdminUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const adminUser = await User.create({
      name,
      email,
      password,
      role: 'admin'
    });

    await logEvent('system', 'create_admin', req.user._id, adminUser._id, { newAdminEmail: adminUser.email });
    
    // SMART ALERT - Notify all other admins
    const otherAdmins = await User.find({ role: 'admin', _id: { $ne: adminUser._id } });
    const adminNotifs = otherAdmins.map(admin => ({
      userId: admin._id,
      type: 'system',
      message: `🛡️ New Admin Account created: ${adminUser.name} (${adminUser.email})`,
      link: '/admin/users'
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

    res.status(201).json({
      _id: adminUser._id,
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role,
      isBanned: adminUser.isBanned,
      isVerified: adminUser.isVerified
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all properties for admin view
// @route   GET /api/admin/properties
export const getAdminProperties = async (req, res) => {
  try {
    const properties = await Property.find({}).populate('sellerId', 'name email');
    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a property (Admin)
// @route   DELETE /api/admin/properties/:id
export const deleteAdminProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: 'Property not found' });

    await property.deleteOne();
    await logEvent('moderation', 'delete_property', req.user._id, property._id, { propertyTitle: property.title });
    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle user status (Ban/Unban, Verify/Unverify)
// @route   PUT /api/admin/users/:id/status
export const updateUserStatus = async (req, res) => {
  try {
    const { action } = req.body; // Expects 'ban', 'unban', 'verify', or 'unverify'
    const user = await User.findById(req.params.id);
    
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (action === 'ban') user.isBanned = true;
    if (action === 'unban') user.isBanned = false;
    if (action === 'verify') user.isVerified = true;
    if (action === 'unverify') user.isVerified = false;

    const updatedUser = await user.save();
    await logEvent('moderation', action, req.user._id, user._id, { userEmail: user.email });
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get advanced admin analytics
// @route   GET /api/admin/analytics
export const getAdminAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const buyers = await User.countDocuments({ role: 'buyer' });
    const sellers = await User.countDocuments({ role: 'seller' });

    const properties = await Property.find();
    const totalProperties = properties.length;
    const houses = properties.filter(p => p.type === 'house').length;
    const apartments = properties.filter(p => p.type === 'apartment').length;
    const lands = properties.filter(p => p.type === 'land').length;

    const orders = await Order.find();
    const completedOrders = orders.filter(o => o.status === 'Completed');
    const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
    const totalOrders = orders.length;

    // Generate a basic 6-point trend for the chart based on recent revenue
    const revenueTrend = [
      { name: 'Point 1', revenue: totalRevenue * 0.05 },
      { name: 'Point 2', revenue: totalRevenue * 0.10 },
      { name: 'Point 3', revenue: totalRevenue * 0.15 },
      { name: 'Point 4', revenue: totalRevenue * 0.20 },
      { name: 'Point 5', revenue: totalRevenue * 0.25 },
      { name: 'Current', revenue: totalRevenue * 0.25 },
    ];

    res.json({
      users: { total: totalUsers, buyers, sellers },
      properties: { total: totalProperties, houses, apartments, lands },
      sales: { totalRevenue, totalOrders, completed: completedOrders.length },
      revenueTrend
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/admin/payments
// @desc    Get all boost transactions
export const getPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('sellerId', 'name email')
      .populate('propertyId', 'title isBoosted boostExpiresAt')
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch payment records.' });
  }
};

// @desc    Get all orders globally
// @route   GET /api/admin/orders
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('propertyId', 'title status price')
      .populate('buyerId', 'name email')
      .populate('sellerId', 'name email')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Forcibly cancel an order
// @route   PUT /api/admin/orders/:id/force-cancel
export const forceCancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    
    // Only allow cancelling if it's not completed
    if (order.status === 'Completed') {
      return res.status(400).json({ message: 'Cannot forcefully cancel a fully completed order.' });
    }
    
    order.status = 'Cancelled';
    const updatedOrder = await order.save();
    
    // Restore property to Active
    await Property.findByIdAndUpdate(order.propertyId, { status: 'Active' });
    
    await logEvent('moderation', 'force_cancel_order', req.user._id, order._id, { propertyId: order.propertyId });
    
    const io = req.app.get('io');
    if (io) {
      // Notify Buyer
      const buyerNotif = await Notification.create({
        userId: order.buyerId,
        type: 'alert',
        message: `🚨 Your purchase request was FORCE CANCELLED by an administrator.`,
        link: '/purchases'
      });
      io.to(order.buyerId.toString()).emit('new_notification', buyerNotif);
      
      // Notify Seller
      const sellerNotif = await Notification.create({
        userId: order.sellerId,
        type: 'alert',
        message: `🚨 A pending order for your property was FORCE CANCELLED by an administrator.`,
        link: '/dashboard/sales'
      });
      io.to(order.sellerId.toString()).emit('new_notification', sellerNotif);
      
      // Broadcast property status change
      io.emit('property_status_updated', { propertyId: order.propertyId, status: 'Active' });
    }

    res.json({ message: 'Order forcefully cancelled and property restored to active.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all reviews globally
// @route   GET /api/admin/reviews
export const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find({})
      .populate('buyerId', 'name email')
      .populate('sellerId', 'name email')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Forcibly delete a review
// @route   DELETE /api/admin/reviews/:id
export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    
    await review.deleteOne();
    
    await logEvent('moderation', 'wipe_review', req.user._id, review._id, { 
      sellerId: review.sellerId,
      buyerId: review.buyerId,
      rating: review.rating
    });
    
    // Notify the Buyer whose review was wiped
    const io = req.app.get('io');
    if (io) {
      const buyerNotif = await Notification.create({
        userId: review.buyerId,
        type: 'alert',
        message: `🚨 Your review was removed by an administrator for violating community guidelines.`,
        link: '/'
      });
      io.to(review.buyerId.toString()).emit('new_notification', buyerNotif);
    }

    res.json({ message: 'Review wiped successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
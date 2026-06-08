import Order from '../models/Order.js';
import Property from '../models/Property.js';
import nodemailer from 'nodemailer';

// Configure a demo email transporter 
const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  auth: {
    user: 'dallin.cormier@ethereal.email', 
    pass: 'B6yC2DqN9xQpYgM2H6' 
  }
});

// @desc    Process mock payment & create order
// @route   POST /api/orders/checkout
export const processCheckout = async (req, res) => {
  try {
    const { propertyId, cardName, cardNumber } = req.body;
    
    // Fetch property and seller details
    const property = await Property.findById(propertyId).populate('sellerId', 'name email');
    if (!property) return res.status(404).json({ message: 'Property not found' });

    // Create the Order
    const order = new Order({
      propertyId,
      buyerId: req.user._id,
      sellerId: property.sellerId._id,
      amount: property.price
    });
    const savedOrder = await order.save();

    // Dispatch Emails
    const buyerEmailHtml = `
      <h2>Payment Successful!</h2>
      <p>Hi ${req.user.name},</p>
      <p>Your mock payment of <strong>$${property.price.toLocaleString()}</strong> via card ending in ${cardNumber.slice(-4)} was successful.</p>
      <p>You are now the proud owner of: ${property.title}.</p>
    `;

    const sellerEmailHtml = `
      <h2>New Property Sold!</h2>
      <p>Hi ${property.sellerId.name},</p>
      <p>Great news! Your property <strong>${property.title}</strong> was just purchased by ${req.user.name} for $${property.price.toLocaleString()}.</p>
      <p>Log in to your dashboard to view the order details.</p>
    `;

    // Fire and forget emails (async without awaiting to keep response fast)
    transporter.sendMail({ from: '"PropTech System" <noreply@demo.com>', to: req.user.email, subject: 'Purchase Receipt', html: buyerEmailHtml }).catch(console.error);
    transporter.sendMail({ from: '"PropTech System" <noreply@demo.com>', to: property.sellerId.email, subject: 'You have a new order!', html: sellerEmailHtml }).catch(console.error);

    res.status(201).json(savedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get buyer's purchases
// @route   GET /api/orders/buyer
export const getBuyerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ buyerId: req.user._id }).populate('propertyId').sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get seller's received orders
// @route   GET /api/orders/seller
export const getSellerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ sellerId: req.user._id }).populate('propertyId buyerId').sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order status (Cancel or Complete)
// @route   PUT /api/orders/:id/status
export const updateOrderStatus = async (req, res) => {
  try {
    const { action } = req.body; // Expects 'cancel' or 'complete'
    const order = await Order.findById(req.params.id);
    
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (action === 'cancel') {
      // Ensure only the buyer can cancel
      if (order.buyerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to cancel this order' });
      }

      // Check if it's within the 3-day window
      const orderDate = new Date(order.createdAt);
      const currentDate = new Date();
      const diffTime = Math.abs(currentDate - orderDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 3) {
        return res.status(400).json({ message: 'Cancellation window (3 days) has expired' });
      }
      if (order.status === 'Completed') {
        return res.status(400).json({ message: 'Cannot cancel a completed order' });
      }

      order.status = 'Cancelled';
    } 
    else if (action === 'complete') {
      // Ensure only the seller can complete
      if (order.sellerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to complete this order' });
      }
      if (order.status === 'Cancelled') {
        return res.status(400).json({ message: 'Cannot complete a cancelled order' });
      }

      order.status = 'Completed';
    }

    const updatedOrder = await order.save();
    
    // Return the populated order so the UI updates smoothly
    const populatedOrder = await Order.findById(updatedOrder._id)
      .populate('propertyId buyerId');
      
    res.json(populatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
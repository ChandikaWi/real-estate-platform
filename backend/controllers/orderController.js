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
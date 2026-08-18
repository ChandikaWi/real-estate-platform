import Order from '../models/Order.js';
import Property from '../models/Property.js';
import nodemailer from 'nodemailer';
import Notification from '../models/Notification.js';

const transporter = nodemailer.createTransport({
  service: 'gmail', 
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS 
  }
});

// Helper function to send emails safely
const sendEmail = (to, subject, html) => {
  transporter.sendMail({ from: '"Real Estate Platform" <noreply@demo.com>', to, subject, html }).catch(console.error);
};

// @desc    Submit a Purchase Request (Marketplace Flow)
// @route   POST /api/orders/checkout
export const processCheckout = async (req, res) => {
  try {
    const { propertyId } = req.body;
    
    // ATOMIC UPDATE - Lock property as 'Reserved'
    const property = await Property.findOneAndUpdate(
      { _id: propertyId, status: 'Active' },
      { status: 'Reserved' }, 
      { new: true }
    ).populate('sellerId', 'name email');

    if (!property) return res.status(409).json({ message: 'This property is already reserved or sold.' });

    // Create the Request
    const order = new Order({
      propertyId,
      buyerId: req.user._id,
      sellerId: property.sellerId._id,
      amount: property.price,
      status: 'Pending' 
    });
    const savedOrder = await order.save();

    // REAL-TIME NOTIFICATIONS
    const newNotif = await Notification.create({
      userId: property.sellerId._id,
      type: 'order',
      message: `🔔 New Purchase Request! ${req.user.name} wants to buy "${property.title}".`,
      link: '/dashboard/sales'
    });
    
    const io = req.app.get('io');
    if (io) {
      io.to(property.sellerId._id.toString()).emit('new_notification', newNotif);
      io.emit('property_status_updated', { propertyId: property._id, status: 'Reserved' });
    }
    
    // DUAL EMAILS (To Seller and Buyer)
    sendEmail(property.sellerId.email, 'Action Required: New Purchase Request', `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #f39c12; padding: 25px; text-align: center;"><h1 style="margin: 0; color: #ffffff;">New Purchase Request 🏠</h1></div>
        <div style="padding: 30px; color: #374151; line-height: 1.6;">
          <p>Hi <strong>${property.sellerId.name}</strong>,</p>
          <p>${req.user.name} has requested to purchase <strong>${property.title}</strong>.</p>
          <p>The property is now temporarily <strong>Reserved</strong>. Please log in to your dashboard to <strong>Approve</strong> this request.</p>
        </div>
      </div>
    `);

    sendEmail(req.user.email, 'Purchase Request Received!', `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #3b82f6; padding: 25px; text-align: center;"><h1 style="margin: 0; color: #ffffff;">Request Sent Successfully ✅</h1></div>
        <div style="padding: 30px; color: #374151; line-height: 1.6;">
          <p>Hi <strong>${req.user.name}</strong>,</p>
          <p>Your request to purchase <strong>${property.title}</strong> has been sent to the seller.</p>
          <p>We will notify you by email as soon as the seller reviews and approves your request to proceed with offline negotiations.</p>
        </div>
      </div>
    `);

    res.status(201).json(savedOrder);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const getBuyerOrders = async (req, res) => {
  try { res.json(await Order.find({ buyerId: req.user._id }).populate('propertyId').sort({ createdAt: -1 })); } 
  catch (error) { res.status(500).json({ message: error.message }); }
};

export const getSellerOrders = async (req, res) => {
  try { res.json(await Order.find({ sellerId: req.user._id }).populate('propertyId buyerId').sort({ createdAt: -1 })); } 
  catch (error) { res.status(500).json({ message: error.message }); }
};

// @desc    Update order status (Approve, Complete, Cancel)
// @route   PUT /api/orders/:id/status
export const updateOrderStatus = async (req, res) => {
  try {
    const { action } = req.body; 
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    
    const io = req.app.get('io');
    let buyerMessage = '';
    let emailSubjectBuyer = '';
    let emailHtmlBuyer = '';

    // CANCEL ACTION
    if (action === 'cancel') {
      if (order.status === 'Completed') return res.status(400).json({ message: 'Cannot cancel a completed transaction' });
      order.status = 'Cancelled';
      await Property.findByIdAndUpdate(order.propertyId, { status: 'Active' });
      if (io) io.emit('property_status_updated', { propertyId: order.propertyId, status: 'Active' });
      
      buyerMessage = `🚫 The purchase request for a property was cancelled.`;
      emailSubjectBuyer = 'Purchase Request Cancelled';
      emailHtmlBuyer = `<p>The transaction for the property has been officially cancelled, and it is back on the market.</p>`;
    } 
    
    // APPROVE ACTION
    else if (action === 'approve') {
      if (order.sellerId.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Unauthorized' });
      order.status = 'Approved';
      buyerMessage = `✅ Your request was APPROVED! The seller is ready to proceed.`;
      emailSubjectBuyer = 'Your Purchase Request was Approved! 🤝';
      emailHtmlBuyer = `<p>The seller has approved your purchase request! Please contact them to arrange offline payment and legal documentation.</p>`;
    }

    // COMPLETE ACTION
    else if (action === 'complete') {
      if (order.sellerId.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Unauthorized' });
      order.status = 'Completed';
      await Property.findByIdAndUpdate(order.propertyId, { status: 'Sold' });
      if (io) io.emit('property_status_updated', { propertyId: order.propertyId, status: 'Sold' });
      
      buyerMessage = `🎉 Transaction Completed! You are the new owner.`;
      emailSubjectBuyer = 'Transaction Completed! 🎉';
      emailHtmlBuyer = `<p>Congratulations! The seller has officially marked the property as Sold to you. Please consider leaving a review for your seller!</p>`;

      // SEND SELLER COMPLETION EMAIL
      sendEmail(order.sellerId.email, 'Sale Successfully Finalized 🤝', `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #10b981; padding: 25px; text-align: center;"><h1 style="margin: 0; color: #ffffff;">Transaction Closed</h1></div>
          <div style="padding: 30px; color: #374151; line-height: 1.6;">
            <p>Hi <strong>${req.user.name}</strong>,</p>
            <p>You have successfully marked the transaction for this property as <strong>Completed</strong>.</p>
            <p>Excellent work! This sale has been added to your lifetime analytics.</p>
          </div>
        </div>
      `);
    }

    const updatedOrder = await order.save();
    const populatedOrder = await Order.findById(updatedOrder._id).populate('propertyId', 'title').populate('buyerId', 'name email').populate('sellerId', 'name email phoneNumber');

    // REAL-TIME - Notify Buyer
    if (io && buyerMessage) {
      const notif = await Notification.create({ userId: populatedOrder.buyerId._id, type: 'order_update', message: buyerMessage, link: '/purchases' });
      io.to(populatedOrder.buyerId._id.toString()).emit('new_notification', notif);
    }

    // SEND BUYER EMAIL
    if (emailHtmlBuyer) {
      sendEmail(populatedOrder.buyerId.email, emailSubjectBuyer, `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #2563eb; padding: 25px; text-align: center;"><h1 style="margin: 0; color: #ffffff;">Status Update</h1></div>
          <div style="padding: 30px; color: #374151; line-height: 1.6;">
            <p>Hi <strong>${populatedOrder.buyerId.name}</strong>,</p>
            <p><strong>Property:</strong> ${populatedOrder.propertyId.title}</p>
            ${emailHtmlBuyer}
            ${action === 'approve' ? `<p><strong>Seller Contact:</strong> ${populatedOrder.sellerId.phoneNumber || populatedOrder.sellerId.email}</p>` : ''}
          </div>
        </div>
      `);
    }

    res.json(populatedOrder);
  } catch (error) { res.status(500).json({ message: error.message }); }
};
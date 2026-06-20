import Order from '../models/Order.js';
import Property from '../models/Property.js';
import nodemailer from 'nodemailer';
import Notification from '../models/Notification.js';

// Configure real email transporter using environment variables
const transporter = nodemailer.createTransport({
  service: 'gmail', // Tells nodemailer to use Google's SMTP servers
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS 
  }
});

// @desc    Process mock payment & create order
// @route   POST /api/orders/checkout
export const processCheckout = async (req, res) => {
  try {
    const { propertyId, cardName, cardNumber } = req.body;
    
    // ATOMIC UPDATE (Concurrency Protection)
    const property = await Property.findOneAndUpdate(
      { _id: propertyId, status: 'Active' },
      { status: 'Sold' }, 
      { new: true }
    ).populate('sellerId', 'name email');

    if (!property) {
      return res.status(409).json({ message: 'Transaction Failed: This property was just reserved or sold to another buyer.' });
    }

    // Create the Order as PENDING
    const order = new Order({
      propertyId,
      buyerId: req.user._id,
      sellerId: property.sellerId._id,
      amount: property.price,
      status: 'Pending' // et to Pending so the seller MUST approve it
    });
    const savedOrder = await order.save();

    // Notify Seller of the pending sale
    await Notification.create({
      userId: property.sellerId._id,
      type: 'order',
      message: `💰 Action Required! ${req.user.name} just purchased "${property.title}". Please approve to complete the sale.`,
      link: '/dashboard/sales'
    });
    
    // Dispatch Initial Email to Seller ONLY
    const sellerAlertHtml = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
        <div style="background-color: #2563eb; padding: 25px; text-align: center;">
          <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Action Required ⚡</h1>
        </div>
        <div style="padding: 30px; background-color: #ffffff; color: #374151; line-height: 1.6;">
          <h2 style="margin-top: 0; color: #111827;">New Order Pending Approval</h2>
          <p style="font-size: 16px;">Hi <strong>${property.sellerId.name}</strong>,</p>
          <p style="font-size: 16px;">Great news! You have a new purchase request. The buyer has successfully submitted their payment, and the property is now temporarily reserved.</p>
          
          <div style="background-color: #f3f4f6; border-left: 4px solid #f39c12; padding: 15px; margin: 25px 0; border-radius: 4px;">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280; text-transform: uppercase; font-weight: bold;">Transaction Details</p>
            <p style="margin: 5px 0;"><strong>Property:</strong> ${property.title}</p>
            <p style="margin: 5px 0;"><strong>Buyer:</strong> ${req.user.name}</p>
            <p style="margin: 5px 0;"><strong>Amount:</strong> <span style="color: #2563eb; font-weight: bold; font-size: 1.1rem;">Rs. ${property.price.toLocaleString()}</span></p>
          </div>

          <p style="font-size: 16px;">Please log in to your dashboard to review this transaction and mark it as <strong>Complete</strong> to officially finalize the sale.</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="http://localhost:5173/dashboard/sales" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: bold; font-size: 16px;">Review Order in Dashboard</a>
          </div>
        </div>
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb;">
          This is an automated message from your Real Estate Platform.<br>
          &copy; ${new Date().getFullYear()} RealEstate. All rights reserved.
        </div>
      </div>
    `;

    transporter.sendMail({ from: '"PropTech System" <noreply@demo.com>', to: property.sellerId.email, subject: 'Action Required: New Order Pending Approval', html: sellerAlertHtml }).catch(console.error);

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
    const { action } = req.body; 
    const order = await Order.findById(req.params.id);
    
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (action === 'cancel') {
      if (order.buyerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to cancel this order' });
      }

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

      // INVENTORY ROLLBACK
      await Property.findByIdAndUpdate(order.propertyId, { status: 'Active' });
      const io = req.app.get('io');
      if (io) io.emit('property_status_updated', { propertyId: order.propertyId, status: 'Active' });

    } 
    else if (action === 'complete') {
      if (order.sellerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to complete this order' });
      }
      if (order.status === 'Cancelled') {
        return res.status(400).json({ message: 'Cannot complete a cancelled order' });
      }

      order.status = 'Completed';
    }

    const updatedOrder = await order.save();
    
    // Populate data so we have emails and names for the dispatch
    const populatedOrder = await Order.findById(updatedOrder._id)
      .populate('propertyId')
      .populate('buyerId', 'name email')
      .populate('sellerId', 'name email');
      
    // DISPATCH COMPLETION EMAILS
    if (action === 'complete') {
      const buyerSuccessHtml = `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
          <div style="background-color: #10b981; padding: 25px; text-align: center;">
            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Congratulations! 🎉</h1>
          </div>
          <div style="padding: 30px; background-color: #ffffff; color: #374151; line-height: 1.6;">
            <h2 style="margin-top: 0; color: #111827;">Your Purchase is Finalized</h2>
            <p style="font-size: 16px;">Hi <strong>${populatedOrder.buyerId.name}</strong>,</p>
            <p style="font-size: 16px;">We are thrilled to let you know that the seller has officially approved and completed your purchase. Welcome to your new property!</p>
            
            <div style="background-color: #f3f4f6; border-left: 4px solid #10b981; padding: 15px; margin: 25px 0; border-radius: 4px;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280; text-transform: uppercase; font-weight: bold;">Official Receipt</p>
              <p style="margin: 5px 0;"><strong>Property:</strong> ${populatedOrder.propertyId.title}</p>
              <p style="margin: 5px 0;"><strong>Seller:</strong> ${populatedOrder.sellerId.name}</p>
              <p style="margin: 5px 0;"><strong>Order ID:</strong> #${populatedOrder._id}</p>
              <p style="margin: 10px 0 5px 0; border-top: 1px solid #e5e7eb; padding-top: 10px;">
                <strong>Total Paid:</strong> <span style="color: #10b981; font-weight: bold; font-size: 1.2rem;">Rs. ${populatedOrder.amount.toLocaleString()}</span>
              </p>
            </div>

            <p style="font-size: 16px;">You can view the full details of your transaction in your buyer dashboard.</p>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="http://localhost:5173/purchases" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: bold; font-size: 16px;">View My Purchases</a>
            </div>
          </div>
          <div style="background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb;">
            This is an automated receipt from your Real Estate Platform.<br>
            &copy; ${new Date().getFullYear()} RealEstate. All rights reserved.
          </div>
        </div>
      `;

      const sellerConfirmationHtml = `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
          <div style="background-color: #2563eb; padding: 25px; text-align: center;">
            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Sale Finalized 🤝</h1>
          </div>
          <div style="padding: 30px; background-color: #ffffff; color: #374151; line-height: 1.6;">
            <h2 style="margin-top: 0; color: #111827;">Transaction Closed</h2>
            <p style="font-size: 16px;">Hi <strong>${populatedOrder.sellerId.name}</strong>,</p>
            <p style="font-size: 16px;">You have successfully marked the order as complete. The transaction is now officially closed, and the property status has been updated.</p>
            
            <div style="background-color: #f3f4f6; border-left: 4px solid #2563eb; padding: 15px; margin: 25px 0; border-radius: 4px;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280; text-transform: uppercase; font-weight: bold;">Sale Summary</p>
              <p style="margin: 5px 0;"><strong>Property Sold:</strong> ${populatedOrder.propertyId.title}</p>
              <p style="margin: 5px 0;"><strong>Sold To:</strong> ${populatedOrder.buyerId.name}</p>
              <p style="margin: 5px 0;"><strong>Order ID:</strong> #${populatedOrder._id}</p>
              <p style="margin: 10px 0 5px 0; border-top: 1px solid #e5e7eb; padding-top: 10px;">
                <strong>Revenue Generated:</strong> <span style="color: #2563eb; font-weight: bold; font-size: 1.2rem;">Rs. ${populatedOrder.amount.toLocaleString()}</span>
              </p>
            </div>

            <p style="font-size: 16px;">Excellent work! This sale has been added to your lifetime analytics.</p>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="http://localhost:5173/dashboard/sales" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: bold; font-size: 16px;">View Sales History</a>
            </div>
          </div>
          <div style="background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb;">
            This is an automated confirmation from your Real Estate Platform.<br>
            &copy; ${new Date().getFullYear()} RealEstate. All rights reserved.
          </div>
        </div>
      `;

      transporter.sendMail({ from: '"PropTech System" <noreply@demo.com>', to: populatedOrder.buyerId.email, subject: 'Purchase Officially Completed!', html: buyerSuccessHtml }).catch(console.error);
      transporter.sendMail({ from: '"PropTech System" <noreply@demo.com>', to: populatedOrder.sellerId.email, subject: 'Sale Successfully Finalized', html: sellerConfirmationHtml }).catch(console.error);
    }

    res.json(populatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
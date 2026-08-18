import Payment from '../models/Payment.js';
import Property from '../models/Property.js';

// @route   POST /api/payments/create-session
// @desc    Calculate price and create a pending payment session
export const createMockCheckoutSession = async (req, res) => {
  try {
    const { propertyId, planType } = req.body;
    const property = await Property.findById(propertyId);
    
    if (!property) return res.status(404).json({ message: 'Property not found' });

    let amount = 0;
    if (planType === '7_days') amount = 3500;
    else if (planType === '14_days') amount = 6000;
    else if (planType === '30_days') amount = 12000;
    else if (planType === 'lifetime') amount = property.price * 0.002;

    const payment = await Payment.create({
      sellerId: req.user._id,
      propertyId,
      amount,
      planType,
      status: 'Pending'
    });

    res.status(200).json({ paymentId: payment._id });
  } catch (error) {
    res.status(500).json({ message: 'Failed to initialize checkout.' });
  }
};

// @route   GET /api/payments/session/:id
// @desc    Get session details for the checkout page
export const getSessionDetails = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('propertyId', 'title images price location')
      .populate('sellerId', 'name email');

    if (!payment) return res.status(404).json({ message: 'Session not found' });
    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load session details.' });
  }
};

// @route   POST /api/payments/confirm
// @desc    Simulate successful payment and boost property
export const confirmMockPayment = async (req, res) => {
  try {
    const { paymentId } = req.body;
    const payment = await Payment.findById(paymentId);
    
    if (!payment) return res.status(404).json({ message: 'Payment record not found' });

    // Mark Payment as Completed
    payment.status = 'Completed';
    await payment.save();

    // Calculate Expiration
    let expiryDate = null; // null means lifetime
    if (payment.planType !== 'lifetime') {
      const days = parseInt(payment.planType.split('_')[0]);
      expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + days);
    }

    // Boost the Property
    await Property.findByIdAndUpdate(payment.propertyId, {
      isBoosted: true,
      boostExpiresAt: expiryDate
    });

    res.status(200).json({ message: 'Payment successful! Property boosted.' });
  } catch (error) {
    res.status(500).json({ message: 'Payment processing failed.' });
  }
};
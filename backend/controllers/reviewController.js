import Review from '../models/Review.js';
import Order from '../models/Order.js';
import Notification from '../models/Notification.js';

// @desc    Get all reviews for a specific seller
// @route   GET /api/reviews/seller/:sellerId
export const getSellerReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ sellerId: req.params.sellerId })
      .populate('buyerId', 'name profilePhoto')
      .sort({ createdAt: -1 }); // Newest first
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a new review
// @route   POST /api/reviews
export const addReview = async (req, res) => {
  try {
    const { sellerId, rating, comment } = req.body;
    const buyerId = req.user._id;

    // Enforce Verified Purchase - Check if buyer has a completed order with this seller
    const hasBought = await Order.findOne({ buyerId, sellerId, status: 'Completed' });
    if (!hasBought) {
      return res.status(403).json({ message: 'You must complete a purchase with this seller before leaving a review.' });
    }

    // Ensure only one review per buyer per seller
    const existingReview = await Review.findOne({ buyerId, sellerId });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this seller. Please edit your existing review.' });
    }

    const review = await Review.create({ sellerId, buyerId, rating, comment });
    const populatedReview = await Review.findById(review._id).populate('buyerId', 'name profilePhoto');
    
    // SMART ALERT - Notify Seller of a new review
    const newNotif = await Notification.create({
      userId: sellerId,
      type: 'review',
      message: `⭐ You received a new ${rating}-star review from ${req.user.name}!`,
      link: '/analytics' // Sends them to their performance matrix
    });

    const io = req.app.get('io');
    if (io) {
      io.to(sellerId.toString()).emit('new_notification', newNotif);
    }
    
    res.status(201).json(populatedReview);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a review
// @route   PUT /api/reviews/:id
export const updateReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const review = await Review.findById(req.params.id);

    if (!review) return res.status(404).json({ message: 'Review not found' });
    
    // Ensure the user owns the review
    if (review.buyerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized to edit this review' });
    }

    review.rating = rating || review.rating;
    review.comment = comment || review.comment;
    await review.save();

    const populatedReview = await Review.findById(review._id).populate('buyerId', 'name profilePhoto');
    res.json(populatedReview);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    // Ensure the user owns the review (or is an admin)
    if (review.buyerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to delete this review' });
    }

    await review.deleteOne();
    res.json({ message: 'Review successfully deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
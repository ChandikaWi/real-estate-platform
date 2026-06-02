import Favorite from '../models/Favorite.js';

// @desc    Add property to favorites
// @route   POST /api/favorites
export const addFavorite = async (req, res) => {
  try {
    const { propertyId } = req.body;

    // Check if it already exists to prevent duplicates
    const existingFavorite = await Favorite.findOne({ userId: req.user._id, propertyId });
    if (existingFavorite) {
      return res.status(400).json({ message: 'Property is already in your favorites' });
    }

    const favorite = new Favorite({
      userId: req.user._id,
      propertyId
    });

    const savedFavorite = await favorite.save();
    res.status(201).json(savedFavorite);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's favorite properties
// @route   GET /api/favorites/user/:userId
export const getUserFavorites = async (req, res) => {
  try {
    // Use req.user._id from the token for security, ignoring the param to prevent fetching others' lists
    const favorites = await Favorite.find({ userId: req.user._id })
      .populate('propertyId') // Pull in the full property details
      .sort({ createdAt: -1 });

    res.json(favorites);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove property from favorites
// @route   DELETE /api/favorites/:id
export const removeFavorite = async (req, res) => {
  try {
    const favorite = await Favorite.findById(req.params.id);
    if (!favorite) return res.status(404).json({ message: 'Favorite not found' });

    // Ensure only the owner can delete it
    if (favorite.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await favorite.deleteOne();
    res.json({ message: 'Removed from favorites' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
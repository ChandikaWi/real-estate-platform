import Property from '../models/Property.js';

// @desc    Get all properties (with search, filter, pagination)
// @route   GET /api/properties
export const getProperties = async (req, res) => {
  try {
    const { keyword, minPrice, maxPrice, type, bedrooms, page = 1, limit = 10, sort } = req.query;

    let query = {};

    // Search by keyword (title or city)
    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { 'location.city': { $regex: keyword, $options: 'i' } }
      ];
    }

    // Filters
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (type) query.type = type;
    if (bedrooms) query.bedrooms = Number(bedrooms);

    // Sorting
    let sortOption = { createdAt: -1 }; // default newest
    if (sort === 'price_low') sortOption = { price: 1 };
    if (sort === 'price_high') sortOption = { price: -1 };

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);

    const properties = await Property.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit))
      .populate('sellerId', 'name email');

    const total = await Property.countDocuments(query);

    res.json({
      properties,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      totalProperties: total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a property
// @route   POST /api/properties
export const createProperty = async (req, res) => {
  try {
    const property = new Property({ ...req.body, sellerId: req.user._id });
    const createdProperty = await property.save();
    res.status(201).json(createdProperty);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a property
// @route   DELETE /api/properties/:id
export const deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: 'Property not found' });

    // Ensure only the seller or an admin can delete
    if (property.sellerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this property' });
    }

    await property.deleteOne();
    res.json({ message: 'Property removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
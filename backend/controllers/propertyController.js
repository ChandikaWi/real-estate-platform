import Property from '../models/Property.js';
import Order from '../models/Order.js';
import Message from '../models/Message.js';

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
      .populate('sellerId', 'name email isVerified phoneNumber profilePhoto');

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

// @desc    Fetch single property
// @route   GET /api/properties/:id
export const getPropertyById = async (req, res) => {
  try {
    // Increment the views by 1 every time this route is hit
    const property = await Property.findByIdAndUpdate(
      req.params.id, 
      { $inc: { views: 1 } }, 
      { new: true }
    ).populate('sellerId', 'name email isVerified phoneNumber profilePhoto');

    if (property) {
      res.json(property);
    } else {
      res.status(404).json({ message: 'Property not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a property
// @route   PUT /api/properties/:id
export const updateProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: 'Property not found' });

    // Verify ownership or admin status
    if (property.sellerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this property' });
    }

    // Update the document
    const updatedProperty = await Property.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true } // Returns the newly updated document
    );
    res.json(updatedProperty);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged in seller's properties
// @route   GET /api/properties/seller/me
export const getSellerProperties = async (req, res) => {
  try {
    const properties = await Property.find({ sellerId: req.user._id }).sort({ createdAt: -1 });
    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get seller analytics and performance metrics
// @route   GET /api/properties/seller/analytics
export const getSellerAnalytics = async (req, res) => {
  try {
    // Fetch all data related to this seller
    const properties = await Property.find({ sellerId: req.user._id });
    const orders = await Order.find({ sellerId: req.user._id });
    const messages = await Message.find({ receiverId: req.user._id });

    // Calculate Summary Totals
    const totalViews = properties.reduce((sum, prop) => sum + prop.views, 0);
    const totalInquiries = messages.length;
    const totalSalesRevenue = orders
      .filter(o => o.status === 'Completed')
      .reduce((sum, o) => sum + o.amount, 0);

    // Calculate Individual Listing Performance
    const listingPerformance = properties.map(prop => {
      const propOrders = orders.filter(o => o.propertyId.toString() === prop._id.toString());
      const propMessages = messages.filter(m => m.propertyId.toString() === prop._id.toString());
      const revenue = propOrders
        .filter(o => o.status === 'Completed')
        .reduce((sum, o) => sum + o.amount, 0);

      return {
        _id: prop._id,
        title: prop.title,
        views: prop.views,
        inquiries: propMessages.length,
        orders: propOrders.length,
        revenue: revenue,
        status: propOrders.some(o => o.status === 'Completed') ? 'Sold' : 'Active'
      };
    });

    res.json({
      summary: {
        activeListings: properties.length,
        totalViews,
        totalInquiries,
        totalSalesRevenue
      },
      listings: listingPerformance
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
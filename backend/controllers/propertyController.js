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
    const properties = await Property.find({ sellerId: req.user._id });
    const orders = await Order.find({ sellerId: req.user._id });
    const messages = await Message.find({ receiverId: req.user._id });

    // Calculate Summary Totals 
    const totalViews = properties.reduce((sum, prop) => sum + (prop.views || 0), 0);
    const totalInquiries = messages.length;
    const totalSalesRevenue = orders
      .filter(o => o.status === 'Completed')
      .reduce((sum, o) => sum + (o.amount || 0), 0);

    // Calculate Individual Listing Performance
    const listingPerformance = properties.map(prop => {
      // Safely filter orders/messages using optional chaining 
      const propOrders = orders.filter(o => o.propertyId?.toString() === prop._id.toString());
      const propMessages = messages.filter(m => m.propertyId?.toString() === prop._id.toString());
      
      const revenue = propOrders
        .filter(o => o.status === 'Completed')
        .reduce((sum, o) => sum + (o.amount || 0), 0);

      return {
        _id: prop._id,
        title: prop.title,
        views: prop.views || 0,
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
    console.error("Analytics Error:", error); // Logs exact reason to terminal if it fails 
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all public properties by a specific seller
// @route   GET /api/properties/user/:sellerId
export const getPropertiesBySellerId = async (req, res) => {
  try {
    const properties = await Property.find({ sellerId: req.params.sellerId })
      .sort({ createdAt: -1 }); // Newest first
    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get personalized property recommendations based on budget and history
// @route   GET /api/properties/recommendations
export const getRecommendations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch user's history (Favorites and Purchases) to establish a pattern
    const favorites = await Favorite.find({ userId }).populate('propertyId');
    const orders = await Order.find({ buyerId: userId }).populate('propertyId');

    // Combine all interacted properties
    const allInteractions = [
      ...favorites.map(f => f.propertyId).filter(Boolean),
      ...orders.map(o => o.propertyId).filter(Boolean)
    ];

    // Fallback - If the user is brand new and has no history, return Trending properties
    if (allInteractions.length === 0) {
      const trending = await Property.find().sort({ views: -1, 'valuationMetrics.conditionScore': -1 }).limit(8);
      return res.json(trending);
    }

    // Extract Budget Patterns & Preferences
    const prices = allInteractions.map(p => p.price);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const minBudget = avgPrice * 0.6; // 40% below their average
    const maxBudget = avgPrice * 1.4; // 40% above their average

    // Calculate most frequent property type and city
    const types = allInteractions.map(p => p.type);
    const preferredType = types.sort((a,b) => types.filter(v => v===a).length - types.filter(v => v===b).length).pop();

    const cities = allInteractions.map(p => p.location?.city).filter(Boolean);
    const preferredCity = cities.sort((a,b) => cities.filter(v => v===a).length - cities.filter(v => v===b).length).pop();

    const interactedIds = allInteractions.map(p => p._id);

    // Query the database matching these intelligent patterns
    const recommendations = await Property.find({
      _id: { $nin: interactedIds }, // Exclude properties they already saved/bought
      $or: [
        { type: preferredType },
        { 'location.city': preferredCity },
        { price: { $gte: minBudget, $lte: maxBudget } }
      ]
    })
    .sort({ views: -1 }) // Sort the matches by popularity
    .limit(8);

    // Pad with trending properties if the algorithm found fewer than 4 matches
    if (recommendations.length < 4) {
       const pad = await Property.find({ 
         _id: { $nin: [...interactedIds, ...recommendations.map(p => p._id)] } 
       }).sort({ views: -1 }).limit(8 - recommendations.length);
       recommendations.push(...pad);
    }

    res.json(recommendations);
  } catch (error) {
    console.error("Recommendation Engine Error:", error);
    res.status(500).json({ message: error.message });
  }
};
import Property from '../models/Property.js';
import Message from '../models/Message.js';
import Order from '../models/Order.js';
import Favorite from '../models/Favorite.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import axios from 'axios';

// @desc    Get all properties (with search, filter, pagination)
// @route   GET /api/properties
export const getProperties = async (req, res) => {
  try {
    // Extract listingType from the query
    const { keyword, minPrice, maxPrice, type, bedrooms, listingType, page = 1, limit = 10, sort } = req.query;

    let query = { status: 'Active' };
    let andConditions = []; // Use array to safely combine multiple $or queries

    //  Apply Listing Type Filter (Buy vs Rent)
    if (listingType) {
      if (listingType === 'buy') {
        // Safe Fallback: Includes explicitly 'buy' OR legacy properties where the field doesn't exist yet
        andConditions.push({ $or: [{ listingType: 'buy' }, { listingType: { $exists: false } }] });
      } else {
        query.listingType = listingType; // E.g., 'rent'
      }
    }

    // Apply Keyword Search
    if (keyword) {
      andConditions.push({
        $or: [
          { title: { $regex: keyword, $options: 'i' } },
          { 'location.city': { $regex: keyword, $options: 'i' } }
        ]
      });
    }

    // If we have bundled conditions, apply them to the main query
    if (andConditions.length > 0) {
      query.$and = andConditions;
    }

    // Filters
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (type) query.type = type;
    if (bedrooms) query.bedrooms = Number(bedrooms);

    // GLOBAL SORTING FOR BOOSTED PROPERTIES
    let sortOption = {};
    if (sort === 'price_low') {
      sortOption = { isBoosted: -1, price: 1 };
    } else if (sort === 'price_high') {
      sortOption = { isBoosted: -1, price: -1 };
    } else {
      // Default 'newest' sort
      sortOption = { isBoosted: -1, createdAt: -1 }; 
    }

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

// @desc    Get AI Property Valuation
// @route   POST /api/properties/predict-price
// @access  Private
export const getAIValuation = async (req, res) => {
  try {
    const { city, type, bedrooms, bathrooms, area } = req.body;

    if (!city || !type || area === undefined) {
      return res.status(400).json({ message: 'Missing required property details for AI valuation.' });
    }

    // Proxy request to Python FastAPI microservice on port 8000
    const pythonResponse = await axios.post('http://127.0.0.1:8000/predict', {
      city,
      type: type.toLowerCase(),
      bedrooms: Number(bedrooms) || 0,
      bathrooms: Number(bathrooms) || 0,
      area: Number(area)
    });

    res.json({ estimatedPrice: pythonResponse.data.estimated_price });
  } catch (error) {
    console.error("FastAPI Error:", error.message);
    res.status(500).json({ message: 'AI Valuation Engine is currently unavailable.' });
  }
};

// @desc    Create a property
// @route   POST /api/properties
export const createProperty = async (req, res) => {
  try {
    const property = new Property({ ...req.body, sellerId: req.user._id });
    const createdProperty = await property.save();

    // Notify all Admins of new inventory
    const admins = await User.find({ role: 'admin' });
    const adminNotifs = admins.map(admin => ({
      userId: admin._id,
      type: 'alert',
      message: `🏢 New property listed: "${property.title}" by ${req.user.name}.`,
      link: '/admin/properties'
    }));
    if (adminNotifs.length > 0) await Notification.insertMany(adminNotifs);

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

// @desc    Get a single property by ID
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

    // Check for Price Drop before saving
    if (req.body.price && Number(req.body.price) < property.price) {
      const priceDropPercentage = Math.round(((property.price - req.body.price) / property.price) * 100);
      
      // Find all buyers who favorited this exact property
      const favorites = await Favorite.find({ propertyId: property._id });
      
      // Send them all a notification!
      const notifications = favorites.map(fav => ({
        userId: fav.userId, // The buyer
        type: 'price_drop',
        message: `🔥 Price dropped by ${priceDropPercentage}% on "${property.title}"! It is now Rs.${req.body.price.toLocaleString()}.`,
        link: `/property/${property._id}`
      }));
      if (notifications.length > 0) await Notification.insertMany(notifications);
    }
    
    // Force status back to 'Pending Review' upon any edit
    const updatedData = { ...req.body };
    
    // If the seller makes the edit, force to 'Pending Review'. 
    // (Admins bypass this so they can fix typos without taking the listing offline)
    if (req.user.role !== 'admin') {
      updatedData.status = 'Pending Review';
    }

    // Update the document
    const updatedProperty = await Property.findByIdAndUpdate(
      req.params.id,
      { $set: updatedData },
      { new: true } // Returns the newly updated document
    );

    // REAL-TIME - Instantly broadcast the status change so buyers looking at the page know it's under review
    const io = req.app.get('io');
    if (io && req.user.role !== 'admin') {
      io.emit('property_status_updated', { propertyId: property._id, status: 'Pending Review' });
    }

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
    console.error("Analytics Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all public properties by a specific seller
// @route   GET /api/properties/user/:sellerId
export const getPropertiesBySellerId = async (req, res) => {
  try {
    const properties = await Property.find({ sellerId: req.params.sellerId })
      .sort({ isBoosted: -1, createdAt: -1 });
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
      const trending = await Property.find().sort({ isBoosted: -1, views: -1, 'valuationMetrics.conditionScore': -1 }).limit(8);
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
    .sort({ isBoosted: -1, views: -1 }) // Pinned Boosted properties to the top of Recs
    .limit(8);

    // Pad with trending properties if the algorithm found fewer than 4 matches
    if (recommendations.length < 4) {
       const pad = await Property.find({ 
         _id: { $nin: [...interactedIds, ...recommendations.map(p => p._id)] } 
       }).sort({ isBoosted: -1, views: -1 }).limit(8 - recommendations.length);
       recommendations.push(...pad);
    }

    res.json(recommendations);
  } catch (error) {
    console.error("Recommendation Engine Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get similar properties based on type, location, and price
// @route   GET /api/properties/:id/similar
export const getSimilarProperties = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: 'Property not found' });

    // Define a +/- 20% price range
    const minPrice = property.price * 0.8;
    const maxPrice = property.price * 1.2;

    // Strict Match - Same Type, Same City, Similar Price
    let similarProperties = await Property.find({
      _id: { $ne: property._id }, // Exclude the current property
      type: property.type,
      'location.city': property.location.city,
      price: { $gte: minPrice, $lte: maxPrice }
    })
    .sort({ isBoosted: -1, views: -1 }) // Pinned Boosted properties to top of Similar list
    .limit(4);

    // Broad Match Fallback - If strict matches < 4, ignore the city to fill the remaining slots
    if (similarProperties.length < 4) {
      const existingIds = similarProperties.map(p => p._id);
      const fallbackProperties = await Property.find({
        _id: { $ne: property._id, $nin: existingIds },
        type: property.type,
        price: { $gte: minPrice, $lte: maxPrice }
      })
      .sort({ isBoosted: -1, views: -1 })
      .limit(4 - similarProperties.length);
      
      similarProperties = [...similarProperties, ...fallbackProperties];
    }

    res.json(similarProperties);
  } catch (error) {
    console.error("Similar Properties Engine Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get properties based on lifestyle quiz answers
// @route   POST /api/properties/lifestyle-match
export const getLifestyleMatches = async (req, res) => {
  try {
    const { vibe, priority, commute } = req.body;
    
    let query = {};
    let sortOption = { isBoosted: -1, views: -1 }; 

    // Vibe Mapping
    if (vibe === 'urban') {
      query.type = { $in: ['apartment', 'house'] };
      query['valuationMetrics.distanceToTransport'] = { $lte: 5 }; 
    } else if (vibe === 'suburban') {
      query.type = 'house';
      query['valuationMetrics.distanceToTransport'] = { $gte: 5 };
    }

    // Priority Mapping
    if (priority === 'family') {
      query.bedrooms = { $gte: 3 }; 
    } else if (priority === 'nightlife') {
      query.type = 'apartment'; 
    } else if (priority === 'budget') {
      sortOption = { isBoosted: -1, price: 1 }; 
    }

    // Commute Mapping
    if (commute === 'transit') {
      query['valuationMetrics.distanceToTransport'] = { $lte: 2 }; 
    } else if (commute === 'drive') {
      query['valuationMetrics.parkingSpaces'] = { $gte: 1 }; 
    }

    // Execute the dynamically built query
    const matches = await Property.find(query)
      .sort(sortOption)
      .limit(6);

    // Fallback - If the exact lifestyle match is too strict, loosen it
    if (matches.length === 0) {
      const looseMatches = await Property.find({ type: query.type || 'house' })
        .sort(sortOption)
        .limit(6);
      return res.json(looseMatches);
    }

    res.json(matches);
  } catch (error) {
    console.error("Lifestyle Engine Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update property lifecycle status (Admin/System)
// @route   PUT /api/properties/:id/status
export const updatePropertyStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const property = await Property.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!property) return res.status(404).json({ message: 'Property not found' });

    const io = req.app.get('io');

    // Alert the seller that their listing was approved/rejected
    if (status === 'Active' || status === 'Rejected') {
      const newNotif = await Notification.create({
        userId: property.sellerId,
        type: 'system',
        message: `📢 Your listing "${property.title}" is now ${status}.`,
        link: '/dashboard/listings'
      });
      // REAL-TIME - Push notification directly to the Seller
      io.to(property.sellerId.toString()).emit('new_notification', newNotif);
    }

    // REAL-TIME - Broadcast global status change to anyone looking at this property
    io.emit('property_status_updated', { propertyId: property._id, status: property.status });

    res.json(property);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
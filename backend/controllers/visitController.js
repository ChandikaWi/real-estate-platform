import Visit from '../models/Visit.js';
import Property from '../models/Property.js';

// @desc    Create a new visit request
// @route   POST /api/visits
export const createVisit = async (req, res) => {
  try {
    const { propertyId, date, timeSlot } = req.body;
    const property = await Property.findById(propertyId);
    
    if (!property) return res.status(404).json({ message: 'Property not found' });

    // Check if buyer already requested this exact slot
    const existingVisit = await Visit.findOne({ propertyId, buyerId: req.user._id, date, timeSlot });
    if (existingVisit) {
      return res.status(400).json({ message: 'You have already requested this time slot.' });
    }

    const visit = await Visit.create({
      propertyId,
      buyerId: req.user._id,
      sellerId: property.sellerId,
      date,
      timeSlot
    });

    res.status(201).json(visit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get visits for logged-in buyer
// @route   GET /api/visits/buyer
export const getBuyerVisits = async (req, res) => {
  try {
    const visits = await Visit.find({ buyerId: req.user._id })
      .populate('propertyId', 'title images location')
      .populate('sellerId', 'name phoneNumber')
      .sort({ date: 1 });
    res.json(visits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get visits for logged-in seller
// @route   GET /api/visits/seller
export const getSellerVisits = async (req, res) => {
  try {
    const visits = await Visit.find({ sellerId: req.user._id })
      .populate('propertyId', 'title')
      .populate('buyerId', 'name email phoneNumber profilePhoto')
      .sort({ date: 1 });
    res.json(visits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update visit status (Accept/Reject)
// @route   PUT /api/visits/:id/status
export const updateVisitStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const visit = await Visit.findById(req.params.id);

    if (!visit) return res.status(404).json({ message: 'Visit not found' });
    if (visit.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized action' });
    }

    visit.status = status;
    await visit.save();
    
    // Return populated data so UI updates smoothly
    const updatedVisit = await Visit.findById(visit._id)
      .populate('propertyId', 'title')
      .populate('buyerId', 'name email phoneNumber profilePhoto');

    res.json(updatedVisit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete/Cancel a visit (Buyer)
// @route   DELETE /api/visits/:id
export const deleteVisit = async (req, res) => {
  try {
    const visit = await Visit.findById(req.params.id);
    if (!visit) return res.status(404).json({ message: 'Visit not found' });
    
    if (visit.buyerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized action' });
    }

    await visit.deleteOne();
    res.json({ message: 'Visit cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
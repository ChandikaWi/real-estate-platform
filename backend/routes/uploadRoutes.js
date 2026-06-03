import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';
import { protect, authorize } from '../middleware/authMiddleware.js';

dotenv.config();

// Cloudinary credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage engine
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'real-estate-properties', // The folder name in Cloudinary account
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  },
});

const upload = multer({ storage });
const router = express.Router();

// @desc    Upload multiple images
// @route   POST /api/upload
// @access  Private (Seller/Admin)
router.post('/', protect, authorize('seller', 'admin'), upload.array('images', 5), (req, res) => {
  try {
    // req.files contains the uploaded file objects provided by multer
    const imageUrls = req.files.map((file) => file.path);
    res.status(200).json(imageUrls);
  } catch (error) {
    res.status(500).json({ message: 'Failed to upload images' });
  }
});

export default router;
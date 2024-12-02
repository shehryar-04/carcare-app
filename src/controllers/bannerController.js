const bannerService = require('../services/bannerService');
const handleErrorResponse = (res, error, message) =>
  res.status(500).json({ error: message + error.message });

// Create a new banner
exports.createBanner = async (req, res) => {
  try {
    const {image } = req.body;
    await bannerService.createBanner(image);
    res.status(201).json({ message: 'Banner created successfully.' });
  } catch (error) {
    handleErrorResponse(res, error, 'Error creating banner');
  }
};

// Get a single banner by ID
exports.getBannerById = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await bannerService.getBannerById(id);
    res.status(200).json(banner);
  } catch (error) {
    handleErrorResponse(res, error, 'Error retrieving banner');
  }
};

// Get all banners
exports.getAllBanners = async (req, res) => {
  try {
    const banners = await bannerService.getAllBanners();
    res.status(200).json(banners);
  } catch (error) {
    handleErrorResponse(res, error, 'Error retrieving banners');
  }
};

// Update a banner
exports.updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
  
    const file = req.file;
    await bannerService.updateBanner(id, file);
    res.status(200).json({ message: 'Banner updated successfully.' });
  } catch (error) {
    handleErrorResponse(res, error, 'Error updating banner');
  }
};

// Delete a banner
exports.deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    await bannerService.deleteBanner(id);
    res.status(200).json({ message: 'Banner deleted successfully.' });
  } catch (error) {
    handleErrorResponse(res, error, 'Error deleting banner');
  }
};

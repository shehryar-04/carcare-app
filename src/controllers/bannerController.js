const bannerService = require('../services/bannerService');
const handleErrorResponse = (res, error, message) =>
  res.status(500).json({ error: message + error.message });

// Create a new banner
exports.createBanner = async (req, res) => {
  try {
    const { title, description, link, image } = req.body;
    await bannerService.createBanner(title, description, link, image);
    res.status(201).send('Banner created successfully.');
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
    const { title, description, link } = req.body;
    const file = req.file;
    await bannerService.updateBanner(id, title, description, link, file);
    res.status(200).send('Banner updated successfully.');
  } catch (error) {
    handleErrorResponse(res, error, 'Error updating banner');
  }
};

// Delete a banner
exports.deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    await bannerService.deleteBanner(id);
    res.status(200).send('Banner deleted successfully.');
  } catch (error) {
    handleErrorResponse(res, error, 'Error deleting banner');
  }
};

const wishlistService = require('../services/wishlistService');
const handleErrorResponse = (res, error, message) =>
  res.status(500).json({ error: message + error.message });

// Add a product to wishlist.
exports.createWishlist = async (req, res) => {
  try {
    const { userId, productId } = req.body;
    await wishlistService.addWishList(userId, productId);
    res.status(201).send('Product added to wishlist successfully.');
  } catch (error) {
    handleErrorResponse(res, error, 'Error adding wishlist');
  }
};

// Get user wishlist by userId
exports.getWishlistByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const wishlist = await wishlistService.wishlistByUserId(userId);
    res.status(200).json(wishlist);
  } catch (error) {
    handleErrorResponse(res, error, 'Error retrieving wishlist');
  }
};

// Delete a product from wishlist
exports.deleteFromWishlist = async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId } = req.body;
    await wishlistService.deleteWishlist(userId, productId);
    res.status(200).send('Product removed successfully from wishlist.');
  } catch (error) {
    handleErrorResponse(res, error, 'Error deleting wishlist');
  }
};

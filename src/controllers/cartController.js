const cartService = require('../services/cartService');
const handleErrorResponse = (res, error, message) =>
  res.status(500).json({ error: message + error.message });

// Add a product to cart.
exports.addToCart = async (req, res) => {
  try {
    const { userId, productId } = req.body;
    await cartService.addToCart(userId, productId);
    res.status(201).send('Product successfully added to cart.');
  } catch (error) {
    handleErrorResponse(res, error, 'Error adding a product to cart');
  }
};

// Get user cart by userId
exports.getCartByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const cart = await cartService.cartByUserId(userId);
    res.status(200).json(cart);
  } catch (error) {
    handleErrorResponse(res, error, 'Error retrieving cart');
  }
};

// Delete a product from cart
exports.deleteFromCart = async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId } = req.body;
    await cartService.deleteCartItem(userId, productId);
    res.status(200).send('Product removed successfully from cart.');
  } catch (error) {
    handleErrorResponse(res, error, 'Error deleting product from cart');
  }
};

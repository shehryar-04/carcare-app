const productService = require('../services/productService');
const handleErrorResponse = (res, error, message) =>
    res.status(500).json({ error: message + error.message });

// Create a new Product
exports.createProduct = async (req, res) => {
    try {
        const { image, price, title, description, category, tags } = req.body;
        await productService.createProduct(image, price, title, description, category, tags);
        res.status(201).json({ message: 'Product created successfully.' });
    } catch (error) {
        handleErrorResponse(res, error, 'Error creating Product');
    }
};

// Get a single product by ID
exports.getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await productService.getProductById(id);
        res.status(200).json(product);
    } catch (error) {
        handleErrorResponse(res, error, 'Error retrieving Product');
    }
};

// Get all Products
exports.getAllProducts = async (req, res) => {
    try {
        const products = await productService.getAllProducts();
        res.status(200).json(products);
    } catch (error) {
        handleErrorResponse(res, error, 'Error retrieving Product');
    }
};

// Update a Product
exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { image, price, title, description, category, tags } = req.body;
        await productService.updateProduct(id, image, price, title, description, category, tags);
        res.status(200).send('Product updated successfully.');
    } catch (error) {
        handleErrorResponse(res, error, 'Error updating Product');
    }
};

// Delete a Product
exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        await productService.deleteProduct(id);
        res.status(200).send('Product deleted successfully.');
    } catch (error) {
        handleErrorResponse(res, error, 'Error deleting Product');
    }
};

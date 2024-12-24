const categoryService = require('../services/categoryService');
const handleErrorResponse = (res, error, message) =>
  res.status(500).json({ error: message + error.message });

// Create a new category
exports.createCategory = async (req, res) => {
  try {
    const { title, image } = req.body;
    await categoryService.createCategory(title, image);
    res.status(201).send('category created successfully.');
  } catch (error) {
    handleErrorResponse(res, error, 'Error creating category');
  }
};

// Get a single category by ID
exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await categoryService.getCategoryById(id);
    res.status(200).json(category);
  } catch (error) {
    handleErrorResponse(res, error, 'Error retrieving category');
  }
};

// Get all categorys
exports.getAllCategories = async (req, res) => {
  try {
    const categorys = await categoryService.getAllCategories();
    res.status(200).json(categorys);
  } catch (error) {
    handleErrorResponse(res, error, 'Error retrieving categories');
  }
};

// Update a category
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, image } = req.body;
    await categoryService.updateCategory(id, title, image);
    res.status(200).send('category updated successfully.');
  } catch (error) {
    handleErrorResponse(res, error, 'Error updating category');
  }
};

// Delete a category
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await categoryService.deleteCategory(id);
    res.status(200).send('category deleted successfully.');
  } catch (error) {
    handleErrorResponse(res, error, 'Error deleting category');
  }
};

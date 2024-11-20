const blogService = require('../services/blogService');
const handleErrorResponse = (res, error, message) =>
  res.status(500).json({ error: message + error.message });

// Create a new blog
exports.createBlog = async (req, res) => {
  try {
    const { title, content, author, image } = req.body;
    await blogService.createBlog(title, content, author, image);
    res.status(201).send('Blog created successfully.');
  } catch (error) {
    handleErrorResponse(res, error, 'Error creating blog');
  }
};

// Get a single blog by ID
exports.getBlogById = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await blogService.getBlogById(id);
    res.status(200).json(blog);
  } catch (error) {
    handleErrorResponse(res, error, 'Error retrieving blog');
  }
};

// Get all blogs
exports.getAllBlogs = async (req, res) => {
  try {
    const blogs = await blogService.getAllBlogs();
    res.status(200).json(blogs);
  } catch (error) {
    handleErrorResponse(res, error, 'Error retrieving blogs');
  }
};

// Update a blog
exports.updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, author, image } = req.body;
    await blogService.updateBlog(id, title, content, author, image);
    res.status(200).send('Blog updated successfully.');
  } catch (error) {
    handleErrorResponse(res, error, 'Error updating blog');
  }
};

// Delete a blog
exports.deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;
    await blogService.deleteBlog(id);
    res.status(200).send('Blog deleted successfully.');
  } catch (error) {
    handleErrorResponse(res, error, 'Error deleting blog');
  }
};

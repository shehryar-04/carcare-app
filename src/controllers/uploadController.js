const fs = require('fs');
const path = require('path');
const handleErrorResponse = (res, error, message) =>
  res.status(500).json({ error: message + error.message });

// Upload image
exports.uploadImage = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }
    const { filename } = req.file;
    const imagePath = `/uploads/images/${filename}`;
    res.status(201).json({message:`Image uploaded successfully: ${imagePath}`});
  } catch (error) {
    handleErrorResponse(res, error, 'Error uploading image');
  }
};

// Get image by filename
exports.getImage = (req, res) => {
  try {
    const { filename } = req.params;
    const imagePath = path.join(__dirname, '../../uploads/images', filename);

    if (fs.existsSync(imagePath)) {
      res.sendFile(imagePath);
    } else {
      res.status(404).json({ error: 'Image not found.' });
    }
  } catch (error) {
    handleErrorResponse(res, error, 'Error retrieving image');
  }
};

// Get all images (list)
exports.getAllImages = (req, res) => {
  try {
    const directoryPath = path.join(__dirname, '../../uploads/images');

    fs.readdir(directoryPath, (err, files) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ error: 'Error retrieving images.' });
      }
      const imagePaths = files.map((file) => `/uploads/images/${file}`);
      res.status(200).json(imagePaths);
    });
  } catch (error) {
    handleErrorResponse(res, error, 'Error retrieving images');
  }
};

// Delete image by filename
exports.deleteImage = (req, res) => {
  try {
    const { filename } = req.params;
    const imagePath = path.join(__dirname, '../../uploads/images', filename);

    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
      res.status(200).json({ message: 'Image deleted successfully.' });
    } else {
      res.status(404).send('Image not found.');
    }
  } catch (error) {
    handleErrorResponse(res, error, 'Error deleting image');
  }
};

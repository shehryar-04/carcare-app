const { admin, db } = require('../config/firebaseconfig');
const handleErrorResponse = (res, error, message) =>
  res.status(500).json({ error: message + error.message });

// create area
exports.createArea = async (req, res) => {
  const { name } = req.body;

  try {
    const areaRef = db.collection('areas').doc();
    await areaRef.set({ name });
    res.status(201).json({ id: areaRef.id });
  } catch (error) {
    handleErrorResponse(res, error, 'Error creating area:');
  }
};

// get all areas
exports.getAllAreas = async (req, res) => {
  try {
    const snapshot = await db.collection('areas').get();
    const areas = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(areas);
  } catch (error) {
    handleErrorResponse(res, error, 'Error retrieving areas:');
  }
};

// get area by id
exports.getAreaById = async (req, res) => {
  const { id } = req.params;

  try {
    const doc = await db.collection('areas').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Area not found' });
    }
    res.status(200).json({ id: doc.id, ...doc.data() });
  } catch (error) {
    handleErrorResponse(res, error, 'Error retrieving area:');
  }
};

// update area
exports.updateArea = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  try {
    await db.collection('areas').doc(id).update({ name });
    res.status(204).json({message: 'Area updated successfully'}); // No content
  } catch (error) {
    handleErrorResponse(res, error, 'Error updating area:');
  }
};

// delete area
exports.deleteArea = async (req, res) => {
  const { id } = req.params;

  try {
    await db.collection('areas').doc(id).delete();
    res.status(204).json({message: 'Area deleted successfully'}); // No content
  } catch (error) {
    handleErrorResponse(res, error, 'Error deleting area:');
  }
};

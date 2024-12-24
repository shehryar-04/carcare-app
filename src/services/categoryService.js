const { db } = require('../config/firebaseconfig');

exports.createCategory = async (title, image) => {
  const categoryData = { title, image, createdAt: new Date() };
  await db.collection('categories').add(categoryData);
};

exports.getCategoryById = async (id) => {
  const categoryRef = db.collection('categories').doc(id);
  const categoryDoc = await categoryRef.get();
  if (!categoryDoc.exists) throw new Error('Category not found');
  return categoryDoc.data();
};

exports.getAllCategories = async () => {
  const categoriesSnapshot = await db.collection('categories').get();
  return categoriesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

exports.updateCategory = async (id, title, image) => {
  const updateData = { title, image, updatedAt: new Date() };
  await db.collection('categories').doc(id).update(updateData);
};

exports.deleteCategory = async (id) => {
  await db.collection('categories').doc(id).delete();
};

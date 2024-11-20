const { db } = require('../config/firebaseconfig');

exports.createBlog = async (title, content, author, image) => {
  const blogData = { title, content, author, image, createdAt: new Date() };
  await db.collection('blogs').add(blogData);
};

exports.getBlogById = async (id) => {
  const blogRef = db.collection('blogs').doc(id);
  const blogDoc = await blogRef.get();
  if (!blogDoc.exists) throw new Error('Blog not found');
  return blogDoc.data();
};

exports.getAllBlogs = async () => {
  const blogsSnapshot = await db.collection('blogs').get();
  return blogsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

exports.updateBlog = async (id, title, content, author, image) => {
  const updateData = { title, content, author, image, updatedAt: new Date() };
  await db.collection('blogs').doc(id).update(updateData);
};

exports.deleteBlog = async (id) => {
  await db.collection('blogs').doc(id).delete();
};

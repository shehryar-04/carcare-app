const { db } = require('../config/firebaseconfig');

exports.createProduct = async (image, price, title, description, category, quantity) => {
    const productData = { image, price, title, description, category, quantity, createdAt: new Date() };
    await db.collection('products').add(productData);
};

exports.getProductById = async (id) => {
    const productRef = db.collection('products').doc(id);
    const productDoc = await productRef.get();
    if (!productDoc.exists) throw new Error('Product not found');
    return productDoc.data();
};

exports.getAllProducts = async () => {
    const productsSnapShot = await db.collection('products').get();
    return productsSnapShot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

exports.updateProduct = async (id, image, price, title, description, category, quantity) => {
    const updateData = { image, price, title, description, category, quantity, updatedAt: new Date() };
    await db.collection('products').doc(id).update(updateData);
};

exports.deleteProduct = async (id) => {
    await db.collection('products').doc(id).delete();
};

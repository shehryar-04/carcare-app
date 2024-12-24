const { db } = require('../config/firebaseconfig');

exports.addToCart = async (userId, productId) => {
  const cartData = { userId, productId, createdAt: new Date() };
  await db.collection('cart').add(cartData);
};

exports.cartByUserId = async (userId) => {
  const cartRef = db.collection('cart').where('userId', '==', userId);
  const cartDoc = await cartRef.get();
  if (!cartDoc.exists) throw new Error('cart have no item');
  return cartDoc.data();
};

exports.deleteCartItem = async (userId, productId) => {
  const cartRef = db.collection('cart');

  const snapshot = await cartRef
    .where('userId', '==', userId)
    .where('productId', '==', productId)
    .get();

  if (snapshot.empty) {
    throw new Error('No matching cart item found');
  }

  snapshot.forEach(async (doc) => {
    await doc.ref.delete();
  });
};

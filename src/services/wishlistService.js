const { db } = require("../config/firebaseconfig");

exports.addWishList = async (userId, productId) => {
  const wishlistData = { userId, productId, createdAt: new Date() };
  await db.collection("wishlists").add(wishlistData);
};

exports.wishlistByUserId = async (userId) => {
  const wishlistRef = db.collection("wishlists").where("userId", "==", userId);
  const wishlistDoc = await wishlistRef.get();
  if (!wishlistDoc.exists) throw new Error("wishlist have no item");
  return wishlistDoc.data();
};

exports.deleteWishlist = async (userId, productId) => {
  const wishlistRef = db.collection("wishlists");

  const snapshot = await wishlistRef
    .where("userId", "==", userId)
    .where("productId", "==", productId)
    .get();

  if (snapshot.empty) {
    throw new Error("No matching wishlist item found");
  }

  snapshot.forEach(async (doc) => {
    await doc.ref.delete();
  });
};

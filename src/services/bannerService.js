const { db } = require('../config/firebaseconfig');

exports.createBanner = async (image) => {
  const bannerData = {  image, createdAt: new Date() };
  await db.collection('banners').add(bannerData);
};

exports.getBannerById = async (id) => {
  const bannerRef = db.collection('banners').doc(id);
  const bannerDoc = await bannerRef.get();
  if (!bannerDoc.exists) throw new Error('Banner not found');
  return bannerDoc.data();
};

exports.getAllBanners = async () => {
  const bannersSnapshot = await db.collection('banners').get();
  return bannersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

exports.updateBanner = async (id,image) => {
  const updateData = {  image, updatedAt: new Date() };
  await db.collection('banners').doc(id).update(updateData);
};

exports.deleteBanner = async (id) => {
  await db.collection('banners').doc(id).delete();
};

const { db } = require('../config/firebaseconfig');

exports.addSubscriber = async (email) => {
  const subscriberData = { email, createdAt: new Date() };
  await db.collection('subscribers').add(subscriberData);
};

exports.getAllSubscribers = async () => {
  const subscribersSnapshot = await db.collection('subscribers').get();
  return subscribersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

exports.getSubscriberByEmail = async (email) => {
  const subscriberSnapshot = await db.collection('subscribers').where('email', '==', email).get();
  return subscriberSnapshot.empty ? null : subscriberSnapshot.docs[0].data();
};
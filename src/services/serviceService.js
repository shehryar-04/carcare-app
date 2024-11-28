const { db } = require('../config/firebaseconfig');

exports.createService = async (name, description,packages,  image,vendorCommission) => {
  const serviceData = { name, packages,description, image,vendorCommission};
  await db.collection('services').add(serviceData);
};

exports.getServiceById = async (id) => {
  const serviceRef = db.collection('services').doc(id);
  const serviceDoc = await serviceRef.get();
  if (!serviceDoc.exists) throw new Error('Service not found');
  return serviceDoc.data();
};

exports.getAllServices = async () => {
  const servicesSnapshot = await db.collection('services').get();
  return servicesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

exports.updateService = async (
  id,
  name,
  heading,
  description,
  buttons,
  image,
  price
) => {
  const updateData = { name, heading, description, buttons, image,  price };
  await db.collection('services').doc(id).update(updateData);
};

exports.deleteService = async (id) => {
  await db.collection('services').doc(id).delete();
};

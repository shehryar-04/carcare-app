const admin = require('firebase-admin');  
const db = admin.firestore();  
  
  
exports.createVendor = async ({ name, email, phoneNumber, location, area,services = null, imageServices = null, profilePicture = null,state=null,rating=5,credits=0 }) => {  
    const vendorRef = db.collection('vendors').doc(); // Automatically generate a new ID  
    await vendorRef.set({  
        name,  
        email: email || null, // Set email to null if not provided  
        phoneNumber,  
        location,  
        area,  
        imageServices,
        profilePicture,
        verification: false, 
        services,
        state,
        rating,
        credits
    });  
    return { id: vendorRef.id, name, email, phoneNumber, location, area, imageServices, profilePicture };  
};  


exports.updateVendor = async (vendorId, updateData) => {  
    const vendorRef = db.collection('vendors').doc(vendorId);  
    await vendorRef.update(updateData);  
};  
  
exports.getVendors = async (verified, area, services) => {  
    let vendorsRef = db.collection('vendors');  
  
    if (verified === 'true' || verified === 'false') {  
        const isVerified = verified === 'true'; // Convert to boolean  
        vendorsRef = vendorsRef.where('verification', '==', isVerified);  
    }  
  
    if (area) {  
        vendorsRef = vendorsRef.where('area', '==', area);  
    }  
  
    if (services) {  
        vendorsRef = vendorsRef.where('services', 'array-contains', services);  
    }  
  
    const vendorsSnapshot = await vendorsRef.get();  
    return vendorsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));  
};  
 
exports.getVendorById = async (vendorId) => {  
    const vendorRef = db.collection('vendors').doc(vendorId);  
    const vendorDoc = await vendorRef.get();  
  
    if (!vendorDoc.exists) {  
        return null; // Return null if vendor does not exist  
    }  
  
    const vendorData = { id: vendorDoc.id, ...vendorDoc.data() };  
  
    // Check if the vendor has any service requests  
    if (vendorData.requestId && Array.isArray(vendorData.requestId)) {  
        const requestPromises = vendorData.requestId.map(async (requestId) => {  
            const requestRef = db.collection('serviceRequests').doc(requestId);  
            const requestDoc = await requestRef.get();  
            return requestDoc.exists ? { id: requestDoc.id, name: requestDoc.data().serviceName,date: requestDoc.data().createdAt,price: requestDoc.data().price,currentLocation: requestDoc.data().currentLocation } : null;  
        });  
  
        // Await all service request promises and filter out any null results  
        vendorData.serviceRequestsData = (await Promise.all(requestPromises)).filter(Boolean);  
    } else {  
        vendorData.serviceRequestsData = []; // Initialize with empty array if no requests  
    }  
  
    return vendorData; // Return vendor data including service requests  
};  

exports.deleteVendor = async (vendorId) => {  
    const vendorRef = db.collection('vendors').doc(vendorId);  
    await vendorRef.delete();  
};  

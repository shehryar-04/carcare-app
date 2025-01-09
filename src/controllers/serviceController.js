const serviceService = require('../services/serviceService');
const { admin, db } = require('../config/firebaseconfig');
const cron = require('node-cron');
const axios = require('axios');
const handleErrorResponse = (res, error, message) =>
  res.status(500).json({ error: message + error.message });

// Create a new service
exports.createService = async (req, res) => {
  try {
    const { name, description,packages, image,vendorCommission,carTypes} = req.body;
    await serviceService.createService(
      name,
      description,
      packages,
      image,
      vendorCommission,
      carTypes
    );
    res.status(201).json({ message: 'Service created successfully.' });
  } catch (error) {
    handleErrorResponse(res, error, 'Error creating service');
  }
};

// Get a single service by ID
exports.getServiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await serviceService.getServiceById(id);
    res.status(200).json(service);
  } catch (error) {
    handleErrorResponse(res, error, 'Error retrieving service');
  }
};

// Get all services
exports.getAllServices = async (req, res) => {
  try {
    const services = await serviceService.getAllServices();
    res.status(200).json(services);
  } catch (error) {
    handleErrorResponse(res, error, 'Error retrieving services');
  }
};

// Update a service
exports.updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if updates object is empty
    if (Object.keys(updates).length === 0) {
      return res.status(400).send('At least one field must be provided for update.');
    }

    // Optional: Validate specific fields if needed (for example, if packages is an array or vendorCommission is a number)
    if (updates.packages && !Array.isArray(updates.packages)) {
      return res.status(400).send('Packages should be an array.');
    }

    if (updates.vendorCommission && typeof updates.vendorCommission !== 'number') {
      return res.status(400).send('Vendor commission should be a number.');
    }

    // Update the service with only the provided fields
    await serviceService.updateService(id, updates);

    res.status(200).json({ message: 'Service updated successfully.' });
  } catch (error) {
    handleErrorResponse(res, error, 'Error updating service');
  }
};


// Delete a service
exports.deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    await serviceService.deleteService(id);
    res.status(200).json({ message: 'Service deleted successfully.' });
  } catch (error) {
    handleErrorResponse(res, error, 'Error deleting service');
  }
};

// Create a new service request
  
exports.requestService = async (req, res) => {  
  try {  
    const {  
      date,  
      time,  
      vehicleNumber,  
      currentLocation,  
      vehicleType,  
      userId,  
      price,  
      area,  
      serviceName,  
      location,  
      vendorId = null,  
      packages,  
      serviceId,  
      serviceType,  
      vendorResponses // Assuming this is now passed in the request body  
    } = req.body;  
  
    // Validate the incoming data  
    if (  
      !date ||  
      !time ||  
      !vehicleNumber ||  
      !currentLocation ||  
      !vehicleType ||  
      !userId ||  
      !price ||  
      !area ||  
      !vendorResponses // Ensure vendorResponses is present  
    ) {  
      return res.status(400).json({ error: 'All fields are required' });  
    }  
    
    //("Vendor Responses:", req.body.vendorResponses);
    const vendorResponsesArray = req.body.vendorResponses;

    // Create a vendorResponses object
    vendorResponses = vendorResponsesArray.reduce((acc, vendor) => {
      acc[vendor.vendorId] = { status: 'active' };
      return acc;
    }, {});
    // Extract vendor IDs from vendorResponses  
    const vendorIds = Object.keys(vendorResponses);  
    // //(vendorIds)
  
    // Fetch vendor data using vendor IDs (pseudo-code, replace with your actual data fetching logic)  
    const vendorDataPromises = vendorIds.map(vendorId => {  
      return getVendorDataById(vendorId); // Replace with your actual function to fetch vendor data  
    });  
  
    // Wait for all vendor data to be fetched  
    // //(vendorDataPromises)
    const vendorDataArray = await Promise.all(vendorDataPromises); 
    // //(vendorDataArray) 
    
    // Filter out vendors that have a valid fcmToken  
    const notifications = vendorDataArray  
      .filter(vendor => vendor && vendor.fcmToken) // Assuming vendor data has fcmToken  
      .map(vendor => ({  
        recipients: vendor.fcmToken,  
        title: 'Service Request Notification',  
        body: `You have a new service request for ${serviceName}.`  
      }));  
      console.log(vendorDataArray);
      // //(notifications)
    // Send notifications to each vendor  
    const notificationPromises = notifications.map(notification => {  
      return axios.post('https://carcarebaked.azurewebsites.net/api/send-notification-token', notification);  
    });  
  
    // Wait for all notifications to be sent  
    await Promise.all(notificationPromises);  
  
    // Create a new service request  
    const bookingDetails = {  
      date,  
      time,  
      vehicleNumber,  
      currentLocation,  
      vehicleType,  
      userId,  
      price,  
      state: 'active',  
      area,  
      serviceName,  
      serviceId,  
      vendorResponses,  
      location,  
      vendorId,  
      packages,  
      createdAt: admin.firestore.FieldValue.serverTimestamp(),  
      expiryTime: Date.now() + (3 * 60 * 1000), // 3 minutes from now  
      serviceType // Store expiry time  
    };  
  
    // Save the request to Firestore  
    const docRef = await db.collection('serviceRequests').add(bookingDetails);  
  
    // Start a timer to check the expiry and update the request  
    setTimeout(async () => {  
      const currentRequest = await db.collection('serviceRequests').doc(docRef.id).get();  
      const serviceRequest = currentRequest.data();  
      if (serviceRequest && serviceRequest.state === 'active' && Date.now() > serviceRequest.expiryTime) {  
        // Update request status to 'cancelled'  
        await db.collection('serviceRequests').doc(docRef.id).update({ state: 'cancelled' });  
        // //(`Service request ${docRef.id} cancelled due to expiry.`);  
      }  
    }, 3 * 60 * 1000); // Run after 3 minutes  
  
    return res.status(201).json({ id: docRef.id, ...bookingDetails });  
  } catch (error) {  
    handleErrorResponse(res, error, 'Error creating service request');  
  }  
};  
  
// Mock function to get vendor data (replace with actual implementation)  
async function getVendorDataById(vendorId) {  
  // Replace this with your actual data fetching logic  
  // For example, if you are using Firestore or another database, you would query it here.  
  const vendorData = await db.collection('vendors').doc(vendorId).get();  
  return vendorData.exists ? vendorData.data() : null;  
}  

// Get all services requests
exports.getServicesRequests = async (req, res) => {
  try {
    const snapshot = await db.collection('serviceRequests').get();
    const serviceRequests = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return res.json(serviceRequests);
  } catch (error) {
    handleErrorResponse(res, error, 'Failed to retrieve service requests');
  }
};

// Get service request by id
exports.getServiceRequestById = async (req, res) => {
  const { id } = req.params;
  try {
    const doc = await db.collection('serviceRequests').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Service request not found' });
    }
    return res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    handleErrorResponse(res, error, 'Failed to retrieve service request');
  }
};

// update service request all fields
exports.updateServiceRequestAllFields = async (req, res) => {
  const { id } = req.params;
  const {
    date,
    time,
    vehicleNumber,
    vehicleType,
    currentLocation
  } = req.body;
  try {
    const docRef = db.collection('serviceRequests').doc(id);
    await docRef.update({
      date,
      time,
      vehicleNumber,
      vehicleType,
      currentLocation
    });
    return res
      .status(200)
      .json({ message: 'Service request updated successfully' });
  } catch (error) {
    handleErrorResponse(res, error, 'Failed to update service request');
  }
};

// update service request
// update service request
exports.updateServiceRequest = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    const docRef = db.collection('serviceRequests').doc(id);
    await docRef.update(updates);

    if (updates.step) {
      const serviceRequestDoc = await docRef.get();
      const userId = serviceRequestDoc.data().userId;
      const userDoc = await db.collection('users').doc(userId).get();
      const fcmToken = userDoc.data().fcmToken;
      return res
        .status(200)
        .json({ message: 'Service request updated successfully', fcmToken });
    }

    return res
      .status(200)
      .json({ message: 'Service request updated successfully' });
  } catch (error) {
    handleErrorResponse(res, error, 'Failed to update service request');
  }
};

// delete service request
exports.deleteServiceRequest = async (req, res) => {
  const { id } = req.params;

  try {
    await db.collection('serviceRequests').doc(id).delete();
    return res.status(204).json({ message: 'Service request deleted successfully' });
  } catch (error) {
    handleErrorResponse(res, error, 'Failed to delete service request');
  }
};

// get service request by userId
exports.getServiceRequestByUserId = async (req, res) => {  
  const { userId } = req.params;  
  try {  
    const snapshot = await db  
      .collection('serviceRequests')  
      .where('userId', '==', userId)  
      .get();  
  
    const serviceRequests = await Promise.all(  
      snapshot.docs.map(async (doc) => {  
        const serviceRequest = {  
          id: doc.id,  
          ...doc.data(),  
        };  
        
        // Make an Axios request to get vendor data using vendorId  
        
        const vendorId = serviceRequest.vendorId;  
        if (!vendorId || vendorId === '') {
          return serviceRequest;  
        }
        // //(vendorId)
        const vendorResponse = await axios.get(`https://carcarebaked.azurewebsites.net/api/vendor/${vendorId}`);  
        const vendorData = vendorResponse.data;  
  
        return { ...serviceRequest, vendorData }; // Return service request with vendor data  
      })  
    );  
  
    return res.json(serviceRequests);  
  } catch (error) {  
    handleErrorResponse(res, error, 'Failed to retrieve service requests');  
  }  
};  
// Get service request by area
exports.getServiceRequestByArea = async (req, res) => {
  const { area } = req.params;
  try {
    const snapshot = await db
      .collection('serviceRequests')
      .where('area', '==', area)
      .get();
    const serviceRequests = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return res.json(serviceRequests);
  } catch (error) {
    handleErrorResponse(res, error, 'Failed to retrieve service requests');
  }
};

exports.getServiceRequestByVendor = async (req, res) => {
  const { vendorId } = req.params;
  try {
    const snapshot = await db
      .collection('serviceRequests')
      .where('vendorId', '==', vendorId)
      .get();
    const serviceRequests = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return res.json(serviceRequests);
  } catch (error) {
    handleErrorResponse(res, error, 'Failed to retrieve service requests');
  }
};
// Accept service request by a vendor
exports.acceptServiceRequest = async (req, res) => {  
  const { requestId, vendorId } = req.params;  
  try {  
      // Start a Firestore transaction  
      await db.runTransaction(async (transaction) => {  
          const requestRef = db.collection('serviceRequests').doc(requestId);  
          const serviceRequestDoc = await transaction.get(requestRef);  

          // Check if the service request exists  
          if (!serviceRequestDoc.exists) {  
              return res.status(404).json({ error: 'Service request not found' });  
          }  

          const serviceRequestData = serviceRequestDoc.data();  

          // Check if this service request has already been accepted by another vendor  
          if (serviceRequestData.vendorId) {  
              return res.status(403).json({  
                  error: 'Service request has already been accepted by another vendor.',  
                  acceptedVendorId: serviceRequestData.vendorId  
              });  
          }  

          // Check if the vendor ID is valid in the service request  
          if (!serviceRequestData.vendorResponses || !serviceRequestData.vendorResponses[vendorId]) {  
              return res.status(404).json({ error: `Vendor ID not found in this service request`, vendorId });  
          }  

          // Update the vendor's response status and the main vendor ID field  
          transaction.update(requestRef, {  
              [`vendorResponses.${vendorId}.status`]: 'pending',  
              vendorId: vendorId, // Set the accepted vendor's ID  
              state: 'pending',  
              step: 'accepted' // Update the step to 'accepted'  
          });  

          // Set the status of all other vendors to 'unactive'  
          Object.keys(serviceRequestData.vendorResponses).forEach((otherVendorId) => {  
              if (otherVendorId !== vendorId) {  
                  transaction.update(requestRef, {  
                      [`vendorResponses.${otherVendorId}.status`]: 'unactive'  
                  });  
              }  
          });  
      });  
      const vendorData = await db.collection('vendors').doc(vendorId).get();
      const vendor = vendorData.data();
      const fcmToken = vendor.fcmToken;
      // Return success message  
      return res.status(200).json({ message: 'Service request accepted successfully', fcmToken });  
  } catch (error) {  
      return res.status(500).json({ error: `Error accepting service request: ${error.message}` });  
  }  
};

// Helper function to check vendor responses and update request state
async function checkAndCancelServiceRequest(requestId) {
  const requestRef = db.collection('serviceRequests').doc(requestId);
  const requestSnapshot = await requestRef.get();
  
  if (!requestSnapshot.exists) {
    // //(`Service request ${requestId} does not exist.`);
    return;
  }

  const serviceRequest = requestSnapshot.data();
  const vendorResponses = serviceRequest.vendorResponses || {};

  // Check if all vendor responses are 'unactive'
  const allVendorsCancelled = Object.values(vendorResponses).every(
    (response) => response.status === 'unactive'
  );

  if (allVendorsCancelled) {
    // Update the request state to 'cancelled'
    await requestRef.update({ state: 'cancelled' });
    //(`Service request ${requestId} updated to 'cancelled' because all vendor responses are 'unactive'.`);
  }
}


// Run a cron job every hour to check for expired or inactive service requests
cron.schedule('0 * * * *', async () => {
  const snapshot = await db.collection('serviceRequests')
    .where('state', '==', 'active')
    .get();

  const now = Date.now();

  snapshot.forEach(async (doc) => {
    const serviceRequest = doc.data();

    // Check for expiry
    if (serviceRequest.expiryTime && now > serviceRequest.expiryTime) {
      // Update request state to 'cancelled'
      await db.collection('serviceRequests').doc(doc.id).update({ state: 'cancelled' });

      // Update all vendor statuses to 'unactive'
      const vendorUpdates = {};
      Object.keys(serviceRequest.vendorResponses).forEach(vendorId => {
        vendorUpdates[`vendorResponses.${vendorId}.status`] = 'unactive';
      });

      await db.collection('serviceRequests').doc(doc.id).update(vendorUpdates);
      //(`Service request ${doc.id} cancelled due to expiry.`);
    }

    // Check if all vendors are inactive and update request status if necessary
    await checkAndCancelServiceRequest(doc.id);
  });
});
// Vendor cancels their participation in a service request
exports.cancelServiceRequest = async (req, res) => {  
  const { requestId, vendorId } = req.params;  

  try {  
      await db.runTransaction(async (transaction) => {  
          const requestRef = db.collection('serviceRequests').doc(requestId);  
          const serviceRequestDoc = await transaction.get(requestRef);  

          if (!serviceRequestDoc.exists) {  
              return res.status(404).json({ error: 'Service request not found' });  
          }  

          const serviceRequestData = serviceRequestDoc.data();  

          if (!serviceRequestData.vendorResponses || !serviceRequestData.vendorResponses[vendorId]) {  
              return res.status(404).json({ error: `Vendor ID not found in this service request`, vendorId });  
          }  

          // Update the vendor's response status to 'inactive'  
          transaction.update(requestRef, {  
              [`vendorResponses.${vendorId}.status`]: 'inactive'  
          });  

          // Check if all vendor responses are now 'inactive'  
          const allVendorsCancelled = Object.values(serviceRequestData.vendorResponses).every(  
              (response) => response.status === 'inactive'  
          );  

          if (allVendorsCancelled) {  
              transaction.update(requestRef, { state: 'cancelled' });  
          }  

          const vendorRef = db.collection('vendors').doc(vendorId);  
          const cancellationDetails = {  
              requestId: requestId,  
              cancelledDate: new Date(), // capturing the cancellation date  
              serviceRequestDetails: serviceRequestData // storing the entire service request data  
          };  

          // Update the vendor's data to include detailed cancellation information  
          transaction.update(vendorRef, {  
              cancelledServiceRequests: admin.firestore.FieldValue.arrayUnion(cancellationDetails)  
          });  
      });  

      return res.status(200).json({ message: 'Vendor cancelled service request successfully' });  
  } catch (error) {  
      return res.status(500).json({ error: `Error cancelling service request: ${error.message}` });  
  }  
};  
// User cancels their service request
exports.cancelServiceRequestByUser = async (req, res) => {
  const { requestId, userId } = req.params;
  try {
    // Start a Firestore transaction to ensure data consistency
    await db.runTransaction(async (transaction) => {
      const requestRef = db.collection('serviceRequests').doc(requestId);
      const serviceRequestDoc = await transaction.get(requestRef);

      // Check if the service request exists
      if (!serviceRequestDoc.exists) {
        return res.status(404).json({ error: 'Service request not found' });
      }

      const serviceRequestData = serviceRequestDoc.data();

      // Check if the user ID matches the service request's userId
      if (serviceRequestData.userId !== userId) {
        return res.status(403).json({ error: 'Unauthorized: User ID does not match the service request owner.' });
      }

      // Update the service request state to 'cancelled by user'
      transaction.update(requestRef, { state: 'cancelled by user' });

      // Optionally, update vendor statuses to 'unactive' if applicable
      const vendorUpdates = {};
      Object.keys(serviceRequestData.vendorResponses || {}).forEach(vendorId => {
        vendorUpdates[`vendorResponses.${vendorId}.status`] = 'unactive';
      });
      transaction.update(requestRef, vendorUpdates);
    });

    // Return success message
    return res.status(200).json({ message: 'Service request cancelled by user successfully', });
  } catch (error) {
    return res.status(500).json({ error: `Error cancelling service request by user: ${error.message}` });
  }
};


exports.completeServiceRequest = async (req, res) => {  
  const { userId, vendorId, serviceRequestId } = req.params; // Request parameters  
  const { servicePerformed, userRating, singleService } = req.body; // Inputs from user  
  
  try {  
    // Start a Firestore transaction  
    await db.runTransaction(async (transaction) => {  
      const requestRef = db.collection("serviceRequests").doc(serviceRequestId);  
      const vendorRef = db.collection("vendors").doc(vendorId);  
      const serviceRequestDoc = await transaction.get(requestRef);  
  
      // Validate service request  
      if (!serviceRequestDoc.exists) {  
        throw new Error("Service request not found");  
      }  
      const serviceRequestData = serviceRequestDoc.data();  
  
      // Validate user and vendor involvement  
      if (serviceRequestData.userId !== userId) {  
        throw new Error("Unauthorized: User ID does not match the service request owner");  
      }  
      if (!Object.keys(serviceRequestData.vendorResponses).includes(vendorId)) {  
        throw new Error("Unauthorized: Vendor ID is not one of the responding vendors");  
      }  
  
      // Ensure service request state allows completion  
      if (serviceRequestData.state !== "pending") {  
        throw new Error("Service request is not pending");  
      }  
  
      // Fetch vendor data  
      const vendorDoc = await transaction.get(vendorRef);  
      if (!vendorDoc.exists) {  
        throw new Error("Vendor not found");  
      }  
      const vendorData = vendorDoc.data();  
      
      // Get service details  
      const serviceId = serviceRequestData.serviceId; // Extract service ID from service request data  
      const serviceRef = db.collection("services").doc(serviceId);  
      const serviceDoc = await transaction.get(serviceRef);  
      if (!serviceDoc.exists) {  
        throw new Error("Service details not found");  
      }  
      const serviceData = serviceDoc.data();  
  
      // Extract vendor commission percentage  
      const vendorCommission = serviceData.vendorCommission;  
      if (vendorCommission === undefined) {  
        throw new Error("Vendor commission information is missing");  
      }  
  
      // Calculate vendor earnings  
      const servicePrice = serviceRequestData.price;  
      const vendorEarnings = (servicePrice * vendorCommission) / 100;  
  
      // Update service request based on servicePerformed  
      const updates = {};  
      let packagesRemaining = serviceRequestData.packages; // Keep current packages count  
  
      if (servicePerformed) {
        if (!singleService) {
          packagesRemaining -= 1; // Subtract 1 from packages only if not single service
          if (packagesRemaining > 0) {
            // Reset the state to "accepted" since there are more packages remaining
            updates.state = "pending";
            updates.packages = packagesRemaining;
            updates.step ="accepted"  // Update packages remaining
          } else {
            // No packages remaining, mark as completed
            updates.state = "completed";
            updates.step = "complete";
            updates.completedAt = Date.now();
          }
        }
      } else {
        // If service was not performed
        if (singleService || packagesRemaining <= 1) {
          // Do not decrement packages or change state if it's a single service or if there is only one package remaining
          // Log the condition to indicate service was not performed
          updates.message = "Service was not performed.";
        } else {
          // Only mark as not performed if not singleService and packages are more than 1
          updates.state = "not performed";
          // Penalize vendor for non-performance
          const penaltyRating = Math.max(0, (vendorData.rating || 0) - 0.5);
          transaction.update(vendorRef, {
            rating: penaltyRating,
            incompleteRequests: admin.firestore.FieldValue.increment(1),
          });
        }
      }
      
      // Update the service request only if there are updates  
      if (Object.keys(updates).length > 0) {  
        transaction.update(requestRef, updates);  
      }  
  
      // Update vendor's rating and credits  
      if (userRating !== undefined) {  
        const newRating =  
          ((vendorData.rating || 0) * (vendorData.ratingCount || 0) + userRating) /  
          ((vendorData.ratingCount || 0) + 1);  
        transaction.update(vendorRef, {  
          rating: newRating,  
          ratingCount: admin.firestore.FieldValue.increment(1),  
          completedRequests: admin.firestore.FieldValue.increment(1),  
          credits: admin.firestore.FieldValue.increment(vendorEarnings), // Add credits  
        });  
      } else {  
        transaction.update(vendorRef, {  
          credits: admin.firestore.FieldValue.increment(vendorEarnings), // Add credits  
        });  
      }  
  
      // Log the completion and vendor commission  
      db.collection("logs").add({  
        type: "serviceCompletion",  
        userId: userId,  
        vendorId: vendorId,  
        serviceRequestId: serviceRequestId,  
        serviceName: serviceData.name, // Use service name from service data  
        servicePrice: servicePrice,  
        vendorCommission: vendorCommission,  
        vendorEarnings: vendorEarnings,  
        log: `Service request ${serviceRequestId} processed. Vendor earned ${vendorEarnings} credits.`,  
      });  
  
      // Respond based on the number of remaining packages  
      if (singleService) {  
        return res.status(200).json({  
          message: "Service was not performed.",  
          remainingServices: packagesRemaining, // Indicate the number of remaining services  
        });  
      } else if (packagesRemaining <= 0) {  
        return res.status(200).json({ message: "All services are completed" });  
      } else {  
        return res.status(200).json({  
          message: `${packagesRemaining} services remaining`,  
          times: packagesRemaining,  
          serviceName: serviceData.name, // Pass the service name in the response  
        });  
      }  
    });  
  } catch (error) {  
    console.error("Error completing service request:", error.message);  
    return res.status(500).json({  
      error: `Error completing service request: ${error.message}`,  
    });  
  }  
};  
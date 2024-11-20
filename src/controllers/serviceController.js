const serviceService = require('../services/serviceService');
const { admin, db } = require('../config/firebaseconfig');
const cron = require('node-cron');
const axios = require('axios');
const handleErrorResponse = (res, error, message) =>
  res.status(500).json({ error: message + error.message });

// Create a new service
exports.createService = async (req, res) => {
  try {
    const { name, heading, description, buttons, image,price,vendorCommission } = req.body;
    await serviceService.createService(
      name,
      heading,
      description,
      buttons,
      image,
      price,
      vendorCommission
    );
    res.status(201).send('Service created successfully.');
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
    const { name, heading, description, buttons, image } = req.body;
    await serviceService.updateService(
      id,
      name,
      heading,
      description,
      buttons,
      image
    );
    res.status(200).send('Service updated successfully.');
  } catch (error) {
    handleErrorResponse(res, error, 'Error updating service');
  }
};

// Delete a service
exports.deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    await serviceService.deleteService(id);
    res.status(200).send('Service deleted successfully.');
  } catch (error) {
    handleErrorResponse(res, error, 'Error deleting service');
  }
};

// Create a new service request
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
      vendorData,
      location,
      vendorId = null,
      packages
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
      !area
    ) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const vendorResponses = {};
    vendorData.forEach((vendor) => {
      vendorResponses[vendor.vendorId] = { status: 'pending' };
    });

    const expiryTime = Date.now() + (3* 60 * 1000); // 24 hours from now

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
      vendorResponses,
      location,
      vendorId,
      packages,
      createdAt:  admin.firestore.FieldValue.serverTimestamp(),
      expiryTime, // Store expiry time
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

        // Set all vendor responses to 'unactive'
        const vendorUpdates = {};
        Object.keys(serviceRequest.vendorResponses).forEach(vendorId => {
          vendorUpdates[`vendorResponses.${vendorId}.status`] = 'unactive';
        });

        await db.collection('serviceRequests').doc(docRef.id).update(vendorUpdates);
        console.log(`Service request ${docRef.id} cancelled due to expiry.`);
      }
    }, 3* 60 * 1000); // Run after 24 hours

    return res.status(201).json({ id: docRef.id, ...bookingDetails });
  } catch (error) {
    handleErrorResponse(res, error, 'Error creating service request');
  }
};

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
    state,
    vendorId
  } = req.body;
  try {
    const docRef = db.collection('serviceRequests').doc(id);
    await docRef.update({
      date,
      time,
      vehicleNumber,
      vehicleType,
      state,
      vendorId
    });
    return res
      .status(200)
      .json({ message: 'Service request updated successfully' });
  } catch (error) {
    handleErrorResponse(res, error, 'Failed to update service request');
  }
};

// update service request
exports.updateServiceRequest = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    const docRef = db.collection('serviceRequests').doc(id);
    await docRef.update(updates);
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
    return res.status(204).send();
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
        console.log(vendorId)
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
  
      // Get the service data to retrieve the vendor commission percentage  
      const serviceDoc = await db.collection('services').doc(serviceRequestData.serviceId).get();  
      if (!serviceDoc.exists) {  
        return res.status(404).json({ error: 'Service not found' });  
      }  
  
      const serviceData = serviceDoc.data();  
      const vendorCommissionPercentage = serviceData.vendorCommission; // Assuming vendorCommission is a percentage (e.g., 10 for 10%)  
  
      // Calculate the commission amount based on the service request price  
      const commissionAmount = (serviceRequestData.price * vendorCommissionPercentage) / 100;  
  
      // Update the vendor's response status and the main vendor ID field  
      transaction.update(requestRef, {  
        [`vendorResponses.${vendorId}.status`]: 'pending',  
        vendorId: vendorId, // Set the accepted vendor's ID  
        state: 'pending'  
      });  
  
      // Update the vendor's credits with the commission amount  
      const vendorRef = db.collection('vendors').doc(vendorId);  
      transaction.update(vendorRef, {  
        credits: admin.firestore.FieldValue.increment(commissionAmount) // Increment the vendor's credits by the commission amount  
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
  
    // Return success message  
    return res.status(200).json({ message: 'Service request accepted successfully' });  
  } catch (error) {  
    // Handle error  
    return res.status(500).json({ error: `Error accepting service request: ${error.message}` });  
  }  
};  

// Helper function to check vendor responses and update request state
async function checkAndCancelServiceRequest(requestId) {
  const requestRef = db.collection('serviceRequests').doc(requestId);
  const requestSnapshot = await requestRef.get();
  
  if (!requestSnapshot.exists) {
    console.log(`Service request ${requestId} does not exist.`);
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
    console.log(`Service request ${requestId} updated to 'cancelled' because all vendor responses are 'unactive'.`);
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
      console.log(`Service request ${doc.id} cancelled due to expiry.`);
    }

    // Check if all vendors are inactive and update request status if necessary
    await checkAndCancelServiceRequest(doc.id);
  });
});
// Vendor cancels their participation in a service request
exports.cancelServiceRequest = async (req, res) => {  
  const { requestId, vendorId } = req.params;  
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

          // Check if the vendor ID is valid in the service request  
          if (!serviceRequestData.vendorResponses || !serviceRequestData.vendorResponses[vendorId]) {  
              return res.status(404).json({ error: `Vendor ID not found in this service request`, vendorId });  
          }  

          // Update the vendor's response status to 'unactive'  
          transaction.update(requestRef, {  
              [`vendorResponses.${vendorId}.status`]: 'unactive'  
          });  

          // Check if all vendor responses are now 'unactive'  
          const allVendorsCancelled = Object.values(serviceRequestData.vendorResponses).every(  
              (response) => response.status === 'unactive'  
          );  

          // If all vendors have cancelled, update the service request state to 'cancelled'  
          if (allVendorsCancelled) {  
              transaction.update(requestRef, { state: 'cancelled' });  
          }  

          // Update the vendor's data to reflect the cancellation  
          const vendorRef = db.collection('vendors').doc(vendorId);  
            
          // Use Firestore's FieldValue to add the requestId to the serviceRequests array  
          transaction.update(vendorRef, {  
              serviceRequests: admin.firestore.FieldValue.arrayUnion(requestId) // Add requestId to the serviceRequests array  
          });  
      });  

      // Return success message  
      return res.status(200).json({ message: 'Vendor cancelled service request successfully' });  
  } catch (error) {  
      // Handle error  
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
    return res.status(200).json({ message: 'Service request cancelled by user successfully' });
  } catch (error) {
    return res.status(500).json({ error: `Error cancelling service request by user: ${error.message}` });
  }
};
exports.completeServiceRequest = async (req, res) => {
  const { userId, vendorId, serviceRequestId } = req.params; // Request parameters
  const { servicePerformed, userRating } = req.body; // Inputs from user

  try {
    // Start a Firestore transaction
    await db.runTransaction(async (transaction) => {
      const requestRef = db.collection('serviceRequests').doc(serviceRequestId);
      const vendorRef = db.collection('vendors').doc(vendorId);
      const userRef = db.collection('users').doc(userId);

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
      // if (serviceRequestData.vendorResponses[vendorId].vendorId !== vendorId) {
      //   throw new Error("Unauthorized: Vendor ID does not match the assigned vendor for this service request");
      // }
      
      if (!Object.keys(serviceRequestData.vendorResponses).includes(vendorId)) {
        throw new Error("Unauthorized: Vendor ID is not one of the responding vendors");
      }
      

      // Ensure service request state allows completion
      if (serviceRequestData.state !== 'pending') {
        throw new Error("Service request is not active or pending");
      }

      // Fetch vendor data
      const vendorDoc = await transaction.get(vendorRef);
      if (!vendorDoc.exists) {
        throw new Error("Vendor not found");
      }

      const vendorData = vendorDoc.data();

      // Update service request based on servicePerformed
      const updates = {};
      if (servicePerformed) {
        updates.state = "completed";
        updates.completedAt = Date.now();

        // Update vendor's rating
        if (userRating !== undefined) {
          const newRating =
            ((vendorData.rating || 0) * (vendorData.ratingCount || 0) + userRating) /
            ((vendorData.ratingCount || 0) + 1);

          transaction.update(vendorRef, {
            rating: newRating,
            ratingCount: admin.firestore.FieldValue.increment(1),
            completedRequests: admin.firestore.FieldValue.increment(1),
          });
        }
      } else {
        updates.state = "not performed";

        // Penalize vendor for non-performance
        const penaltyRating = Math.max(0, (vendorData.rating || 0) - 0.5);

        transaction.update(vendorRef, {
          rating: penaltyRating,
          incompleteRequests: admin.firestore.FieldValue.increment(1),
        });
      }

      // Apply updates to service request
      transaction.update(requestRef, updates);

      // Log the completion
      console.log(
        `Service request ${serviceRequestId} marked as ${updates.state}`
      );
    });

    // Respond with success message
    return res.status(200).json({
      message: "Service request processed successfully",
    });
  } catch (error) {
    console.error("Error completing service request:", error.message);
    return res.status(500).json({
      error: `Error completing service request: ${error.message}`,
    });
  }
};
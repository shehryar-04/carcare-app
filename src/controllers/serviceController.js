const serviceService = require("../services/serviceService");
const { admin, db } = require("../config/firebaseconfig");
const cron = require("node-cron");
const axios = require("axios");
const handleErrorResponse = (res, error, message) =>
  res.status(500).json({ error: message + error.message });

// Create a new service
exports.createService = async (req, res) => {
  try {
    const { name, description, packages, image, vendorCommission, carTypes } =
      req.body;
    await serviceService.createService(
      name,
      description,
      packages,
      image,
      vendorCommission,
      carTypes
    );
    res.status(201).json({ message: "Service created successfully." });
  } catch (error) {
    handleErrorResponse(res, error, "Error creating service");
  }
};

// Get a single service by ID
exports.getServiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await serviceService.getServiceById(id);
    res.status(200).json(service);
  } catch (error) {
    handleErrorResponse(res, error, "Error retrieving service");
  }
};

// Get all services
exports.getAllServices = async (req, res) => {
  try {
    const services = await serviceService.getAllServices();
    res.status(200).json(services);
  } catch (error) {
    handleErrorResponse(res, error, "Error retrieving services");
  }
};

// Update a service
exports.updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if updates object is empty
    if (Object.keys(updates).length === 0) {
      return res
        .status(400)
        .send("At least one field must be provided for update.");
    }

    // Optional: Validate specific fields if needed (for example, if packages is an array or vendorCommission is a number)
    if (updates.packages && !Array.isArray(updates.packages)) {
      return res.status(400).send("Packages should be an array.");
    }

    if (
      updates.vendorCommission &&
      typeof updates.vendorCommission !== "number"
    ) {
      return res.status(400).send("Vendor commission should be a number.");
    }

    // Update the service with only the provided fields
    await serviceService.updateService(id, updates);

    res.status(200).json({ message: "Service updated successfully." });
  } catch (error) {
    handleErrorResponse(res, error, "Error updating service");
  }
};

// Delete a service
exports.deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    await serviceService.deleteService(id);
    res.status(200).json({ message: "Service deleted successfully." });
  } catch (error) {
    handleErrorResponse(res, error, "Error deleting service");
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
      vendorResponsesArray, // Assuming this is passed in the request body
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
      !vendorResponsesArray // Ensure vendorResponsesArray is present
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Validate date format mm/dd/yy
    const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ error: "Invalid date format. Use mm/dd/yy." });
    }

    // Parse the date from mm/dd/yy
    const [monthStr, dayStr, yearStr] = date.split('/');
    const month = Number(monthStr);
    const day = Number(dayStr);
    const year = Number(yearStr);
    // Assumption: the year in the provided date is a two-digit year representing 20YY.
    const inputDate = new Date(2000 + year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of the day

    // Check if the date is today or after today
    if (inputDate < today) {
      return res.status(400).json({ error: "Date must be today or after today." });
    }

    // Create a vendorResponses object
    let vendorResponses = vendorResponsesArray.reduce((acc, vendor) => {
      acc[vendor.vendorId] = { status: "pending" };
      return acc;
    }, {});

    // Extract vendor IDs from vendorResponses
    const vendorIds = Object.keys(vendorResponses);

    // Fetch vendor data using vendor IDs
    const vendorDataPromises = vendorIds.map((vendorId) => {
      return getVendorDataById(vendorId); // Replace with your actual function to fetch vendor data
    });

    // Wait for all vendor data to be fetched
    const vendorDataArray = await Promise.all(vendorDataPromises);

    // Filter out vendors that have a valid fcmToken
    const notifications = vendorDataArray
      .filter((vendor) => vendor && vendor.fcmToken) // Assuming vendor data has fcmToken
      .map((vendor) => ({
        recipients: vendor.fcmToken,
        title: "Service Request Notification",
        body: `You have a new service request for ${serviceName}.`,
      }));

    // Send notifications to each vendor
    const notificationPromises = notifications.map((notification) => {
      return axios.post(
        "http://localhost:4000/api/send-notification-token",
        notification
      );
    });

    // Wait for all notifications to be sent
    await Promise.all(notificationPromises);

    // Create an array of date objects based on the number of packages
// Create an array of date objects based on the number of packages, excluding Sundays
const startDate = new Date(inputDate); // already parsed from mm/dd/yy
const dateArray = [];
let i = 0;

while (dateArray.length < packages) {
  const nextDate = new Date(startDate);
  nextDate.setDate(startDate.getDate() + i); // Add i days to the start date

  if (nextDate.getDay() !== 0) { // Exclude Sundays (0 = Sunday)
    const formattedDate = `${String(nextDate.getMonth() + 1).padStart(2, "0")}/${String(nextDate.getDate()).padStart(2, "0")}/${String(nextDate.getFullYear()).slice(-2)}`;

    dateArray.push({
      date: formattedDate,
      status: "pending", // Adding a status field to each date object
    });
  }
  i++; // Increment to check the next day
}


    // Calculate expiryTime using the last date in dateArray.
    // Since our dateArray dates are in mm/dd/yy format, we parse them accordingly.
    const lastDateStr = dateArray[dateArray.length - 1].date;
    const [lastMonth, lastDay, lastYearStr] = lastDateStr.split('/');
    const lastYear = Number(lastYearStr);
    const expiryDate = new Date(2000 + lastYear, Number(lastMonth) - 1, Number(lastDay));
    // Adding 6 hours (6 * 60 * 60 * 1000) to the expiry time
    const expiryTime = expiryDate.getTime() + 6 * 60 * 60 * 1000;

    // Create a new service request
    const bookingDetails = {
      dates: dateArray, // Use the array of date objects formatted as mm/dd/yy
      time,
      vehicleNumber,
      currentLocation,
      vehicleType,
      userId,
      price,
      state: "active",
      area,
      serviceName,
      serviceId,
      vendorResponses,
      location,
      vendorId,
      packages,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiryTime, // Expiry time computed above
      serviceType,
    };

    // Save the request to Firestore
    const docRef = await db.collection("serviceRequests").add(bookingDetails);

    // Start a timer to check the expiry and update the request
    setTimeout(async () => {
      const currentRequest = await db
        .collection("serviceRequests")
        .doc(docRef.id)
        .get();
      const serviceRequest = currentRequest.data();
      if (
        serviceRequest &&
        serviceRequest.state === "active" &&
        Date.now() > serviceRequest.expiryTime
      ) {
        // Update request status to 'cancelled'
        await db
          .collection("serviceRequests")
          .doc(docRef.id)
          .update({ state: "cancelled" });
      }
    }, 120 * 60 * 1000); // Run after 120 minutes

    return res.status(201).json({ id: docRef.id, ...bookingDetails });
  } catch (error) {
    handleErrorResponse(res, error, "Error creating service request");
  }
};


// Mock function to get vendor data (replace with actual implementation)
async function getVendorDataById(vendorId) {
  const vendorData = await db.collection("vendors").doc(vendorId).get();
  return vendorData.exists ? vendorData.data() : null;
}
// Get all services requests
exports.getServicesRequests = async (req, res) => {
  try {
    const snapshot = await db.collection("serviceRequests").get();
    const serviceRequests = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return res.json(serviceRequests);
  } catch (error) {
    handleErrorResponse(res, error, "Failed to retrieve service requests");
  }
};

// Get service request by id
exports.getServiceRequestById = async (req, res) => {
  const { id } = req.params;
  try {
    const doc = await db.collection("serviceRequests").doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Service request not found" });
    }
    return res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    handleErrorResponse(res, error, "Failed to retrieve service request");
  }
};

// update service request all fields
exports.updateServiceRequestAllFields = async (req, res) => {
  const { id } = req.params;
  const { date, time, vehicleNumber, vehicleType, currentLocation } = req.body;
  try {
    const docRef = db.collection("serviceRequests").doc(id);
    await docRef.update({
      date,
      time,
      vehicleNumber,
      vehicleType,
      currentLocation,
    });
    return res
      .status(200)
      .json({ message: "Service request updated successfully" });
  } catch (error) {
    handleErrorResponse(res, error, "Failed to update service request");
  }
};

// update service request
// update service request
exports.updateServiceRequest = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    const docRef = db.collection("serviceRequests").doc(id);
    await docRef.update(updates);

    if (updates.step) {
      const serviceRequestDoc = await docRef.get();
      const userId = serviceRequestDoc.data().userId;
      const userDoc = await db.collection("users").doc(userId).get();
      const fcmToken = userDoc.data().fcmToken;
      return res
        .status(200)
        .json({ message: "Service request updated successfully", fcmToken });
    }

    return res
      .status(200)
      .json({ message: "Service request updated successfully" });
  } catch (error) {
    handleErrorResponse(res, error, "Failed to update service request");
  }
};

// delete service request
exports.deleteServiceRequest = async (req, res) => {
  const { id } = req.params;

  try {
    await db.collection("serviceRequests").doc(id).delete();
    return res
      .status(204)
      .json({ message: "Service request deleted successfully" });
  } catch (error) {
    handleErrorResponse(res, error, "Failed to delete service request");
  }
};

// get service request by userId
exports.getServiceRequestByUserId = async (req, res) => {
  const { userId } = req.params;
  try {
    const snapshot = await db
      .collection("serviceRequests")
      .where("userId", "==", userId)
      .get();

    const serviceRequests = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const serviceRequest = {
          id: doc.id,
          ...doc.data(),
        };

        // Make an Axios request to get vendor data using vendorId

        const vendorId = serviceRequest.vendorId;
        if (!vendorId || vendorId === "") {
          return serviceRequest;
        }
        // //(vendorId)
        const vendorResponse = await axios.get(
          `http://localhost:4000/api/vendor/${vendorId}`
        );
        const vendorData = vendorResponse.data;

        return { ...serviceRequest, vendorData }; // Return service request with vendor data
      })
    );

    return res.json(serviceRequests);
  } catch (error) {
    handleErrorResponse(res, error, "Failed to retrieve service requests");
  }
};
// Get service request by area
exports.getServiceRequestByArea = async (req, res) => {
  const { area } = req.params;
  try {
    const snapshot = await db
      .collection("serviceRequests")
      .where("area", "==", area)
      .get();
    const serviceRequests = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return res.json(serviceRequests);
  } catch (error) {
    handleErrorResponse(res, error, "Failed to retrieve service requests");
  }
};

exports.getServiceRequestByVendor = async (req, res) => {
  const { vendorId } = req.params;
  try {
    const snapshot = await db
      .collection("serviceRequests")
      .where("vendorId", "==", vendorId)
      .get();
    const serviceRequests = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return res.json(serviceRequests);
  } catch (error) {
    handleErrorResponse(res, error, "Failed to retrieve service requests");
  }
};
// Accept service request by a vendor
exports.acceptServiceRequest = async (req, res) => {  
  const { requestId, vendorId } = req.params;  
  
  try {  
    let fcmToken = null; // Store FCM token outside the transaction
    let errorResponse = null; // Store any validation error

    // Start a Firestore transaction  
    await db.runTransaction(async (transaction) => {  
      const requestRef = db.collection("serviceRequests").doc(requestId);  
      const serviceRequestDoc = await transaction.get(requestRef);  

      if (!serviceRequestDoc.exists) {  
        throw { status: 404, message: "Service request not found" }; // ✅ Throw an object with status code  
      }  

      const serviceRequestData = serviceRequestDoc.data();  

      if (serviceRequestData.vendorId) {  
        throw {  
          status: 403,  
          message: `Service request already accepted by vendor ${serviceRequestData.vendorId}`  
        };  
      }  

      const currentRequestDateTime = serviceRequestData.dateTime;  

      const vendorRequestsSnapshot = await db  
        .collection("serviceRequests")  
        .where("vendorId", "==", vendorId)  
        .get();  

      let conflictFound = false;  

      vendorRequestsSnapshot.forEach((doc) => {  
        const existingRequestData = doc.data();  
        if (existingRequestData.dateTime === currentRequestDateTime) {  
          conflictFound = true;  
        }  
      });  

      if (conflictFound) {  
        throw { status: 409, message: "Vendor has a scheduling conflict with another service request." };  
      }  

      // Update service request  
      transaction.update(requestRef, {  
        vendorId: vendorId,  
        state: "pending",  
        step: "accepted",  
      });  

      // Set other vendors as inactive  
      const vendorResponses = serviceRequestData.vendorResponses || {};  
      Object.keys(vendorResponses).forEach((otherVendorId) => {  
        if (otherVendorId !== vendorId) {  
          transaction.update(requestRef, {  
            [`vendorResponses.${otherVendorId}.status`]: "unactive",  
          });  
        }  
      });  
    });  

    // Fetch vendor FCM token after transaction completes
    const vendorData = await db.collection("vendors").doc(vendorId).get();
    if (vendorData.exists) {
      fcmToken = vendorData.data().fcmToken;
    }

    // ✅ Return success response **after** transaction completes  
    return res.status(200).json({ message: "Service request accepted successfully", fcmToken });  

  } catch (error) {  
    // ✅ Handle different status codes  
    const statusCode = error.status || 500;  
    return res.status(statusCode).json({ error: error.message || "Internal server error" });  
  }  
};



// Helper function to check vendor responses and update request state
async function checkAndCancelServiceRequest(requestId) {
  const requestRef = db.collection("serviceRequests").doc(requestId);
  const requestSnapshot = await requestRef.get();

  if (!requestSnapshot.exists) {
    // //(`Service request ${requestId} does not exist.`);
    return;
  }

  const serviceRequest = requestSnapshot.data();
  const vendorResponses = serviceRequest.vendorResponses || {};

  // Check if all vendor responses are 'unactive'
  const allVendorsCancelled = Object.values(vendorResponses).every(
    (response) => response.status === "unactive"
  );

  if (allVendorsCancelled) {
    // Update the request state to 'cancelled'
    await requestRef.update({ state: "cancelled" });
    //(`Service request ${requestId} updated to 'cancelled' because all vendor responses are 'unactive'.`);
  }
}

// Run a cron job every hour to check for expired or inactive service requests
cron.schedule("10 * * * *", async () => {
  const snapshot = await db
    .collection("serviceRequests")
    .where("state", "==", "active")
    .get();

  const now = Date.now();

  snapshot.forEach(async (doc) => {
    const serviceRequest = doc.data();

    // Check for expiry
    if (serviceRequest.expiryTime && now > serviceRequest.expiryTime) {
      // Update request state to 'cancelled'
      await db
        .collection("serviceRequests")
        .doc(doc.id)
        .update({ state: "cancelled" });

      // Update all vendor statuses to 'unactive'
      const vendorUpdates = {};
      Object.keys(serviceRequest.vendorResponses).forEach((vendorId) => {
        vendorUpdates[`vendorResponses.${vendorId}.status`] = "unactive";
      });

      await db.collection("serviceRequests").doc(doc.id).update(vendorUpdates);
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
      const requestRef = db.collection("serviceRequests").doc(requestId);
      const serviceRequestDoc = await transaction.get(requestRef);

      if (!serviceRequestDoc.exists) {
        return res.status(404).json({ error: "Service request not found" });
      }

      const serviceRequestData = serviceRequestDoc.data();

      if (
        !serviceRequestData.vendorResponses ||
        !serviceRequestData.vendorResponses[vendorId]
      ) {
        return res
          .status(404)
          .json({
            error: `Vendor ID not found in this service request`,
            vendorId,
          });
      }

      // Update the vendor's response status to 'inactive'
      transaction.update(requestRef, {
        [`vendorResponses.${vendorId}.status`]: "inactive",
      });

      // Check if all vendor responses are now 'inactive'
      const allVendorsCancelled = Object.values(
        serviceRequestData.vendorResponses
      ).every((response) => response.status === "inactive");

      if (allVendorsCancelled) {
        transaction.update(requestRef, { state: "cancelled" });
      }

      const vendorRef = db.collection("vendors").doc(vendorId);
      const cancellationDetails = {
        requestId: requestId,
        cancelledDate: new Date(), // capturing the cancellation date
        serviceRequestDetails: serviceRequestData, // storing the entire service request data
      };

      // Update the vendor's data to include detailed cancellation information
      transaction.update(vendorRef, {
        cancelledServiceRequests:
          admin.firestore.FieldValue.arrayUnion(cancellationDetails),
      });
    });

    return res
      .status(200)
      .json({ message: "Vendor cancelled service request successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ error: `Error cancelling service request: ${error.message}` });
  }
};
// User cancels their service request
exports.cancelServiceRequestByUser = async (req, res) => {
  const { requestId, userId } = req.params;
  try {
    // Start a Firestore transaction to ensure data consistency
    await db.runTransaction(async (transaction) => {
      const requestRef = db.collection("serviceRequests").doc(requestId);
      const serviceRequestDoc = await transaction.get(requestRef);

      // Check if the service request exists
      if (!serviceRequestDoc.exists) {
        return res.status(404).json({ error: "Service request not found" });
      }

      const serviceRequestData = serviceRequestDoc.data();

      // Check if the user ID matches the service request's userId
      if (serviceRequestData.userId !== userId) {
        return res
          .status(403)
          .json({
            error:
              "Unauthorized: User ID does not match the service request owner.",
          });
      }

      // Update the service request state to 'cancelled by user'
      transaction.update(requestRef, { state: "cancelled by user" });

      // Optionally, update vendor statuses to 'unactive' if applicable
      const vendorUpdates = {};
      Object.keys(serviceRequestData.vendorResponses || {}).forEach(
        (vendorId) => {
          vendorUpdates[`vendorResponses.${vendorId}.status`] = "unactive";
        }
      );
      transaction.update(requestRef, vendorUpdates);
    });

    // Return success message
    return res
      .status(200)
      .json({ message: "Service request cancelled by user successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({
        error: `Error cancelling service request by user: ${error.message}`,
      });
  }
};

// Function to check if the service request has less than 2 hours remaining
async function checkServiceRequestExpiryAndNotify(requestId) {
  try {
    const requestRef = db.collection("serviceRequests").doc(requestId);
    const serviceRequestDoc = await requestRef.get();

    if (!serviceRequestDoc.exists) {
      console.log(`Service request ${requestId} not found.`);
      return;
    }

    const serviceRequestData = serviceRequestDoc.data();
    const { userId, vendorId, expiryTime } = serviceRequestData;

    const currentTime = Date.now();
    const remainingTime = expiryTime - currentTime;

    // Check if less than 2 hours (7200000 milliseconds) remaining
    if (remainingTime < 2 * 60 * 60 * 1000) {
      // Fetch user data
      const userDoc = await db.collection("users").doc(userId).get();
      const userData = userDoc.exists ? userDoc.data() : null;

      // Fetch vendor data
      const vendorDoc = await db.collection("vendors").doc(vendorId).get();
      const vendorData = vendorDoc.exists ? vendorDoc.data() : null;

      // Prepare notifications
      if (userData && userData.fcmToken) {
        await sendNotification({
          title: "Service Request Reminder",
          body: `The vendor will be at your location in less than 2 hours.`,
          recipients: userData.fcmToken, // Send to user
        });
      }

      if (vendorData && vendorData.fcmToken) {
        await sendNotification({
          title: "Service Request Reminder",
          body: `You have less than 2 hours to perform a Wash.`,
          recipients: vendorData.fcmToken, // Send to vendor
        });
      }
    }
  } catch (error) {
    console.error(`Error checking service request expiry: ${error.message}`);
  }
}

// Function to send notifications using the specified API
async function sendNotification({ title, body, recipient }) {
  // Prepare the payload for the API
  const apiPayload = {
    title: title,
    body: body,
    recipients: recipient, // Send a single token as the recipient
  };

  try {
    // Send the notification using the specified API
    const response = await axios.post(
      "http://localhost:4000/api/send-notification-token",
      apiPayload
    );
    console.log(`Notification sent to ${recipient}: ${response.data}`);
  } catch (error) {
    console.error(
      `Error sending notification to ${recipient}: ${error.message}`
    );
  }
}

// Cron job to check for service requests every 30 minutes
cron.schedule("0 */3 * * * *", async () => {
  try {
    const now = Date.now();
    const snapshot = await db
      .collection("serviceRequests")
      .where("state", "==", "active") // Filter only active requests
      .get();

    snapshot.forEach((doc) => {
      const serviceRequest = doc.data();
      const { expiryTime } = serviceRequest;

      // Check if less than 2 hours (7200000 milliseconds) remaining
      if (expiryTime && expiryTime - now < 2 * 60 * 60 * 1000) {
        checkServiceRequestExpiryAndNotify(doc.id); // Call the function to notify user and vendor
      }
    });
  } catch (error) {
    console.error(`Error checking service requests: ${error.message}`);
  }
});

exports.completeServiceRequest = async (req, res) => {  
  const { userId, vendorId, serviceRequestId } = req.params;  
  const { servicePerformed, userRating, singleService } = req.body;  
  
  try {  
    await db.runTransaction(async (transaction) => {  
      const requestRef = db.collection("serviceRequests").doc(serviceRequestId);  
      const vendorRef = db.collection("vendors").doc(vendorId);  
      const serviceRequestDoc = await transaction.get(requestRef);  
  
      // Validate request existence  
      if (!serviceRequestDoc.exists) {  
        throw new Error("Service request not found");  
      }  
  
      const serviceRequestData = serviceRequestDoc.data();  
  
      // Validate authorization  
      if (serviceRequestData.userId !== userId) {  
        throw new Error("Unauthorized: User ID mismatch");  
      }  
      if (!serviceRequestData.vendorResponses[vendorId]) {  
        throw new Error("Unauthorized: Vendor not associated with this request");  
      }  
  
      // Validate state  
      if (serviceRequestData.state !== "pending") {  
        throw new Error("Service request is not in pending state");  
      }  
  
      // Get vendor and service data  
      const vendorDoc = await transaction.get(vendorRef);  
      if (!vendorDoc.exists) throw new Error("Vendor not found");  
      const vendorData = vendorDoc.data();  
  
      const serviceDoc = await transaction.get(  
        db.collection("services").doc(serviceRequestData.serviceId)  
      );  
      if (!serviceDoc.exists) throw new Error("Service not found");  
      const serviceData = serviceDoc.data();  
  
      // Prepare updates  
      const updates = {  
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),  
      };  
  
      let packagesRemaining = serviceRequestData.packages;  
  
      // Handle service performance  
      if (servicePerformed) {  
        // Update dates array  
        updates.dates = (serviceRequestData.dates || []).map((entry) =>  
          // Assume the status of the date is set to completed  
          { return { ...entry, status: "completed" }; }  
        );  
  
        // Handle package logic  
        if (singleService) {  
          updates.state = "pending";  
          updates.step = "complete";  
          updates.completedAt = Date.now();  
        } else {  
          packagesRemaining = Math.max(0, packagesRemaining - 1);  
          updates.packages = packagesRemaining;  
          updates.state = packagesRemaining > 0 ? "pending" : "completed";  
          updates.step = packagesRemaining > 0 ? "accepted" : "complete";  
          if (packagesRemaining === 0) updates.completedAt = Date.now();  
        }  
      } else {  
        // Service not performed  
        updates.dates = (serviceRequestData.dates || []).map((entry) =>  
          { return { ...entry, status: "vendor not available" }; }  
        );  
  
        if (singleService || packagesRemaining <= 1) {  
          updates.message = "Service was not performed.";  
        } else {  
          updates.state = "pending";  
          transaction.update(vendorRef, {  
            rating: Math.max(0, (vendorData.rating || 0) - 0.5),  
            incompleteRequests: admin.firestore.FieldValue.increment(1),  
          });  
        }  
      }  
  
      // Apply updates  
      transaction.update(requestRef, updates);  
  
      // Update vendor metrics  
      const vendorEarnings = servicePerformed  
        ? (serviceRequestData.price * serviceData.vendorCommission) / 100  
        : 0;  
  
      transaction.update(vendorRef, {  
        credits: admin.firestore.FieldValue.increment(vendorEarnings),  
        ...(userRating !== undefined && {  
          rating: ((vendorData.rating || 0) * (vendorData.ratingCount || 0) +  
            userRating) /  
            ((vendorData.ratingCount || 0) + 1),  
          ratingCount: admin.firestore.FieldValue.increment(1),  
        }),  
        completedRequests: admin.firestore.FieldValue.increment(  
          servicePerformed ? 1 : 0  
        ),  
      });  
  
      // Create log  
      await db.collection("logs").add({  
        type: "serviceCompletion",  
        ...serviceRequestData,  
        vendorEarnings,  
        servicePerformed,  
        logTimestamp: admin.firestore.FieldValue.serverTimestamp(),  
      });  
  
      // Prepare response  
      let response;  
      if (servicePerformed) {  
        response = singleService  
          ? {  
              message: "Single service completed successfully",  
              serviceName: serviceData.name,  
            }  
          : packagesRemaining > 0  
          ? {  
              message: `${packagesRemaining} services remaining`,  
              times: packagesRemaining,  
            }  
          : { message: "All services completed" };  
      } else {  
        response = {  
          message: "Service not performed",  
          reason: "Vendor did not complete service",  
        };  
      }  
  
      res.status(200).json(response);  
    });  
  } catch (error) {  
    console.error("Completion error:", error);  
    res.status(500).json({  
      error: error.message,  
      code: error.code || "internal/server-error",  
    });  
  }  
};  
// Schedule a cron job to run every day at midnight (00:00)
cron.schedule("0 0 * * *", async () => {
  try {
    // Get all service requests with state 'pending'
    const snapshot = await db
      .collection("serviceRequests")
      .where("state", "==", "pending")
      .get();

    // Use a batch to handle multiple updates efficiently
    const batch = db.batch();

    snapshot.forEach((doc) => {
      const requestData = doc.data();
      // Check if the step is 'arrived' or 'completed'
      if (["arrived", "completed"].includes(requestData.step)) {
        const requestRef = db.collection("serviceRequests").doc(doc.id);
        // Update the state to 'user not available'
        batch.update(requestRef, { state: "user not available" });
      }
    });

    // Commit the batch updates
    await batch.commit();
    console.log("EOD check completed: Updated pending service requests.");
  } catch (error) {
    console.error("Error during EOD service request check:", error);
  }
});

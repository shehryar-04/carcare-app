const userService = require('../services/userService');
const handleErrorResponse = (res, error, message) =>
  res.status(500).json({ error: message + error.message });
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'shehryarsiddiqui2004@gmail.com',
    pass: process.env.PASSWORD,
  },
});

// Create new user 
exports.createUser = async (req, res) => {  
  try {  
    const { displayName, email, phoneNumber, password, fcmToken } = req.body;  
    const uid = await userService.createUser(  
      displayName,  
      email,  
      phoneNumber,  
      password,  
      fcmToken  // Pass the FCM token to the service  
    );  
    res.status(201).json({  
      message: 'Please check your email to verify your account.',  
      userId: uid,  
      emailVerified: false,  
    });  
  } catch (error) {  
    handleErrorResponse(res, error, 'Error creating user');  
  }  
};  

// Verify email
exports.verifyEmail = async (req, res) => {
  try {
    const { uid } = req.query;
    await userService.verifyEmail(uid);
    res.redirect('/verify.html');
  } catch (error) {
    handleErrorResponse(res, error, 'Error verifying email');
  }
};

// Get all users
exports.getUsers = async (req, res) => {
  try {
    const users = await userService.getUsers();
    res.status(200).json(users);
  } catch (error) {
    handleErrorResponse(res, error, 'Error retrieving users');
  }
};

// Get a user by UID
exports.getUserById = async (req, res) => {
  try {
    const { uid } = req.params;
    const user = await userService.getUserById(uid);
    res.status(200).json(user);
  } catch (error) {
    handleErrorResponse(res, error, 'Error retrieving user');
  }
};

// Update user data
// Update user data  
// const userService = require('../services/userService'); // Ensure this import points to the correct file

exports.updateUser = async (req, res) => {
  const { uid } = req.params; // Extract UID from URL parameters
  const updateData = req.body; // Capture the request body to update

  try {
    // Validate UID and updateData
    if (!uid || !Object.keys(updateData).length) {
      return res.status(400).json({ message: 'Invalid request. UID and update data are required.' });
    }

    // Call the updateUser method from userService with uid and updateData
    await userService.updateUser(uid, updateData);

    res.status(200).json({ message: 'User updated successfully.' });
  } catch (error) {
    console.error('Error updating user:', error.message);
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
};


// Update user data
exports.resendVerificationEmail = async (req, res) => {
  try {
    const { uid } = req.params; // Get uid from route parameters

    // Validate user ID
    if (!uid) {
      return res.status(400).json({ error: 'User ID is required.' });
    }
    // Check if the user exists in Firestore
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const userData = userDoc.data();

    // Check if email is verified
    if (userData.emailVerified) {
      return res.status(400).json({ error: 'Email is already verified.' });
    }

    // Prepare email options
    const mailOptions = {
      from: 'shehryarsiddiqui2004@gmail.com',
      to: userData.email,
      subject: 'Verify your email',
      html: `<p>Hello ${userData.displayName},</p>  
                   <p>Please verify your email by clicking the link below:</p>  
                   <a href="${process.env.BASE_URL}/api/verifyEmail?uid=${uid}">Verify Email</a>`,
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    // Send a JSON response
    res.status(200).json({
      message: 'Verification email resent. Please check your inbox.',
      userId: uid, // Return the user ID in response
    });
  } catch (error) {
    handleErrorResponse(res, error, 'Error Sending Email to user');
  }
};
// userControllers.js  
  
// Add location  
exports.addLocation = async (req, res) => {  
  try {  
    const { uid } = req.params;  
    const { locationName } = req.body;  
  
    if (!locationName) {  
      return res.status(400).json({ error: 'Location name is required.' });  
    }  
  
    await userService.addLocation(uid, locationName);  
    res.status(200).json({ message: 'Location added successfully.' });  
  } catch (error) {  
    handleErrorResponse(res, error, 'Error adding location: ');  
  }  
};  
  

// Delete location  
exports.deleteLocation = async (req, res) => {  
  try {  
    const { uid } = req.params;  
    const { location } = req.body;  
  
    if (!location) {  
      return res.status(400).json({ error: 'Location name is required.' });  
    }  
  
    await userService.deleteLocation(uid, location);  
    res.status(200).json({ message: 'Location deleted successfully.' });  
  } catch (error) {  
    handleErrorResponse(res, error, 'Error deleting location: ');  
  }  
};  
exports.postFcmToken = async (req, res) => {  
  try {  
      const { uid } = req.params; // Assuming UID is passed as a URL parameter  
      const { fcmToken } = req.body;  

      if (!fcmToken) {  
          return res.status(400).json({ error: 'FCM token is required.' });  
      }  

      const result = await userService.updateFcmToken(uid, fcmToken);  

      if (result.updated) {  
          res.status(200).json({ message: 'FCM token updated successfully.' });  
      } else {  
          res.status(200).json({ message: 'FCM token is already up to date.' });  
      }  
  } catch (error) {  
      handleErrorResponse(res, error, 'Error updating FCM token: ');  
  }  
};  
exports.sendPushNotification = async (req, res) => {  
  const { uid } = req.params; // Assuming UID is passed as a URL parameter  
  const { title, body } = req.body;  

  // Validate the required parameters  
  if (!title || !body) {  
      return res.status(400).json({ message: 'Please fill in all fields.' });  
  }  

  try {  
      // Call the service function to send the notification  
      await userService.sendPushNotification(uid, title, body);  
      return res.status(200).json({ message: 'Notification sent successfully.' });  
  } catch (error) {  
      console.error('Error sending push notification:', error); // Log the error for debugging  
      return res.status(500).json({ error: 'Failed to send notification: ' + error.message });  
  }  
};  
// userControllers.js  
  
exports.updateUserVerification = async (req, res) => {  
  try {  
      const { uid } = req.params; // Get uid from route parameters  
      const { isVerified } = req.body; // Expecting isVerified to be true or false  

      // Validate input  
      if (typeof isVerified !== 'boolean') {  
          return res.status(400).json({ error: 'isVerified must be a boolean value.' });  
      }  

      await userService.updateEmailVerification(uid, isVerified);  
      res.status(200).json({ message: `User verification status updated to ${isVerified}.` });  
  } catch (error) {  
      handleErrorResponse(res, error, 'Error updating user verification status: ');  
  }  
};  
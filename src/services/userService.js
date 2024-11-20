const { db, admin } = require('../config/firebaseconfig');
const axios = require('axios');  
const nodemailer = require('nodemailer');
const { google } = require('googleapis');

// Email setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'shehryarsiddiqui2004@gmail.com',
    pass: process.env.PASSWORD,
  },
});
function getAccessToken() {
  return new Promise(function(resolve, reject) {
    const key = require('../config/firebaseCredentials.json');
    const SCOPES = ['https://www.googleapis.com/auth/firebase'];
    const jwtClient = new google.auth.JWT(
      key.client_email,
      null,
      key.private_key,
      SCOPES,
      null
    );
    jwtClient.authorize(function(err, tokens) {
      if (err) {
        reject(err);
        return;
      }
      resolve(tokens.access_token);
    });
  });
}
  
exports.createUser = async (displayName, email, phoneNumber, password, fcmToken, image = null,vendorid=null) => {
  const existingUser = await admin
    .auth()
    .getUserByEmail(email)
    .catch((error) => {
      if (error.code === 'auth/user-not-found') {
        return null; // User does not exist
      }
      throw error; // Some other error occurred
    });

  if (existingUser) {
    // User exists, check Firestore for additional details
    const userRef = db.collection('users').doc(existingUser.uid);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      const userData = userDoc.data();
      // If the user email is verified (like with Google login), no need to send the verification email
      if (userData.emailVerified || existingUser.emailVerified) {
        return {
          message: 'User already registered and email is verified.',
          userId: existingUser.uid,
          emailVerified: true,
        };
      } else {
        return {
          message: 'User already registered, but email is not verified.',
          userId: existingUser.uid,
          emailVerified: false,
        };
      }
    }
  }

  // If user does not exist, create a new user
  const userRecord = await admin.auth().createUser({ email, password });

  const mailOptions = {
    from: 'shehryarsiddiqui2004@gmail.com',
    to: email,
    subject: 'Verify your email',
    html: `
      <p>Hello ${displayName},</p>
      <p>Please verify your email by clicking the button below:</p>
      <p>
        <a href="${"https://carcarebaked.azurewebsites.net/verify.html?uid=" + userRecord.uid}" 
           style="display: inline-block; padding: 10px 20px; color: white; background-color: #007BFF; text-decoration: none; border-radius: 5px;">
           Verify Email
        </a>
      </p>
      
      <p style=text-align:center;font-size:30px;>Thank you!</p>
    `,
  };
  

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    // If there's an error sending the email, delete the user from Firebase Authentication and Firestore
    await admin.auth().deleteUser(userRecord.uid);
    await db.collection('users').doc(userRecord.uid).delete();
    throw new Error('Error sending verification email. Please try again.');
  }

  // Add user to Firestore with FCM token
  await db.collection('users').doc(userRecord.uid).set({
    displayName,
    email,
    phoneNumber,
    emailVerified: false, // Initially false
    locations: [],
    fcmToken,
    image,
    isVendor: false,
    vendorid
  });

  return userRecord.uid;
};
  

exports.verifyEmail = async (uid) => {
  const userRef = db.collection('users').doc(uid);
  const userDoc = await userRef.get();
  if (!userDoc.exists) throw new Error('User not found.');

  await userRef.update({ emailVerified: true });
  await admin.auth().updateUser(uid, { emailVerified: true });
};

exports.getUsers = async () => {
  const usersSnapshot = await db.collection('users').get();
  return usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

exports.getUserById = async (uid) => {
  const userRef = db.collection('users').doc(uid);
  const userDoc = await userRef.get();
  if (!userDoc.exists) throw new Error('User not found');
  return userDoc.data();
};

// userService.js
exports.updateUser = async (uid, updateData) => {
  const userRef = db.collection('users').doc(uid); // Reference to the user document
  const userDoc = await userRef.get(); // Fetch the document

  if (!userDoc.exists) {
    throw new Error('User not found');
  }

  // Update user document with the provided data
  await userRef.update(updateData);
};

// userService.js  
  
// Add a location  
exports.addLocation = async (uid, locationName) => {  
  const userRef = db.collection('users').doc(uid);  
  await userRef.update({  
    locations: admin.firestore.FieldValue.arrayUnion(locationName),  
  });  
};  

// userService.js  
exports.deleteLocation = async (uid, locationToDelete) => {  
  const userRef = db.collection('users').doc(uid);  
  const userDoc = await userRef.get();  
  
  if (!userDoc.exists) throw new Error('User not found.');  
  
  const userData = userDoc.data();  
  const locations = userData.locations;  
  
  // Ensure locationToDelete is structured correctly  
  if (!locationToDelete) {  
    throw new Error('Location data is required.');  
  }  
  
  // Find the index of the location object to delete  
  const locationIndex = locations.findIndex(location =>   
    location.locationName === locationToDelete.locationName &&  
    location.areaName === locationToDelete.areaName &&  
    location.latitude === locationToDelete.latitude &&  
    location.longitude === locationToDelete.longitude  
  );  
  
  if (locationIndex === -1) throw new Error('Location not found.');  
  
  // Remove the location from the array  
  locations.splice(locationIndex, 1);  
  await userRef.update({ locations });  
};  
exports.updateFcmToken = async (uid, newFcmToken) => {  
  const userRef = db.collection('users').doc(uid);  
  const userDoc = await userRef.get();  

  if (!userDoc.exists) {  
      throw new Error('User not found.');  
  }  

  const userData = userDoc.data();  
  if (userData.fcmToken !== newFcmToken) {  
      await userRef.update({ fcmToken: newFcmToken });  
      return { updated: true };  
  }  

  return { updated: false };  
};  

exports.sendPushNotification = async (uid, title, body) => {  
    try {  
        // Fetch user data from Firestore  
        const userRef = admin.firestore().collection('users').doc(uid);  
        const doc = await userRef.get();  
        const accessToken= await getAccessToken()  
        // console.log(accessToken+"HELLO")
        if (!doc.exists) {  
            console.error('No such user!');  
            throw new Error('User does not exist');  
        }  
  
        const userData = doc.data();  
        const fcmToken = userData.fcmToken; // Assuming the token is stored in the `fcmToken` field  
  
        if (!fcmToken) {  
            throw new Error('FCM token not found for user');  
        }  
  
        // Construct the notification message  
        const message = {  
            message: {  
                token: fcmToken,  
                notification: {  
                    body: body,  
                    title: title  
                }  
            }  
        };  
  
        // Send a notification using FCM  
        const response = await axios.post('https://fcm.googleapis.com/v1/projects/carcare-ff31c/messages:send', message, {  
            headers: {  
                'Content-Type': 'application/json',  
                'Authorization': "Bearer" + accessToken  
            }  
        });  
  
        console.log('Notification sent successfully:', response.data);  
    } catch (error) {  
        console.error('Error in sending notification:', error.message);  
        throw error; // Rethrow the error for the controller to catch  
    }  
};  
// userService.js  
  
exports.updateEmailVerification = async (uid, isVerified) => {  
  const userRef = db.collection('users').doc(uid);  
  const userDoc = await userRef.get();  

  if (!userDoc.exists) {  
      throw new Error('User not found.');  
  }  

  // Update the emailVerified field in Firestore  
  await userRef.update({ emailVerified: isVerified });  
  
  // Update the emailVerified flag in Firebase Authentication  
  await admin.auth().updateUser(uid, { emailVerified: isVerified });  
};  
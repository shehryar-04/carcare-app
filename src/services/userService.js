const { db, admin } = require('../config/firebaseconfig');
const axios = require('axios');  
const nodemailer = require('nodemailer');
const env = require('dotenv');

env.config();
// const { google } = require('googleapis');

// Email setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'shehryarsiddiqui2004@gmail.com',
    pass: process.env.PASSWORD,
  },
});
  
exports.createUser = async (displayName, email, phoneNumber, password, fcmToken, image = null, vendorid = null) => {
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
    // Check if the user has signed in using a different provider
    const providerIds = existingUser.providerData.map((provider) => provider.providerId);

    if (!providerIds.includes('password')) {
      // Conflict: User exists but signed in using a different method (e.g., Google)
      return {
        status: 400,
        message: 'User already exists with a different sign-in method.',
        userId: existingUser.uid,
        emailVerified: existingUser.emailVerified,
     
      };
    }

    // User exists and uses email/password, check Firestore for additional details
    const userRef = db.collection('users').doc(existingUser.uid);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      const userData = userDoc.data();
      if (userData.emailVerified || existingUser.emailVerified) {
        return {
          status: 409,
          message: 'User already exists and email is verified.',
          userId: existingUser.uid,
          emailVerified: true,
          // provider: existingUser.providerData, // Return provider details
        };
      } else {
        return {
          status: 409,
          message: 'User already exists but email is not verified.',
          userId: existingUser.uid,
          emailVerified: false,
          // provider: existingUser.providerData, // Return provider details
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
      <p>Thank you!</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    await admin.auth().deleteUser(userRecord.uid);
    await db.collection('users').doc(userRecord.uid).delete();
    throw new Error('Error sending verification email. Please try again.');
  }

  await db.collection('users').doc(userRecord.uid).set({
    displayName,
    email,
    phoneNumber,
    emailVerified: false,
    locations: [],
    fcmToken,
    image,
    isVendor: false,
    vendorid,
  });

  return {
    status: 201, // Success status code
    message: 'User created successfully. Please verify your email.',
    userId: userRecord.uid,
    emailVerified: false,
  };
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
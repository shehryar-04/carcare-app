const admin = require('firebase-admin');
const { Storage } = require('@google-cloud/storage');

// Firebase credentials
const serviceAccount = require('./firebaseCredentials.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'carcare-ff31c.appspot.com',
});

const db = admin.firestore();
const bucket = new Storage().bucket('carcare-ff31c.appspot.com');

module.exports = { admin, db, bucket };

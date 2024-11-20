const express = require("express");  
const cors = require("cors");  
const path = require("path");  
const firebaseAdmin = require("firebase-admin");  
  
const app = express();  
  
// Initialize Firebase Admin SDK with service account key  
const serviceAccount = require("../firebase/credentials.json"); // Update with your path  
  
firebaseAdmin.initializeApp({  
    credential: firebaseAdmin.credential.cert(serviceAccount),  
});  
  
// Middleware  
app.use(cors());  
app.use(express.json());  
app.use(express.static(path.join(__dirname, "../public"))); // Serve static files from the "public" directory  
  
// Firebase Firestore  
const db = firebaseAdmin.firestore();  

  
// Middleware to check authentication  
const authenticate = async (req, res, next) => {  
    const token = req.headers.authorization?.split("Bearer ")[1];  
    if (!token) {  
        return res.sendFile(path.join(__dirname, "../public", "login.html"));  
    }  
    try {  
        await firebaseAdmin.auth().verifyIdToken(token);  
        next();  
    } catch (error) {  
        console.error("Authentication error:", error);  
        return res.sendFile(path.join(__dirname, "../public", "login.html"));  
    }  
};  
  
// Endpoint to add a coupon  
app.post("/coupons", authenticate, async (req, res) => {  
    const { store, description, code } = req.body;  
  
    // Log the received data for debugging  
    // console.log("Received data:", req.body);  
  
    // Validate that all required fields are provided  
    if (!store || !description || !code) {  
        return res.status(400).json({ message: "Store, description, and code are required." });  
    }  
  
    try {  
        const docRef = await db.collection("coupons").add({  
            store,  
            description,  
            couponcode: code,  
        });  
        res.status(200).json({ message: "Data added successfully", id: docRef.id });  
    } catch (error) {  
        console.error("Error adding data:", error);  
        res.status(500).json({ message: "Error adding data" });  
    }  
});  

// Endpoint to get all coupons  
app.get("/coupons", async (req, res) => {  
    try {  
        const snapshot = await db.collection("coupons").get();  
        const coupons = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));  
        res.json(coupons);  
    } catch (error) {  
        console.error("Error fetching coupons:", error);  
        res.status(500).json({ error: "Failed to fetch coupons" });  
    }  
});  
  
// Endpoint for registration  
// Endpoint for registration  
app.post("/register", async (req, res) => {  
    const { username, email, password } = req.body;  
  
    if (!username || !email || !password) {  
        return res.status(400).send({ message: "Username, email, and password are required." });  
    }  
  
    try {  
        // Create user in Firebase Authentication  
        const userRecord = await firebaseAdmin.auth().createUser({  
            email,  
            password,  
        });  
  
        // Save user data in Firestore with role  
        await db.collection("users").doc(userRecord.uid).set({  
            username,  
            email,  
            role: "users", // Add role field here  
        });  
        
        // Generate email verification link  
        const link = await firebaseAdmin.auth().generateEmailVerificationLink(email);  
        // console.log("Verification email link sent: ", link); // Replace with email sending logic  
  
        res.send({  
            message: "Registration successful! Please check your email for verification.",  
        });  
    } catch (error) {   
        console.error("Error creating user:", error);  
        res.status(400).send({ message: error.message });  
    }  
});  

// Endpoint for login  
app.post("/login", async (req, res) => {  
    const idToken = req.body.idToken;  
    try {  
        const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);  
        const uid = decodedToken.uid;  
  
        // User is authenticated, proceed with your logic  
        res.json({ success: true, uid });  
    } catch (error) {  
        console.error("Login error:", error);  
        res.status(401).json({ success: false, message: "Invalid token" });  
    }  
});  
  
// Route to serve the front-end HTML files (Public content, no authentication required)  
app.get("/", (req, res) => {  
    res.sendFile(path.join(__dirname, "../public", "login.html")); // Adjust path as necessary  
});  
  
app.get("/register", (req, res) => {  
    res.sendFile(path.join(__dirname, "../public", "register.html")); // Public registration page  
});  
  
// Protected routes  
app.get("/coupon-submission", authenticate, (req, res) => {  
    res.sendFile(path.join(__dirname, "../public", "coupon-submission.html")); // Adjust path as necessary  
});  
  
app.get("/coupon-shop", authenticate, (req, res) => {  
    res.sendFile(path.join(__dirname, "../public", "coupon-shop.html")); // Adjust the path as necessary  
});  
  
app.get("/login", (req, res) => {  
    res.sendFile(path.join(__dirname, "../public", "login.html")); // Public login page  
});  
  
// Start the server  
app.listen(4000, () => console.log("The server is running at PORT 4000"));  

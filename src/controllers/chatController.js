const { admin, db } = require('../config/firebaseconfig');  
const axios = require('axios');  
const crypto = require('crypto'); // Require the crypto module  
  
const handleErrorResponse = (res, error, message) =>   
    res.status(500).json({ error: message + error.message });  
  
// Send message to vendor  
exports.sendMessageToVendor = async (req, res) => {  
    const { userId, vendorId } = req.params;  
    const { message, senderType } = req.body;  
  
    // Validate message and senderType  
    if (!message) {  
        return res.status(400).json({ error: 'Message is required.' });  
    }  
    if (!['user', 'vendor'].includes(senderType)) {  
        return res.status(400).json({ error: 'Invalid sender type.' });  
    }  
  
    try {  
        // Create the chat document ID with userId first and vendorId second  
        const chatDocId = `${userId}_${vendorId}`;  
        const chatRef = db.collection('chats').doc(chatDocId);  
  
        // Check if chat document exists and add random text if it doesn't  
        const doc = await chatRef.get();  
        if (!doc.exists) {  
            // Generate a random string for the random text field  
            const randomText = crypto.randomBytes(20).toString('hex');  
            await chatRef.set({ randomText }); // Set random text when creating the document  
        }  
  
        // Create a new message document in the subcollection 'messages'  
        const messageRef = chatRef.collection('messages').doc(); // Auto-generated ID  
        await messageRef.set({  
            senderId: senderType === 'user' ? userId : vendorId,  
            senderType,  
            message,  
            timestamp: admin.firestore.FieldValue.serverTimestamp(), // Add server timestamp  
            isSeen: false,
        });  
  
        // Fetch FCM token based on sender type  
        let fcmToken;  
        if (senderType === 'vendor') {  
            const userRef = db.collection('users').doc(userId);  
            const userDoc = await userRef.get();  
            if (userDoc.exists) {  
                fcmToken = userDoc.data().fcmToken;  
            } else {  
                console.log('User document does not exist');  
            }  
        } else { // If the sender is a user  
            const vendorRef = db.collection('vendors').doc(vendorId);  
            const vendorDoc = await vendorRef.get();  
            if (vendorDoc.exists) {  
                fcmToken = vendorDoc.data().fcmToken;  
            } else {  
                console.log('Vendor document does not exist');  
            }  
        }  
  
        return res.status(201).json({  
            message: 'Message sent successfully',  
            fcmToken:fcmToken
        });  
  
    } catch (error) {  
        handleErrorResponse(res, error, 'Error sending message:');  
    }  
};  
  
// Get all chats for a user  
// Get all chats for a user  
exports.getAllChatsForUser = async (req, res) => {  
    const { userId } = req.params;  
  
    try {  
        const chatsRef = db.collection('chats');  
        const snapshot = await chatsRef.get();  
  
        if (snapshot.empty) {  
            return res.status(404).json({ error: 'No chats found.' });  
        }  
  
        let chats = [];  
        let vendorDetailsPromises = [];  
        let latestMessagePromises = [];  
  
        snapshot.forEach(doc => {  
            const chatId = doc.id;  
            const chatUserId = chatId.split('_')[0]; // Extracts the userId  
            const vendorId = chatId.split('_')[1]; // Extracts the vendorId  
  
            if (chatUserId === userId) {  
                let chat = { id: doc.id, vendorId: vendorId, ...doc.data(), isSeen: false }; // Add vendorId  
                // Fetch vendor details  
                vendorDetailsPromises.push(  
                    axios.get(`https://carcarebaked.azurewebsites.net/api/vendor/${vendorId}`)  
                        .then(response => {  
                            chat.vendorDetails = response.data;  
                        })  
                        .catch(error => {  
                            console.error(`Failed to fetch vendor details for ${vendorId}: ${error}`);  
                        })  
                );  
  
                // Fetch latest message  
                latestMessagePromises.push(  
                    db.collection('chats').doc(chatId).collection('messages')  
                        .orderBy('timestamp', 'desc').limit(1).get()  
                        .then(messageSnapshot => {  
                            if (!messageSnapshot.empty) {  
                                const latestMessage = messageSnapshot.docs[0].data();  
                                chat.latestMessage = latestMessage;  
                            }  
                        })  
                        .catch(error => {  
                            console.error(`Failed to fetch latest message for chat ${chatId}: ${error}`);  
                        })  
                );  
  
                chats.push(chat);  
            }  
        });  
  
        // Wait for all vendor details and latest messages to be fetched and appended  
        await Promise.all([...vendorDetailsPromises, ...latestMessagePromises]);  
  
        if (chats.length === 0) {  
            return res.status(404).json({ error: 'No chats found for the user.' });  
        }  
  
        return res.status(200).json(chats); // Send the chats array with vendor details and latest messages as a JSON response  
    } catch (error) {  
        console.error('Error retrieving chat documents:', error);  
        return res.status(500).json({ error: 'An error occurred while retrieving chat documents.' });  
    }  
};  
  
// Get all chats for a vendor  
// Get all chats for a vendor  
exports.getAllChatsForVendor = async (req, res) => {  
    const { vendorId } = req.params;  
  
    try {  
        const chatsRef = db.collection('chats');  
        const snapshot = await chatsRef.get();  
  
        if (snapshot.empty) {  
            return res.status(404).json({ error: 'No chats found.' });  
        }  
  
        let chats = [];  
        let userDetailsPromises = [];  
        let latestMessagePromises = [];  
  
        snapshot.forEach(doc => {  
            const chatId = doc.id;  
            const chatUserId = chatId.split('_')[0]; // Extracts the userId  
            const chatVendorId = chatId.split('_')[1]; // Extracts the vendorId  
  
            if (chatVendorId === vendorId) {  
                let chat = { id: doc.id, userId: chatUserId, ...doc.data(), isSeen: false }; // Add userId  
                // Fetch user details  
                userDetailsPromises.push(  
                    axios.get(`https://carcarebaked.azurewebsites.net/api/user/${chatUserId}`)  
                        .then(response => {  
                            chat.userDetails = response.data;  
                        })  
                        .catch(error => {  
                            console.error(`Failed to fetch user details for ${chatUserId}: ${error}`);  
                        })  
                );  
  
                // Fetch latest message  
                latestMessagePromises.push(  
                    db.collection('chats').doc(chatId).collection('messages')  
                        .orderBy('timestamp', 'desc').limit(1).get()  
                        .then(messageSnapshot => {  
                            if (!messageSnapshot.empty) {  
                                const latestMessage = messageSnapshot.docs[0].data();  
                                chat.latestMessage = latestMessage;  
                            }  
                        })  
                        .catch(error => {  
                            console.error(`Failed to fetch latest message for chat ${chatId}: ${error}`);  
                        })  
                );  
  
                chats.push(chat);  
            }  
        });  
  
        // Wait for all user details and latest messages to be fetched and appended  
        await Promise.all([...userDetailsPromises, ...latestMessagePromises]);  
  
        if (chats.length === 0) {  
            return res.status(404).json({ error: 'No chats found for the vendor.' });  
        }  
  
        return res.status(200).json(chats); // Send the chats array with user details and latest messages as a JSON response  
    } catch (error) {  
        console.error('Error retrieving chat documents:', error);  
        return res.status(500).json({ error: 'An error occurred while retrieving chat documents.' });  
    }  
};  
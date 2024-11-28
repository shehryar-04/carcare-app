const { GoogleAuth } = require('google-auth-library');  
const axios = require('axios');  
// const firebase = require('../config/firebaseCredentials.json')
  
const auth = new GoogleAuth({  
  keyFile: '../', // Path to your downloaded JSON key file  
  scopes: 'https://www.googleapis.com/auth/firebase.messaging'  
});  
  
async function getAccessToken() {  
  const client = await auth.getClient();  
  const accessToken = await client.getAccessToken();  
  return accessToken.token;  
}  
  
async function sendFCMMessage(recipients, title, body) {  
  try {  
    const token = await getAccessToken(); // Get the access token  
    const url = 'https://fcm.googleapis.com/v1/projects/carcare-ff31c/messages:send';  
      
    // Prepare message payload  
    const messagePayload = {  
      message: {  
        notification: {  
          title: title,  
          body: body  
        },  
        data: {  
          type: "chat" // Used for navigation  
        },  
        android: {  
          priority: "high",  
          notification: {  
            channel_id: "high_importance_channel"  
          }  
        }  
      }  
    };  
  
    // Check if recipients is an array of tokens  
    if (Array.isArray(recipients)) {  
      messagePayload.message.tokens = recipients; // Use tokens field for multiple tokens  
    } else if (recipients.startsWith('/topics/')) {  
      messagePayload.message.topic = recipients; // Use topic if provided  
    } else {  
      messagePayload.message.token = recipients; // Use token if a single token is provided  
    }  
  
    const headers = {  
      'Authorization': `Bearer ${token}`,  
      'Content-Type': 'application/json'  
    };  
  
    const response = await axios.post(url, messagePayload, { headers });  
    console.log('Message sent successfully:', response.data);  
  } catch (error) {  
    console.error('Error sending message:', error.response ? error.response.data : error.message);  
  }  
}  
  
// Export the sendFCMMessage function  
module.exports = sendFCMMessage;  
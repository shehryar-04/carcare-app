const sendFCMMessage = require('../notifications/sendNotificationToTopic'); // Adjust the path accordingly  
const handleErrorResponse = (res, error, message) => res.status(500).json({ error: message + error.message });  
  
// Send Notification Function  
exports.sendNotificationTopic = async (req, res) => {  
  const { title, body, topic } = req.body;  
  
  // Validate the incoming data  
  if (!title || !body || !topic) {  
    return res.status(400).json({ error: 'Title, body, and recipients are required.' });  
  }  
  
  try {  
    await sendFCMMessage(topic, title, body);  
    res.status(200).json({ message: 'Notification sent successfully.' });  
  } catch (error) {  
    handleErrorResponse(res, error, 'Error sending notification: ');  
  }  
};  
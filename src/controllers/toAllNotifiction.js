const sendFCMMessage = require('../notifications/sendNotification'); // Adjust the path accordingly  
const handleErrorResponse = (res, error, message) => res.status(500).json({ error: message + error.message });  
  
// Send Notification Function  
exports.sendNotification = async (req, res) => {  
  const { title, body, recipients } = req.body;  
  
  // Validate the incoming data  
  if (!title || !body || !recipients) {  
    return res.status(400).json({ error: 'Title, body, and recipients are required.' });  
  }  
  
  try {  
    await sendFCMMessage(recipients, title, body);  
    res.status(200).json({ message: 'Notification sent successfully.' });  
  } catch (error) {  
    handleErrorResponse(res, error, 'Error sending notification: ');  
  }  
};  
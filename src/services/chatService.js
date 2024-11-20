const { db } = require('../config/firebaseconfig');
  
const getAllChats = async () => {  
  try {  
    const chatCollection = db.collection('chats');  
    const snapshot = await chatCollection.get();  
    const chats = [];  
  
    snapshot.forEach(doc => {  
      chats.push({ id: doc.id });  
    });  
  
    return chats;  
  } catch (error) {  
    console.error('Error fetching chats from Firestore:', error);  
    throw error;  
  }  
};  
  
module.exports = {  
  getAllChats,  
};  

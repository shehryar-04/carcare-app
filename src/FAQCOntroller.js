// faqController.js  
const admin = require('firebase-admin');  
  
const db = admin.firestore();  
  
// Create an FAQ  
exports.createFAQ = async (req, res) => {  
  try {  
    const { question, answer } = req.body;  
    const faqRef = db.collection('faqs').doc();  
    await faqRef.set({  
      question,  
      answer,  
      createdAt: admin.firestore.FieldValue.serverTimestamp(),  
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),  
    });  
    res.status(201).json({ id: faqRef.id, question, answer });  
  } catch (error) {  
    res.status(500).json({ error: `Error creating FAQ: ${error.message}` });  
  }  
};  
  
// Read all FAQs  
exports.getAllFAQs = async (req, res) => {  
  try {  
    const faqsSnapshot = await db.collection('faqs').get();  
    const faqs = faqsSnapshot.docs.map(doc => ({  
      id: doc.id,  
      ...doc.data(),  
    }));  
    res.status(200).json(faqs);  
  } catch (error) {  
    res.status(500).json({ error: `Error fetching FAQs: ${error.message}` });  
  }  
};  
  
// Read a single FAQ  
exports.getFAQById = async (req, res) => {  
  const { id } = req.params;  
  try {  
    const faqDoc = await db.collection('faqs').doc(id).get();  
    if (!faqDoc.exists) {  
      return res.status(404).json({ error: 'FAQ not found' });  
    }  
    res.status(200).json({ id: faqDoc.id, ...faqDoc.data() });  
  } catch (error) {  
    res.status(500).json({ error: `Error fetching FAQ: ${error.message}` });  
  }  
};  
  
// Update an FAQ  
exports.updateFAQ = async (req, res) => {  
  const { id } = req.params;  
  const { question, answer } = req.body;  
  try {  
    const faqRef = db.collection('faqs').doc(id);  
    const faqDoc = await faqRef.get();  
    if (!faqDoc.exists) {  
      return res.status(404).json({ error: 'FAQ not found' });  
    }  
    await faqRef.update({  
      question,  
      answer,  
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),  
    });  
    res.status(200).json({ id: faqRef.id, question, answer });  
  } catch (error) {  
    res.status(500).json({ error: `Error updating FAQ: ${error.message}` });  
  }  
};  
  
// Delete an FAQ  
exports.deleteFAQ = async (req, res) => {  
  const { id } = req.params;  
  try {  
    const faqRef = db.collection('faqs').doc(id);  
    const faqDoc = await faqRef.get();  
    if (!faqDoc.exists) {  
      return res.status(404).json({ error: 'FAQ not found' });  
    }  
    await faqRef.delete();  
    res.status(204).send(); // No content  
  } catch (error) {  
    res.status(500).json({ error: `Error deleting FAQ: ${error.message}` });  
  }  
};  
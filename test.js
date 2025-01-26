const admin = require('firebase-admin');  
  
// Initialize the Firebase app with your service account  
admin.initializeApp({  
    credential: admin.credential.cert(require('./src/config/serviceAccount.json')),  
});  
  
const db = admin.firestore();  
  
async function checkAndDeleteEmptyCollections() {  
    try {  
        const collections = ['users', 'serviceRequests', 'vendors'];  
          
        // Get all documents from the logs collection  
        const logsSnapshot = await db.collection('logs').get();  
        const logsData = logsSnapshot.docs.map(doc => doc.data());  
          
        // Extract IDs from logs  
        const serviceRequestIds = new Set(logsData.map(log => log.serviceRequestId));  
        const userIds = new Set(logsData.map(log => log.userId));  
        const vendorIds = new Set(logsData.map(log => log.vendorId));  
  
        for (const collectionName of collections) {  
            const collectionRef = db.collection(collectionName);  
            const snapshot = await collectionRef.get();  
  
            if (!snapshot.empty) {  
                // If the collection has documents, check each document  
                const batch = db.batch();  
                let hasOperations = false; // Flag to check if we have any operations  
  
                snapshot.docs.forEach(doc => {  
                    const data = doc.data();  
  
                    // Check based on the collection type  
                    if (collectionName === 'serviceRequests' && !serviceRequestIds.has(data.id)) {  
                        console.log(`Deleting service request with ID: ${data.id}`);  
                        batch.delete(doc.ref);  
                        hasOperations = true; // Set flag to true  
                    } else if (collectionName === 'users' && !userIds.has(data.id)) {  
                        console.log(`Deleting user with ID: ${data.id}`);  
                        batch.delete(doc.ref);  
                        hasOperations = true; // Set flag to true  
                    } else if (collectionName === 'vendors' && !vendorIds.has(data.id)) {  
                        console.log(`Deleting vendor with ID: ${data.id}`);  
                        batch.delete(doc.ref);  
                        hasOperations = true; // Set flag to true  
                    }  
                });  
  
                // Commit the batch delete only if there are operations  
                if (hasOperations) {  
                    await batch.commit();  
                    console.log(`Deleted documents from collection: ${collectionName}`);  
                } else {  
                    console.log(`No documents to delete in collection: ${collectionName}`);  
                }  
            } else {  
                console.log(`Collection ${collectionName} is empty.`);  
            }  
        }  
    } catch (error) {  
        console.error("Error checking collections: ", error);  
    }  
}  
  
// Run the function  
checkAndDeleteEmptyCollections();  
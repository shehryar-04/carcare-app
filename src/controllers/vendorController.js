const vendorService = require('../services/vendorService');  

exports.registerVendor = async (req, res) => {  
    const { area, type, CNIC_front, CNIC_back, CNIC,services, profilePicture,credits,fcmToken,location } = req.body;  
  
    // Validate required fields  
    if (!CNIC_front || !CNIC_back || !CNIC) {  
        return res.status(400).send('Enter CNIC details');  
    }  
    
    if (!area) {  
        return res.status(400).send('Enter Area to operate');  
    }  
    try {  
        const vendor = await vendorService.createVendor({  
            type,CNIC_front, CNIC_back, CNIC, area, profilePicture,services,credits,fcmToken,location
        });  
        res.status(201).json({  
            message: 'Vendor registered successfully',  
            vendorId: vendor.id,  
        });  
    } catch (error) {  
        res.status(500).send('Error registering vendor: ' + error.message);  
    }  
};  

exports.updateVendor = async (req, res) => {
    const { vendorId } = req.params;
    const updates = req.body;

    // Check if updates object is empty
    if (Object.keys(updates).length === 0) {
        return res.status(400).send('At least one field must be provided for update.');
    }

    // If location is provided, validate its structure
    if (updates.location && (!updates.location.latitude || !updates.location.longitude)) {
        return res.status(400).send('Location must include latitude and longitude if provided.');
    }

    try {
        // Update the vendor with only the provided fields
        await vendorService.updateVendor(vendorId, updates);
        res.status(200).json({ message: "Vendor data updated successfully" });
    } catch (error) {
        res.status(500).send('Error updating vendor information: ' + error.message);
    }
};

exports.getVendors = async (req, res) => {  
    const { verified, area, services } = req.query;  
  
    try {  
        const vendors = await vendorService.getVendors(verified, area, services);  
        res.status(200).json(vendors);  
    } catch (error) {  
        res.status(500).send('Error retrieving vendors: ' + error.message);  
    }  
};  

  
exports.getVendorById = async (req, res) => {  
    const { vendorId } = req.params;  
  
    try {  
        const vendor = await vendorService.getVendorById(vendorId);  
        if (!vendor) {  
            return res.status(404).send('Vendor not found.');  
        }  
        res.status(200).json(vendor);  
    } catch (error) {  
        res.status(500).send('Error retrieving vendor: ' + error.message);  
    }  
};  
exports.deleteVendor = async (req, res) => {  
    const { vendorId } = req.params;  
  
    try {  
        await vendorService.deleteVendor(vendorId);  
        res.status(200).json({ message: 'Vendor deleted successfully' });  
    } catch (error) {  
        res.status(500).send('Error deleting vendor: ' + error.message);  
    }  
};  

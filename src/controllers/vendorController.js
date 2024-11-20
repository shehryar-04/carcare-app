const vendorService = require('../services/vendorService');  

exports.registerVendor = async (req, res) => {  
    const { name, email, phoneNumber, location, area, imageServices,services, profilePicture,credits } = req.body;  
  
    // Validate required fields  
    if (!name || !phoneNumber || !location) {  
        return res.status(400).send('Name, phone number, and location are required.');  
    }  
    
    if (!location.latitude || !location.longitude) {  
        return res.status(400).send('Location must include latitude and longitude.');  
    }  
    try {  
        const vendor = await vendorService.createVendor({  
            name, email, phoneNumber, location, area,imageServices, profilePicture,services,credits
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
    const { name, email, phoneNumber, location, services , verification } = req.body;  
  
    if (!name && !email && !phoneNumber && !location && !services && verification === undefined) {  
        return res.status(400).send('At least one field must be provided for update.');  
    }  
  
    if (location && (!location.latitude || !location.longitude)) {  
        return res.status(400).send('Location must include latitude and longitude if provided.');  
    }  
  
    try {  
        await vendorService.updateVendor(vendorId, { name, email, phoneNumber, location, services, verification });  
        res.status(200).json({ message: "Vendor data changed successfully" });  
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
